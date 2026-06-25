import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { matchGlobs, runCheck } from './checks.mjs';

const IGNORE = new Set(['node_modules', '.git', 'target', 'dist', 'build', '.next', 'out', '.idea', 'coverage', '.gradle']);
const MAX_BYTES = 512 * 1024; // 跳过过大/二进制文件，避免 catch-all glob 撑爆时间/内存

// 遍历 root，对匹配某检查 globs 的文件跑该检查；每文件只读一次。返回 [{id, file, reason}]
export function scanProject(root, checks) {
  const violations = [];
  if (!Array.isArray(checks) || checks.length === 0) return violations;

  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (IGNORE.has(e.name) || e.name.startsWith('.tmp')) continue;
        walk(join(dir, e.name));
        continue;
      }
      const full = join(dir, e.name);
      const matched = checks.filter((c) => c && matchGlobs(full, c.globs));
      if (matched.length === 0) continue;
      try { if (statSync(full).size > MAX_BYTES) continue; } catch { continue; }
      let content;
      try { content = readFileSync(full, 'utf8'); } catch { continue; }
      for (const c of matched) {
        if (runCheck(c, content).violated) violations.push({ id: c.id, file: full, reason: c.reason });
      }
    }
  };
  walk(root);
  return violations;
}
