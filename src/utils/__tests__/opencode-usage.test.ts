import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { ClaudeSettings } from '../../types/ClaudeSettings';
import { loadClaudeSettingsSync } from '../claude-settings';
import {
    getOpenCodeUsageToken,
    isOpenCodeUsageSource,
    parseOpenCodeUsageResponse
} from '../opencode-usage';

vi.mock('../claude-settings', () => ({ loadClaudeSettingsSync: vi.fn(() => ({})) }));

// Shape captured from a live GET /zen/go/v1/usage on 2026-09-25.
const LIVE_RESPONSE = JSON.stringify({
    usage: {
        rolling: { status: 'ok', percent: 5, resetsAt: '2026-09-25T15:49:24.936Z' },
        weekly: { status: 'ok', percent: 3, resetsAt: '2026-09-28T00:00:00.000Z' },
        monthly: { status: 'ok', percent: 1, resetsAt: '2026-10-25T03:28:35.000Z' }
    }
});

const AUTH_FILE = path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');
const ENV_KEYS = ['OPENCODE_API_KEY', 'ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL'] as const;
const savedEnv: Record<string, string | undefined> = {};

// bun 自带的 test runner 只实现了 vitest API 的子集（没有 vi.mocked），故直接断言。
const loadClaudeSettingsSyncMock = loadClaudeSettingsSync as unknown as { mockReturnValue: (value: ClaudeSettings) => void };

function mockClaudeSettings(settings: ClaudeSettings): void {
    loadClaudeSettingsSyncMock.mockReturnValue(settings);
}

function mockAuthFile(contents: string | null): void {
    vi.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
        if (filePath === AUTH_FILE && contents !== null) {
            return contents;
        }
        throw new Error('ENOENT');
    });
}

describe('parseOpenCodeUsageResponse', () => {
    it('maps the three windows onto the session/weekly/monthly fields', () => {
        expect(parseOpenCodeUsageResponse(LIVE_RESPONSE)).toEqual({
            sessionUsage: 5,
            sessionResetAt: '2026-09-25T15:49:24.936Z',
            weeklyUsage: 3,
            weeklyResetAt: '2026-09-28T00:00:00.000Z',
            monthlyUsage: 1,
            monthlyResetAt: '2026-10-25T03:28:35.000Z'
        });
    });

    it('keeps a 0% window instead of treating it as missing', () => {
        const parsed = parseOpenCodeUsageResponse(JSON.stringify({ usage: { rolling: { status: 'ok', percent: 0, resetsAt: '2026-09-25T15:49:24.936Z' } } }));

        expect(parsed?.sessionUsage).toBe(0);
    });

    it('drops only the unusable parts of a window', () => {
        const parsed = parseOpenCodeUsageResponse(JSON.stringify({ usage: { weekly: { percent: 7, resetsAt: 'not-a-timestamp' } } }));

        expect(parsed).toEqual({ weeklyUsage: 7, weeklyResetAt: undefined });
    });

    it('accepts unknown fields around the windows', () => {
        const parsed = parseOpenCodeUsageResponse(JSON.stringify({
            useBalance: true,
            usage: { monthly: { percent: 12, resetsAt: '2026-10-25T03:28:35.000Z', extra: 'x' }, other: {} }
        }));

        expect(parsed?.monthlyUsage).toBe(12);
    });

    it('returns null when no window carries a usable percentage', () => {
        expect(parseOpenCodeUsageResponse('{}')).toBeNull();
        expect(parseOpenCodeUsageResponse('{"usage":{}}')).toBeNull();
        expect(parseOpenCodeUsageResponse('{"usage":{"rolling":{"percent":"5"}}}')).toBeNull();
    });

    it('returns null on malformed json', () => {
        expect(parseOpenCodeUsageResponse('not json')).toBeNull();
    });
});

describe('isOpenCodeUsageSource', () => {
    beforeEach(() => {
        mockClaudeSettings({});
    });

    it('detects the opencode gateway from the environment base url', () => {
        process.env.ANTHROPIC_BASE_URL = 'https://opencode.ai/zen/go';
        expect(isOpenCodeUsageSource()).toBe(true);
    });

    it('rejects other gateways and an unset base url', () => {
        process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
        expect(isOpenCodeUsageSource()).toBe(false);

        delete process.env.ANTHROPIC_BASE_URL;
        expect(isOpenCodeUsageSource()).toBe(false);
    });

    it('falls back to the settings env block', () => {
        delete process.env.ANTHROPIC_BASE_URL;
        mockClaudeSettings({ env: { ANTHROPIC_BASE_URL: 'https://opencode.ai/zen/go' } });

        expect(isOpenCodeUsageSource()).toBe(true);
    });
});

describe('getOpenCodeUsageToken', () => {
    beforeEach(() => {
        for (const key of ENV_KEYS) {
            savedEnv[key] = process.env[key];
            Reflect.deleteProperty(process.env, key);
        }
        mockClaudeSettings({});
        mockAuthFile(JSON.stringify({ 'opencode': { key: 'zen-key' }, 'opencode-go': { key: 'go-key' } }));
    });

    afterEach(() => {
        for (const key of ENV_KEYS) {
            if (savedEnv[key] === undefined) {
                Reflect.deleteProperty(process.env, key);
            } else {
                process.env[key] = savedEnv[key];
            }
        }
    });

    it('prefers the opencode env key', () => {
        process.env.OPENCODE_API_KEY = 'env-opencode-key';
        process.env.ANTHROPIC_API_KEY = 'env-anthropic-key';

        expect(getOpenCodeUsageToken()).toBe('env-opencode-key');
    });

    it('falls back to the anthropic env key', () => {
        process.env.ANTHROPIC_API_KEY = 'env-anthropic-key';

        expect(getOpenCodeUsageToken()).toBe('env-anthropic-key');
    });

    it('falls back to the settings env block', () => {
        mockClaudeSettings({ env: { ANTHROPIC_API_KEY: 'settings-key' } });

        expect(getOpenCodeUsageToken()).toBe('settings-key');
    });

    // The subscription entry (`opencode-go`) returns 403 on /usage — only the
    // Zen entry may be used.
    it('falls back to the zen entry of the opencode auth file', () => {
        expect(getOpenCodeUsageToken()).toBe('zen-key');
    });

    it('treats blank keys and unreadable files as absent', () => {
        process.env.OPENCODE_API_KEY = '   ';
        mockAuthFile(null);

        expect(getOpenCodeUsageToken()).toBeNull();
    });
});
