import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// glob → 正则：** 跨目录、* 单层；用于匹配文件路径
export function globToRegex(glob) {
  let g = String(glob).replace(/\\/g, '/');
  g = g.replace(/[.+^${}()|[\]]/g, '\\$&'); // 转义正则特殊字符（保留 * /）
  // 先把多字符通配符替换成占位符，避免后续单层 * 替换破坏已生成的正则片段
  g = g.replace(/\*\*\//g, '\x00');         // **/ → 任意层级前缀（含零层）
  g = g.replace(/\*\*/g, '\x01');           // 余下 ** → 任意
  g = g.replace(/\*/g, '[^/]*');            // 单层 *
  g = g.replace(/\x00/g, '(?:.*/)?');
  g = g.replace(/\x01/g, '.*');
  return new RegExp('^' + g + '$');
}

export function matchGlobs(filePath, globs) {
  const p = String(filePath).replace(/\\/g, '/');
  return (globs || []).some((g) => globToRegex(g).test(p));
}

// 返回 { violated:boolean, reason }
export function runCheck(check, content) {
  let re;
  try { re = new RegExp(check.pattern, 'm'); } catch { return { violated: false }; }
  const found = re.test(String(content));
  if (check.kind === 'forbid') return { violated: found, reason: check.reason };
  if (check.kind === 'require') return { violated: !found, reason: check.reason };
  return { violated: false };
}

export function loadChecks(root) {
  const p = join(root, 'docs', 'harness', 'checks.json');
  if (!existsSync(p)) return [];
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
