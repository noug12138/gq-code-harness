import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

// 注：best-effort——已跳过 ``` / ~~~ 代码块内的示例链接；但仍不处理带 title `[x](p "t")` 或尖括号 `[x](<p>)` 的形式（会跳过）。
const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

// 去掉 ``` 和 ~~~ 围栏代码块，避免把示例链接当真链接
function stripCodeFences(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
}

// 收集 dirs 下全部 .md 文件
export function collectMarkdown(dirs) {
  const acc = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.md')) acc.push(p);
    }
  };
  dirs.forEach(walk);
  return acc;
}

// 返回死链错误信息数组（相对 root 展示）
export function findDeadLinks(files, root) {
  const errors = [];
  for (const file of files) {
    const text = stripCodeFences(readFileSync(file, 'utf8'));
    let m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(text))) {
      let target = m[1].trim();
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      target = target.split('#')[0];
      if (!target) continue;
      if (/[<>"|?*]/.test(target) || /&lt;|&gt;/.test(target)) continue; // 模板占位符
      if (!existsSync(resolve(dirname(file), target))) {
        const rel = file.replace(root, '').replace(/^[\\/]/, '').replace(/\\/g, '/');
        errors.push(`死链: ${rel} -> ${target}`);
      }
    }
  }
  return errors;
}
