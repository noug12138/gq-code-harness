import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function ovPath(root) { return join(root, '.ai', '.harness-override.json'); }

export function isOverridden(root, id) {
  const p = ovPath(root);
  if (!existsSync(p)) return false;
  try {
    const o = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(o.ids) && o.ids.includes(id);
  } catch { return false; }
}

// 消耗一次放行：从 ids 移除，并把消耗事件追加到 log[]（留痕，与 grant 事件共用 log）
export function consumeOverride(root, id) {
  const p = ovPath(root);
  if (!existsSync(p)) return;
  try {
    const o = JSON.parse(readFileSync(p, 'utf8'));
    o.ids = (Array.isArray(o.ids) ? o.ids : []).filter((x) => x !== id);
    o.log = Array.isArray(o.log) ? o.log : [];
    o.log.push({ id, at: new Date().toISOString(), action: 'consume' });
    writeFileSync(p, JSON.stringify(o, null, 2));
  } catch { /* fail-open */ }
}
