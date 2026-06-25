import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('../hooks/check-runner.mjs', import.meta.url));

function setup(checks, overrideIds) {
  const root = mkdtempSync(join(tmpdir(), 'cr-'));
  mkdirSync(join(root, 'docs', 'harness'), { recursive: true });
  writeFileSync(join(root, 'docs', 'harness', 'checks.json'), JSON.stringify(checks));
  if (overrideIds) { mkdirSync(join(root, '.ai'), { recursive: true }); writeFileSync(join(root, '.ai', '.harness-override.json'), JSON.stringify({ ids: overrideIds })); }
  return root;
}
function run(root, payload) {
  return execFileSync('node', [hook], { input: JSON.stringify(payload), env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: 'utf8' });
}
const CK = [{ id: 'NO-TODO', globs: ['**/*.java'], kind: 'forbid', pattern: 'TODO 请修改', reason: '禁止占位 TODO' }];

test('Write 命中 forbid → deny + 含 id', () => {
  const out = run(setup(CK), { tool_name: 'Write', tool_input: { file_path: 'D:/x/Foo.java', content: 'class Foo { // TODO 请修改\n}' } });
  const r = JSON.parse(out);
  assert.equal(r.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(r.hookSpecificOutput.permissionDecisionReason, /NO-TODO/);
});

test('Edit 干净内容 → 放行（空输出）', () => {
  const out = run(setup(CK), { tool_name: 'Edit', tool_input: { file_path: 'D:/x/Foo.java', new_string: 'class Foo {}' } });
  assert.equal(out.trim(), '');
});

test('glob 不匹配（.ts）→ 放行', () => {
  const out = run(setup(CK), { tool_name: 'Write', tool_input: { file_path: 'D:/x/Foo.ts', content: 'TODO 请修改' } });
  assert.equal(out.trim(), '');
});

test('已 override → 放行', () => {
  const out = run(setup(CK, ['NO-TODO']), { tool_name: 'Write', tool_input: { file_path: 'D:/x/Foo.java', content: 'TODO 请修改' } });
  assert.equal(out.trim(), '');
});

test('非写工具（Read）→ 放行', () => {
  const out = run(setup(CK), { tool_name: 'Read', tool_input: { file_path: 'D:/x/Foo.java' } });
  assert.equal(out.trim(), '');
});

test('坏 JSON → fail-open 放行', () => {
  const out = execFileSync('node', [hook], { input: 'not json', env: { ...process.env, CLAUDE_PROJECT_DIR: setup(CK) }, encoding: 'utf8' });
  assert.equal(out.trim(), '');
});
