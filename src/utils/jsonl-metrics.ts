import * as fs from 'node:fs';
import path from 'node:path';

import type {
    SpeedMetrics,
    TokenBreakdown,
    TokenMetrics,
    TranscriptLine
} from '../types';
import type { CompactionData } from '../types/RenderContext';

import {
    accumulateCompactionStats,
    createCompactionStats,
    getCompactBoundaryPostTokens,
    isCompactBoundary
} from './compaction';
import {
    contextLengthFromUsageTokens,
    parseUsageTokens,
    type UsageTokens
} from './context-window';
import { isDeepSeekPeakHour } from './deepseek-pricing';
import {
    iterateJsonlLines,
    parseJsonlLine
} from './jsonl-lines';
import {
    getThinkingEffortUpdate,
    type ResolvedThinkingEffort
} from './jsonl-metadata';
import { getSessionNameFromRecord } from './jsonl-session';

export interface SpeedMetricsCollection {
    sessionAverage: SpeedMetrics;
    windowed: Record<string, SpeedMetrics>;
}

export interface TranscriptAnalysisOptions {
    includeSessionDuration?: boolean;
    includeSpeedMetrics?: boolean;
    includeSubagents?: boolean;
    speedWindowSeconds?: number[];
    includeCompactionStats?: boolean;
    includeThinkingEffort?: boolean;
    includeSessionName?: boolean;
}

export interface TranscriptAnalysis {
    tokenMetrics: TokenMetrics;
    sessionDuration: string | null;
    speedMetricsCollection: SpeedMetricsCollection | null;
    compactionData: CompactionData | null;
    thinkingEffort: ResolvedThinkingEffort | undefined;
    sessionName: string | null;
}

interface TranscriptScanOptions extends TranscriptAnalysisOptions { includeTokenMetrics?: boolean }

interface TranscriptScanResult {
    tokenMetrics: TokenMetrics | null;
    sessionDuration: string | null;
    speedMetricsCollection: SpeedMetricsCollection | null;
    compactionData: CompactionData | null;
    thinkingEffort: ResolvedThinkingEffort | undefined;
    sessionName: string | null;
}

interface SpeedInterval {
    startMs: number;
    endMs: number;
}

interface SpeedRequest {
    inputTokens: number;
    outputTokens: number;
    assistantTimestampMs: number | null;
    /** Message id 首次出现的时间戳（首块落盘时刻），与 thinkingMs 配合反推 TTFT */
    firstTimestampMs: number | null;
    /** 首块为 thinking 块时，CLI 记录的那段思考时长；缺失则 TTFT 不可分解 */
    thinkingMs: number | null;
    intervals: SpeedInterval[];
}

interface CollectedSpeedMetrics {
    requests: SpeedRequest[];
    latestTimestampMs: number | null;
}

interface TokenMetricEntry {
    usage: UsageTokens;
    stopReason: string | null | undefined;
    timestampMs: number | null;
    isMainChain: boolean;
    messageId: string | null;
}

// 按 usage 记录的实际发生时刻把 token 分入波峰/波谷桶；DeepSeek 分时计价消费。
interface PeakSplit {
    input: number;
    output: number;
    read: number;
    creation: number;
}

interface TokenMetricAccumulator {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    peak: PeakSplit;
    offPeak: PeakSplit;
    mostRecentMainChainUsage: UsageTokens | null;
    mostRecentTimestampMs: number | null;
    mostRecentPostCompactionUsage: UsageTokens | null;
    mostRecentPostCompactionTimestampMs: number | null;
}

interface TokenMetricState {
    metrics: TokenMetricAccumulator;
    hasStopReasonField: boolean;
    countedOutputByMessageId: Map<string, number>;
    lastUsageEntry: TokenMetricEntry | null;
    sawCompactBoundary: boolean;
    boundaryAfterLastUsage: boolean;
    lastCompactBoundaryPostTokens: number | null;
}

function createEmptyTokenMetrics(): TokenMetrics {
    return {
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: 0,
        contextLength: 0,
        peakBreakdown: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
        offPeakBreakdown: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }
    };
}

function createTokenMetricAccumulator(): TokenMetricAccumulator {
    return {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        peak: { input: 0, output: 0, read: 0, creation: 0 },
        offPeak: { input: 0, output: 0, read: 0, creation: 0 },
        mostRecentMainChainUsage: null,
        mostRecentTimestampMs: null,
        mostRecentPostCompactionUsage: null,
        mostRecentPostCompactionTimestampMs: null
    };
}

