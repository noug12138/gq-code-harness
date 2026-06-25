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
  const blockOf = (id) => { const c = checks.find((x) => x && x.id === id); return c && c.block === true; };

  const blocking = [];
  for (const v of violations) {
    if (!blockOf(v.id)) continue;
    if (isOverridden(root, v.id)) { consumeOverride(root, v.id); continue; }
    blocking.push(v);
  }

  if (blocking.length) {
    process.stderr.write(
      `收工检查拦截：${blocking.length} 处违反硬性检查，先处理或 /gq-code-harness:override <id> "理由"：\n` +
      blocking.map(fmt).join('\n')
    );
    process.exit(2); // 阻断收工（最多 8 次后放行）
  }
  process.stdout.write(JSON.stringify({
    systemMessage: `收工检查：发现 ${violations.length} 处违反（仅提示，未拦）：\n` + violations.map(fmt).join('\n')
  }));
  process.exit(0);
} catch {
  process.exit(0); // fail-open：扫描自身出错绝不拦收工
}
