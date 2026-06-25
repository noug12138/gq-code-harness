import { runCheck } from './checks.mjs';

// 校验一条 check：结构合法 + 坏例必违反 + 好例必不违反。返回 {ok, errors[]}
export function validateCheck(check, badExample, goodExample) {
  const errors = [];
  if (!check || typeof check !== 'object') return { ok: false, errors: ['check 不是对象'] };
  for (const f of ['id', 'pattern', 'reason']) if (!check[f]) errors.push(`缺字段：${f}`);
  if (!['forbid', 'require'].includes(check.kind)) errors.push(`kind 必须是 forbid 或 require（当前：${check.kind}）`);
  if (!Array.isArray(check.globs) || check.globs.length === 0) errors.push('globs 必须是非空数组');
  if (errors.length) return { ok: false, errors };

  if (!runCheck(check, String(badExample)).violated) errors.push('坏例没被抓住（检查太松 / pattern 不匹配坏例）');
  if (runCheck(check, String(goodExample)).violated) errors.push('好例被误伤（检查太严 / pattern 命中了正常内容）');
  return { ok: errors.length === 0, errors };
}