function resetPostCompactionUsage(accumulator: TokenMetricAccumulator): void {
    accumulator.mostRecentPostCompactionUsage = null;
    accumulator.mostRecentPostCompactionTimestampMs = null;
}

function accumulateTokenMetricEntry(
    accumulator: TokenMetricAccumulator,
    entry: TokenMetricEntry,
    includePostCompactionUsage: boolean
): void {
    const { usage } = entry;
    accumulator.inputTokens += usage.input;
    accumulator.outputTokens += usage.output;
    accumulator.cacheReadTokens += usage.read;
    accumulator.cacheCreationTokens += usage.creation;

    // 无时间戳的记录归入波谷桶（与分时计价回退「按当前时段全量计价」的语义一致）
    const bucket = entry.timestampMs !== null && isDeepSeekPeakHour(new Date(entry.timestampMs))
        ? accumulator.peak
        : accumulator.offPeak;
    bucket.input += usage.input;
    bucket.output += usage.output;
    bucket.read += usage.read;
    bucket.creation += usage.creation;

    if (!entry.isMainChain || entry.timestampMs === null) {
        return;
    }

    if (accumulator.mostRecentTimestampMs === null || entry.timestampMs > accumulator.mostRecentTimestampMs) {
        accumulator.mostRecentTimestampMs = entry.timestampMs;
        accumulator.mostRecentMainChainUsage = usage;
    }
    if (includePostCompactionUsage
        && (accumulator.mostRecentPostCompactionTimestampMs === null
            || entry.timestampMs > accumulator.mostRecentPostCompactionTimestampMs)) {
        accumulator.mostRecentPostCompactionTimestampMs = entry.timestampMs;
        accumulator.mostRecentPostCompactionUsage = usage;
    }
}

function createTokenMetricState(): TokenMetricState {
    return {
        metrics: createTokenMetricAccumulator(),
        hasStopReasonField: false,
        countedOutputByMessageId: new Map(),
        lastUsageEntry: null,
        sawCompactBoundary: false,
        boundaryAfterLastUsage: false,
        lastCompactBoundaryPostTokens: null
    };
}

// Count each message once even when another response separates its content
// blocks. Keep the maximum output and the first counted context snapshot, as
// consecutive duplicates did; records without an id still count independently.
function accumulateCumulativeTokenEntry(
    state: TokenMetricState,
    entry: TokenMetricEntry,
    includePostCompactionUsage: boolean
): void {
    const previousOutput = entry.messageId === null
        ? undefined
        : state.countedOutputByMessageId.get(entry.messageId);
    if (entry.messageId !== null && previousOutput !== undefined) {
        const outputDelta = entry.usage.output - previousOutput;
        if (outputDelta > 0) {
            state.countedOutputByMessageId.set(entry.messageId, entry.usage.output);
            state.metrics.outputTokens += outputDelta;
            const bucket = entry.timestampMs !== null && isDeepSeekPeakHour(new Date(entry.timestampMs))
                ? state.metrics.peak
                : state.metrics.offPeak;
            bucket.output += outputDelta;
        }
        return;
    }

    if (entry.messageId !== null) {
        state.countedOutputByMessageId.set(entry.messageId, entry.usage.output);
    }
    accumulateTokenMetricEntry(state.metrics, entry, includePostCompactionUsage);
}

function collectTokenMetricRecord(state: TokenMetricState, data: TranscriptLine | null, timestampMs: number | null): void {
    const compactBoundary = isCompactBoundary(data);
    if (compactBoundary) {
        state.sawCompactBoundary = true;
        state.boundaryAfterLastUsage = true;
        state.lastCompactBoundaryPostTokens = getCompactBoundaryPostTokens(data);
        resetPostCompactionUsage(state.metrics);
    }

    const message = data?.message;
    const usage = message?.usage;
    if (usage) {
        const rawMessageId = message.id;
        const entry: TokenMetricEntry = {
            usage: parseUsageTokens(usage),
            stopReason: message.stop_reason,
            timestampMs,
            isMainChain: data?.isSidechain !== true && !data?.isApiErrorMessage,
            messageId: typeof rawMessageId === 'string' && rawMessageId.length > 0 ? rawMessageId : null
        };

        const hasStopReason = Object.prototype.hasOwnProperty.call(message, 'stop_reason');
        if (hasStopReason && !state.hasStopReasonField) {
            state.hasStopReasonField = true;
            state.metrics = createTokenMetricAccumulator();
            state.countedOutputByMessageId.clear();
        }
        if (!state.hasStopReasonField || entry.stopReason) {
            accumulateCumulativeTokenEntry(state, entry, !compactBoundary);
        }
        state.lastUsageEntry = entry;
        state.boundaryAfterLastUsage = compactBoundary;
    }
}

