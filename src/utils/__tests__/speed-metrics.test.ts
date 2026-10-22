import {
    describe,
    expect,
    it
} from 'vitest';

import type { SpeedMetrics } from '../../types/SpeedMetrics';
import {
    calculateOutputSpeed,
    calculateTotalSpeed,
    formatSpeed
} from '../speed-metrics';

function createMetrics(overrides: Partial<SpeedMetrics> = {}): SpeedMetrics {
    return {
        generationDurationMs: 10000,
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        requestCount: 5,
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

    it('calculateTotalSpeed returns null when generation duration is zero', () => {
        const result = calculateTotalSpeed(createMetrics({ generationDurationMs: 0 }));
        expect(result).toBeNull();
    });

    it('calculateTotalSpeed computes total tokens per second from totalTokens', () => {
        const result = calculateTotalSpeed(createMetrics({ totalTokens: 3000, generationDurationMs: 12000 }));
        expect(result).toBe(250);
    });

    it('total speed shares the output-speed denominator so both stay comparable', () => {
        const metrics = createMetrics({ inputTokens: 2000, outputTokens: 500, totalTokens: 2500, generationDurationMs: 5000 });
        expect(calculateOutputSpeed(metrics)).toBe(100);
        expect(calculateTotalSpeed(metrics)).toBe(500);
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
