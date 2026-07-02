import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadChecks } from './checks.mjs';

function storePath(root) { return join(root, 'docs', 'harness', 'checks.json'); }

// 追加一条 check；id 重复或文件损坏则拒绝（绝不覆盖可手工修复的内容）。返回 {ok, id, count} | {ok:false, error}
export function addCheck(root, check) {
  const p = storePath(root);
  if (existsSync(p)) {
    let parsed;
    try { parsed = JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); }
    catch { return { ok: false, error: `checks.json 存在但无法解析，已拒绝写入以防覆盖：${p}` }; }
    if (!Array.isArray(parsed)) return { ok: false, error: `checks.json 内容不是数组，已拒绝写入以防覆盖：${p}` };
  }
  const existing = loadChecks(root);
  if (existing.some((c) => c && c.id === check.id)) {
    return { ok: false, error: `检查 id 已存在：${check.id}` };
  }
  const next = existing.concat([check]);
  if (!existsSync(dirname(p))) mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(next, null, 2) + '\n');
  return { ok: true, id: check.id, count: next.length };
}