function finishTokenMetrics(state: TokenMetricState): TokenMetrics {
    if (state.hasStopReasonField && state.lastUsageEntry?.stopReason === null) {
        accumulateCumulativeTokenEntry(state, state.lastUsageEntry, !state.boundaryAfterLastUsage);
    }

    const contextLengthFromUsage = (usage: UsageTokens | null): number | null => usage
        ? contextLengthFromUsageTokens(usage)
        : null;
    const contextLength = state.sawCompactBoundary
        ? (contextLengthFromUsage(state.metrics.mostRecentPostCompactionUsage) ?? state.lastCompactBoundaryPostTokens ?? 0)
        : (contextLengthFromUsage(state.metrics.mostRecentMainChainUsage) ?? 0);
    const cachedTokens = state.metrics.cacheReadTokens + state.metrics.cacheCreationTokens;

    return {
        inputTokens: state.metrics.inputTokens,
        outputTokens: state.metrics.outputTokens,
        cachedTokens,
        cacheReadTokens: state.metrics.cacheReadTokens,
        cacheCreationTokens: state.metrics.cacheCreationTokens,
        totalTokens: state.metrics.inputTokens + state.metrics.outputTokens + cachedTokens,
        contextLength,
        peakBreakdown: {
            inputTokens: state.metrics.peak.input,
            outputTokens: state.metrics.peak.output,
            cacheReadTokens: state.metrics.peak.read,
            cacheCreationTokens: state.metrics.peak.creation
        },
        offPeakBreakdown: {
            inputTokens: state.metrics.offPeak.input,
            outputTokens: state.metrics.offPeak.output,
            cacheReadTokens: state.metrics.offPeak.read,
            cacheCreationTokens: state.metrics.offPeak.creation
        }
    };
}

function collectAgentIds(value: unknown, agentIds: Set<string>) {
    if (!value || typeof value !== 'object') {
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectAgentIds(item, agentIds);
        }
        return;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
        if (key === 'agentId' && typeof nestedValue === 'string' && nestedValue.trim() !== '') {
            agentIds.add(nestedValue);
            continue;
        }

        collectAgentIds(nestedValue, agentIds);
    }
}

function parseTimestampMs(value: string | undefined): number | null {
    if (!value) {
        return null;
    }

    const timestampMs = Date.parse(value);
    return Number.isNaN(timestampMs) ? null : timestampMs;
}

function mergeIntervals(intervals: SpeedInterval[]): SpeedInterval[] {
    if (intervals.length === 0) {
        return [];
    }

    const sorted = intervals
        .slice()
        .sort((a, b) => a.startMs - b.startMs);
    const first = sorted[0];
    if (!first) {
        return [];
    }
    const merged: SpeedInterval[] = [{ ...first }];

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];
        if (!current || !last) {
            continue;
        }

        if (current.startMs <= last.endMs) {
            last.endMs = Math.max(last.endMs, current.endMs);
        } else {
            merged.push({ ...current });
        }
    }

    return merged;
}

function getIntervalsDurationMs(intervals: SpeedInterval[]): number {
    return intervals.reduce((total, interval) => total + (interval.endMs - interval.startMs), 0);
}

/**
 * Cuts a request down to the part of its time inside the window.
 *
 * A request's tokens are produced across the time its response ran, so one that
 * started before the window produced only some of them inside it. It keeps the
 * share of its tokens that matches the share of that time inside the window: all
 * of its tokens over only the clipped time would overstate the speed. That time
 * is the union of the intervals of the response's records, including those
 * logged before the window; a request without any interval keeps all of its
 * tokens.
 */
function clipRequestToWindow(request: SpeedRequest, window: SpeedInterval): SpeedRequest {
    const responseTime = mergeIntervals(request.intervals);
    const intervals: SpeedInterval[] = [];
    for (const interval of responseTime) {
        const startMs = Math.max(interval.startMs, window.startMs);
        const endMs = Math.min(interval.endMs, window.endMs);
        if (endMs > startMs) {
            intervals.push({ startMs, endMs });
        }
    }

    const fullMs = getIntervalsDurationMs(responseTime);
    if (fullMs === 0) {
        return { ...request, intervals };
    }

    const insideMs = getIntervalsDurationMs(intervals);
    return {
        ...request,
        inputTokens: request.inputTokens * insideMs / fullMs,
        outputTokens: request.outputTokens * insideMs / fullMs,
        intervals
    };
}

