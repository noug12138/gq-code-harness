import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const START = /<!--\s*gq-index:start\s+kind=(\w+)\s*-->/;
const BLOCK = /<!--\s*gq-index:start\s+kind=(\w+)\s*-->[\s\S]*?<!--\s*gq-index:end\s*-->/g;

// 从 .md 文本取 title / description / status；title 回退首个 # 标题，再回退文件名
function meta(text, fallback) {
  let title = null, description = null, status = null;
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm) {
    const t = fm[1].match(/^title:\s*(.+)$/m); if (t) title = t[1].trim();
    const d = fm[1].match(/^description:\s*(.+)$/m); if (d) description = d[1].trim();
    const s = fm[1].match(/^status:\s*(\S+)/m); if (s) status = s[1];
  }
  if (!title) { const h = text.match(/^#\s+(.+)$/m); if (h) title = h[1].trim(); }
  return { title: title || fallback, description, status };
}

function siblings(dir) {
  let names;
  try { names = readdirSync(dir); } catch { return []; }
  return names
    .filter((n) => n.endsWith('.md') && n.toLowerCase() !== 'index.md')
    .sort()
    .map((n) => { let text = ''; try { text = readFileSync(join(dir, n), 'utf8'); } catch {} return { file: n, ...meta(text, n) }; });
}

function renderDocs(dir) {
  const items = siblings(dir);
  if (!items.length) return '（暂无）';
  return items.map((it) => `- [${it.title}](${it.file})${it.description ? ' — ' + it.description : ''}`).join('\n');
}

function renderTasks(dir) {
  const items = siblings(dir);
  const groups = { active: [], done: [], cancelled: [] };
  for (const it of items) { (groups[it.status] || (groups[it.status] = [])).push(it); }
  const sec = (label, arr) => arr.length ? `**${label}（${arr.length}）**\n` + arr.map((it) => `- [${it.title}](${it.file})`).join('\n') : '';
  const parts = [sec('进行中', groups.active), sec('已完成', groups.done), sec('已取消', groups.cancelled)].filter(Boolean);
  return parts.length ? parts.join('\n\n') : '（暂无任务）';
}

const RENDER = { docs: renderDocs, tasks: renderTasks };

// 重写 text 里所有 marker 块（按 kind 用 dir 的兄弟文件重算）；marker 外内容不动
export function regenerate(text, dir) {
  return text.replace(BLOCK, (_m, kind) => {
    const render = RENDER[kind] || RENDER.docs;
    return `<!-- gq-index:start kind=${kind} -->\n${render(dir)}\n<!-- gq-index:end -->`;
  });
}

export function regenerateFile(indexPath) {
  let text;
  try { text = readFileSync(indexPath, 'utf8'); } catch { return { file: indexPath, changed: false }; }
  const out = regenerate(text, dirname(indexPath));
  if (out === text) return { file: indexPath, changed: false };
  try { writeFileSync(indexPath, out); return { file: indexPath, changed: true }; } catch { return { file: indexPath, changed: false }; }
}

// 扫 root 下 docs/ 与 .ai/ 里"带 marker 的 index.md"，逐个重算；返回改动的绝对路径数组
export function regenerateAll(root) {
  const changed = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.tmp') || e.name === 'node_modules' || e.name === '.git') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (e.name.toLowerCase() === 'index.md') {
        let text = ''; try { text = readFileSync(full, 'utf8'); } catch {}
        if (START.test(text)) { const r = regenerateFile(full); if (r.changed) changed.push(full); }
      }
    }
  };
  for (const top of ['docs', '.ai']) { const d = join(root, top); if (existsSync(d)) walk(d); }
  return changed;
}
