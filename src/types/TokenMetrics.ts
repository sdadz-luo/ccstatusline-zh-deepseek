export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}

export interface TranscriptLine {
    message?: { id?: string; usage?: TokenUsage; stop_reason?: string | null };
    isSidechain?: boolean;
    timestamp?: string;
    isApiErrorMessage?: boolean;
    type?: 'user' | 'assistant' | 'system' | 'progress' | 'file-history-snapshot';
}

// Peak/off-peak split of a token tally. DeepSeek bills by time of day, so tokens
// are bucketed by the timestamp of the usage record that carried them.
export interface TokenBreakdown {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
}

export interface TokenMetrics {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    // Hot (cache read) and cold (cache creation) split of cachedTokens.
    // Optional so existing TokenMetrics literals stay valid; getTokenMetrics always sets them.
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
    totalTokens: number;
    contextLength: number;
    // Optional so metrics literals built without time-of-day bucketing stay valid.
    peakBreakdown?: TokenBreakdown;
    offPeakBreakdown?: TokenBreakdown;
}
