#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
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

function normalizePath(p) {
  return String(p || '').replace(/\\/g, '/');
}

function absPath(root, filePath) {
  if (!filePath) return filePath;
  return isAbsolute(filePath) ? filePath : join(root, filePath);
}

function splitLines(content) {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function findSeq(lines, seq, start) {
  if (seq.length === 0) return start;
  outer:
  for (let i = start; i <= lines.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) {
      if (lines[i + j] !== seq[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function applyUpdatePatch(root, filePath, sectionLines) {
  const fullPath = absPath(root, filePath);
  if (!existsSync(fullPath)) return null;

  const original = splitLines(readFileSync(fullPath, 'utf8'));
  const result = [];
  let cursor = 0;
  let hunk = null;
  const hunks = [];

  for (const line of sectionLines) {
    if (line.startsWith('*** Move to: ')) continue;
    if (line.startsWith('@@')) {
      hunk = [];
      hunks.push(hunk);
      continue;
    }
    if (!hunk) continue;
    if (line === '*** End of File') continue;
    if (/^[ +\-]/.test(line)) hunk.push(line);
  }

  if (hunks.length === 0) return null;

  for (const h of hunks) {
    const oldLines = [];
    const newLines = [];
    for (const line of h) {
      const body = line.slice(1);
      if (line[0] === ' ' || line[0] === '-') oldLines.push(body);
      if (line[0] === ' ' || line[0] === '+') newLines.push(body);
    }

    const at = findSeq(original, oldLines, cursor);
    if (at < 0) return null;
    result.push(...original.slice(cursor, at));
    result.push(...newLines);
    cursor = at + oldLines.length;
  }

  result.push(...original.slice(cursor));
  return result.join('\n');
}

function addedLines(sectionLines) {
  return sectionLines
    .filter((line) => line.startsWith('+'))
    .map((line) => line.slice(1))
    .join('\n');
}

function applyPatchTargets(root, command) {
  const lines = String(command || '').replace(/\r\n/g, '\n').split('\n');
  const targets = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const add = line.match(/^\*\*\* Add File: (.+)$/);
    const update = line.match(/^\*\*\* Update File: (.+)$/);
    const del = line.match(/^\*\*\* Delete File: (.+)$/);
    if (!add && !update && !del) { i++; continue; }

    const kind = add ? 'add' : update ? 'update' : 'delete';
    const filePath = (add || update || del)[1].trim();
    const section = [];
    i++;
    while (i < lines.length && !/^\*\*\* (Add|Update|Delete) File: /.test(lines[i]) && lines[i] !== '*** End Patch') {
      section.push(lines[i]);
      i++;
    }

    if (kind === 'delete') continue;
    if (kind === 'add') {
      targets.push({ filePath, content: addedLines(section), fullContent: true });
      continue;
    }

    const moveTo = section.find((l) => l.startsWith('*** Move to: '));
    const targetPath = moveTo ? moveTo.slice('*** Move to: '.length).trim() : filePath;
    const patched = applyUpdatePatch(root, filePath, section);
    if (patched == null) targets.push({ filePath: targetPath, content: addedLines(section), fullContent: false });
    else targets.push({ filePath: targetPath, content: patched, fullContent: true });
  }

  return targets;
}

function shellWriteTargets(command) {
  const s = String(command || '');
  const out = [];
  for (const m of s.matchAll(/(?:^|[^>])>{1,2}\s*["']?([^"'\s|;&]+)["']?/g)) {
    if (m[1]) out.push(m[1]);
  }
  for (const m of s.matchAll(/\b(?:Set-Content|Add-Content|Out-File)\b[\s\S]*?(?:-LiteralPath|-Path|--path)?\s*["']([^"']+)["']/gi)) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function checkTarget(root, checks, target) {
  for (const c of checks) {
    if (!c || !matchGlobs(normalizePath(target.filePath), c.globs)) continue;
    if (target.fullContent === false && c.kind === 'require') continue;
    if (!runCheck(c, target.content).violated) continue;
    if (isOverridden(root, c.id)) { consumeOverride(root, c.id); continue; }
    return `[${c.id}] ${c.reason || '违反检查'} —— 要放行：/gq-code-harness:override ${c.id} "理由"`;
  }
  return null;
}

try {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch {}
  if (!raw.trim()) allow();

  const input = JSON.parse(raw);
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  const root = projectRoot();
  const checks = loadChecks(root);

  if (tool === 'Write') {
    if (!ti.file_path || ti.content == null) allow();
    const reason = checkTarget(root, checks, { filePath: ti.file_path, content: ti.content, fullContent: true });
    if (reason) deny(reason);
    allow();
  }

  if (tool === 'Edit') {
    if (!ti.file_path || ti.new_string == null) allow(); // 空串 "" 仍进检查（require 视空内容为违反，符合预期）
    const reason = checkTarget(root, checks, { filePath: ti.file_path, content: ti.new_string, fullContent: true });
    if (reason) deny(reason);
    allow();
  }

  if (tool === 'apply_patch') {
    for (const target of applyPatchTargets(root, ti.command)) {
      const reason = checkTarget(root, checks, target);
      if (reason) deny(reason);
    }
    allow();
  }

  if (tool === 'Bash') {
    for (const filePath of shellWriteTargets(ti.command)) {
      if (checks.some((c) => c && matchGlobs(normalizePath(filePath), c.globs))) {
        deny(`gq-code-harness 无法可靠检查 shell 写入 ${filePath} 的最终内容；请改用 apply_patch/Write 让 PreToolUse 检查先审内容。`);
      }
    }
    allow();
  }

  allow();
} catch {
  allow(); // fail-open：引擎自身出错绝不拦
}