function createEmptySpeedMetrics(): SpeedMetrics {
    return {
        generationDurationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        requestCount: 0
    };
}

/**
 * 反推单次请求的首字延迟（TTFT）。
 *
 * 分块 transcript 里首块（thinking）落盘时刻 = 首 token 到达时刻 + 该段思考时长，
 * CLI 在同一行附了 thinkingDurationMs，于是：
 *   TTFT = 首块落盘时间 - 请求起点(上一条 user/tool_result) - thinkingDurationMs
 * 结果超出 [0, 区间长度] 视为不可分解（无 thinking 块、字段缺失或计时边界异常），
 * 返回 null，由调用方用会话中位数估算。
 */
function computeRequestTtftMs(request: SpeedRequest): number | null {
    if (request.firstTimestampMs === null || request.thinkingMs === null) {
        return null;
    }

    const firstInterval = mergeIntervals(request.intervals)[0];
    if (!firstInterval) {
        return null;
    }

    const ttftMs = request.firstTimestampMs - firstInterval.startMs - request.thinkingMs;
    const intervalDurationMs = firstInterval.endMs - firstInterval.startMs;
    if (ttftMs < 0 || ttftMs > intervalDurationMs) {
        return null;
    }

    return ttftMs;
}

function median(values: number[]): number | null {
    if (values.length === 0) {
        return null;
    }

    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
        return sorted[middle] ?? null;
    }

    const lower = sorted[middle - 1];
    const upper = sorted[middle];
    return lower !== undefined && upper !== undefined ? (lower + upper) / 2 : null;
}

function collectTtftSamples(requests: SpeedRequest[]): number[] {
    const samples: number[] = [];
    for (const request of requests) {
        const ttftMs = computeRequestTtftMs(request);
        if (ttftMs !== null) {
            samples.push(ttftMs);
        }
    }
    return samples;
}

// 生成段从「请求起点 + TTFT」起算，把排队与首字等待从分母剔除；
// 无样本请求用中位数估算，估算值最多占区间的 80%，避免短请求被整个扣没。
function applyTtftToIntervals(request: SpeedRequest, fallbackTtftMs: number | null): SpeedInterval[] {
    const merged = mergeIntervals(request.intervals);
    const first = merged[0];
    if (!first) {
        return merged;
    }

    const ttftMs = computeRequestTtftMs(request) ?? fallbackTtftMs;
    if (ttftMs === null) {
        return merged;
    }

    const intervalDurationMs = first.endMs - first.startMs;
    const appliedTtftMs = Math.min(Math.max(ttftMs, 0), intervalDurationMs * 0.8);
    const startMs = Math.min(first.startMs + appliedTtftMs, first.endMs);
    return [{ startMs, endMs: first.endMs }, ...merged.slice(1)]
        .filter(interval => interval.endMs > interval.startMs);
}

function normalizeWindowSeconds(value: number | undefined): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    const normalized = Math.trunc(value);
    return normalized > 0 ? normalized : null;
}

interface SpeedMetricCollectorState extends CollectedSpeedMetrics {
    lastUserTimestampMs: number | null;
    lastRequest: SpeedRequest | null;
    lastRequestInterval: SpeedInterval | null;
    // Scoped to this transcript so subagent collectors keep independent requests.
    requestsByMessageId: Map<string, SpeedRequest>;
}

function createSpeedMetricCollector(): SpeedMetricCollectorState {
    return {
        requests: [],
        latestTimestampMs: null,
        lastUserTimestampMs: null,
        lastRequest: null,
        lastRequestInterval: null,
        requestsByMessageId: new Map()
    };
}

