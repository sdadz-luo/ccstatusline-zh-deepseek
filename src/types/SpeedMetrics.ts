/**
 * Speed metrics for calculating token processing rates.
 * Provides time-based data needed for speed calculations.
 */
export interface SpeedMetrics {
    /**
     * Wall-clock duration in milliseconds: the merged user→assistant intervals.
     * Tool execution waits are excluded by the interval definition, but the wait
     * for the first token (prefill, queueing, network) is included because the
     * transcript carries no first-token timestamp to subtract it.
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
