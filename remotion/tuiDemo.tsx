import type {
    CSSProperties,
    ReactNode
} from 'react';
import {
    AbsoluteFill,
    Easing,
    interpolate,
    useCurrentFrame
} from 'remotion';

import packageJson from '../package.json';
import {
    filterFuzzySearchRecords,
    getMatchSegments,
    type FuzzySearchRecord
} from '../src/utils/fuzzy';

type Screen = 'launch' | 'main' | 'lines' | 'items' | 'picker' | 'powerline' | 'themes' | 'final';
type PickerLevel = 'category' | 'widget';
type UsageDisplayMode = 'time' | 'progress' | 'progress-short' | 'slider' | 'slider-only';
type ThemeName
    = 'custom'
        | 'nord'
        | 'nord-aurora'
        | 'monokai'
        | 'solarized'
        | 'minimal'
        | 'dracula'
        | 'catppuccin'
        | 'gruvbox'
        | 'onedark'
        | 'tokyonight';

const PACKAGE_VERSION = packageJson.version;

interface Swatch {
    foreground: string;
    background: string;
}

interface Theme {
    name: string;
    description: string;
    swatches: [
        Swatch,
        Swatch,
        Swatch,
        Swatch,
        Swatch,
        Swatch
    ];
}

interface Phase {
    title: string;
    subtitle: string;
    screen: Screen;
    powerline: boolean;
    selectedTheme: ThemeName;
    selectedMainIndex: number;
    selectedLineIndex: number;
    selectedItemIndex: number;
    lineOneConfigured: boolean;
    lineOneWidgetCount: number;
    lineNumber: 1 | 2;
    lineTwoConfigured: boolean;
    lineTwoWidgetCount: number;
    sessionUsageMode: UsageDisplayMode;
    weeklyUsageMode: UsageDisplayMode;
    pickerLevel?: PickerLevel;
    selectedCategory?: string;
    categoryQuery?: string;
    widgetQuery?: string;
    keys: string[];
}

interface MenuItem {
    label: string;
    sublabel?: string;
    description?: string;
    disabled?: boolean;
    separator?: boolean;
    powerlineSeparator?: 'triangle-right';
}

interface EditorWidget {
    displayText: string;
    description: string;
}

interface WidgetCatalogItem extends MenuItem {
    type: string;
    category: string;
    searchText: string;
}

const TUI_START_FRAME = 96;
const COMMAND_TEXT = '$ npx ccstatusline-zh@latest';

const THEMES: Record<ThemeName, Theme> = {
    'custom': {
        name: 'Custom',
        description: 'Uses individual widget background colors',
        swatches: [
            { foreground: '#F8FAFC', background: '#334155' },
            { foreground: '#E2E8F0', background: '#475569' },
            { foreground: '#0F172A', background: '#94A3B8' },
            { foreground: '#F8FAFC', background: '#1E293B' },
            { foreground: '#0F172A', background: '#CBD5E1' },
            { foreground: '#E2E8F0', background: '#64748B' }
        ]
    },
    'nord': {
        name: 'Nord',
        description: 'Arctic, north-bluish color palette',
        swatches: [
            { foreground: '#2E3440', background: '#88C0D0' },
            { foreground: '#D8DEE9', background: '#4C566A' },
            { foreground: '#FDF6E3', background: '#5E81AC' },
            { foreground: '#2E3440', background: '#B48EAD' },
            { foreground: '#2E3440', background: '#A3BE8C' },
            { foreground: '#D8DEE9', background: '#4C566A' }
        ]
    },
    'nord-aurora': {
        name: 'Nord Aurora',
        description: 'Nord theme with aurora colors',
        swatches: [
            { foreground: '#ECEFF4', background: '#BF616A' },
            { foreground: '#2E3440', background: '#EBCB8B' },
            { foreground: '#FDF6E3', background: '#5E81AC' },
            { foreground: '#2E3440', background: '#A3BE8C' },
            { foreground: '#2E3440', background: '#B48EAD' },
            { foreground: '#ECEFF4', background: '#4C566A' }
        ]
    },
    'monokai': {
        name: 'Monokai',
        description: 'Dark background with vibrant colors',
        swatches: [
            { foreground: '#272822', background: '#A6E22E' },
            { foreground: '#F8F8F2', background: '#49483E' },
            { foreground: '#272822', background: '#E6DB74' },
            { foreground: '#272822', background: '#AE81FF' },
            { foreground: '#272822', background: '#66D9EF' },
            { foreground: '#F8F8F2', background: '#75715E' }
        ]
    },
    'solarized': {
        name: 'Solarized',
        description: 'Precision colors for readability',
        swatches: [
            { foreground: '#073642', background: '#268BD2' },
            { foreground: '#073642', background: '#B58900' },
            { foreground: '#FDF6E3', background: '#586E75' },
            { foreground: '#073642', background: '#2AA198' },
            { foreground: '#073642', background: '#EEE8D5' },
            { foreground: '#073642', background: '#B58900' }
        ]
    },
    'minimal': {
        name: 'Minimal',
        description: 'Clean monochrome theme',
        swatches: [
            { foreground: '#FFFFFF', background: '#585858' },
            { foreground: '#1C1C1C', background: '#D0D0D0' },
            { foreground: '#FFFFFF', background: '#1A1A1A' },
            { foreground: '#1C1C1C', background: '#A8A8A8' },
            { foreground: '#E4E4E4', background: '#303030' },
            { foreground: '#1C1C1C', background: '#D0D0D0' }
        ]
    },
    'dracula': {
        name: 'Dracula',
        description: 'Dark theme with purple accents',
        swatches: [
            { foreground: '#282A36', background: '#BD93F9' },
            { foreground: '#282A36', background: '#F8F8F2' },
            { foreground: '#282A36', background: '#FF5555' },
            { foreground: '#282A36', background: '#8BE9FD' },
            { foreground: '#F8F8F2', background: '#44475A' },
            { foreground: '#282A36', background: '#BD93F9' }
        ]
    },
    'catppuccin': {
        name: 'Catppuccin',
        description: 'Soothing pastel theme',
        swatches: [
            { foreground: '#1E1E2E', background: '#CBA6F7' },
            { foreground: '#CDD6F4', background: '#45475A' },
            { foreground: '#1E1E2E', background: '#A6E3A1' },
            { foreground: '#1E1E2E', background: '#F38BA8' },
            { foreground: '#CDD6F4', background: '#585B70' },
            { foreground: '#1E1E2E', background: '#F9E2AF' }
        ]
    },
    'gruvbox': {
        name: 'Gruvbox',
        description: 'Retro groove color scheme',
        swatches: [
            { foreground: '#EBDBB2', background: '#CC241D' },
            { foreground: '#282828', background: '#FABD2F' },
            { foreground: '#282828', background: '#A89984' },
            { foreground: '#FDF6E3', background: '#458588' },
            { foreground: '#282828', background: '#98971A' },
            { foreground: '#EBDBB2', background: '#CC241D' }
        ]
    },
    'onedark': {
        name: 'One Dark',
        description: 'Atom-inspired dark theme',
        swatches: [
            { foreground: '#282C34', background: '#61AFEF' },
            { foreground: '#ABB2BF', background: '#3E4452' },
            { foreground: '#282C34', background: '#98C379' },
            { foreground: '#282C34', background: '#E06C75' },
            { foreground: '#282C34', background: '#E5C07B' },
            { foreground: '#ABB2BF', background: '#3E4452' }
        ]
    },
    'tokyonight': {
        name: 'Tokyo Night',
        description: 'Clean, dark theme inspired by Tokyo nightlife',
        swatches: [
            { foreground: '#1A1B26', background: '#7AA2F7' },
            { foreground: '#1A1B26', background: '#D5D6DB' },
            { foreground: '#1A1B26', background: '#BB9AF7' },
            { foreground: '#1A1B26', background: '#E0AF68' },
            { foreground: '#1A1B26', background: '#7DCFFF' },
            { foreground: '#C0CAF5', background: '#414868' }
        ]
    }
};

const THEME_ORDER: ThemeName[] = [
    'custom',
    'nord',
    'nord-aurora',
    'monokai',
    'solarized',
    'minimal',
    'dracula',
    'catppuccin',
    'gruvbox',
    'onedark',
    'tokyonight'
];

