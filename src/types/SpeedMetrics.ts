/**
 * Speed metrics for calculating token processing rates.
 * Provides time-based data needed for speed calculations.
 */
export interface SpeedMetrics {
    /**
     * Pure generation duration in milliseconds: the merged user→assistant intervals
     * with each request's TTFT removed. Tool execution waits are already excluded by
     * the interval definition, so this approximates the time the model spent producing
     * tokens (排除排队与首字延迟).
     */
    generationDurationMs: number;

    /** Total input tokens across all requests */
    inputTokens: number;

    /** Total output tokens across all requests */
    outputTokens: number;

    /** Total tokens (input + output) */
    totalTokens: number;

    /** Number of assistant usage entries included in speed aggregation */
    requestCount: number;

    /** Sum of measurable TTFT samples in milliseconds (requests whose transcript carries thinkingDurationMs) */
    ttftMsSum: number;

    /** Number of requests that contributed a TTFT sample */
    ttftSampleCount: number;

    /**
     * 真正参与 prefill 计算的 token（未缓存输入 + 缓存写入）之和，取自
     * 有 TTFT 样本的请求。缓存命中（cache read）直接读 KV cache、不经过
     * 前向计算，故不计入，否则吞吐会被上下文长度稀释成虚高值。
     */
    ttftInputTokens: number;
}