function collectSpeedMetricRecord(
    state: SpeedMetricCollectorState,
    data: TranscriptLine | null,
    timestampMs: number | null,
    ignoreSidechain: boolean
): void {
    if (!data || data.isApiErrorMessage || (ignoreSidechain && data.isSidechain === true)) {
        return;
    }

    if (timestampMs !== null && (state.latestTimestampMs === null || timestampMs > state.latestTimestampMs)) {
        state.latestTimestampMs = timestampMs;
    }

    if (data.type === 'user' && timestampMs !== null) {
        state.lastUserTimestampMs = timestampMs;
        return;
    }

    if (data.type !== 'assistant' || !data.message?.usage) {
        return;
    }

    let interval: SpeedInterval | null = null;
    if (timestampMs !== null && state.lastUserTimestampMs !== null && timestampMs > state.lastUserTimestampMs) {
        interval = { startMs: state.lastUserTimestampMs, endMs: timestampMs };
    }

    const usage = parseUsageTokens(data.message.usage);
    const rawMessageId = data.message.id;
    const messageId = typeof rawMessageId === 'string' && rawMessageId.length > 0 ? rawMessageId : null;

    // One API call can be written as several entries sharing a message.id,
    // each repeating the call's input tokens. Count the call once, keeping
    // its largest output count and its latest end time.
    const previous = messageId === null ? undefined : state.requestsByMessageId.get(messageId);
    if (previous) {
        if (state.lastRequest !== previous) {
            state.lastRequestInterval = null;
        }
        // 合并分支只维护区间终点；首块时间戳保持首次出现值（正常时序下不会为空）
        if (previous.firstTimestampMs === null) {
            previous.firstTimestampMs = timestampMs;
            if (previous.thinkingMs === null && typeof data.thinkingDurationMs === 'number') {
                previous.thinkingMs = data.thinkingDurationMs;
            }
        }
        previous.inputTokens = usage.input;
        previous.outputTokens = Math.max(previous.outputTokens, usage.output);
        if (timestampMs !== null) {
            previous.assistantTimestampMs = timestampMs;
        }
        if (interval) {
            const lastInterval = state.lastRequestInterval;
            if (lastInterval) {
                lastInterval.startMs = Math.min(lastInterval.startMs, interval.startMs);
                lastInterval.endMs = Math.max(lastInterval.endMs, interval.endMs);
            } else {
                // A nonconsecutive repeat must not turn the intervening idle
                // time into active processing time.
                previous.intervals.push(interval);
                state.lastRequestInterval = interval;
            }
        }
        state.lastRequest = previous;
        return;
    }

    const request: SpeedRequest = {
        inputTokens: usage.input,
        outputTokens: usage.output,
        assistantTimestampMs: timestampMs,
        firstTimestampMs: timestampMs,
        thinkingMs: typeof data.thinkingDurationMs === 'number' ? data.thinkingDurationMs : null,
        intervals: interval ? [interval] : []
    };
    state.requests.push(request);
    state.lastRequest = request;
    state.lastRequestInterval = interval;
    if (messageId !== null) {
        state.requestsByMessageId.set(messageId, request);
    }
}

async function collectSpeedMetricsFromFile(filePath: string, ignoreSidechain: boolean): Promise<CollectedSpeedMetrics> {
    const state = createSpeedMetricCollector();
    for await (const line of iterateJsonlLines(filePath)) {
        const data = parseJsonlLine(line) as TranscriptLine | null;
        collectSpeedMetricRecord(state, data, parseTimestampMs(data?.timestamp), ignoreSidechain);
    }

    return state;
}

function mergeCollectedSpeedMetrics(parts: CollectedSpeedMetrics[]): CollectedSpeedMetrics {
    const requests: SpeedRequest[] = [];
    let latestTimestampMs: number | null = null;

    for (const part of parts) {
        // One push per request: spreading a long transcript's requests into a
        // single call exceeds the engine's argument limit and throws
        for (const request of part.requests) {
            requests.push(request);
        }

        if (part.latestTimestampMs !== null && (latestTimestampMs === null || part.latestTimestampMs > latestTimestampMs)) {
            latestTimestampMs = part.latestTimestampMs;
        }
    }

    return {
        requests,
        latestTimestampMs
    };
}

