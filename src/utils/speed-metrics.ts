import type { SpeedMetrics } from '../types/SpeedMetrics';

/**
 * Calculates output tokens per second from speed metrics.
 *
 * 分母用纯生成时长（已剔除 TTFT 与工具等待），而非端到端时长，
 * 否则短响应会被数秒的首字延迟稀释，显示值远低于实际生成速度。
 *
 * @param metrics SpeedMetrics containing timing and token data
 * @returns Output tokens per second, or null if generation duration is zero
 */
export function calculateOutputSpeed(metrics: SpeedMetrics): number | null {
    if (metrics.generationDurationMs === 0) {
        return null;
    }
    const seconds = metrics.generationDurationMs / 1000;
    return metrics.outputTokens / seconds;
}

/**
 * Calculates input processing (prefill) throughput from speed metrics.
 *
 * 输入处理耗时约等于 TTFT（首 token 到达前服务端要过完整段输入），因此
 * 吞吐 = 完整输入（含缓存命中/写入）÷ TTFT 总量；只统计有 TTFT 样本的请求。
 *
 * @param metrics SpeedMetrics containing timing and token data
 * @returns Input tokens per second, or null if no TTFT samples exist
 */
export function calculateInputSpeed(metrics: SpeedMetrics): number | null {
    if (metrics.ttftMsSum === 0) {
        return null;
    }
    const seconds = metrics.ttftMsSum / 1000;
    return metrics.ttftInputTokens / seconds;
}

/**
 * Calculates total tokens per second from speed metrics.
 *
 * @param metrics SpeedMetrics containing timing and token data
 * @returns Total tokens per second, or null if generation duration is zero
 */
export function calculateTotalSpeed(metrics: SpeedMetrics): number | null {
    if (metrics.generationDurationMs === 0) {
        return null;
    }
    const seconds = metrics.generationDurationMs / 1000;
    return metrics.totalTokens / seconds;
}

/**
 * Calculates the average time to first token (TTFT) in milliseconds.
 *
 * @param metrics SpeedMetrics containing TTFT samples
 * @returns Average TTFT in milliseconds, or null if no samples exist
 */
export function calculateTtftMs(metrics: SpeedMetrics): number | null {
    if (metrics.ttftSampleCount === 0) {
        return null;
    }
    return metrics.ttftMsSum / metrics.ttftSampleCount;
}

/**
 * Formats a tokens per second value for display.
 *
 * @param tokensPerSec Tokens per second value, or null if unavailable
 * @returns Formatted string (e.g., "42.5 t/s", "1.2k t/s", or "—" for null)
 */
export function formatSpeed(tokensPerSec: number | null): string {
    if (tokensPerSec === null) {
        return '—';
    }

    if (tokensPerSec >= 1000) {
        const kValue = tokensPerSec / 1000;
        return `${kValue.toFixed(1)}k t/s`;
    }

    return `${tokensPerSec.toFixed(1)} t/s`;
}

/**
 * Formats a TTFT value for display.
 *
 * @param ttftMs TTFT in milliseconds, or null if unavailable
 * @returns Formatted string (e.g., "850ms", "1.6s", or "—" for null)
 */
export function formatTtft(ttftMs: number | null): string {
    if (ttftMs === null) {
        return '—';
    }

    if (ttftMs >= 1000) {
        return `${(ttftMs / 1000).toFixed(1)}s`;
    }

    return `${Math.round(ttftMs)}ms`;
}