const MAIN_MENU: MenuItem[] = [
    {
        label: '📝 编辑状态行',
        description: '配置多行状态栏，添加模型信息、Git 状态、Token 用量等组件'
    },
    {
        label: '🎨 编辑颜色',
        description: '为每个组件自定义前景色、背景色和加粗样式'
    },
    {
        label: '⚡ Powerline 设置',
        description: '安装 Powerline 字体以获得更美观的分隔符和符号'
    },
    { label: '', separator: true },
    {
        label: '💻 终端选项',
        description: '配置终端特定设置以获得最佳显示效果'
    },
    {
        label: '🌐 全局覆盖',
        description: '设置适用于所有组件的全局内边距、分隔符和颜色覆盖'
    },
    { label: '', separator: true },
    {
        label: '📦 安装到 Claude Code',
        description: '将 ccstatusline-zh 添加到 Claude Code 设置以自动渲染状态栏'
    },
    {
        label: '🚪 退出',
        description: '退出配置工具'
    },
    { label: '', separator: true },
    {
        label: '⭐ 喜欢 ccstatusline-zh？来 GitHub 给个 Star',
        description: '在浏览器中打开 ccstatusline-zh GitHub 仓库以 Star 本项目'
    }
];

const FINAL_MENU: MenuItem[] = [
    ...MAIN_MENU.slice(0, 8),
    {
        label: '💾 保存并退出',
        description: '保存所有更改并退出配置工具'
    },
    {
        label: '❌ 不保存退出',
        description: '放弃更改并退出'
    },
    { label: '', separator: true },
    MAIN_MENU[10] ?? { label: '⭐ 喜欢 ccstatusline-zh？来 GitHub 给个 Star' }
];

const LINE_ONE_WIDGETS: EditorWidget[] = [
    {
        displayText: '模型',
        description: '显示当前 Claude 模型名称（如 Claude 3.5 Sonnet）'
    },
    {
        displayText: '上下文长度',
        description: '显示当前上下文窗口大小（Token 数）'
    },
    {
        displayText: 'Git 分支',
        description: '显示当前 Git 分支名'
    },
    {
        displayText: 'Git 变更',
        description: '显示 Git 变更数（+新增, -删除）'
    },
    {
        displayText: '总 Token',
        description: '显示当前会话的总 Token 数（输入 + 输出 + 缓存）'
    },
    {
        displayText: '会话费用',
        description: '显示当前会话总费用（美元）'
    }
];

const LINE_TWO_WIDGETS: EditorWidget[] = [
    {
        displayText: '会话用量',
        description: '显示每日/会话 API 用量百分比'
    },
    {
        displayText: '周用量',
        description: '显示每周 API 用量百分比'
    },
    {
        displayText: '时段重置计时',
        description: '显示当前 5 时时段重置窗口的剩余时间'
    },
    {
        displayText: '周重置计时',
        description: '显示周用量重置倒计时'
    }
];

const WIDGET_CATEGORIES: MenuItem[] = [
    {
        label: '全部',
        description: '在所有组件分类中搜索。'
    },
    { label: '核心' },
    { label: 'Git' },
    { label: 'Jujutsu' },
    { label: '环境' },
    { label: 'Token' },
    { label: 'Token 速度' },
    { label: '上下文' },
    { label: '会话' },
    { label: '用量' },
    { label: '自定义' },
    { label: '布局' }
];

const WIDGET_CATALOG: WidgetCatalogItem[] = [
    makeCatalogItem('model', '模型', '显示当前 Claude 模型名称（如 Claude 3.5 Sonnet）', '核心'),
    makeCatalogItem('output-style', '输出风格', '显示当前 Claude Code 输出风格', '核心'),
    makeCatalogItem('version', '版本', '显示 Claude Code CLI 版本号', '核心'),
    makeCatalogItem('thinking-effort', '思考力度', '显示当前思考力度级别（low、medium、high、xhigh、max）', '核心'),
    makeCatalogItem('git-branch', 'Git 分支', '显示当前 Git 分支名', 'Git'),
    makeCatalogItem('git-changes', 'Git 变更', '显示 Git 变更数（+新增, -删除）', 'Git'),
    makeCatalogItem('git-status', 'Git 状态', '显示 Git 状态指示：+ 已暂存, * 未暂存, ? 未跟踪, ! 冲突', 'Git'),
    makeCatalogItem('jj-description', 'JJ 变更描述', '显示当前 Jujutsu 变更描述', 'Jujutsu'),
    makeCatalogItem('current-working-dir', '当前目录', '显示当前工作目录', '环境'),
    makeCatalogItem('terminal-width', '终端宽度', '显示当前终端宽度（列数）', '环境'),
    makeCatalogItem('tokens-input', '输入 Token', '显示当前会话的输入 Token 数', 'Token'),
    makeCatalogItem('tokens-output', '输出 Token', '显示当前会话的输出 Token 数', 'Token'),
    makeCatalogItem('tokens-cached', '缓存 Token', '显示当前会话的缓存 Token 数', 'Token'),
    makeCatalogItem('tokens-total', '总 Token', '显示当前会话的总 Token 数（输入 + 输出 + 缓存）', 'Token'),
    makeCatalogItem('output-speed', '输出速度', '显示会话平均输出 Token 速度（tokens/sec）', 'Token 速度'),
    makeCatalogItem('total-speed', '总速度', '显示会话平均总 Token 速度（tokens/sec）', 'Token 速度'),
    makeCatalogItem('context-length', '上下文长度', '显示当前上下文窗口大小（Token 数）', '上下文'),
    makeCatalogItem('context-percentage', '上下文 %', '显示上下文窗口已用或剩余百分比', '上下文'),
    makeCatalogItem('context-bar', '上下文进度条', '以进度条形式显示上下文用量', '上下文'),
    makeCatalogItem('session-clock', '会话时钟', '显示当前会话已经过的时间', '会话'),
    makeCatalogItem('session-cost', '会话费用', '显示当前会话总费用（美元）', '会话'),
    makeCatalogItem('block-timer', '时段计时器', '显示当前 5 时时段的已用时间或进度', '用量'),
    makeCatalogItem('session-usage', '会话用量', '显示每日/会话 API 用量百分比', '用量'),
    makeCatalogItem('weekly-usage', '周用量', '显示每周 API 用量百分比', '用量'),
    makeCatalogItem('weekly-sonnet-usage', '周 Sonnet 用量', '显示每周 Sonnet API 用量百分比', '用量'),
    makeCatalogItem('weekly-opus-usage', '周 Opus 用量', '显示每周 Opus API 用量百分比', '用量'),
    makeCatalogItem('reset-timer', '时段重置计时', '显示当前 5 时时段重置窗口的剩余时间', '用量'),
    makeCatalogItem('weekly-reset-timer', '周重置计时', '显示周用量重置倒计时', '用量'),
    makeCatalogItem('custom-text', '自定义文本', '显示用户自定义文本', '自定义'),
    makeCatalogItem('custom-symbol', '自定义符号', '显示自定义符号或 Emoji（单个字符）', '自定义'),
    makeCatalogItem('custom-command', '自定义命令', '执行自定义 Shell 命令并显示输出', '自定义'),
    makeCatalogItem('separator', '分隔符', '状态栏组件之间的分隔符', '布局'),
    makeCatalogItem('flex-separator', '弹性分隔符', '扩展以填充可用终端宽度', '布局')
];

function makeCatalogItem(
    type: string,
    label: string,
    description: string,
    category: string
): WidgetCatalogItem {
    return {
        type,
        label,
        description,
        category,
        searchText: `${label} ${description} ${type}`.toLowerCase()
    };
}

const POWERLINE_ITEMS: MenuItem[] = [
    {
        label: '分隔符',
        description: '选择 Powerline 段之间使用的字形。'
    },
    {
        label: '起始端帽',
        description: '配置每行 Powerline 起始位置显示的端帽字形。'
    },
    {
        label: '结束端帽',
        description: '配置每行 Powerline 结束位置显示的端帽字形。'
    },
    {
        label: '主题',
        description: '预览内置 Powerline 主题或将主题复制到自定义组件颜色中。'
    },
    { label: '', separator: true },
    { label: '← 返回' }
];

function clampProgress(
    frame: number,
    start: number,
    end: number
): number {
    return interpolate(frame, [start, end], [0, 1], {
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });
}

function getTypedText(
    frame: number,
    start: number,
    end: number,
    text: string
): string {
    const length = getTypedTextLength(frame, start, end, text);

    return text.slice(0, length);
}

function getTypedTextLength(
    frame: number,
    start: number,
    end: number,
    text: string
): number {
    if (frame < start) {
        return 0;
    }

    if (frame >= end) {
        return text.length;
    }

    const span = Math.max(1, end - start);
    const progress = (frame - start) / span;

    return Math.min(text.length, Math.floor(progress * text.length) + 1);
}

