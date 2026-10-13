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

    /** Complete input tokens (incl. cache read/creation) of the TTFT-sampled requests, for prefill throughput */
    ttftInputTokens: number;
}
