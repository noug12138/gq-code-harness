#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateCheck } from '../lib/validate-check.mjs';
import { addCheck } from '../lib/checks-store.mjs';

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const root = get('--project') || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const doAdd = args.includes('--add');
const out = (o) => process.stdout.write(JSON.stringify(o));

try {
  const { check, bad, good } = JSON.parse(readFileSync(0, 'utf8'));
  const v = validateCheck(check, bad, good);
  if (!v.ok) { out({ ok: false, errors: v.errors }); process.exit(1); }
  if (doAdd) { const r = addCheck(root, check); out(r); process.exit(r.ok ? 0 : 1); }
  out({ ok: true });
} catch (e) {
  out({ ok: false, errors: ['输入解析失败：' + (e && e.message)] });
  process.exit(1);
}