function getTypingKeys(
    frame: number,
    start: number,
    end: number,
    text: string,
    openingKey?: string
): string[] {
    if (frame < start) {
        return openingKey ? [openingKey] : [];
    }

    const length = getTypedTextLength(frame, start, end, text);
    const key = text[Math.max(0, length - 1)];

    if (!key) {
        return openingKey ? [openingKey] : [];
    }

    return [key === ' ' ? 'Space' : key];
}

function makePhase(overrides: Partial<Phase>): Phase {
    const lineOneWidgetCount = overrides.lineOneWidgetCount ?? 4;
    const lineTwoWidgetCount = overrides.lineTwoWidgetCount ?? 0;

    return {
        title: 'Configure ccstatusline',
        subtitle: '',
        screen: 'main',
        powerline: false,
        selectedTheme: 'nord-aurora',
        selectedMainIndex: 0,
        selectedLineIndex: 0,
        selectedItemIndex: 0,
        lineOneConfigured: lineOneWidgetCount >= LINE_ONE_WIDGETS.length,
        lineOneWidgetCount,
        lineNumber: 1,
        lineTwoConfigured: lineTwoWidgetCount >= LINE_TWO_WIDGETS.length,
        lineTwoWidgetCount,
        sessionUsageMode: 'time',
        weeklyUsageMode: 'time',
        keys: [],
        ...overrides
    };
}

function getPhase(frame: number): Phase {
    if (frame < TUI_START_FRAME) {
        return makePhase({
            title: 'Launch ccstatusline',
            screen: 'launch',
            lineOneWidgetCount: 4,
            keys: frame > 82 ? ['Enter'] : []
        });
    }

    if (frame < 140) {
        return makePhase({
            title: 'Open Edit Lines',
            screen: 'main',
            keys: ['Enter']
        });
    }

    if (frame < 180) {
        return makePhase({
            title: 'Choose line 1',
            screen: 'lines',
            selectedLineIndex: 0,
            keys: ['Enter']
        });
    }

    if (frame < 210) {
        return makePhase({
            title: 'Edit line 1',
            screen: 'items',
            lineNumber: 1,
            selectedItemIndex: 0,
            keys: ['Enter']
        });
    }

    if (frame < 230) {
        return makePhase({
            screen: 'items',
            lineNumber: 1,
            selectedItemIndex: 1,
            keys: ['Down']
        });
    }

    if (frame < 250) {
        return makePhase({
            screen: 'items',
            lineNumber: 1,
            selectedItemIndex: 2,
            keys: ['Down']
        });
    }

    if (frame < 270) {
        return makePhase({
            screen: 'items',
            lineNumber: 1,
            selectedItemIndex: 3,
            keys: ['Down']
        });
    }

    if (frame < 300) {
        return makePhase({
            title: 'Add Tokens Total',
            screen: 'picker',
            lineNumber: 1,
            selectedItemIndex: 0,
            pickerLevel: 'category',
            selectedCategory: '全部',
            categoryQuery: '',
            keys: ['a']
        });
    }

    if (frame < 335) {
        const query = '总 Token';

        return makePhase({
            title: 'Search Tokens Total',
            screen: 'picker',
            lineNumber: 1,
            selectedItemIndex: 0,
            pickerLevel: 'category',
            selectedCategory: '全部',
            categoryQuery: getTypedText(frame, 302, 330, query),
            keys: getTypingKeys(frame, 302, 330, query)
        });
    }

    if (frame < 370) {
        return makePhase({
            title: 'Tokens Total added',
            screen: 'items',
            lineNumber: 1,
            selectedItemIndex: 4,
            lineOneWidgetCount: 5,
            keys: ['Enter']
        });
    }

    if (frame < 400) {
        const query = '会话费用';

        return makePhase({
            title: 'Search Session Cost',
            screen: 'picker',
            lineNumber: 1,
            selectedItemIndex: 0,
            lineOneWidgetCount: 5,
            pickerLevel: 'category',
            selectedCategory: '全部',
            categoryQuery: getTypedText(frame, 374, 396, query),
            keys: getTypingKeys(frame, 374, 396, query, 'a')
        });
    }

    if (frame < 435) {
        return makePhase({
            title: 'Session Cost added',
            screen: 'items',
            lineNumber: 1,
            selectedItemIndex: 5,
            lineOneWidgetCount: 6,
            keys: ['Enter']
        });
    }

    if (frame < 455) {
        return makePhase({
            screen: 'lines',
            selectedLineIndex: 0,
            lineOneWidgetCount: 6,
            keys: ['Esc']
        });
    }

    if (frame < 475) {
        return makePhase({
            screen: 'lines',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            keys: ['Down']
        });
    }

    if (frame < 505) {
        return makePhase({
            title: 'Edit line 2',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 0,
            selectedItemIndex: 0,
            keys: ['Enter']
        });
    }

    if (frame < 525) {
        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'category',
            selectedCategory: '全部',
            keys: ['a']
        });
    }

    if (frame < 565) {
        const categoryIndex = Math.min(
            9,
            Math.floor((frame - 525) / 4) + 1
        );
        const selectedCategory = WIDGET_CATEGORIES[categoryIndex]?.label ?? '用量';

        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'category',
            selectedCategory,
            keys: ['Down']
        });
    }

    if (frame < 578) {
        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'category',
            selectedCategory: '用量',
            keys: ['Enter']
        });
    }

    if (frame < 591) {
        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'widget',
            selectedCategory: '用量',
            selectedItemIndex: 0,
            keys: []
        });
    }

    if (frame < 604) {
        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'widget',
            selectedCategory: '用量',
            selectedItemIndex: 1,
            keys: ['Down']
        });
    }

    if (frame < 617) {
        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'widget',
            selectedCategory: '用量',
            selectedItemIndex: 2,
            keys: ['Down']
        });
    }

    if (frame < 630) {
        return makePhase({
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            pickerLevel: 'widget',
            selectedCategory: '用量',
            selectedItemIndex: 2,
            keys: ['Enter']
        });
    }

    if (frame < 645) {
        return makePhase({
            title: 'Session Usage added',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 1,
            selectedItemIndex: 0,
            keys: []
        });
    }

    if (frame < 675) {
        const query = '周用量';

        return makePhase({
            title: 'Search Weekly Usage',
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 1,
            pickerLevel: 'category',
            selectedCategory: '全部',
            categoryQuery: getTypedText(frame, 649, 671, query),
            selectedItemIndex: 0,
            keys: getTypingKeys(frame, 649, 671, query, 'a')
        });
    }

    if (frame < 705) {
        return makePhase({
            title: 'Weekly Usage added',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 2,
            selectedItemIndex: 1,
            keys: ['Enter']
        });
    }

    if (frame < 735) {
        const query = '时段重置计时';

        return makePhase({
            title: 'Search Block Reset Timer',
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 2,
            pickerLevel: 'category',
            selectedCategory: '全部',
            categoryQuery: getTypedText(frame, 709, 731, query),
            selectedItemIndex: 0,
            keys: getTypingKeys(frame, 709, 731, query, 'a')
        });
    }

    if (frame < 765) {
        return makePhase({
            title: 'Block Reset Timer added',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 3,
            selectedItemIndex: 2,
            keys: ['Enter']
        });
    }

    if (frame < 795) {
        const query = '周重置计时';

        return makePhase({
            title: 'Search Weekly Reset Timer',
            screen: 'picker',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 3,
            pickerLevel: 'category',
            selectedCategory: '全部',
            categoryQuery: getTypedText(frame, 769, 791, query),
            selectedItemIndex: 0,
            keys: getTypingKeys(frame, 769, 791, query, 'a')
        });
    }

    if (frame < 825) {
        return makePhase({
            title: 'Weekly Reset Timer added',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 3,
            keys: ['Enter']
        });
    }

    if (frame < 845) {
        return makePhase({
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 2,
            keys: ['Up']
        });
    }

    if (frame < 865) {
        return makePhase({
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 1,
            keys: ['Up']
        });
    }

    if (frame < 885) {
        return makePhase({
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 0,
            keys: ['Up']
        });
    }

    if (frame < 910) {
        return makePhase({
            title: 'Session Usage long bar',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 0,
            sessionUsageMode: 'progress',
            keys: ['p']
        });
    }

    if (frame < 935) {
        return makePhase({
            title: 'Session Usage medium bar',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 0,
            sessionUsageMode: 'progress-short',
            keys: ['p']
        });
    }

    if (frame < 960) {
        return makePhase({
            title: 'Session Usage short bar',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 0,
            sessionUsageMode: 'slider',
            keys: ['p']
        });
    }

    if (frame < 980) {
        return makePhase({
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 1,
            sessionUsageMode: 'slider',
            keys: ['Down']
        });
    }

    if (frame < 1005) {
        return makePhase({
            title: 'Weekly Usage long bar',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 1,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'progress',
            keys: ['p']
        });
    }

    if (frame < 1030) {
        return makePhase({
            title: 'Weekly Usage medium bar',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 1,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'progress-short',
            keys: ['p']
        });
    }

    if (frame < 1055) {
        return makePhase({
            title: 'Weekly Usage short bar',
            screen: 'items',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineNumber: 2,
            lineTwoWidgetCount: 4,
            selectedItemIndex: 1,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['p']
        });
    }

    if (frame < 1085) {
        return makePhase({
            screen: 'lines',
            selectedLineIndex: 1,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            lineNumber: 2,
            keys: ['Esc']
        });
    }

    if (frame < 1105) {
        return makePhase({
            screen: 'main',
            selectedMainIndex: 0,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Esc']
        });
    }

    if (frame < 1125) {
        return makePhase({
            screen: 'main',
            selectedMainIndex: 1,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Down']
        });
    }

    if (frame < 1145) {
        return makePhase({
            screen: 'main',
            selectedMainIndex: 2,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Down']
        });
    }

    if (frame < 1175) {
        return makePhase({
            title: 'Open Powerline setup',
            screen: 'powerline',
            powerline: false,
            selectedMainIndex: 2,
            selectedTheme: 'minimal',
            selectedItemIndex: 5,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Enter']
        });
    }

    if (frame < 1205) {
        return makePhase({
            title: 'Turn on Powerline mode',
            screen: 'powerline',
            powerline: true,
            selectedMainIndex: 2,
            selectedTheme: 'minimal',
            selectedItemIndex: 0,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['t']
        });
    }

    if (frame < 1225) {
        return makePhase({
            screen: 'powerline',
            powerline: true,
            selectedMainIndex: 2,
            selectedTheme: 'minimal',
            selectedItemIndex: 1,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Down']
        });
    }

    if (frame < 1245) {
        return makePhase({
            screen: 'powerline',
            powerline: true,
            selectedMainIndex: 2,
            selectedTheme: 'minimal',
            selectedItemIndex: 2,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Down']
        });
    }

    if (frame < 1275) {
        return makePhase({
            screen: 'powerline',
            powerline: true,
            selectedMainIndex: 2,
            selectedTheme: 'minimal',
            selectedItemIndex: 3,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Down']
        });
    }

    if (frame < 1385) {
        const themeIndex = Math.min(
            THEME_ORDER.length - 1,
            Math.max(5, 5 + Math.floor((frame - 1295) / 14))
        );

        return makePhase({
            title: 'Preview built-in themes',
            screen: 'themes',
            powerline: true,
            selectedTheme: THEME_ORDER[themeIndex] ?? 'minimal',
            selectedMainIndex: 2,
            selectedItemIndex: themeIndex,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: frame < 1295 ? ['Enter'] : ['Down']
        });
    }

    if (frame < 1425) {
        return makePhase({
            title: 'Apply Tokyo Night',
            screen: 'powerline',
            powerline: true,
            selectedTheme: 'tokyonight',
            selectedMainIndex: 2,
            selectedItemIndex: 3,
            lineOneWidgetCount: 6,
            lineTwoWidgetCount: 4,
            sessionUsageMode: 'slider',
            weeklyUsageMode: 'slider',
            keys: ['Enter']
        });
    }

    return makePhase({
        title: 'Exit Powerline setup',
        screen: 'main',
        powerline: true,
        selectedTheme: 'tokyonight',
        selectedMainIndex: 2,
        selectedItemIndex: 3,
        lineOneWidgetCount: 6,
        lineTwoWidgetCount: 4,
        sessionUsageMode: 'slider',
        weeklyUsageMode: 'slider',
        keys: ['Esc']
    });
}

