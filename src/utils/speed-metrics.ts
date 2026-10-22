import type { SpeedMetrics } from '../types/SpeedMetrics';

/**
 * Calculates output tokens per second from speed metrics.
 *
 * 口径是端到端：分子为该批次输出 token 总量，分母为请求起点到末块落盘的时刻差。
 * transcript 不记录首 token 时刻，任何"扣除 TTFT"的尝试都只能靠块级落盘时间戳
 * 反推，实测会把分母压缩 2-4 倍；宁可揭示含等待的真实吞吐，也不给虚高读数。
 *
 * @param metrics SpeedMetrics containing timing and token data
 * @returns Output tokens per second, or null if the time span is zero
 */
export function calculateOutputSpeed(metrics: SpeedMetrics): number | null {
    if (metrics.generationDurationMs === 0) {
        return null;
    }
    const seconds = metrics.generationDurationMs / 1000;
    return metrics.outputTokens / seconds;
}

/**
 * Calculates total tokens per second from speed metrics.
 *
 * 与输出速度同分母，分子换成输入+输出，保证两个组件可直接对比。
 *
 * @param metrics SpeedMetrics containing timing and token data
 * @returns Total tokens per second, or null if the time span is zero
 */
export function calculateTotalSpeed(metrics: SpeedMetrics): number | null {
    if (metrics.generationDurationMs === 0) {
        return null;
    }
    const seconds = metrics.generationDurationMs / 1000;
    return metrics.totalTokens / seconds;
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
