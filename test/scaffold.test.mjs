import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffold } from '../lib/scaffold.mjs';

function dirs() {
  const a = mkdtempSync(join(tmpdir(), 'asset-'));
  mkdirSync(join(a, 'docs', 'harness'), { recursive: true });
  writeFileSync(join(a, 'docs', 'index.md'), 'IDX');
  writeFileSync(join(a, 'docs', 'harness', 'checks.json'), '[]');
  const t = mkdtempSync(join(tmpdir(), 'target-'));
  return { a, t };
}

test('复制骨架：新文件创建、内容一致', () => {
  const { a, t } = dirs();
  const r = scaffold(t, a);
  assert.ok(existsSync(join(t, 'docs', 'index.md')));
  assert.equal(readFileSync(join(t, 'docs', 'harness', 'checks.json'), 'utf8'), '[]');
  assert.ok(r.created.includes(join('docs', 'index.md')));
  assert.equal(r.skipped.length, 0);
  assert.equal(r.created.length, 2);
});

test('已存在的文件不覆盖、计入 skipped', () => {
  const { a, t } = dirs();
  mkdirSync(join(t, 'docs'), { recursive: true });
  writeFileSync(join(t, 'docs', 'index.md'), 'KEEP');
  const r = scaffold(t, a);
  assert.equal(readFileSync(join(t, 'docs', 'index.md'), 'utf8'), 'KEEP');
  assert.ok(r.skipped.includes(join('docs', 'index.md')));
});
