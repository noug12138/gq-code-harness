#!/usr/bin/env node
import { projectRoot } from '../lib/project.mjs';
import { loadChecks } from '../lib/checks.mjs';
import { scanProject } from '../lib/scan-project.mjs';
import { isOverridden, consumeOverride } from '../lib/override.mjs';

try {
  const root = projectRoot();
  const checks = loadChecks(root);
  const violations = scanProject(root, checks);
  if (violations.length === 0) process.exit(0);

  const rel = (f) => f.replace(root, '').replace(/^[\\/]/, '').replace(/\\/g, '/');
  const fmt = (v) => `   - [${v.id}] ${rel(v.file)}：${v.reason}`;
  const cap = (arr, n = 20) => (arr.length > n ? arr.slice(0, n).concat([`   … 还有 ${arr.length - n} 处`]) : arr);
  const blockOf = (id) => { const c = checks.find((x) => x && x.id === id); return c && c.block === true; };

  // 按检查 id（不是单个违反）决定拦/放：一个 id 的 override 一次盖住它的全部违反
  const blockIds = [...new Set(violations.filter((v) => blockOf(v.id)).map((v) => v.id))];
  const stillBlocking = [];
  for (const id of blockIds) {
    if (isOverridden(root, id)) { consumeOverride(root, id); continue; }
    stillBlocking.push(id);
  }
  const blocking = violations.filter((v) => stillBlocking.includes(v.id));

  if (blocking.length) {
    process.stderr.write(
      `收工检查拦截：${blocking.length} 处违反硬性检查，先处理或 /gq-code-harness:override <id> "理由"：\n` +
      cap(blocking.map(fmt)).join('\n')
    );
    process.exit(2);
  }
  process.stdout.write(JSON.stringify({
    systemMessage: `收工检查：发现 ${violations.length} 处违反（仅提示，未拦）：\n` + cap(violations.map(fmt)).join('\n')
  }));
  process.exit(0);
} catch {
  process.exit(0); // fail-open
}
