import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type { TokenBreakdown } from '../types/TokenMetrics';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getDeepSeekPricing,
    isDeepSeekPeakHour,
    type DeepSeekRates
} from '../utils/deepseek-pricing';

// 供应商/代理会改写模型标识（deepseek-flash[1m]、deepseek-v4-flash、deepseek-v4.1-flash…），
// 只认 "deepseek" + "flash" 双关键词，免得模型升级改名后费用段落静默消失。
function isDeepSeekFlash(context: RenderContext): boolean {
    const model = context.data?.model;
    const tag = (typeof model === 'string'
        ? model
        : `${model?.id ?? ''} ${model?.display_name ?? ''}`).toLowerCase();

    return tag.includes('deepseek') && tag.includes('flash');
}

// 入参用 Partial 以同时接纳 TokenBreakdown 与 TokenMetrics（后者的缓存字段可选）
function mergeBreakdowns(a?: Partial<TokenBreakdown> | null, b?: Partial<TokenBreakdown> | null): TokenBreakdown {
    return {
        inputTokens: (a?.inputTokens ?? 0) + (b?.inputTokens ?? 0),
        outputTokens: (a?.outputTokens ?? 0) + (b?.outputTokens ?? 0),
        cacheReadTokens: (a?.cacheReadTokens ?? 0) + (b?.cacheReadTokens ?? 0),
        cacheCreationTokens: (a?.cacheCreationTokens ?? 0) + (b?.cacheCreationTokens ?? 0)
    };
}

function costForBreakdown(tokens: TokenBreakdown, rates: DeepSeekRates): number {
    return tokens.inputTokens / 1e6 * rates.input
        + tokens.outputTokens / 1e6 * rates.output
        + tokens.cacheReadTokens / 1e6 * rates.cacheRead
        + tokens.cacheCreationTokens / 1e6 * rates.input;
}

// 按 token 实际发生时段分段计价：波峰 token 用波峰价、波谷 token 用波谷价，
// 避免跨时段刷新时全部 token 被按当前价格重算导致费用跳变。
function calculateDeepSeekCost(context: RenderContext): number | null {
    if (!isDeepSeekFlash(context)) {
        return null;
    }

    const metrics = context.tokenMetrics;
    if (!metrics) {
        return null;
    }

    const pricing = getDeepSeekPricing();
    // 子代理（Task 工具）的 token 单独记录在 subagents/ 下，不含在主会话 metrics 里，
    // 需额外汇总，否则费用被低估。
    const sub = context.subagentTokenMetrics;
    const peak = metrics.peakBreakdown;
    const offPeak = metrics.offPeakBreakdown;

    if (!peak || !offPeak) {
        // 兼容无分段统计的旧数据：回退到按当前时段全量计价
        const rates = isDeepSeekPeakHour(new Date()) ? pricing.peak : pricing.offPeak;

        return costForBreakdown(mergeBreakdowns(metrics, sub), rates);
    }

    return costForBreakdown(mergeBreakdowns(peak, sub?.peakBreakdown), pricing.peak)
        + costForBreakdown(mergeBreakdowns(offPeak, sub?.offPeakBreakdown), pricing.offPeak);
}

export class SessionCostWidget implements Widget {
    getDefaultColor(): string { return isDeepSeekPeakHour(new Date()) ? 'red' : 'green'; }
    getDescription(): string { return '显示当前会话总费用（美元）'; }
    getDisplayName(): string { return '会话费用'; }
    getCategory(): string { return '会话'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '$2.45' : '费用: $2.45';
        }

        const deepSeekCost = calculateDeepSeekCost(context);
        if (deepSeekCost !== null) {
            const formattedCost = `$${deepSeekCost.toFixed(2)}`;

            return item.rawValue ? formattedCost : `费用: ${formattedCost}`;
        }

        const totalCost = context.data?.cost?.total_cost_usd;
        if (totalCost === undefined) {
            return null;
        }

        // Format the cost to 2 decimal places
        const formattedCost = `$${totalCost.toFixed(2)}`;

        return item.rawValue ? formattedCost : `费用: ${formattedCost}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
