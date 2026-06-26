import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// 取 frontmatter（首个 --- ... --- 块）里的 status 值；无则 null
function readStatus(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const s = m[1].match(/^status:\s*(\S+)/m);
  return s ? s[1] : null;
}

// 取 frontmatter 里的 title；无则回退文件名
function readTitle(text, fallback) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (m) { const t = m[1].match(/^title:\s*(.+)$/m); if (t) return t[1].trim(); }
  return fallback;
}

// 统计 GFM 清单：返回 { total, unchecked }
function countSteps(text) {
  const checked = (text.match(/^[ \t]*- \[x\]/gim) || []).length;
  const unchecked = (text.match(/^[ \t]*- \[ \]/gim) || []).length;
  return { total: checked + unchecked, unchecked };
}

// 扫 .ai/tasks/*.md：返回 { activeCount, doneNotArchived: [{file,title,total}] }
// doneNotArchived = status:active 且有 checkbox 且 0 个未勾（做完没收）
export function findStaleTasks(root) {
  const dir = join(root, '.ai', 'tasks');
  const result = { activeCount: 0, doneNotArchived: [] };
  if (!existsSync(dir)) return result;
  let names;
  try { names = readdirSync(dir); } catch { return result; }
  for (const name of names) {
    if (!name.endsWith('.md') || name === 'index.md') continue;
    let text;
    try { text = readFileSync(join(dir, name), 'utf8'); } catch { continue; }
    if (readStatus(text) !== 'active') continue;
    result.activeCount++;
    const { total, unchecked } = countSteps(text);
    if (total > 0 && unchecked === 0) {
      result.doneNotArchived.push({ file: name, title: readTitle(text, name), total });
    }
  }
  return result;
}
