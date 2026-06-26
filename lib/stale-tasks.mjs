import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// 解析 frontmatter（首个 --- ... --- 块）：一次性返回 { status, title }
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { status: null, title: null };
  const block = m[1];
  const s = block.match(/^status:\s*(\S+)/m);
  const t = block.match(/^title:\s*(.+)$/m);
  return { status: s ? s[1] : null, title: t ? t[1].trim() : null };
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
    if (!name.endsWith('.md') || name.toLowerCase() === 'index.md') continue;
    let text;
    try { text = readFileSync(join(dir, name), 'utf8'); } catch { continue; }
    const fm = parseFrontmatter(text);
    if (fm.status !== 'active') continue;
    result.activeCount++;
    const { total, unchecked } = countSteps(text);
    if (total > 0 && unchecked === 0) {
      result.doneNotArchived.push({ file: name, title: fm.title || name, total });
    }
  }
  return result;
}
