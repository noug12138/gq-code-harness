import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { matchGlobs, runCheck } from './checks.mjs';

const IGNORE = new Set(['node_modules', '.git', 'target', 'dist', 'build', '.next', 'out', '.idea', 'coverage', '.gradle']);

// 遍历 root，对匹配某检查 globs 的文件跑该检查；返回 [{id, file, reason}]
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
      for (const c of checks) {
        if (!c || !matchGlobs(full, c.globs)) continue;
        let content;
        try { content = readFileSync(full, 'utf8'); } catch { continue; }
        if (runCheck(c, content).violated) violations.push({ id: c.id, file: full, reason: c.reason });
      }
    }
  };
  walk(root);
  return violations;
}