function buildSpeedMetrics(
    collected: CollectedSpeedMetrics,
    windowSeconds?: number
): SpeedMetrics {
    const normalizedWindowSeconds = normalizeWindowSeconds(windowSeconds);
    const windowBounds = normalizedWindowSeconds !== null && collected.latestTimestampMs !== null
        ? {
            startMs: collected.latestTimestampMs - (normalizedWindowSeconds * 1000),
            endMs: collected.latestTimestampMs
        }
        : null;
    if (normalizedWindowSeconds !== null && windowBounds === null) {
        return createEmptySpeedMetrics();
    }

    const selectedRequests = windowBounds
        ? collected.requests.filter(request => request.assistantTimestampMs !== null
            && request.assistantTimestampMs >= windowBounds.startMs
            && request.assistantTimestampMs <= windowBounds.endMs
        )
        : collected.requests;

    // TTFT 估算：约四成请求没有 thinkingDurationMs，无法反推首 token。为免这些请求
    // 退回端到端（分母多出数秒等待、速度被稀释数倍），用中位数补齐。优先用窗口内
    // 中位数——代理排队会成片波动，全会话中位数在高峰时段会把速度压得过低；窗口内
    // 样本不足 2 个时才退回全会话。
    const windowTtftSamples = collectTtftSamples(selectedRequests);
    const fallbackTtftMs = windowTtftSamples.length >= 2
        ? median(windowTtftSamples)
        : median(collectTtftSamples(collected.requests));

    let inputTokens = 0;
    let outputTokens = 0;
    const intervals: SpeedInterval[] = [];

    for (const rawRequest of selectedRequests) {
        // 无区间的请求（无法定位生成时段）无条件计入 token，保持与 token 统计一致
        if (rawRequest.intervals.length === 0) {
            inputTokens += rawRequest.inputTokens;
            outputTokens += rawRequest.outputTokens;
            continue;
        }

        const request = windowBounds ? clipRequestToWindow(rawRequest, windowBounds) : rawRequest;
        const requestIntervals = applyTtftToIntervals(request, fallbackTtftMs);

        // 扣减后没有剩余时间：该请求无法归入解码口径，分子分母一并排除，
        // 否则会出现 token 照算、时长不计的速度虚高。
        if (requestIntervals.length === 0) {
            continue;
        }

        inputTokens += request.inputTokens;
        outputTokens += request.outputTokens;
        for (const interval of requestIntervals) {
            intervals.push(interval);
        }
    }

    const mergedIntervals = mergeIntervals(intervals);
    const generationDurationMs = getIntervalsDurationMs(mergedIntervals);

    return {
        generationDurationMs,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        requestCount: selectedRequests.length
    };
}

function buildEmptyWindowedMetrics(windowSeconds: number[]): Record<string, SpeedMetrics> {
    const windowed: Record<string, SpeedMetrics> = {};
    for (const window of windowSeconds) {
        windowed[window.toString()] = createEmptySpeedMetrics();
    }
    return windowed;
}

function buildSpeedMetricsCollection(collected: CollectedSpeedMetrics[], windowSeconds: number[]): SpeedMetricsCollection {
    const combined = mergeCollectedSpeedMetrics(collected);
    const windowed: Record<string, SpeedMetrics> = {};
    for (const window of windowSeconds) {
        windowed[window.toString()] = buildSpeedMetrics(combined, window);
    }

    return {
        sessionAverage: buildSpeedMetrics(combined),
        windowed
    };
}

function formatSessionDuration(firstTimestampMs: number | null, lastTimestampMs: number | null): string | null {
    if (firstTimestampMs === null || lastTimestampMs === null) {
        return null;
    }

    const totalMinutes = Math.floor((lastTimestampMs - firstTimestampMs) / (1000 * 60));
    if (totalMinutes < 1) {
        return '<1m';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) {
        return `${minutes}m`;
    }
    if (minutes === 0) {
        return `${hours}hr`;
    }
    return `${hours}hr ${minutes}m`;
}

function normalizeSpeedWindows(windowSeconds: number[] | undefined): number[] {
    return Array.from(
        new Set(
            (windowSeconds ?? [])
                .map(window => normalizeWindowSeconds(window))
                .filter((window): window is number => window !== null)
        )
    );
}

function createEmptyScanResult(options: TranscriptScanOptions, speedWindows: number[]): TranscriptScanResult {
    return {
        tokenMetrics: options.includeTokenMetrics ? createEmptyTokenMetrics() : null,
        sessionDuration: null,
        speedMetricsCollection: options.includeSpeedMetrics
            ? {
                sessionAverage: createEmptySpeedMetrics(),
                windowed: buildEmptyWindowedMetrics(speedWindows)
            }
            : null,
        compactionData: options.includeCompactionStats ? createCompactionStats() : null,
        thinkingEffort: undefined,
        sessionName: null
    };
}

