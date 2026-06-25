#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { projectRoot } from '../lib/project.mjs';
import { loadChecks, matchGlobs, runCheck } from '../lib/checks.mjs';
import { isOverridden, consumeOverride } from '../lib/override.mjs';

function allow() { process.exit(0); }
function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason }
  }));
  process.exit(0);
}

try {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch {}
  if (!raw.trim()) allow();

  const input = JSON.parse(raw);
  const tool = input.tool_name;
  const ti = input.tool_input || {};

  let filePath, content;
  if (tool === 'Write') { filePath = ti.file_path; content = ti.content; }
  else if (tool === 'Edit') { filePath = ti.file_path; content = ti.new_string; }
  else allow();
  if (!filePath || content == null) allow(); // 仅缺字段(null/undefined)放行；空串 "" 仍进检查（require 视空内容为违反，符合预期）

  const root = projectRoot();
  for (const c of loadChecks(root)) {
    if (!c || !matchGlobs(filePath, c.globs)) continue;
    if (!runCheck(c, content).violated) continue;
    if (isOverridden(root, c.id)) { consumeOverride(root, c.id); continue; }
    deny(`[${c.id}] ${c.reason || '违反检查'} —— 要放行：/gq-code-harness:override ${c.id} "理由"`);
  }
  allow();
} catch {
  allow(); // fail-open：引擎自身出错绝不拦
}
