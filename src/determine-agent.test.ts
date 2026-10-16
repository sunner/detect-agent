import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { determineAgent, KNOWN_AGENTS } from './index';
import { access } from 'node:fs/promises';
import testCases from '../testcases.json';

vi.mock('node:fs/promises', () => ({ access: vi.fn() }));

vi.setConfig({ testTimeout: 6 * 60 * 1000 });

type TestCase = (typeof testCases)[number];

const ALL_AGENT_ENVS = [
  'AI_AGENT',
  'CURSOR_TRACE_ID',
  'CURSOR_AGENT',
  'CURSOR_EXTENSION_HOST_ROLE',
  'KIMI_PLUGIN_ROOT',
  'GROK_PLUGIN_ROOT',
  'GROK_PLUGIN_DATA',
  'GEMINI_CLI',
  'CODEX_SANDBOX',
  'CODEX_CI',
  'CODEX_THREAD_ID',
  'CODEX_SANDBOX_NETWORK_DISABLED',
  'ANTIGRAVITY_AGENT',
  'AUGMENT_AGENT',
  'OPENCODE_CLIENT',
  'OPENCODE',
  'GOOSE_PROVIDER',
  'JUNIE_DATA',
  'JUNIE_SHIM_PATH',
  'CLAUDECODE',
  'CLAUDE_CODE',
  'CLAUDE_CODE_IS_COWORK',
  'REPL_ID',
  'COPILOT_MODEL',
  'COPILOT_ALLOW_ALL',
  'COPILOT_GITHUB_TOKEN',
  'TERM_PROGRAM',
];

describe('determineAgent', () => {
  const originalIsTTY = process.stdout.isTTY;
  const files = new Map<string, 'present' | 'EACCES'>();

  beforeEach(() => {
    files.clear();
    vi.mocked(access).mockReset();
    vi.mocked(access).mockImplementation(async path => {
      const state = files.get(String(path));
      if (state !== 'present') {
        const code = state ?? 'ENOENT';
        throw Object.assign(new Error(code), { code });
      }
    });
    vi.unstubAllEnvs();
    for (const v of ALL_AGENT_ENVS) {
      vi.stubEnv(v, '');
    }
    vi.stubEnv('PATH', '/usr/bin');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.stdout.isTTY = originalIsTTY;
    vi.mocked(access).mockReset();
  });

  for (const tc of testCases as TestCase[]) {
    it(tc.name, async () => {
      for (const [key, value] of Object.entries(tc.env)) {
        vi.stubEnv(key, value);
      }

      if (tc.tty !== undefined && tc.tty !== null) {
        process.stdout.isTTY = tc.tty;
      }

      if (tc.files && tc.files.length > 0) {
        for (const path of tc.files) {
          files.set(path, 'present');
        }
      }

      const result = await determineAgent();

      const expectedName =
        tc.expectedName ??
        (tc.expectedAgentKey
          ? (KNOWN_AGENTS as Record<string, string>)[tc.expectedAgentKey]
          : undefined);

      if (tc.expectedIsAgent) {
        expect(result).toEqual({
          isAgent: true,
          agent: { name: expectedName },
        });
      } else {
        expect(result).toEqual({ isAgent: false });
      }
    });
  }

  it('handles file system errors gracefully for devin detection', async () => {
    files.set('/opt/.devin', 'EACCES');
    const result = await determineAgent();
    expect(result).toEqual({ isAgent: false });
  });
});
