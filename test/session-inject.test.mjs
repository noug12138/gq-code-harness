import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('../hooks/session-inject.mjs', import.meta.url));

function runWithProject(root) {
  return execFileSync('node', [hook], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    encoding: 'utf8'
  });
}

test('注入 session.md 内容到 additionalContext', () => {
  const root = mkdtempSync(join(tmpdir(), 'harness-'));
  mkdirSync(join(root, '.ai'), { recursive: true });
  writeFileSync(join(root, '.ai', 'session.md'), '# 当前会话\n测试内容XYZ');

  const out = runWithProject(root);
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(parsed.hookSpecificOutput.additionalContext, /测试内容XYZ/);
});

test('无 session.md 时静默（空输出）', () => {
  const root = mkdtempSync(join(tmpdir(), 'harness-'));
  const out = runWithProject(root);
  assert.equal(out.trim(), '');
});
