/**
 * Speed metrics for calculating token processing rates.
 * Provides time-based data needed for speed calculations.
 */
export interface SpeedMetrics {
    /**
     * Generation duration in milliseconds: the merged user→assistant intervals
     * with each request's TTFT removed. Tool execution waits are already excluded
     * by the interval definition. Requests without a thinkingDurationMs sample are
     * trimmed by the session's median TTFT, so the denominator stays comparable
     * across requests that do and do not expose a first-token timestamp.
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
}
