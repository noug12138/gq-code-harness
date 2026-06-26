import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
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

test('block:true 一个 id 多处违反 + override 一次 → 全放行（exit 0）', () => {
  const r = run(setup(blockCk, { 'A.java': 'BAD', 'B.java': 'BAD' }, ['B']));
  assert.equal(r.code, 0);
});

// ── 做完没收（stale tasks）测试 ────────────────────────────────────────────

function staleRoot() {
  const r = mkdtempSync(join(tmpdir(), 'sc-'));
  mkdirSync(join(r, '.ai', 'tasks'), { recursive: true });
  mkdirSync(join(r, 'docs', 'harness'), { recursive: true });
  writeFileSync(join(r, 'docs', 'harness', 'checks.json'), JSON.stringify([]));
  writeFileSync(join(r, '.ai', 'tasks', '2026-06-26-done.md'), '---\nstatus: active\ntitle: 收口我\n---\n## 步骤\n- [x] 一\n');
  return r;
}

test('做完没收 → exit 2 + 驱动 archive', () => {
  const r = run(staleRoot());
  assert.equal(r.code, 2);
  assert.match(r.err, /做完没收/);
  assert.match(r.err, /收口我/);
  assert.match(r.err, /archive/);
});

test('已 override 的做完没收 → 放行(exit 0) 且消耗 override', () => {
  const r2 = staleRoot();
  writeFileSync(join(r2, '.ai', '.harness-override.json'), JSON.stringify({ ids: ['2026-06-26-done.md'], log: [] }));
  const r = run(r2);
  assert.equal(r.code, 0);
  const o = JSON.parse(readFileSync(join(r2, '.ai', '.harness-override.json'), 'utf8'));
  assert.equal(o.ids.includes('2026-06-26-done.md'), false);
});

test('代码违反 + 做完没收 同时 → exit 2，两段都在', () => {
  const root = mkdtempSync(join(tmpdir(), 'sc-'));
  mkdirSync(join(root, 'docs', 'harness'), { recursive: true });
  writeFileSync(join(root, 'docs', 'harness', 'checks.json'), JSON.stringify(blockCk));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'A.java'), 'BAD');
  mkdirSync(join(root, '.ai', 'tasks'), { recursive: true });
  writeFileSync(join(root, '.ai', 'tasks', '2026-06-26-combo.md'), '---\nstatus: active\ntitle: 合并测试\n---\n## 步骤\n- [x] 一\n');
  const { code, err: stderr } = run(root);
  assert.equal(code, 2);
  assert.match(stderr, /违反硬性检查/);
  assert.match(stderr, /做完没收/);
});
