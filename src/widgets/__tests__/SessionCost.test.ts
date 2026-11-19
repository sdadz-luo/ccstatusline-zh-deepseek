import * as fs from 'fs';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type {
    RenderContext,
    TokenBreakdown,
    TokenMetrics,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import {
    SessionCostWidget,
    peakAwareDefaultColor
} from '../SessionCost';

const ITEM: WidgetItem = { id: 'cost', type: 'session-cost' };
const RAW_ITEM: WidgetItem = { id: 'cost', type: 'session-cost', rawValue: true };

function makeContext(overrides: Partial<RenderContext> = {}): RenderContext {
    return { ...overrides };
}

function render(item: WidgetItem, context: RenderContext = {}): string | null {
    const widget = new SessionCostWidget();
    return widget.render(item, context, DEFAULT_SETTINGS);
}

// 北京时间（UTC+8）周四 10:30，落在 9:00-12:00 波峰段
const PEAK_THURSDAY = new Date('2026-11-19T02:30:00Z');
// 北京时间周四 20:30，波谷
const OFF_PEAK_THURSDAY = new Date('2026-11-19T12:30:00Z');
// 北京时间周六 10:30：在工作时段内但周末不计费
const SATURDAY_MORNING = new Date('2026-11-21T02:30:00Z');

const DEEPSEEK_CTX = makeContext({ data: { model: { id: 'deepseek-v4.1-flash[1m]' } } });
const GLM_CTX = makeContext({ data: { model: { id: 'glm-5.3[1m]' } } });

function makeBreakdown(input: number): TokenBreakdown {
    return { inputTokens: input, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
}

function makeMetrics(peakInput: number, offPeakInput: number): TokenMetrics {
    return {
        inputTokens: peakInput + offPeakInput,
        outputTokens: 0,
        cachedTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: peakInput + offPeakInput,
        contextLength: 0,
        peakBreakdown: makeBreakdown(peakInput),
        offPeakBreakdown: makeBreakdown(offPeakInput)
    };
}

describe('SessionCostWidget', () => {
    // 费用金额断言依赖默认价格表；拦截定价文件读取，隔离用户本机
    // ~/.config/ccstatusline/deepseek-pricing.json 的覆盖值。
    beforeEach(() => {
        vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
            throw new Error('isolated from user pricing override');
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('peakAwareDefaultColor()', () => {
        it('DeepSeek 模型在波峰时段变红', () => {
            expect(peakAwareDefaultColor(DEEPSEEK_CTX, PEAK_THURSDAY)).toBe('red');
        });

        it('DeepSeek 模型在波谷时段保持绿色', () => {
            expect(peakAwareDefaultColor(DEEPSEEK_CTX, OFF_PEAK_THURSDAY)).toBe('green');
        });

        it('DeepSeek 模型周末白天按波谷计', () => {
            expect(peakAwareDefaultColor(DEEPSEEK_CTX, SATURDAY_MORNING)).toBe('green');
        });

        it('非 DeepSeek 模型即使处于波峰时段也不变红', () => {
            expect(peakAwareDefaultColor(GLM_CTX, PEAK_THURSDAY)).toBe('green');
        });

        it('无模型上下文（TUI 配置界面）恒为绿色', () => {
            expect(peakAwareDefaultColor(undefined, PEAK_THURSDAY)).toBe('green');
        });
    });

    describe('getDefaultColor()', () => {
        // 时段敏感的分支由 peakAwareDefaultColor 以固定时间覆盖；
        // 这里只断言与运行时钟无关的稳定行为，避免用例对执行时刻敏感。
        it('非 DeepSeek 模型恒为绿色', () => {
            expect(new SessionCostWidget().getDefaultColor(GLM_CTX)).toBe('green');
        });

        it('无 context 时恒为绿色', () => {
            expect(new SessionCostWidget().getDefaultColor()).toBe('green');
        });
    });

    describe('render()：DeepSeek 峰谷计价', () => {
        it('按峰谷分段计价（波峰 1M + 波谷 1M 输入 = $0.45）', () => {
            const ctx = makeContext({
                data: { model: { id: 'deepseek-v4.1-flash[1m]' } },
                tokenMetrics: makeMetrics(1_000_000, 1_000_000)
            });
            expect(new SessionCostWidget().render(ITEM, ctx, DEFAULT_SETTINGS)).toBe('费用: $0.45');
        });

        it('折叠子代理 token（主、子各 1M 波峰输入 = $0.60）', () => {
            const ctx = makeContext({
                data: { model: { id: 'deepseek-v4.1-flash[1m]' } },
                tokenMetrics: makeMetrics(1_000_000, 0),
                subagentTokenMetrics: makeMetrics(1_000_000, 0)
            });
            expect(new SessionCostWidget().render(ITEM, ctx, DEFAULT_SETTINGS)).toBe('费用: $0.60');
        });

        it('rawValue 模式省略「费用: 」前缀', () => {
            const ctx = makeContext({
                data: { model: { id: 'deepseek-v4.1-flash[1m]' } },
                tokenMetrics: makeMetrics(1_000_000, 1_000_000)
            });
            expect(new SessionCostWidget().render(RAW_ITEM, ctx, DEFAULT_SETTINGS)).toBe('$0.45');
        });

        it('DeepSeek 计费也遵循 zero 隐藏', () => {
            const ctx = makeContext({
                data: { model: { id: 'deepseek-v4.1-flash[1m]' } },
                tokenMetrics: makeMetrics(0, 0)
            });
            expect(new SessionCostWidget().render(
                { ...ITEM, metadata: { hide: 'zero' } },
                ctx,
                DEFAULT_SETTINGS
            )).toBeNull();
        });
    });

    describe('render()：官方费用路径', () => {
        it('从状态 JSON 渲染会话费用', () => {
            expect(render(
                { id: 'session-cost', type: 'session-cost' },
                { data: { cost: { total_cost_usd: 2.456 } } }
            )).toBe('费用: $2.46');
        });

        it('缺少费用数据时不渲染', () => {
            expect(render({ id: 'session-cost', type: 'session-cost' }, {})).toBeNull();
        });

        it('非 DeepSeek 模型回退到官方 total_cost_usd', () => {
            const ctx = makeContext({ data: { model: { id: 'glm-5.3[1m]' }, cost: { total_cost_usd: 2.454 } } });
            expect(new SessionCostWidget().render(ITEM, ctx, DEFAULT_SETTINGS)).toBe('费用: $2.45');
        });

        it('preview 模式返回演示文案', () => {
            expect(render(ITEM, { isPreview: true })).toBe('费用: $2.45');
        });

        it('预览样例遵循所选费用格式', () => {
            expect(render({
                id: 'session-cost',
                type: 'session-cost',
                numberFormat: { style: 'whole' }
            }, { isPreview: true })).toBe('费用: $2');
        });

        it('声明 zero 隐藏状态', () => {
            expect(new SessionCostWidget().getHideableStates().map(state => state.key)).toEqual(['zero']);
        });

        it('仅在启用 zero 隐藏时隐藏 $0.00', () => {
            const context: RenderContext = { data: { cost: { total_cost_usd: 0 } } };

            expect(render({ id: 'session-cost', type: 'session-cost' }, context)).toBe('费用: $0.00');
            expect(render({
                id: 'session-cost',
                type: 'session-cost',
                metadata: { hide: 'zero' }
            }, context)).toBeNull();
            expect(render({
                id: 'session-cost',
                type: 'session-cost',
                metadata: { hide: 'zero' }
            }, { data: { cost: { total_cost_usd: 0.01 } } })).toBe('费用: $0.01');
        });

        it('显示为 $0.00 的亚分费用按零处理', () => {
            expect(render({
                id: 'session-cost',
                type: 'session-cost',
                metadata: { hide: 'zero' }
            }, { data: { cost: { total_cost_usd: 0.001 } } })).toBeNull();
        });

        it.each([
            { name: 'compact', numberFormat: { style: 'compact' as const } },
            { name: 'whole', numberFormat: { style: 'whole' as const } },
            { name: 'custom-decimal', numberFormat: { decimals: 4 } }
        ])('在 $name 数字格式下仍保留 zero 隐藏', ({ numberFormat }) => {
            expect(render({
                id: 'session-cost',
                type: 'session-cost',
                metadata: { hide: 'zero' },
                numberFormat
            }, { data: { cost: { total_cost_usd: 0 } } })).toBeNull();
        });
    });
});