function getPreviewLines(phase: Phase): string[][] {
    const firstLine = [
        'Model: Claude',
        'Ctx: 18.6k',
        '⎇ main',
        '(+42,-10)',
        'Total: 30.6k',
        'Cost: $2.45'
    ].slice(0, phase.lineOneWidgetCount);
    const secondLine = getLineTwoPreviewSegments(phase);

    if (secondLine.length === 0) {
        return [firstLine];
    }

    return [
        firstLine,
        secondLine
    ];
}

function getLineTwoPreviewSegments(phase: Phase): string[] {
    const segments = [
        renderUsagePreview('Session', 20, phase.sessionUsageMode),
        renderUsagePreview('Weekly', 12, phase.weeklyUsageMode),
        'Reset: 4hr 30m',
        'Weekly Reset: 1d 12hr 30m'
    ];

    return segments.slice(0, phase.lineTwoWidgetCount);
}

function renderUsagePreview(
    label: 'Session' | 'Weekly',
    percent: number,
    mode: UsageDisplayMode
): string {
    if (mode === 'progress') {
        return `${label}: [${makeProgressBar(percent, 32)}] ${percent.toFixed(1)}%`;
    }

    if (mode === 'progress-short') {
        return `${label}: [${makeProgressBar(percent, 16)}] ${percent.toFixed(1)}%`;
    }

    if (mode === 'slider') {
        return `${label}: ${makeSliderPreview(percent)} ${percent.toFixed(1)}%`;
    }

    if (mode === 'slider-only') {
        return `${label}: ${makeSliderPreview(percent)}`;
    }

    return `${label}: ${percent.toFixed(1)}%`;
}

