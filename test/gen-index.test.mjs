import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { regenerate, regenerateAll } from '../lib/gen-index.mjs';

test('docs 块：按兄弟文档重算，标记外内容不动', () => {
  const d = mkdtempSync(join(tmpdir(), 'gi-'));
  writeFileSync(join(d, 'a.md'), '---\ntitle: 甲\ndescription: 甲说明\n---\n# x');
  writeFileSync(join(d, 'b.md'), '# 乙标题\nbody');
  const text = '# 索引\n\n保留这句\n\n<!-- gq-index:start kind=docs -->\n旧内容\n<!-- gq-index:end -->\n\n尾部';
  const out = regenerate(text, d);
  assert.match(out, /保留这句/);
  assert.match(out, /尾部/);
  assert.match(out, /- \[甲\]\(a\.md\) — 甲说明/);
  assert.match(out, /- \[乙标题\]\(b\.md\)/);
  assert.doesNotMatch(out, /旧内容/);
});

test('tasks 块：按 status 分组', () => {
  const d = mkdtempSync(join(tmpdir(), 'gi-'));
  writeFileSync(join(d, 't1.md'), '---\nstatus: active\ntitle: 跑着的\n---');
  writeFileSync(join(d, 't2.md'), '---\nstatus: done\ntitle: 完了的\n---');
  const out = regenerate('<!-- gq-index:start kind=tasks -->\n\n<!-- gq-index:end -->', d);
  assert.match(out, /进行中（1）/);
  assert.match(out, /- \[跑着的\]\(t1\.md\)/);
  assert.match(out, /已完成（1）/);
});

test('无 marker → 原样不动', () => {
  const out = regenerate('# 纯手写\n没有标记', mkdtempSync(join(tmpdir(), 'gi-')));
  assert.equal(out, '# 纯手写\n没有标记');
});

test('regenerateAll：只动带 marker 的 index.md', () => {
  const root = mkdtempSync(join(tmpdir(), 'gir-'));
  mkdirSync(join(root, 'docs', 'sub'), { recursive: true });
  writeFileSync(join(root, 'docs', 'sub', 'a.md'), '# 文档A');
  writeFileSync(join(root, 'docs', 'sub', 'index.md'), '<!-- gq-index:start kind=docs -->\n\n<!-- gq-index:end -->');
  writeFileSync(join(root, 'docs', 'index.md'), '# 手写无标记');
  const changed = regenerateAll(root);
  assert.equal(changed.length, 1);
  assert.match(readFileSync(join(root, 'docs', 'sub', 'index.md'), 'utf8'), /文档A/);
  assert.equal(readFileSync(join(root, 'docs', 'index.md'), 'utf8'), '# 手写无标记');
});
