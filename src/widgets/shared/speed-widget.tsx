import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import type { RenderContext } from '../../types/RenderContext';
import type { SpeedMetrics } from '../../types/SpeedMetrics';
import type {
    CustomKeybind,
    WidgetEditorDisplay,
    WidgetEditorProps,
    WidgetItem
} from '../../types/Widget';
import { shouldInsertInput } from '../../utils/input-guards';
import {
    calculateInputSpeed,
    calculateOutputSpeed,
    calculateTotalSpeed,
    calculateTtftMs,
    formatSpeed,
    formatTtft
} from '../../utils/speed-metrics';
import {
    DEFAULT_SPEED_WINDOW_SECONDS,
    MAX_SPEED_WINDOW_SECONDS,
    MIN_SPEED_WINDOW_SECONDS,
    getWidgetSpeedWindowSeconds,
    isWidgetSpeedWindowEnabled,
    withWidgetSpeedWindowSeconds
} from '../../utils/speed-window';

import { makeModifierText } from './editor-display';
import { formatRawOrLabeledValue } from './raw-or-labeled';

export type SpeedWidgetKind = 'input' | 'output' | 'total' | 'ttft';

const WINDOW_EDITOR_ACTION = 'edit-window';

interface SpeedWidgetKindConfig {
    label: string;
    displayName: string;
    description: string;
    sessionPreview: string;
    windowedPreview: string;
}

const SPEED_WIDGET_CONFIG: Record<SpeedWidgetKind, SpeedWidgetKindConfig> = {
    input: {
        label: '输入: ',
        displayName: '输入速度',
        description: '真实 prefill 吞吐：未缓存输入 + 缓存写入（不含缓存命中）÷ 首字延迟总量（tokens/sec）。可选窗口：0-120 秒（0 = 全会话平均）。',
        sessionPreview: '27.5k t/s',
        windowedPreview: '18.2k t/s'
    },
    output: {
        label: '输出: ',
        displayName: '输出速度',
        description: '纯生成速度：输出 Token ÷ 纯生成时长（已剔除首字延迟与工具等待，tokens/sec）。可选窗口：0-120 秒（0 = 全会话平均）。',
        sessionPreview: '42.5 t/s',
        windowedPreview: '26.8 t/s'
    },
    total: {
        label: '合计: ',
        displayName: '总速度',
        description: '纯生成口径的总 Token 速度（输入+输出，已剔除首字延迟与工具等待，tokens/sec）。可选窗口：0-120 秒（0 = 全会话平均）。',
        sessionPreview: '127.7 t/s',
        windowedPreview: '58.3 t/s'
    },
    ttft: {
        label: 'TTFT: ',
        displayName: '首字延迟 (TTFT)',
        description: '平均首字延迟：从发出请求到模型开始输出的时间（含排队与输入处理）。可选窗口：0-120 秒（0 = 全会话平均）。',
        sessionPreview: '1.6s',
        windowedPreview: '1.2s'
    }
};

function getSpeedMetricsForWidget(item: WidgetItem, context: RenderContext): SpeedMetrics | null {
    if (!isWidgetSpeedWindowEnabled(item)) {
        return context.speedMetrics ?? null;
    }

    const windowSeconds = getWidgetSpeedWindowSeconds(item);
    return context.windowedSpeedMetrics?.[windowSeconds.toString()] ?? null;
}

function calculateSpeed(kind: SpeedWidgetKind, metrics: SpeedMetrics): number | null {
    if (kind === 'input') {
        return calculateInputSpeed(metrics);
    }
    if (kind === 'output') {
        return calculateOutputSpeed(metrics);
    }
    return calculateTotalSpeed(metrics);
}

export function getSpeedWidgetDisplayName(kind: SpeedWidgetKind): string {
    return SPEED_WIDGET_CONFIG[kind].displayName;
}

export function getSpeedWidgetDescription(kind: SpeedWidgetKind): string {
    return SPEED_WIDGET_CONFIG[kind].description;
}

export function getSpeedWidgetEditorDisplay(kind: SpeedWidgetKind, item: WidgetItem): WidgetEditorDisplay {
    const windowSeconds = getWidgetSpeedWindowSeconds(item);
    const modifiers = windowSeconds > 0
        ? [`${windowSeconds}秒窗口`]
        : ['全会话平均'];

    return {
        displayText: getSpeedWidgetDisplayName(kind),
        modifierText: makeModifierText(modifiers)
    };
}

export function renderSpeedWidgetValue(
    kind: SpeedWidgetKind,
    item: WidgetItem,
    context: RenderContext
): string | null {
    const config = SPEED_WIDGET_CONFIG[kind];
    const previewValue = isWidgetSpeedWindowEnabled(item)
        ? config.windowedPreview
        : config.sessionPreview;

    if (context.isPreview) {
        return formatRawOrLabeledValue(item, config.label, previewValue);
    }

    const metrics = getSpeedMetricsForWidget(item, context);
    if (!metrics) {
        return null;
    }

    const valueText = kind === 'ttft'
        ? formatTtft(calculateTtftMs(metrics))
        : formatSpeed(calculateSpeed(kind, metrics));
    return formatRawOrLabeledValue(item, config.label, valueText);
}

export function getSpeedWidgetCustomKeybinds(): CustomKeybind[] {
    return [{
        key: 'w',
        label: '(w)时间窗口',
        action: WINDOW_EDITOR_ACTION
    }];
}

export function renderSpeedWidgetEditor(props: WidgetEditorProps): React.ReactElement {
    return <SpeedWindowEditor {...props} />;
}

const SpeedWindowEditor: React.FC<WidgetEditorProps> = ({ widget, onComplete, onCancel, action }) => {
    const [windowInput, setWindowInput] = useState(getWidgetSpeedWindowSeconds(widget).toString());

    useInput((input, key) => {
        if (action !== WINDOW_EDITOR_ACTION) {
            return;
        }

        if (key.return) {
            const parsedWindow = Number.parseInt(windowInput, 10);
            const nextWindow = Number.isFinite(parsedWindow)
                ? parsedWindow
                : DEFAULT_SPEED_WINDOW_SECONDS;

            onComplete(withWidgetSpeedWindowSeconds(widget, nextWindow));
            return;
        }

        if (key.escape) {
            onCancel();
            return;
        }

        if (key.backspace) {
            setWindowInput(windowInput.slice(0, -1));
            return;
        }

        if (shouldInsertInput(input, key) && /\d/.test(input)) {
            setWindowInput(windowInput + input);
        }
    });

    if (action !== WINDOW_EDITOR_ACTION) {
        return <Text>未知编辑模式</Text>;
    }

    return (
        <Box flexDirection='column'>
            <Box>
                <Text>
                    输入时间窗口（秒，
                    {MIN_SPEED_WINDOW_SECONDS}
                    -
                    {MAX_SPEED_WINDOW_SECONDS}
                    ）：
                    {' '}
                </Text>
                <Text>{windowInput}</Text>
                <Text backgroundColor='gray' color='black'>{' '}</Text>
            </Box>
            <Text dimColor>0 表示禁用窗口模式并使用全会话平均值。按 Enter 保存，ESC 取消。</Text>
        </Box>
    );
};
