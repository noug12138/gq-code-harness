import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadChecks, matchGlobs, runCheck } from '../lib/checks.mjs';

test('matchGlobs: **/*Controller.java 命中绝对路径与裸文件名', () => {
  assert.equal(matchGlobs('D:/a/b/FooController.java', ['**/*Controller.java']), true);
  assert.equal(matchGlobs('FooController.java', ['**/*Controller.java']), true);
  assert.equal(matchGlobs('D:/a/Foo.ts', ['**/*Controller.java']), false);
});

test('runCheck forbid: 内容含 pattern → violated', () => {
  const c = { id: 'X', kind: 'forbid', pattern: 'TODO 请修改', reason: 'r' };
  assert.equal(runCheck(c, 'a // TODO 请修改').violated, true);
  assert.equal(runCheck(c, 'a clean').violated, false);
});

test('runCheck require: 内容缺 pattern → violated', () => {
  const c = { id: 'Y', kind: 'require', pattern: '@PreAuthorize', reason: 'r' };
  assert.equal(runCheck(c, 'class X {}').violated, true);
  assert.equal(runCheck(c, '@PreAuthorize("x") void m(){}').violated, false);
});

test('loadChecks: 读 docs/harness/checks.json；不存在则空数组', () => {
  const root = mkdtempSync(join(tmpdir(), 'ck-'));
  assert.deepEqual(loadChecks(root), []);
  mkdirSync(join(root, 'docs', 'harness'), { recursive: true });
  writeFileSync(join(root, 'docs', 'harness', 'checks.json'), JSON.stringify([{ id: 'A', globs: ['**/*'], kind: 'forbid', pattern: 'x', reason: 'r' }]));
  assert.equal(loadChecks(root).length, 1);
});
