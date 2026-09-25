import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getUsageErrorMessage,
    resolveMonthlyUsageWindow
} from '../utils/usage';

import { makeTimerProgressBar } from './shared/progress-bar';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';
import {
    cycleUsageDisplayMode,
    getUsageDisplayMode,
    getUsageDisplayModifierText,
    getUsagePercentCustomKeybinds,
    getUsageProgressBarWidth,
    isUsageCursorEnabled,
    isUsageInverted,
    isUsageProgressMode,
    isUsageSliderMode,
    makeSliderBar,
    toggleUsageCursor,
    toggleUsageInverted
} from './shared/usage-display';

// Only the opencode go source reports a monthly window (Claude's usage API
// stops at the five-hour/seven-day windows), so this widget renders nothing
// without it.
export class MonthlyUsageWidget implements Widget {
    getDefaultColor(): string { return 'brightBlue'; }
    getDescription(): string { return '显示每月 API 用量百分比（opencode go）'; }
    getDisplayName(): string { return '月用量'; }
    getCategory(): string { return '用量'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return {
            displayText: this.getDisplayName(),
            modifierText: getUsageDisplayModifierText(item, { showUsageDirection: true })
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-progress') {
            return cycleUsageDisplayMode(item, [], true, true);
        }

        if (action === 'toggle-invert') {
            return toggleUsageInverted(item);
        }

        if (action === 'toggle-cursor') {
            return toggleUsageCursor(item);
        }

        return null;
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const displayMode = getUsageDisplayMode(item);
        const inverted = isUsageInverted(item);
        const showCursor = isUsageCursorEnabled(item);

        if (context.isPreview) {
            const previewPercent = 8;
            const renderedPercent = inverted ? 100 - previewPercent : previewPercent;

            if (isUsageProgressMode(displayMode)) {
                const width = getUsageProgressBarWidth(displayMode);
                const progressBar = makeTimerProgressBar(renderedPercent, width, showCursor ? { cursorPercent: 50 } : undefined);
                const progressDisplay = `[${progressBar}] ${renderedPercent.toFixed(1)}%`;
                return formatRawOrLabeledValue(item, '月用量: ', progressDisplay);
            }

            if (isUsageSliderMode(displayMode)) {
                const slider = makeSliderBar(renderedPercent, undefined, showCursor ? { cursorPercent: 50 } : undefined);
                const sliderDisplay = displayMode === 'slider' ? `${slider} ${renderedPercent.toFixed(1)}%` : slider;
                return formatRawOrLabeledValue(item, '月用量: ', sliderDisplay);
            }

            return formatRawOrLabeledValue(item, '月用量: ', `${renderedPercent.toFixed(1)}%`);
        }

        const data = context.usageData ?? {};
        if (data.monthlyUsage === undefined) {
            if (data.error)
                return getUsageErrorMessage(data.error);
            return null;
        }

        const percent = Math.max(0, Math.min(100, data.monthlyUsage));
        const renderedPercent = inverted ? 100 - percent : percent;
        const getCursorOptions = (): { cursorPercent: number } | undefined => {
            if (!showCursor) {
                return undefined;
            }

            const window = resolveMonthlyUsageWindow(data);
            return window ? { cursorPercent: window.elapsedPercent } : undefined;
        };

        if (isUsageProgressMode(displayMode)) {
            const width = getUsageProgressBarWidth(displayMode);

            const progressBar = makeTimerProgressBar(renderedPercent, width, getCursorOptions());
            const progressDisplay = `[${progressBar}] ${renderedPercent.toFixed(1)}%`;
            return formatRawOrLabeledValue(item, '月用量: ', progressDisplay);
        }

        if (isUsageSliderMode(displayMode)) {
            const slider = makeSliderBar(renderedPercent, undefined, getCursorOptions());
            const sliderDisplay = displayMode === 'slider' ? `${slider} ${renderedPercent.toFixed(1)}%` : slider;
            return formatRawOrLabeledValue(item, '月用量: ', sliderDisplay);
        }

        return formatRawOrLabeledValue(item, '月用量: ', `${renderedPercent.toFixed(1)}%`);
    }

    getCustomKeybinds(item?: WidgetItem): CustomKeybind[] {
        return getUsagePercentCustomKeybinds(item);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
