import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';

import { loadClaudeSettingsSync } from './claude-settings';
import type { UsageData } from './usage-types';

// opencode 网关通道（ANTHROPIC_BASE_URL 指向 opencode.ai/zen/go）不复用 Claude 的
// OAuth 订阅凭据，上游用量组件在这里永远读不到 token、只能显示「无凭证」。opencode
// go 自己的额度另有接口：GET /zen/go/v1/usage 返回三个滚动窗口的已用百分比——
// 5 小时窗口 = 月额度 20%、周 = 50%、月 = 100%（https://opencode.ai/docs/go/）。
export const OPENCODE_USAGE_API_HOST = 'opencode.ai';
export const OPENCODE_USAGE_API_PATH = '/zen/go/v1/usage';

// percent 是「已用」百分比（0-100 整数），不是剩余：按 opencode 自身的记账价目
// （其 provider 表内 deepseek-flash = $0.098/$0.196/$0.028 每 M token）换算本地
// transcript 的消耗后，rolling 与 weekly 两窗口各自反解出的月额度互相吻合
// （$128.7 与 $125.2，且两窗口实测消耗比 0.685 ≈ 5%×20% : 3%×50% = 0.667）；
// 若按「剩余」解释，两窗口解得 $6.77 与 $3.87，自相矛盾。
const OpenCodeUsageWindowSchema = z.object({
    status: z.string().nullable().optional(),
    percent: z.number().nullable().optional(),
    resetsAt: z.string().nullable().optional()
});

type OpenCodeUsageWindow = z.infer<typeof OpenCodeUsageWindowSchema>;

const OpenCodeUsageResponseSchema = z.looseObject({
    usage: z.looseObject({
        rolling: OpenCodeUsageWindowSchema.nullable().optional(),
        weekly: OpenCodeUsageWindowSchema.nullable().optional(),
        monthly: OpenCodeUsageWindowSchema.nullable().optional()
    }).nullable().optional()
});

// auth.json 的 `opencode-go` 那条订阅 key 实测对 /usage 返回 403（读不了用量），
// 同账号的 Zen key 才行，故只取 `opencode`。
const OpenCodeAuthFileSchema = z.looseObject({ opencode: z.looseObject({ key: z.string().nullable().optional() }).nullable().optional() });

const OPENCODE_AUTH_FILE = path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');

function nonEmptyString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readSettingsEnv(): Record<string, unknown> {
    try {
        const env = loadClaudeSettingsSync({ logErrors: false }).env;
        return env !== null && typeof env === 'object' ? env as Record<string, unknown> : {};
    } catch {
        return {};
    }
}

// 状态栏进程由 Claude Code 派生、通常已继承 ANTHROPIC_BASE_URL；读不到时回退
// settings.json 的 env 段——Claude Code 的该变量本来就是从那里注入的。
function getConfiguredBaseUrl(): string {
    return nonEmptyString(process.env.ANTHROPIC_BASE_URL)
        ?? nonEmptyString(readSettingsEnv().ANTHROPIC_BASE_URL)
        ?? '';
}

export function isOpenCodeUsageSource(): boolean {
    return getConfiguredBaseUrl().includes('opencode.ai');
}

function readAuthFileToken(): string | null {
    try {
        const parsed = OpenCodeAuthFileSchema.safeParse(JSON.parse(fs.readFileSync(OPENCODE_AUTH_FILE, 'utf8')));
        return parsed.success ? nonEmptyString(parsed.data.opencode?.key) : null;
    } catch {
        return null;
    }
}

// 顺序按实测可用性排：前三处返回同一账号的同一份数据，`opencode-go` 那条 403。
// settings.json 里存的 key 正是 Claude Code 用来调这个网关的那把，故作为兜底。
export function getOpenCodeUsageToken(): string | null {
    return nonEmptyString(process.env.OPENCODE_API_KEY)
        ?? nonEmptyString(process.env.ANTHROPIC_API_KEY)
        ?? nonEmptyString(readSettingsEnv().ANTHROPIC_API_KEY)
        ?? readAuthFileToken();
}

function getWindowPercent(usageWindow: OpenCodeUsageWindow | null | undefined): number | undefined {
    return typeof usageWindow?.percent === 'number' ? usageWindow.percent : undefined;
}

function getWindowResetAt(usageWindow: OpenCodeUsageWindow | null | undefined): string | undefined {
    const resetsAt = usageWindow?.resetsAt;
    return typeof resetsAt === 'string' && !Number.isNaN(Date.parse(resetsAt)) ? resetsAt : undefined;
}

export function parseOpenCodeUsageResponse(rawJson: string): UsageData | null {
    let parsed: z.infer<typeof OpenCodeUsageResponseSchema>;

    try {
        const result = OpenCodeUsageResponseSchema.safeParse(JSON.parse(rawJson));
        if (!result.success) {
            return null;
        }
        parsed = result.data;
    } catch {
        return null;
    }

    const usage = parsed.usage;
    const data: UsageData = {
        sessionUsage: getWindowPercent(usage?.rolling),
        sessionResetAt: getWindowResetAt(usage?.rolling),
        weeklyUsage: getWindowPercent(usage?.weekly),
        weeklyResetAt: getWindowResetAt(usage?.weekly),
        monthlyUsage: getWindowPercent(usage?.monthly),
        monthlyResetAt: getWindowResetAt(usage?.monthly)
    };

    // 三个窗口一个都没有 = 这不是一份可用的用量响应，按解析失败处理（与 Claude
    // 分支的「既无 sessionUsage 又无 weeklyUsage」判据同一意图）。
    return data.sessionUsage === undefined && data.weeklyUsage === undefined && data.monthlyUsage === undefined
        ? null
        : data;
}
