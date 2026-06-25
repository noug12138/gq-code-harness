import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findDeadLinks } from '../lib/deadlinks.mjs';

test('逮到指向不存在文件的链接', () => {
  const root = mkdtempSync(join(tmpdir(), 'dl-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs', 'a.md'), '见 [B](./b.md) 和 [真实](a.md)');
  const errs = findDeadLinks([join(root, 'docs', 'a.md')], root);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /b\.md/);
});

test('忽略外链、锚点、模板占位符', () => {
  const root = mkdtempSync(join(tmpdir(), 'dl-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs', 'a.md'),
    '[x](https://e.com) [y](#sec) [z](<task-name>.md) [w](a.md#h)');
  const errs = findDeadLinks([join(root, 'docs', 'a.md')], root);
  assert.equal(errs.length, 0);
});
