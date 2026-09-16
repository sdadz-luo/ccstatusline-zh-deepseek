import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface DeepSeekRates {
    input: number;
    output: number;
    cacheRead: number;
}

export interface DeepSeekPricing {
    peak: DeepSeekRates;
    offPeak: DeepSeekRates;
}

// DeepSeek V4.1 Flash 定价（美元/百万 token，2026-09-10 12:00 起生效）。
// 官方以人民币计价：波谷 ¥1 / ¥4 / ¥0.02，波峰为波谷两倍，此处按 6.67 汇率折算。
// 缓存写入（cache_creation）无独立价格，未命中输入按输入价计费。
const DEFAULT_PRICING: DeepSeekPricing = {
    peak: { input: 0.3, output: 1.2, cacheRead: 0.006 },
    offPeak: { input: 0.15, output: 0.6, cacheRead: 0.003 }
};

// 与 settings.json 同目录。此处不 import config.ts，是为了避开
// config → widgets → SessionCost 这条已有的回环依赖。
const PRICING_PATH = path.join(os.homedir(), '.config', 'ccstatusline', 'deepseek-pricing.json');

function pickRate(record: Record<string, unknown>, key: keyof DeepSeekRates, fallback: DeepSeekRates): number {
    const value = record[key];

    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback[key];
}

function mergeRates(value: unknown, fallback: DeepSeekRates): DeepSeekRates {
    if (!value || typeof value !== 'object') {
        return fallback;
    }

    const record = value as Record<string, unknown>;

    return {
        input: pickRate(record, 'input', fallback),
        output: pickRate(record, 'output', fallback),
        cacheRead: pickRate(record, 'cacheRead', fallback)
    };
}

/**
 * 读取 DeepSeek 价格表。官方调价频繁，允许用同目录的 deepseek-pricing.json
 * 覆盖内置默认值（可只写要改的字段），免得每次调价都要改源码重新构建。
 * 文件缺失或格式错误时静默回退到默认值。
 */
export function getDeepSeekPricing(): DeepSeekPricing {
    try {
        const raw: unknown = JSON.parse(fs.readFileSync(PRICING_PATH, 'utf8'));
        if (!raw || typeof raw !== 'object') {
            return DEFAULT_PRICING;
        }

        const parsed = raw as Record<string, unknown>;

        return {
            peak: mergeRates(parsed.peak, DEFAULT_PRICING.peak),
            offPeak: mergeRates(parsed.offPeak, DEFAULT_PRICING.offPeak)
        };
    } catch {
        return DEFAULT_PRICING;
    }
}

// 波峰时段：北京时间（UTC+8）周一至周五 9:00-12:00、14:00-18:00，其余为空闲。
// 按固定偏移换算而非读本地时区，机器时区不是东八区时也能与官方口径一致。
export function isDeepSeekPeakHour(date: Date): boolean {
    const beijing = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const day = beijing.getUTCDay();
    if (day === 0 || day === 6) {
        return false;
    }

    const hour = beijing.getUTCHours();

    return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
}
