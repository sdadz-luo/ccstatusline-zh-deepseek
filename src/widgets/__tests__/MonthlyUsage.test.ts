import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types/RenderContext';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import * as usage from '../../utils/usage';
import type { UsageWindowMetrics } from '../../utils/usage-types';
import { MonthlyUsageWidget } from '../MonthlyUsage';

import { runUsagePercentWidgetSuite } from './helpers/usage-widget-suites';

let mockGetUsageErrorMessage: { mockReturnValue: (value: string) => void };
const usageErrorMessageMock = {
    mockReturnValue(value: string): void {
        mockGetUsageErrorMessage.mockReturnValue(value);
    }
};

// The monthly window is assumed to be 30 days long (the API reports only the
// reset instant), so a halfway-elapsed window is 15 days in.
const halfElapsedWindow: UsageWindowMetrics = {
    sessionDurationMs: 2592000000,
    elapsedMs: 1296000000,
    remainingMs: 1296000000,
    elapsedPercent: 50,
    remainingPercent: 50
};

function render(widget: MonthlyUsageWidget, item: WidgetItem, context: RenderContext = {}): string | null {
    return widget.render(item, context, DEFAULT_SETTINGS);
}

describe('MonthlyUsageWidget', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockGetUsageErrorMessage = vi.spyOn(usage, 'getUsageErrorMessage');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the time cursor in short bar modes', () => {
        const widget = new MonthlyUsageWidget();
        const context: RenderContext = { usageData: { monthlyUsage: 20 } };

        vi.spyOn(usage, 'resolveMonthlyUsageWindow').mockReturnValue(halfElapsedWindow);

        expect(render(widget, {
            id: 'monthly',
            type: 'monthly-usage',
            metadata: { cursor: 'true', display: 'slider' }
        }, context)).toBe('月用量: ▓▓░░░│░░░░ 20.0%');
        expect(render(widget, {
            id: 'monthly',
            type: 'monthly-usage',
            metadata: { cursor: 'true', display: 'slider-only' }
        }, context)).toBe('月用量: ▓▓░░░│░░░░');
    });

    it('renders nothing without a monthly window', () => {
        const widget = new MonthlyUsageWidget();

        // Claude's usage API has no monthly window, so a session-usage-only
        // payload must leave this widget blank rather than showing 0%.
        expect(render(widget, { id: 'monthly', type: 'monthly-usage' }, { usageData: { sessionUsage: 42 } })).toBeNull();
    });

    runUsagePercentWidgetSuite({
        baseItem: { id: 'monthly', type: 'monthly-usage' },
        createWidget: () => new MonthlyUsageWidget(),
        errorMessageMock: usageErrorMessageMock,
        expectedInvertedTime: '月用量: 57.9%',
        expectedModifierText: '(长进度条, 剩余)',
        expectedPreviewInvertedTime: '月用量: 92.0%',
        expectedProgress: '月用量: [███████████████████░░░░░░░░░░░░░] 57.9%',
        expectedRawInvertedTime: '57.9%',
        expectedRawProgress: '[███████░░░░░░░░░] 42.1%',
        expectedRawTime: '42.1%',
        expectedTime: '月用量: 42.1%',
        modifierItem: {
            id: 'monthly',
            type: 'monthly-usage',
            metadata: { display: 'progress', invert: 'true' }
        },
        progressItem: {
            id: 'monthly',
            type: 'monthly-usage',
            metadata: { display: 'progress', invert: 'true' }
        },
        rawProgressItem: {
            id: 'monthly',
            type: 'monthly-usage',
            rawValue: true,
            metadata: { display: 'progress-short' }
        },
        rawTimeItem: {
            id: 'monthly',
            type: 'monthly-usage',
            rawValue: true
        },
        render,
        usageField: 'monthlyUsage',
        usageValue: 42.06
    });
});
