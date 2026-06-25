import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadChecks } from '../lib/checks.mjs';

const cli = fileURLToPath(new URL('../bin/contract.mjs', import.meta.url));
function run(payload, root, add) {
  const args = ['--project', root]; if (add) args.push('--add');
  try { return { out: execFileSync('node', [cli, ...args], { input: JSON.stringify(payload), encoding: 'utf8' }), code: 0 }; }
  catch (e) { return { out: e.stdout || '', code: e.status }; }
}
const good = { check: { id: 'A', globs: ['**/*.java'], kind: 'forbid', pattern: 'BAD', reason: 'r' }, bad: 'x BAD x', good: 'clean' };

test('校验合格 → ok:true，不落地', () => {
  const root = mkdtempSync(join(tmpdir(), 'cli-'));
  const r = run(good, root, false);
  assert.equal(JSON.parse(r.out).ok, true);
  assert.equal(loadChecks(root).length, 0); // 未 --add
});

test('校验不合格（坏例没抓住）→ ok:false + exit 1', () => {
  const root = mkdtempSync(join(tmpdir(), 'cli-'));
  const r = run({ ...good, bad: '没有违规' }, root, false);
  assert.equal(JSON.parse(r.out).ok, false);
  assert.equal(r.code, 1);
});

test('--add：合格则落地，loadChecks 能读到', () => {
  const root = mkdtempSync(join(tmpdir(), 'cli-'));
  const r = run(good, root, true);
  assert.equal(JSON.parse(r.out).ok, true);
  assert.equal(loadChecks(root).length, 1);
});