function makeProgressBar(percent: number, width: number): string {
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.floor((clamped / 100) * width);

    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function makeSliderPreview(percent: number): string {
    const width = 10;
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round((clamped / 100) * width);

    return '▓'.repeat(filled) + '░'.repeat(width - filled);
}

export const TUIDemo = () => {
    const frame = useCurrentFrame();
    const phase = getPhase(frame);
    const enter = clampProgress(frame, 0, 36);
    const terminalX = interpolate(enter, [0, 1], [-46, 0]);

    return (
        <AbsoluteFill style={styles.root}>
            <Background frame={frame} />
            <div style={styles.shell}>
                <div
                    style={{
                        ...styles.terminalWrap,
                        opacity: enter,
                        transform: `translateX(${terminalX}px)`
                    }}
                >
                    <TerminalWindow
                        frame={frame}
                        phase={phase}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};

function Background({ frame }: { frame: number }) {
    const shade = interpolate(
        Math.sin(frame / 46),
        [-1, 1],
        [0.88, 1]
    );

    return (
        <AbsoluteFill
            style={{
                ...styles.background,
                opacity: shade
            }}
        />
    );
}

function TerminalWindow({
    frame,
    phase
}: {
    frame: number;
    phase: Phase;
}) {
    const launched = frame >= TUI_START_FRAME;
    const tuiOpacity = clampProgress(frame, TUI_START_FRAME, TUI_START_FRAME + 18);

    return (
        <div style={styles.terminal}>
            <div style={styles.windowChrome}>
                <div style={styles.windowButtons}>
                    <span style={{ ...styles.dot, backgroundColor: '#FF5F57' }} />
                    <span style={{ ...styles.dot, backgroundColor: '#FFBD2E' }} />
                    <span style={{ ...styles.dot, backgroundColor: '#28C840' }} />
                </div>
                <div style={styles.windowTitle}>ccstatusline-zh - npx ccstatusline-zh@latest</div>
            </div>
            <div style={styles.terminalBody}>
                {!launched ? (
                    <LaunchCommand frame={frame} />
                ) : (
                    <div
                        style={{
                            opacity: tuiOpacity,
                            transform: `translateY(${interpolate(tuiOpacity, [0, 1], [10, 0])}px)`
                        }}
                    >
                        <TuiScreen phase={phase} />
                    </div>
                )}
            </div>
            {launched && (
                <KeypressHint
                    frame={frame}
                    keys={phase.keys}
                />
            )}
        </div>
    );
}

function KeypressHint({
    frame,
    keys
}: {
    frame: number;
    keys: string[];
}) {
    if (keys.length === 0) {
        return null;
    }
    const key = keys[keys.length - 1] ?? '';
    const pulseFrame = frame % 20;
    const scale = interpolate(pulseFrame, [0, 3, 10, 20], [1.18, 1.1, 1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });
    const glow = interpolate(pulseFrame, [0, 8, 20], [0.44, 0.12, 0.12], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });

    return (
        <div style={styles.keypressHint}>
            <span style={styles.keypressLabel}>key</span>
            <span
                style={{
                    ...styles.keypressValue,
                    transform: `scale(${scale})`,
                    borderColor: `rgba(125, 211, 252, ${glow})`,
                    boxShadow: `0 0 18px rgba(125, 211, 252, ${glow * 0.45})`
                }}
            >
                {key}
            </span>
        </div>
    );
}

function LaunchCommand({ frame }: { frame: number }) {
    const typedLength = Math.min(COMMAND_TEXT.length, Math.floor(frame / 3));
    const typed = COMMAND_TEXT.slice(0, typedLength);
    const cursorOpacity = Math.floor(frame / 12) % 2 === 0 ? 1 : 0.18;
    const executed = typedLength >= COMMAND_TEXT.length && frame > 82;

    return (
        <div style={styles.launchBody}>
            <div style={styles.commandLine}>
                <span style={styles.commandText}>{typed}</span>
                {!executed && (
                    <span
                        style={{
                            ...styles.cursor,
                            opacity: cursorOpacity
                        }}
                    />
                )}
            </div>
            {executed && (
                <div style={styles.launchDimText}>正在启动 ccstatusline-zh...</div>
            )}
        </div>
    );
}

function TuiScreen({ phase }: { phase: Phase }) {
    const theme = THEMES[phase.selectedTheme];
    const previewLines = getPreviewLines(phase);
    const alignedWidths = phase.powerline ? getAlignedSegmentWidths(previewLines) : undefined;

    return (
        <>
            <div style={styles.tuiHeader}>
                <span style={styles.tuiTitle}>CCStatusline 配置</span>
                <span style={styles.version}>
                    &nbsp;|&nbsp;v
                    {PACKAGE_VERSION}
                </span>
                {phase.screen === 'final' && (
                    <span style={styles.savedMessage}>  ✓ 配置已保存</span>
                )}
            </div>
            <div style={styles.previewBox}>
                <div style={styles.previewHeader}>
                    <span style={styles.promptChar}>&gt;</span>
                    <span> 预览  （随时按 ctrl+s 保存配置）</span>
                </div>
            </div>
            <div style={styles.previewLines}>
                {previewLines.map((segments, index) => (
                    <div key={index} style={styles.previewLine}>
                        <span style={styles.previewIndent}>  </span>
                        {phase.powerline ? (
                            <PowerlinePreview
                                segments={segments}
                                theme={theme}
                                alignedWidths={alignedWidths}
                                lineIndex={index}
                                lineCount={previewLines.length}
                            />
                        ) : <PlainPreview segments={segments} />}
                    </div>
                ))}
            </div>
            <div style={styles.screenContent}>{renderScreenContent(phase)}</div>
        </>
    );
}

function PlainPreview({ segments }: { segments: string[] }) {
    return (
        <div style={styles.plainPreview}>
            {segments.map((segment, index) => (
                <span key={`${segment}-${index}`}>
                    <span style={plainSegmentStyle(segment)}>{segment}</span>
                    {index < segments.length - 1 && <span style={styles.plainSeparator}>&nbsp;|&nbsp;</span>}
                </span>
            ))}
        </div>
    );
}

function PowerlinePreview({
    segments,
    theme,
    alignedWidths,
    lineIndex,
    lineCount
}: {
    segments: string[];
    theme: Theme;
    alignedWidths?: number[];
    lineIndex: number;
    lineCount: number;
}) {
    const isFirstLine = lineIndex === 0;
    const isLastLine = lineIndex === lineCount - 1;

    return (
        <div style={styles.powerlinePreview}>
            {segments.map((segment, index) => {
                const swatch = theme.swatches[index % theme.swatches.length] ?? theme.swatches[0];
                const nextSwatch = theme.swatches[(index + 1) % theme.swatches.length] ?? theme.swatches[0];
                const isLast = index === segments.length - 1;

                return (
                    <div
                        key={`${segment}-${index}`}
                        style={styles.powerlineGroup}
                    >
                        <div
                            style={{
                                ...styles.powerlineSegment,
                                color: swatch.foreground,
                                backgroundColor: swatch.background,
                                width: alignedWidths?.[index],
                                borderTopLeftRadius: index === 0 && isFirstLine ? 5 : 0,
                                borderBottomLeftRadius: index === 0 && isLastLine ? 5 : 0,
                                borderTopRightRadius: isLast && isFirstLine ? 5 : 0,
                                borderBottomRightRadius: isLast && isLastLine ? 5 : 0
                            }}
                        >
                            {segment}
                        </div>
                        {!isLast && (
                            <div
                                style={{
                                    ...styles.powerlineSeparator,
                                    backgroundColor: nextSwatch.background
                                }}
                            >
                                <span
                                    style={{
                                        ...styles.powerlineTriangle,
                                        borderLeftColor: swatch.background
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function getAlignedSegmentWidths(lines: string[][]): number[] {
    const maxSegments = Math.max(...lines.map(line => line.length));

    return Array.from({ length: maxSegments }, (_, index) => {
        const longest = Math.max(...lines.map(line => line[index]?.length ?? 0));
        return Math.max(72, longest * 8 + 30);
    });
}

function plainSegmentStyle(segment: string): CSSProperties {
    return {
        color: getFreshInstallWidgetColor(segment),
        fontWeight: 700
    };
}

function getFreshInstallWidgetColor(segment: string): string {
    if (segment.startsWith('Model:') || segment.startsWith('Total:')) {
        return '#06989a';
    }

    if (segment.startsWith('Ctx:')) {
        return '#555753';
    }

    if (segment.startsWith('⎇')) {
        return '#75507b';
    }

    if (segment.startsWith('(+')) {
        return '#c4a000';
    }

    if (segment.startsWith('Cost:')) {
        return '#4e9a06';
    }

    return '#729fcf';
}

function renderScreenContent(phase: Phase): ReactNode {
    switch (phase.screen) {
        case 'lines':
            return <LineSelectorScreen phase={phase} />;
        case 'items':
            return <ItemsScreen phase={phase} />;
        case 'picker':
            return <WidgetPicker phase={phase} />;
        case 'powerline':
            return <PowerlineScreen phase={phase} />;
        case 'themes':
            return <ThemeScreen phase={phase} />;
        case 'final':
            return (
                <MainScreen
                    items={FINAL_MENU}
                    selectedIndex={phase.selectedMainIndex}
                />
            );
        case 'main':
        default:
            return (
                <MainScreen
                    items={MAIN_MENU}
                    selectedIndex={phase.selectedMainIndex}
                />
            );
    }
}

function MainScreen({
    items,
    selectedIndex
}: {
    items: MenuItem[];
    selectedIndex: number;
}) {
    return (
        <div>
            <div style={styles.screenTitle}>主菜单</div>
            <MenuList
                items={items}
                selectedIndex={selectedIndex}
            />
        </div>
    );
}

function LineSelectorScreen({ phase }: { phase: Phase }) {
    const firstLineWidgets = phase.lineOneWidgetCount;
    const secondLineWidgets = phase.lineTwoWidgetCount;
    const items: MenuItem[] = [
        {
            label: '☰ 第 1 行',
            sublabel: `(${firstLineWidgets} 个组件)`
        },
        {
            label: '☰ 第 2 行',
            sublabel: secondLineWidgets > 0 ? '(4 个组件)' : '(空)'
        },
        { label: '', separator: true },
        { label: '← 返回' }
    ];

    return (
        <div>
            <div style={styles.screenTitle}>选择要编辑组件的行</div>
            <div style={styles.helpText}>选择要配置的状态栏行</div>
            <div style={styles.helpText}>(a) 添加新行，(d) 删除行，(m) 移动行，ESC 返回</div>
            <MenuList
                items={items}
                selectedIndex={phase.selectedLineIndex}
            />
        </div>
    );
}

function ItemsScreen({ phase }: { phase: Phase }) {
    const widgets = getEditorWidgets(phase);
    const selectedWidget = widgets[phase.selectedItemIndex] ?? widgets[0];
    const help = getItemsHelpText(phase, widgets);

    return (
        <div>
            <div style={styles.screenTitle}>
                编辑行
                {' '}
                {phase.lineNumber}
                {' '}
                {phase.powerline && (
                    <span style={styles.inlineWarning}>⚠ Powerline 模式已启用：分隔符由 Powerline 设置控制</span>
                )}
            </div>
            <div style={styles.helpText}>{help.main}</div>
            <div style={styles.helpText}>{help.custom}</div>
            <div style={styles.helpSpacer}> </div>
            {widgets.length === 0 ? (
                <div style={styles.emptyLine}>暂无组件。按 'a' 添加。</div>
            ) : (
                <div style={styles.menuList}>
                    {widgets.map((widget, index) => {
                        const selected = index === phase.selectedItemIndex;
                        const modifierText = getWidgetModifierText(phase, index);

                        return (
                            <div
                                key={widget.displayText}
                                style={{
                                    ...styles.menuRow,
                                    color: selected ? '#22C55E' : '#D7DEE8'
                                }}
                            >
                                <span style={styles.menuPointer}>{selected ? '▶  ' : '   '}</span>
                                <span style={selected ? styles.menuSelectedText : undefined}>
                                    {`${index + 1}. ${widget.displayText}`}
                                </span>
                                {modifierText && (
                                    <span style={{ ...styles.dimText, marginLeft: 6 }}>{modifierText}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {selectedWidget && widgets.length > 0 && (
                <div style={styles.description}>
                    {selectedWidget.description}
                </div>
            )}
        </div>
    );
}

function getEditorWidgets(phase: Phase): EditorWidget[] {
    return phase.lineNumber === 1
        ? LINE_ONE_WIDGETS.slice(0, phase.lineOneWidgetCount)
        : LINE_TWO_WIDGETS.slice(0, phase.lineTwoWidgetCount);
}

function getWidgetModifierText(phase: Phase, index: number): string | undefined {
    if (phase.lineNumber !== 2) {
        return undefined;
    }

    if (index === 0) {
        return getUsageModifierText(phase.sessionUsageMode);
    }

    if (index === 1) {
        return getUsageModifierText(phase.weeklyUsageMode);
    }

    return undefined;
}

function getUsageModifierText(mode: UsageDisplayMode): string | undefined {
    if (mode === 'progress') {
        return '(长进度条)';
    }

    if (mode === 'progress-short') {
        return '(中进度条)';
    }

    if (mode === 'slider') {
        return '(短进度条)';
    }

    if (mode === 'slider-only') {
        return '(仅短进度条)';
    }

    return undefined;
}

function getItemsHelpText(
    phase: Phase,
    widgets: EditorWidget[]
): { main: string; custom: string } {
    if (widgets.length === 0) {
        return {
            main: '(a)添加, (i)插入, ESC 返回',
            custom: ' '
        };
    }

    let main = '↑↓ 选择, ←→ 打开类型选择器, Enter 移动, (a)添加, (i)插入, (k)克隆, (d)删除, (c)清空行';
    main += ', (r)纯值';
    main += ', ESC 返回';

    return {
        main,
        custom: getCustomKeybindsText(phase) || ' '
    };
}

function getCustomKeybindsText(phase: Phase): string {
    if (phase.lineNumber !== 2) {
        return '';
    }

    if (phase.selectedItemIndex === 0) {
        return getUsagePercentKeybindsText(phase.sessionUsageMode);
    }

    if (phase.selectedItemIndex === 1) {
        return getUsagePercentKeybindsText(phase.weeklyUsageMode);
    }

    if (phase.selectedItemIndex === 2) {
        return '(p)进度条切换, (s)短时间, (t)时间戳';
    }

    if (phase.selectedItemIndex === 3) {
        return '(p)进度条切换, (s)短时间, (t)时间戳, (h)仅小时';
    }

    return '';
}

function getUsagePercentKeybindsText(mode: UsageDisplayMode): string {
    if (mode === 'time') {
        return '(p)进度条切换';
    }

    return '(p)进度条切换, (v)反转填充, (t)时间游标';
}

function WidgetPicker({ phase }: { phase: Phase }) {
    const pickerActionLabel = '添加组件';
    const pickerLevel = phase.pickerLevel ?? 'category';
    const categoryQuery = phase.categoryQuery ?? '';
    const widgetQuery = phase.widgetQuery ?? '';
    const selectedCategory = phase.selectedCategory ?? 'All';
    const categoryIndex = Math.max(
        0,
        WIDGET_CATEGORIES.findIndex(category => category.label === selectedCategory)
    );
    const isTopLevelSearch = pickerLevel === 'category' && categoryQuery.trim().length > 0;
    const items = getPickerItems(
        pickerLevel,
        selectedCategory,
        categoryQuery,
        widgetQuery
    );
    const selected = isTopLevelSearch || pickerLevel === 'widget'
        ? Math.min(phase.selectedItemIndex, Math.max(0, items.length - 1))
        : categoryIndex;
    const selectedItem = items[selected] ?? { label: '' };

    return (
        <div>
            <div style={styles.screenTitle}>
                编辑行
                {' '}
                {phase.lineNumber}
                {' '}
                <span style={styles.modePill}>{`[${pickerActionLabel}]`}</span>
            </div>
            {pickerLevel === 'category' ? (
                <>
                    <div style={styles.helpText}>
                        {categoryQuery.trim().length > 0
                            ? '↑↓ 选择匹配组件，Enter 确认，ESC 清除/取消'
                            : '↑↓ 选择分类，输入搜索所有组件，Enter 继续，ESC 取消'}
                    </div>
                    <div style={styles.searchLine}>
                        <span style={styles.dimText}>搜索: </span>
                        <span style={styles.searchValue}>{categoryQuery || '（无）'}</span>
                    </div>
                </>
            ) : (
                <>
                    <div style={styles.helpText}>↑↓ 选择组件，输入搜索，Enter 确认，ESC 返回</div>
                    <div style={styles.searchLine}>
                        <span style={styles.dimText}>
                            分类:
                            {' '}
                            {selectedCategory}
                            {' '}
                            | 搜索:
                            {' '}
                        </span>
                        <span style={styles.searchValue}>{widgetQuery || '（无）'}</span>
                    </div>
                </>
            )}
            <div style={styles.pickerList}>
                {items.map((item, index) => {
                    const isSelected = index === selected;
                    const query = isTopLevelSearch ? categoryQuery : pickerLevel === 'widget' ? widgetQuery : '';

                    return (
                        <div
                            key={item.label}
                            style={{
                                ...styles.pickerRow,
                                color: isSelected ? '#22C55E' : '#D7DEE8'
                            }}
                        >
                            <span style={styles.pickerPointer}>{isSelected ? '▶ ' : '  '}</span>
                            <span style={isSelected ? styles.menuSelectedText : undefined}>
                                {`${index + 1}.\u00A0`}
                            </span>
                            <HighlightedLabel
                                label={item.label}
                                query={query}
                                selected={isSelected}
                            />
                        </div>
                    );
                })}
            </div>
            {selectedItem.description && (
                <div style={styles.description}>
                    {selectedItem.description}
                </div>
            )}
        </div>
    );
}

function getPickerItems(
    pickerLevel: PickerLevel,
    selectedCategory: string,
    categoryQuery: string,
    widgetQuery: string
): MenuItem[] {
    if (pickerLevel === 'category') {
        if (!categoryQuery.trim()) {
            return WIDGET_CATEGORIES;
        }

        return filterDemoWidgetCatalog('全部', categoryQuery);
    }

    return filterDemoWidgetCatalog(selectedCategory, widgetQuery);
}

function filterDemoWidgetCatalog(
    category: string,
    query: string
): WidgetCatalogItem[] {
    const categoryFiltered = category === '全部'
        ? [...WIDGET_CATALOG]
        : WIDGET_CATALOG.filter(entry => entry.category === category);
    const records: FuzzySearchRecord<WidgetCatalogItem>[] = categoryFiltered.map(entry => ({
        item: entry,
        name: entry.label,
        type: entry.type,
        description: entry.description ?? '',
        searchText: entry.searchText,
        sortText: entry.label,
        secondarySortText: entry.type
    }));

    return filterFuzzySearchRecords(records, query);
}

function HighlightedLabel({
    label,
    query,
    selected
}: {
    label: string;
    query: string;
    selected: boolean;
}) {
    if (!query.trim()) {
        return <span style={selected ? styles.menuSelectedText : undefined}>{label}</span>;
    }

    const segments = getMatchSegments(label, query);

    return (
        <span style={selected ? styles.menuSelectedText : undefined}>
            {segments.map((segment, index) => (
                <span
                    key={`${segment.text}-${index}`}
                    style={!selected && segment.matched ? styles.matchText : undefined}
                >
                    {segment.text}
                </span>
            ))}
        </span>
    );
}

function PowerlineScreen({ phase }: { phase: Phase }) {
    const items = getPowerlineMenuItems(phase);

    return (
        <div>
            <div style={styles.screenTitle}>Powerline 设置</div>
            <PowerlineSettingRow
                label='字体状态'
                status='✓ 已安装'
                statusStyle={styles.goodText}
                detail='请确保终端中已激活字体'
            />
            <PowerlineSettingRow
                label='Powerline 模式'
                status={phase.powerline ? '✓ 已启用' : '✗ 已禁用'}
                statusStyle={phase.powerline ? styles.goodText : styles.badText}
                detail='按 (t) 切换'
            />
            {phase.powerline ? (
                <>
                    <PowerlineSettingRow
                        label='对齐组件'
                        status='✓ 已启用'
                        statusStyle={styles.goodText}
                        detail='按 (a) 切换'
                    />
                    <PowerlineSettingRow
                        label='主题色延续'
                        status='✗ 已禁用'
                        statusStyle={styles.badText}
                        detail='按 (c) 切换'
                    />
                    <div style={styles.powerlineNotes}>
                        <div>启用后，全局覆盖将被禁用，并使用 Powerline 分隔符</div>
                        <div>主题色延续：Powerline 颜色序列跨多行状态栏连续延续</div>
                    </div>
                </>
            ) : (
                <div style={styles.powerlineNotes}>启用 Powerline 模式以配置分隔符、端帽和主题。</div>
            )}
            <PowerlineMenuList
                items={items}
                selectedIndex={phase.selectedItemIndex}
            />
        </div>
    );
}

function getPowerlineMenuItems(phase: Phase): MenuItem[] {
    const disabled = !phase.powerline;

    return POWERLINE_ITEMS.map((item) => {
        if (item.separator || item.label === '← 返回') {
            return item;
        }

        const sublabel = item.label === '分隔符'
            ? '( - 右三角)'
            : item.label === '起始端帽'
                ? '(多个)'
                : item.label === '结束端帽'
                    ? '( - 三角)'
                    : `(${getPowerlineThemeDisplay(phase.selectedTheme)})`;

        return {
            ...item,
            sublabel,
            disabled
        };
    });
}

function getPowerlineThemeDisplay(themeName: ThemeName): string {
    return THEMES[themeName].name;
}

function PowerlineSettingRow({
    label,
    status,
    statusStyle,
    detail
}: {
    label: string;
    status: string;
    statusStyle: CSSProperties;
    detail: string;
}) {
    return (
        <div style={styles.powerlineSetting}>
            <span style={styles.powerlineSettingLabel}>
                {label}
                :
                {' '}
            </span>
            <span style={{ ...styles.powerlineStatus, ...statusStyle }}>{status}</span>
            <span style={styles.dimText}>{`- ${detail}`}</span>
        </div>
    );
}

function PowerlineMenuList({
    items,
    selectedIndex
}: {
    items: MenuItem[];
    selectedIndex: number;
}) {
    const selectedItem = items[selectedIndex];

    return (
        <div style={styles.powerlineMenuList}>
            {items.map((item, index) => {
                if (item.separator || item.label.length === 0) {
                    return <div key={`gap-${index}`} style={styles.menuGap} />;
                }

                const selected = index === selectedIndex;
                const color = selected ? '#22C55E' : item.disabled ? '#64748B' : '#D7DEE8';

                return (
                    <div
                        key={`${item.label}-${index}`}
                        style={{
                            ...styles.powerlineMenuRow,
                            color
                        }}
                    >
                        <span style={styles.menuPointer}>{selected ? '▶  ' : '   '}</span>
                        <span style={selected ? styles.powerlineMenuSelectedLabel : styles.powerlineMenuLabel}>
                            {item.label}
                        </span>
                        {item.sublabel && (
                            <span
                                style={{
                                    ...(selected ? styles.menuSelectedText : styles.dimText),
                                    ...styles.powerlineMenuValue
                                }}
                            >
                                <PowerlineMenuValue item={item} />
                            </span>
                        )}
                    </div>
                );
            })}
            {selectedItem?.description && (
                <div style={styles.description}>
                    {selectedItem.description}
                </div>
            )}
        </div>
    );
}

function PowerlineMenuValue({ item }: { item: MenuItem }) {
    if (item.label === '分隔符') {
        return (
            <>
                <span>(</span>
                <PowerlineInlineGlyph />
                <span> - 右三角)</span>
            </>
        );
    }

    if (item.label === '结束端帽') {
        return (
            <>
                <span>(</span>
                <PowerlineInlineGlyph />
                <span> - 三角)</span>
            </>
        );
    }

    return <>{item.sublabel}</>;
}

function PowerlineInlineGlyph() {
    return <span style={styles.powerlineInlineGlyph} />;
}

function ThemeScreen({ phase }: { phase: Phase }) {
    const items: MenuItem[] = THEME_ORDER.map(themeName => ({
        label: THEMES[themeName].name,
        sublabel: themeName === 'minimal' ? '(original)' : undefined,
        description: THEMES[themeName].description
    }));
    const selectedThemeName = THEME_ORDER[phase.selectedItemIndex] ?? phase.selectedTheme;

    return (
        <div>
            <div style={styles.screenTitle}>
                Powerline Theme Selection  |
                {'  '}
                <span style={styles.dimText}>Original: minimal</span>
            </div>
            <div style={styles.helpText}>
                {`↑↓ navigate, Enter apply${selectedThemeName !== 'custom' ? ', (c)ustomize theme' : ''}, ESC cancel`}
            </div>
            <MenuList
                items={items}
                selectedIndex={phase.selectedItemIndex}
            />
            {selectedThemeName !== 'custom' && (
                <div style={styles.themeFooter}>Press (c) to customize this theme - copies colors to widgets</div>
            )}
        </div>
    );
}

function MenuList({
    items,
    selectedIndex
}: {
    items: MenuItem[];
    selectedIndex: number;
}) {
    const selectedItem = items[selectedIndex];

    return (
        <div style={styles.menuList}>
            {items.map((item, index) => {
                if (item.separator || item.label.length === 0) {
                    return <div key={`gap-${index}`} style={styles.menuGap} />;
                }

                const selected = index === selectedIndex;
                const color = selected ? '#22C55E' : item.disabled ? '#64748B' : '#D7DEE8';

                return (
                    <div
                        key={`${item.label}-${index}`}
                        style={{
                            ...styles.menuRow,
                            color
                        }}
                    >
                        <span style={styles.menuPointer}>{selected ? '▶  ' : '   '}</span>
                        <span style={selected ? styles.menuSelectedText : undefined}>
                            {item.label}
                        </span>
                        {item.sublabel && (
                            <>
                                {'\u00A0'}
                                <span style={selected ? styles.menuSelectedText : styles.dimText}>
                                    {item.sublabel}
                                </span>
                            </>
                        )}
                        {item.powerlineSeparator && (
                            <>
                                {'\u00A0'}
                                <span style={selected ? styles.menuSelectedText : styles.dimText}>(</span>
                                <PowerlineMenuGlyph selected={selected} />
                                <span style={selected ? styles.menuSelectedText : styles.dimText}> - Triangle Right)</span>
                            </>
                        )}
                    </div>
                );
            })}
            {selectedItem?.description && (
                <div style={styles.description}>
                    {selectedItem.description}
                </div>
            )}
        </div>
    );
}

function PowerlineMenuGlyph({ selected }: { selected: boolean }) {
    return (
        <span
            style={{
                ...styles.powerlineMenuGlyph,
                borderLeftColor: selected ? '#22C55E' : '#94A3B8'
            }}
        />
    );
}

const styles = {
    root: {
        backgroundColor: '#0A0F16',
        color: '#F8FAFC',
        fontFamily: '"Inter", "SF Pro Display", "Segoe UI", sans-serif'
    },
    background: { backgroundImage: 'linear-gradient(135deg, #081018 0%, #101820 46%, #15130f 100%)' },
    shell: {
        position: 'absolute',
        inset: '26px 28px',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center'
    },
    terminalWrap: {
        width: '100%',
        minWidth: 0
    },
    terminal: {
        position: 'relative',
        height: '100%',
        borderRadius: 22,
        backgroundColor: '#0E141B',
        border: '1px solid rgba(148, 163, 184, 0.22)',
        boxShadow: '0 34px 90px rgba(0, 0, 0, 0.55)',
        overflow: 'hidden'
    },
    windowChrome: {
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#121A24',
        borderBottom: '1px solid rgba(148, 163, 184, 0.16)'
    },
    windowButtons: {
        position: 'absolute',
        left: 22,
        top: 20,
        display: 'flex',
        gap: 9
    },
    dot: {
        width: 13,
        height: 13,
        borderRadius: '50%'
    },
    windowTitle: {
        color: '#93A4B8',
        fontFamily: '"SFMono-Regular", "Cascadia Code", "Menlo", monospace',
        fontSize: 14,
        letterSpacing: 0
    },
    terminalBody: {
        padding: '24px 30px',
        fontFamily: '"SFMono-Regular", "Cascadia Code", "Menlo", monospace',
        fontSize: 14,
        lineHeight: 1.25
    },
    launchBody: {
        height: 700,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    commandLine: {
        height: 42,
        display: 'flex',
        alignItems: 'center',
        color: '#CBD5E1',
        marginBottom: 12,
        fontSize: 14
    },
    commandText: { color: '#A7F3D0' },
    cursor: {
        display: 'inline-block',
        width: 8,
        height: 18,
        marginLeft: 4,
        backgroundColor: '#A7F3D0'
    },
    launchDimText: {
        color: '#94A3B8',
        fontSize: 14
    },
    tuiHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 20
    },
    tuiTitle: {
        fontWeight: 800,
        color: '#7DD3FC'
    },
    version: {
        color: '#E2E8F0',
        fontWeight: 700
    },
    savedMessage: {
        marginLeft: 14,
        color: '#4ADE80',
        fontWeight: 800
    },
    previewBox: {
        border: '1px solid rgba(148, 163, 184, 0.40)',
        borderRadius: 12,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 20,
        color: '#94A3B8',
        marginBottom: 12
    },
    previewHeader: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
    },
    promptChar: { color: '#E2E8F0' },
    previewLines: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        marginBottom: 24
    },
    previewLine: {
        minHeight: 32,
        display: 'flex',
        alignItems: 'center'
    },
    previewIndent: { whiteSpace: 'pre' },
    plainPreview: {
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
    },
    plainSeparator: { color: '#64748B' },
    powerlinePreview: {
        display: 'flex',
        alignItems: 'stretch',
        height: 32,
        maxWidth: '100%',
        filter: 'drop-shadow(0 12px 22px rgba(0, 0, 0, 0.25))'
    },
    powerlineGroup: {
        display: 'flex',
        alignItems: 'stretch'
    },
    powerlineSegment: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        height: 32,
        padding: '0 10px',
        fontWeight: 800,
        whiteSpace: 'nowrap',
        fontSize: 14
    },
    powerlineSeparator: {
        position: 'relative',
        width: 18,
        height: 32
    },
    powerlineTriangle: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        borderTop: '16px solid transparent',
        borderBottom: '16px solid transparent',
        borderLeft: '18px solid'
    },
    screenContent: { minHeight: 420 },
    screenTitle: {
        fontWeight: 900,
        color: '#F8FAFC',
        marginBottom: 10,
        whiteSpace: 'pre'
    },
    inlineWarning: {
        color: '#FACC15',
        fontWeight: 700,
        marginLeft: '3ch'
    },
    helpText: {
        color: '#94A3B8',
        marginBottom: 4
    },
    helpSpacer: {
        height: 18,
        color: '#94A3B8'
    },
    emptyLine: {
        color: '#94A3B8',
        marginTop: 10
    },
    menuList: {
        display: 'grid',
        gap: 5,
        marginTop: 10
    },
    menuRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        minHeight: 28
    },
    menuGap: { height: 8 },
    menuPointer: {
        width: '3ch',
        color: '#22C55E',
        fontWeight: 900,
        whiteSpace: 'pre'
    },
    menuSelectedText: { fontWeight: 900 },
    description: {
        marginTop: 14,
        paddingLeft: '2ch',
        color: '#94A3B8',
        lineHeight: 1.28
    },
    modePill: {
        color: '#22D3EE',
        fontWeight: 900
    },
    searchLine: {
        color: '#94A3B8',
        marginBottom: 10
    },
    searchValue: {
        color: '#22D3EE',
        fontWeight: 800
    },
    pickerList: {
        display: 'grid',
        gap: 3,
        marginTop: 10
    },
    pickerRow: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 24
    },
    pickerPointer: {
        width: '3ch',
        color: '#22C55E',
        fontWeight: 900,
        whiteSpace: 'pre'
    },
    matchText: {
        color: '#FDE68A',
        fontWeight: 900
    },
    powerlineSetting: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 7,
        color: '#CBD5E1'
    },
    powerlineSettingLabel: {
        display: 'inline-block',
        width: '16ch',
        textAlign: 'right',
        whiteSpace: 'pre'
    },
    powerlineStatus: {
        display: 'inline-block',
        width: '13ch',
        textAlign: 'left'
    },
    powerlineNotes: {
        marginTop: 20,
        marginBottom: 4,
        color: '#94A3B8'
    },
    powerlineMenuList: {
        display: 'grid',
        gap: 5,
        marginTop: 18
    },
    powerlineMenuRow: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 28
    },
    powerlineMenuLabel: {
        display: 'inline-block',
        width: '12ch',
        whiteSpace: 'pre'
    },
    powerlineMenuSelectedLabel: {
        display: 'inline-block',
        width: '12ch',
        whiteSpace: 'pre',
        fontWeight: 900
    },
    powerlineMenuValue: { fontFamily: '"Symbols Nerd Font Mono", "MesloLGS NF", "JetBrainsMono Nerd Font", "SFMono-Regular", "Cascadia Code", "Menlo", monospace' },
    powerlineInlineGlyph: {
        display: 'inline-block',
        width: 0,
        height: 0,
        borderTop: '0.5em solid transparent',
        borderBottom: '0.5em solid transparent',
        borderLeft: '0.72em solid currentColor',
        transform: 'translateY(0.14em)',
        marginLeft: 1,
        marginRight: 2
    },
    goodText: {
        color: '#4ADE80',
        fontWeight: 900
    },
    badText: {
        color: '#F87171',
        fontWeight: 900
    },
    dimText: {
        color: '#94A3B8',
        fontWeight: 500
    },
    powerlineMenuGlyph: {
        display: 'inline-block',
        width: 0,
        height: 0,
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        borderLeft: '12px solid',
        transform: 'translateY(3px)',
        marginLeft: 2,
        marginRight: 2
    },
    themeFooter: {
        marginTop: 14,
        color: '#94A3B8',
        fontSize: 14
    },
    featurePanel: {
        height: '100%',
        borderRadius: 22,
        background: 'rgba(15, 23, 42, 0.78)',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        boxShadow: '0 34px 90px rgba(0, 0, 0, 0.40)',
        padding: '42px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
    },
    panelHeader: { minHeight: 220 },
    eyebrow: {
        color: '#38BDF8',
        fontSize: 14,
        letterSpacing: 0,
        textTransform: 'uppercase',
        fontWeight: 900,
        marginBottom: 14
    },
    panelTitle: {
        margin: 0,
        fontSize: 14,
        lineHeight: 1.02,
        letterSpacing: 0,
        color: '#F8FAFC'
    },
    panelSubtitle: {
        margin: '18px 0 0 0',
        fontSize: 14,
        lineHeight: 1.32,
        color: '#B6C2D2'
    },
    keyStack: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10
    },
    keyCap: {
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: '#0F172A',
        color: '#E0F2FE',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        fontFamily: '"SFMono-Regular", "Cascadia Code", "Menlo", monospace',
        fontSize: 14,
        fontWeight: 800
    },
    featureCard: {
        borderRadius: 14,
        border: '1px solid rgba(148, 163, 184, 0.20)',
        backgroundColor: 'rgba(2, 6, 23, 0.42)',
        padding: 22
    },
    cardTitle: {
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontSize: 14,
        letterSpacing: 0,
        fontWeight: 900,
        marginBottom: 16
    },
    lineMetric: {
        fontSize: 14,
        color: '#A7F3D0',
        fontWeight: 900,
        lineHeight: 1
    },
    themeName: {
        fontSize: 14,
        fontWeight: 900,
        marginBottom: 12,
        color: '#F8FAFC'
    },
    themeDescription: {
        marginTop: 12,
        color: '#B6C2D2',
        fontSize: 14,
        lineHeight: 1.35
    },
    timelineShell: {
        position: 'absolute',
        left: 76,
        right: 76,
        bottom: 54
    },
    timelineTrack: {
        height: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(148, 163, 184, 0.18)',
        overflow: 'hidden'
    },
    timelineFill: {
        height: '100%',
        borderRadius: 999,
        background: 'linear-gradient(90deg, #38BDF8 0%, #A6E3A1 58%, #E0AF68 100%)'
    },
    timelineLabels: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 12,
        fontFamily: '"SFMono-Regular", "Cascadia Code", "Menlo", monospace',
        textTransform: 'uppercase',
        letterSpacing: 0
    },
    keypressHint: {
        position: 'absolute',
        right: 24,
        bottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'rgba(203, 213, 225, 0.72)',
        fontFamily: '"SFMono-Regular", "Cascadia Code", "Menlo", monospace',
        fontSize: 14,
        pointerEvents: 'none'
    },
    keypressLabel: { color: 'rgba(148, 163, 184, 0.62)' },
    keypressValue: {
        minWidth: 44,
        textAlign: 'center',
        padding: '4px 8px',
        borderRadius: 7,
        border: '1px solid rgba(148, 163, 184, 0.20)',
        backgroundColor: 'rgba(2, 6, 23, 0.34)',
        color: 'rgba(226, 232, 240, 0.82)',
        fontWeight: 800
    }
} satisfies Record<string, CSSProperties>;
