import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadChecks } from './checks.mjs';

function storePath(root) { return join(root, 'docs', 'harness', 'checks.json'); }

// 追加一条 check；id 重复则拒绝。返回 {ok, id, count} | {ok:false, error}
export function addCheck(root, check) {
  const existing = loadChecks(root);
  if (existing.some((c) => c && c.id === check.id)) {
    return { ok: false, error: `检查 id 已存在：${check.id}` };
  }
  const next = existing.concat([check]);
  const p = storePath(root);
  if (!existsSync(dirname(p))) mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(next, null, 2) + '\n');
  return { ok: true, id: check.id, count: next.length };
}
