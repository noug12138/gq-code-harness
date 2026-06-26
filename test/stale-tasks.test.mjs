import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findStaleTasks } from '../lib/stale-tasks.mjs';

function root() {
  const r = mkdtempSync(join(tmpdir(), 'st-'));
  mkdirSync(join(r, '.ai', 'tasks'), { recursive: true });
  return r;
}
function task(r, name, body) { writeFileSync(join(r, '.ai', 'tasks', name), body); }

test('无 tasks 目录 → 空结果', () => {
  const r = mkdtempSync(join(tmpdir(), 'st-'));
  const out = findStaleTasks(r);
  assert.equal(out.activeCount, 0);
  assert.equal(out.doneNotArchived.length, 0);
});

test('active 且 checklist 全勾 → 报做完没收', () => {
  const r = root();
  task(r, '2026-06-26-a.md', '---\nstatus: active\ntitle: 任务A\n---\n## 步骤\n- [x] 一\n- [x] 二\n');
  const out = findStaleTasks(r);
  assert.equal(out.activeCount, 1);
  assert.equal(out.doneNotArchived.length, 1);
  assert.equal(out.doneNotArchived[0].title, '任务A');
});

test('active 但有未勾 → 不报', () => {
  const r = root();
  task(r, '2026-06-26-b.md', '---\nstatus: active\ntitle: B\n---\n## 步骤\n- [x] 一\n- [ ] 二\n');
  const out = findStaleTasks(r);
  assert.equal(out.activeCount, 1);
  assert.equal(out.doneNotArchived.length, 0);
});

test('done → 不计 active、不报', () => {
  const r = root();
  task(r, '2026-06-26-c.md', '---\nstatus: done\ntitle: C\n---\n- [x] 一\n');
  const out = findStaleTasks(r);
  assert.equal(out.activeCount, 0);
  assert.equal(out.doneNotArchived.length, 0);
});

test('无 checkbox 的 active → 不报（没法判定做完）', () => {
  const r = root();
  task(r, '2026-06-26-d.md', '---\nstatus: active\ntitle: D\n---\n纯文字没有清单\n');
  const out = findStaleTasks(r);
  assert.equal(out.doneNotArchived.length, 0);
});

test('index.md 跳过', () => {
  const r = root();
  task(r, 'index.md', '# 索引\n- [x] x\n');
  const out = findStaleTasks(r);
  assert.equal(out.activeCount, 0);
});

test('多 active 文件混合 → activeCount 累加、只报全勾的', () => {
  const r = root();
  task(r, '2026-06-26-e.md', '---\nstatus: active\ntitle: 全勾E\n---\n## 步骤\n- [x] 一\n');
  task(r, '2026-06-26-f.md', '---\nstatus: active\ntitle: 半勾F\n---\n## 步骤\n- [x] 一\n- [ ] 二\n');
  const out = findStaleTasks(r);
  assert.equal(out.activeCount, 2);
  assert.equal(out.doneNotArchived.length, 1);
  assert.equal(out.doneNotArchived[0].title, '全勾E');
});

test('真实模板：步骤全勾 + 收尾沉淀未勾 → 仍报做完没收', () => {
  const r = root();
  task(r, '2026-06-26-tmpl.md',
    '---\nstatus: active\ntitle: 模板形\n---\n' +
    '## 步骤\n- [x] 一\n- [x] 二\n\n' +
    '## 收尾沉淀（done 前必跑）\n- [ ] 模块结构 → docs/architecture/\n- [ ] 业务规则 → docs/product/\n');
  const out = findStaleTasks(r);
  assert.equal(out.doneNotArchived.length, 1);
  assert.equal(out.doneNotArchived[0].title, '模板形');
});
