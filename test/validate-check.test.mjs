import { test } from 'node:test';
import assert from 'node:assert';
import { validateCheck } from '../lib/validate-check.mjs';

const base = { id: 'NO-TODO', globs: ['**/*.java'], kind: 'forbid', pattern: 'TODO 请修改', reason: 'r' };

test('合格：坏例被抓 + 好例不误伤', () => {
  const r = validateCheck(base, 'x // TODO 请修改', 'clean code');
  assert.equal(r.ok, true);
  assert.equal(r.errors.length, 0);
});

test('太松：坏例没被抓 → 不合格', () => {
  const r = validateCheck(base, '没有违规串', 'clean');
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /坏例/);
});

test('太严：好例被误伤 → 不合格', () => {
  const r = validateCheck({ ...base, pattern: 'class' }, 'class TODO 请修改', 'class Foo {}');
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /好例/);
});

test('结构缺字段 / kind 非法 / globs 空 → 不合格', () => {
  assert.equal(validateCheck({ id: 'A', globs: ['*'], kind: 'forbid' }, 'b', 'g').ok, false); // 缺 pattern
  assert.equal(validateCheck({ ...base, kind: 'x' }, 'b', 'g').ok, false);
  assert.equal(validateCheck({ ...base, globs: [] }, 'TODO 请修改', 'g').ok, false);
});
