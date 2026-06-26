#!/usr/bin/env node
import { projectRoot } from '../lib/project.mjs';
import { loadChecks } from '../lib/checks.mjs';
import { scanProject } from '../lib/scan-project.mjs';
import { findStaleTasks } from '../lib/stale-tasks.mjs';
import { isOverridden, consumeOverride } from '../lib/override.mjs';

try {
  const root = projectRoot();
  const checks = loadChecks(root);
  const violations = scanProject(root, checks);
  const stale = findStaleTasks(root).doneNotArchived;
  if (violations.length === 0 && stale.length === 0) process.exit(0);

  const rel = (f) => f.replace(root, '').replace(/^[\\/]/, '').replace(/\\/g, '/');
  const fmt = (v) => `   - [${v.id}] ${rel(v.file)}：${v.reason}`;
  const cap = (arr, n = 20) => (arr.length > n ? arr.slice(0, n).concat([`   … 还有 ${arr.length - n} 处`]) : arr);
  const blockOf = (id) => { const c = checks.find((x) => x && x.id === id); return c && c.block === true; };

  // 代码检查：按 id override（一次盖该 id 全部违反）
  const blockIds = [...new Set(violations.filter((v) => blockOf(v.id)).map((v) => v.id))];
  const stillBlocking = [];
  for (const id of blockIds) {
    if (isOverridden(root, id)) { consumeOverride(root, id); continue; }
    stillBlocking.push(id);
  }
  const blocking = violations.filter((v) => stillBlocking.includes(v.id));

  // 做完没收：任务文件名作 override id，未豁免则拦
  const staleBlocking = [];
  for (const t of stale) {
    if (isOverridden(root, t.file)) { consumeOverride(root, t.file); continue; }
    staleBlocking.push(t);
  }

  if (blocking.length || staleBlocking.length) {
    let msg = '收工检查拦截，请在结束前自行处理：\n';
    if (blocking.length) {
      msg += `[违反硬性检查 ${blocking.length} 处]（修复，或 /gq-code-harness:override <id> "理由"）：\n` +
        cap(blocking.map(fmt)).join('\n') + '\n';
    }
    if (staleBlocking.length) {
      msg += `[做完没收 ${staleBlocking.length} 个]——以下任务步骤已全勾但 status 仍 active，请逐个执行 /gq-code-harness:archive <文件名> 收口（翻 status=done）；若实为未完成补一条未勾步骤；确属待外部验收由用户 /gq-code-harness:override <文件名> "理由"：\n` +
        cap(staleBlocking.map((t) => `   - ${t.title}（${t.file}）`)).join('\n');
    }
    process.stderr.write(msg);
    process.exit(2);
  }

  if (violations.length) {
    process.stdout.write(JSON.stringify({
      systemMessage: `收工检查：发现 ${violations.length} 处违反（仅提示，未拦）：\n` + cap(violations.map(fmt)).join('\n')
    }));
  }
  process.exit(0);
} catch {
  process.exit(0); // fail-open
}
