import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// 把 assetsDir 下的骨架递归复制到 targetRoot；已存在的文件跳过（不覆盖）。返回 {created:[], skipped:[]}
export function scaffold(targetRoot, assetsDir) {
  const created = [], skipped = [];
  const walk = (rel) => {
    const src = rel ? join(assetsDir, rel) : assetsDir;
    for (const name of readdirSync(src)) {
      const childRel = rel ? join(rel, name) : name;
      if (statSync(join(assetsDir, childRel)).isDirectory()) { walk(childRel); continue; }
      const dest = join(targetRoot, childRel);
      if (existsSync(dest)) { skipped.push(childRel); continue; }
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(assetsDir, childRel), dest);
      created.push(childRel);
    }
  };
  walk('');
  return { created, skipped };
}
