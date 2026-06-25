import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isOverridden, consumeOverride } from '../lib/override.mjs';

function root() { const r = mkdtempSync(join(tmpdir(), 'ov-')); mkdirSync(join(r, '.ai'), { recursive: true }); return r; }

test('无文件 → 未放行', () => {
  assert.equal(isOverridden(root(), 'A'), false);
});

test('ids 含该 id → 已放行；consume 后移除并留痕', () => {
  const r = root();
  writeFileSync(join(r, '.ai', '.harness-override.json'), JSON.stringify({ ids: ['A', 'B'] }));
  assert.equal(isOverridden(r, 'A'), true);
  consumeOverride(r, 'A');
  assert.equal(isOverridden(r, 'A'), false);   // 已消耗
  assert.equal(isOverridden(r, 'B'), true);     // 其它保留
  const o = JSON.parse(readFileSync(join(r, '.ai', '.harness-override.json'), 'utf8'));
  assert.equal(o.consumed.some((x) => x.id === 'A'), true); // 留痕
});
