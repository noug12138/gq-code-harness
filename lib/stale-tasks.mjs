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

// 只统计 "## 步骤" 段内的勾选框（到下一个 "## " 标题止）；
// 「收尾沉淀」等其它清单的勾选框不计入——它们在归档时才勾，不代表工作是否做完。
function countSteps(text) {
  const lines = text.split(/\r?\n/);
  let inSteps = false, checked = 0, unchecked = 0;
  for (const line of lines) {
    if (/^##\s/.test(line)) { inSteps = /^##\s+步骤/.test(line); continue; }
    if (!inSteps) continue;
    if (/^[ \t]*- \[x\]/i.test(line)) checked++;
    else if (/^[ \t]*- \[ \]/.test(line)) unchecked++;
  }
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
