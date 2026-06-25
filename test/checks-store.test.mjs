import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addCheck } from '../lib/checks-store.mjs';
import { loadChecks } from '../lib/checks.mjs';

const ck = (id) => ({ id, globs: ['**/*.java'], kind: 'forbid', pattern: 'x', reason: 'r' });

test('追加到 docs/harness/checks.json（目录不存在则建）', () => {
  const root = mkdtempSync(join(tmpdir(), 'st-'));
  const r = addCheck(root, ck('A'));
  assert.equal(r.ok, true);
  assert.equal(r.count, 1);
  assert.ok(existsSync(join(root, 'docs', 'harness', 'checks.json')));
  assert.equal(loadChecks(root).length, 1);
});

test('id 重复 → 拒绝', () => {
  const root = mkdtempSync(join(tmpdir(), 'st-'));
  addCheck(root, ck('A'));
  const r = addCheck(root, ck('A'));
  assert.equal(r.ok, false);
  assert.match(r.error, /已存在/);
  assert.equal(loadChecks(root).length, 1); // 没被重复写入
});

test('checks.json 损坏（非法 JSON）→ 拒绝且一字不改原文件', () => {
  const root = mkdtempSync(join(tmpdir(), 'st-'));
  mkdirSync(join(root, 'docs', 'harness'), { recursive: true });
  const p = join(root, 'docs', 'harness', 'checks.json');
  writeFileSync(p, '[{"id":"C1"'); // 截断的非法 JSON
  const r = addCheck(root, ck('A'));
  assert.equal(r.ok, false);
  assert.match(r.error, /无法解析|拒绝/);
  assert.equal(readFileSync(p, 'utf8'), '[{"id":"C1"'); // 原文件未被覆盖
});
