import {
    describe,
    expect,
    it
} from 'vitest';

import type { SpeedMetrics } from '../../types/SpeedMetrics';
import {
    calculateInputSpeed,
    calculateOutputSpeed,
    calculateTotalSpeed,
    calculateTtftMs,
    formatSpeed,
    formatTtft
} from '../speed-metrics';

function createMetrics(overrides: Partial<SpeedMetrics> = {}): SpeedMetrics {
    return {
        generationDurationMs: 10000,
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        requestCount: 5,
        ttftMsSum: 0,
        ttftSampleCount: 0,
        ttftInputTokens: 0,
        ...overrides
    };
}

describe('speed metrics calculations', () => {
    it('calculateOutputSpeed returns null when generation duration is zero', () => {
        const result = calculateOutputSpeed(createMetrics({ generationDurationMs: 0 }));
        expect(result).toBeNull();
    });

    it('calculateOutputSpeed computes output tokens per second from generation duration', () => {
        const result = calculateOutputSpeed(createMetrics({ outputTokens: 750, generationDurationMs: 15000 }));
        expect(result).toBe(50);
    });

    it('calculateInputSpeed returns null when no TTFT samples exist', () => {
        const result = calculateInputSpeed(createMetrics());
        expect(result).toBeNull();
    });

    it('calculateInputSpeed computes prefill throughput from uncached input over TTFT total', () => {
        const result = calculateInputSpeed(createMetrics({ ttftInputTokens: 120000, ttftMsSum: 2000, ttftSampleCount: 1 }));
        expect(result).toBe(60000);
    });

    it('calculateTotalSpeed returns null when generation duration is zero', () => {
        const result = calculateTotalSpeed(createMetrics({ generationDurationMs: 0 }));
        expect(result).toBeNull();
    });

    it('calculateTotalSpeed computes total tokens per second from totalTokens', () => {
        const result = calculateTotalSpeed(createMetrics({ totalTokens: 3000, generationDurationMs: 12000 }));
        expect(result).toBe(250);
    });

    it('calculateTtftMs returns null without samples', () => {
        const result = calculateTtftMs(createMetrics());
        expect(result).toBeNull();
    });

    it('calculateTtftMs averages the TTFT samples', () => {
        const result = calculateTtftMs(createMetrics({ ttftMsSum: 3600, ttftSampleCount: 2 }));
        expect(result).toBe(1800);
    });
});

describe('formatSpeed', () => {
    it('formats null as an em dash placeholder', () => {
        expect(formatSpeed(null)).toBe('—');
    });

    it('formats sub-1000 speeds with one decimal place', () => {
        expect(formatSpeed(42.54)).toBe('42.5 t/s');
    });

    it('formats exact threshold values in k notation', () => {
        expect(formatSpeed(1000)).toBe('1.0k t/s');
    });

    it('formats high speeds in k notation with one decimal place', () => {
        expect(formatSpeed(1250)).toBe('1.3k t/s');
    });
});

describe('formatTtft', () => {
    it('formats null as an em dash placeholder', () => {
        expect(formatTtft(null)).toBe('—');
    });

    it('formats sub-second values in milliseconds without decimals', () => {
        expect(formatTtft(850.4)).toBe('850ms');
    });

    it('formats values at or above one second with one decimal place', () => {
        expect(formatTtft(1000)).toBe('1.0s');
        expect(formatTtft(1600)).toBe('1.6s');
    });
});
