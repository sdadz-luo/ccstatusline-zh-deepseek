import type { SpeedMetrics } from '../types/SpeedMetrics';

/**
 * Calculates output tokens per second from speed metrics.
 *
 * 分母用扣除首字延迟的生成时长：transcript 中首 token 时刻只能由 thinking 块与
 * thinkingDurationMs 反推（约六成请求具备）；其余请求按会话 TTFT 中位数估算扣减，
 * 避免同一批请求里一部分扣、一部分不扣导致读数忽高忽低。
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
 * Calculates total tokens per second from speed metrics.
 *
 * 与输出速度同分母，分子换成输入+输出，保证两个组件可直接对比。
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