async function scanTranscript(transcriptPath: string, options: TranscriptScanOptions): Promise<TranscriptScanResult> {
    const speedWindows = normalizeSpeedWindows(options.speedWindowSeconds);
    const emptyResult = createEmptyScanResult(options, speedWindows);
    if (!fs.existsSync(transcriptPath)) {
        return emptyResult;
    }

    const tokenState = options.includeTokenMetrics ? createTokenMetricState() : null;
    const speedState = options.includeSpeedMetrics ? createSpeedMetricCollector() : null;
    const compactionData = options.includeCompactionStats ? createCompactionStats() : null;
    const referencedAgentIds = options.includeSpeedMetrics && options.includeSubagents
        ? new Set<string>()
        : null;
    let firstTimestampMs: number | null = null;
    let lastTimestampMs: number | null = null;
    let thinkingEffort: ResolvedThinkingEffort | undefined;
    let sessionName: string | null = null;
    let automaticTitle: string | null = null;

    try {
        for await (const line of iterateJsonlLines(transcriptPath)) {
            const data = parseJsonlLine(line) as TranscriptLine | null;
            const needsTimestamp = options.includeSessionDuration === true
                || speedState !== null
                || Boolean(data?.message?.usage);
            const timestampMs = needsTimestamp ? parseTimestampMs(data?.timestamp) : null;

            if (tokenState) {
                collectTokenMetricRecord(tokenState, data, timestampMs);
            }
            if (options.includeSessionDuration && timestampMs !== null) {
                firstTimestampMs ??= timestampMs;
                lastTimestampMs = timestampMs;
            }
            if (speedState) {
                collectSpeedMetricRecord(speedState, data, timestampMs, true);
            }
            if (referencedAgentIds) {
                collectAgentIds(data, referencedAgentIds);
            }
            if (compactionData) {
                accumulateCompactionStats(compactionData, data);
            }
            if (options.includeThinkingEffort) {
                const update = getThinkingEffortUpdate(data);
                if (update) {
                    thinkingEffort = update.effort;
                }
            }
            if (options.includeSessionName) {
                sessionName = getSessionNameFromRecord(data) ?? sessionName;
                automaticTitle = getSessionNameFromRecord(data, 'ai-title') ?? automaticTitle;
            }
        }

        let speedMetricsCollection: SpeedMetricsCollection | null = null;
        if (speedState) {
            const collected: CollectedSpeedMetrics[] = [speedState];
            if (referencedAgentIds) {
                const subagentPaths = getSubagentTranscriptPaths(transcriptPath, referencedAgentIds);
                const subagentMetrics = await Promise.all(subagentPaths.map(async (subagentPath) => {
                    try {
                        return await collectSpeedMetricsFromFile(subagentPath, false);
                    } catch {
                        return null;
                    }
                }));
                for (const metrics of subagentMetrics) {
                    if (metrics) {
                        collected.push(metrics);
                    }
                }
            }
            speedMetricsCollection = buildSpeedMetricsCollection(collected, speedWindows);
        }

        return {
            tokenMetrics: tokenState ? finishTokenMetrics(tokenState) : null,
            sessionDuration: options.includeSessionDuration
                ? formatSessionDuration(firstTimestampMs, lastTimestampMs)
                : null,
            speedMetricsCollection,
            compactionData,
            thinkingEffort,
            sessionName: sessionName ?? automaticTitle
        };
    } catch {
        return emptyResult;
    }
}

function getSubagentTranscriptPaths(transcriptPath: string, referencedAgentIds: Set<string>): string[] {
    if (referencedAgentIds.size === 0) {
        return [];
    }

    const transcriptDir = path.dirname(transcriptPath);
    const transcriptStem = path.parse(transcriptPath).name;
    const candidateDirs = [
        path.join(transcriptDir, 'subagents'),
        path.join(transcriptDir, transcriptStem, 'subagents')
    ];
    const seenPaths = new Set<string>();
    const matchedPaths: string[] = [];

    for (const subagentsDir of candidateDirs) {
        if (!fs.existsSync(subagentsDir)) {
            continue;
        }

        try {
            const dirEntries = fs.readdirSync(subagentsDir, { withFileTypes: true });
            for (const entry of dirEntries) {
                if (!entry.isFile()) {
                    continue;
                }

                const match = /^agent-(.+)\.jsonl$/.exec(entry.name);
                if (!match?.[1]) {
                    continue;
                }

                if (!referencedAgentIds.has(match[1])) {
                    continue;
                }

                const fullPath = path.join(subagentsDir, entry.name);
                if (seenPaths.has(fullPath)) {
                    continue;
                }

                seenPaths.add(fullPath);
                matchedPaths.push(fullPath);
            }
        } catch {
            continue;
        }
    }

    return matchedPaths;
}

export async function getTranscriptAnalysis(
    transcriptPath: string,
    options: TranscriptAnalysisOptions = {}
): Promise<TranscriptAnalysis> {
    const result = await scanTranscript(transcriptPath, {
        ...options,
        includeTokenMetrics: true
    });

    return {
        tokenMetrics: result.tokenMetrics ?? createEmptyTokenMetrics(),
        sessionDuration: result.sessionDuration,
        speedMetricsCollection: result.speedMetricsCollection,
        compactionData: result.compactionData,
        thinkingEffort: result.thinkingEffort,
        sessionName: result.sessionName
    };
}

