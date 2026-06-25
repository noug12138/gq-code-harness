import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanProject } from '../lib/scan-project.mjs';

const ck = [{ id: 'NO-SYSOUT', globs: ['**/*.java'], kind: 'forbid', pattern: 'System.out.println', reason: 'r' }];

test('跨多文件找出违反；不匹配 glob 的不报', () => {
  const root = mkdtempSync(join(tmpdir(), 'sp-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'A.java'), 'System.out.println(x);'); // 违反
  writeFileSync(join(root, 'src', 'B.java'), 'log.info(x);');            // 干净
  writeFileSync(join(root, 'src', 'C.ts'), 'System.out.println(x);');    // glob 不含 .ts
  const v = scanProject(root, ck);
  assert.equal(v.length, 1);
  assert.equal(v[0].id, 'NO-SYSOUT');
  assert.match(v[0].file, /A\.java/);
});

test('跳过 node_modules / target 等忽略目录', () => {
  const root = mkdtempSync(join(tmpdir(), 'sp-'));
  mkdirSync(join(root, 'node_modules', 'x'), { recursive: true });
  mkdirSync(join(root, 'target'), { recursive: true });
  writeFileSync(join(root, 'node_modules', 'x', 'D.java'), 'System.out.println(x);');
  writeFileSync(join(root, 'target', 'E.java'), 'System.out.println(x);');
  assert.equal(scanProject(root, ck).length, 0); // 都在忽略目录里
});

test('无检查 / 空检查 → 空数组', () => {
  const root = mkdtempSync(join(tmpdir(), 'sp-'));
  assert.deepEqual(scanProject(root, []), []);
});

test('跳过超大文件（>512KB，多为二进制）', () => {
  const root = mkdtempSync(join(tmpdir(), 'sp-'));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'Big.java'), 'System.out.println(x);' + 'x'.repeat(600 * 1024));
  assert.equal(scanProject(root, ck).length, 0);
});
