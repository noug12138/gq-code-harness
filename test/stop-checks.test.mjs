import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('../hooks/stop-checks.mjs', import.meta.url));
function setup(checks, files, overrideIds) {
  const root = mkdtempSync(join(tmpdir(), 'sc-'));
  mkdirSync(join(root, 'docs', 'harness'), { recursive: true });
  writeFileSync(join(root, 'docs', 'harness', 'checks.json'), JSON.stringify(checks));
  mkdirSync(join(root, 'src'), { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, 'src', name), content);
  if (overrideIds) { mkdirSync(join(root, '.ai'), { recursive: true }); writeFileSync(join(root, '.ai', '.harness-override.json'), JSON.stringify({ ids: overrideIds })); }
  return root;
}
function run(root) {
  try { return { out: execFileSync('node', [hook], { env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: 'utf8' }), code: 0 }; }
  catch (e) { return { out: e.stdout || '', err: e.stderr || '', code: e.status }; }
}
const reportCk = [{ id: 'R', globs: ['**/*.java'], kind: 'forbid', pattern: 'BAD', reason: 'r' }];
const blockCk = [{ id: 'B', globs: ['**/*.java'], kind: 'forbid', pattern: 'BAD', reason: 'r', block: true }];

test('无违反 → exit 0、无输出', () => {
  const r = run(setup(reportCk, { 'A.java': 'clean' }));
  assert.equal(r.code, 0);
  assert.equal(r.out.trim(), '');
});

test('普通违反 → 报告（exit 0 + systemMessage），不拦', () => {
  const r = run(setup(reportCk, { 'A.java': 'BAD' }));
  assert.equal(r.code, 0);
  assert.match(JSON.parse(r.out).systemMessage, /R/);
});

test('block:true 违反 → exit 2 阻断', () => {
  const r = run(setup(blockCk, { 'A.java': 'BAD' }));
  assert.equal(r.code, 2);
  assert.match(r.err, /B/);
});

test('block:true 但已 override → 放行（exit 0），消耗一次', () => {
  const r = run(setup(blockCk, { 'A.java': 'BAD' }, ['B']));
  assert.equal(r.code, 0);
});