function accumulateBreakdown(target: TokenBreakdown, source: Partial<TokenBreakdown> | null | undefined): void {
    if (!source) {
        return;
    }

    target.inputTokens += source.inputTokens ?? 0;
    target.outputTokens += source.outputTokens ?? 0;
    target.cacheReadTokens += source.cacheReadTokens ?? 0;
    target.cacheCreationTokens += source.cacheCreationTokens ?? 0;
}

// 汇总本次会话所有直接子代理（Task 工具派生的 agent）的 token 用量。
// 子代理 transcript 与主 transcript 同构，复用 getTranscriptAnalysis 的解析/去重/分桶逻辑。
export async function getSubagentTokenMetrics(transcriptPath: string): Promise<TokenMetrics | null> {
    const referencedAgentIds = new Set<string>();

    try {
        for await (const line of iterateJsonlLines(transcriptPath)) {
            // Only a handful of lines reference an agent; parsing just those keeps
            // this scan cheap on large transcripts.
            if (!line.includes('agentId')) {
                continue;
            }

            collectAgentIds(parseJsonlLine(line), referencedAgentIds);
        }
    } catch {
        return null;
    }

    const subagentPaths = getSubagentTranscriptPaths(transcriptPath, referencedAgentIds);
    if (subagentPaths.length === 0) {
        return null;
    }

    const metricsResults = await Promise.all(subagentPaths.map(async (subagentPath) => {
        try {
            return (await getTranscriptAnalysis(subagentPath)).tokenMetrics;
        } catch {
            return null;
        }
    }));

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheCreationTokens = 0;
    const peak: TokenBreakdown = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
    const offPeak: TokenBreakdown = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };

    for (const metrics of metricsResults) {
        if (!metrics) {
            continue;
        }

        inputTokens += metrics.inputTokens;
        outputTokens += metrics.outputTokens;
        cacheReadTokens += metrics.cacheReadTokens ?? 0;
        cacheCreationTokens += metrics.cacheCreationTokens ?? 0;

        accumulateBreakdown(peak, metrics.peakBreakdown);
        accumulateBreakdown(offPeak, metrics.offPeakBreakdown);
    }

    return {
        inputTokens,
        outputTokens,
        cachedTokens: cacheReadTokens + cacheCreationTokens,
        cacheReadTokens,
        cacheCreationTokens,
        totalTokens: inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens,
        contextLength: 0,
        peakBreakdown: peak,
        offPeakBreakdown: offPeak
    };
}

// 兼容旧 API：上游 2.2.30+ 改用 getTranscriptAnalysis 统一扫描，本 Fork 保留这些
// 单点入口给既有消费方与测试，内部复用同一套扫描流程（每次调用独立扫描）。
export interface SpeedMetricsOptions {
    includeSubagents?: boolean;
    windowSeconds?: number;
}

export interface SpeedMetricsCollectionOptions {
    includeSubagents?: boolean;
    windowSeconds?: number[];
}

export async function getTokenMetrics(transcriptPath: string): Promise<TokenMetrics> {
    const result = await scanTranscript(transcriptPath, { includeTokenMetrics: true });
    return result.tokenMetrics ?? createEmptyTokenMetrics();
}

export async function getSessionDuration(transcriptPath: string): Promise<string | null> {
    const result = await scanTranscript(transcriptPath, { includeSessionDuration: true });
    return result.sessionDuration;
}

export async function getSpeedMetricsCollection(
    transcriptPath: string,
    options: SpeedMetricsCollectionOptions = {}
): Promise<SpeedMetricsCollection> {
    const windows = normalizeSpeedWindows(options.windowSeconds);
    const result = await scanTranscript(transcriptPath, {
        includeSpeedMetrics: true,
        includeSubagents: options.includeSubagents,
        speedWindowSeconds: windows
    });

    return result.speedMetricsCollection ?? {
        sessionAverage: createEmptySpeedMetrics(),
        windowed: buildEmptyWindowedMetrics(windows)
    };
}

export async function getSpeedMetrics(
    transcriptPath: string,
    options: SpeedMetricsOptions = {}
): Promise<SpeedMetrics> {
    const requestedWindow = normalizeWindowSeconds(options.windowSeconds);
    const collection = await getSpeedMetricsCollection(transcriptPath, {
        includeSubagents: options.includeSubagents,
        windowSeconds: requestedWindow ? [requestedWindow] : []
    });

    if (requestedWindow === null) {
        return collection.sessionAverage;
    }

    return collection.windowed[requestedWindow.toString()] ?? createEmptySpeedMetrics();
}
