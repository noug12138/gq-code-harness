#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { projectRoot } from '../lib/project.mjs';
import { collectMarkdown, findDeadLinks } from '../lib/deadlinks.mjs';

const root = projectRoot();
const files = collectMarkdown([join(root, 'docs'), join(root, '.ai')]);
const errors = findDeadLinks(files, root);

const d = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const status = errors.length ? `发现 ${errors.length} 个死链` : '文档一致性全部通过';
let body = `[${stamp}] doctor @ Stop\n结果：${status}`;
if (errors.length) body += '\n\n[X] 死链 (' + errors.length + '):\n' + errors.map((e) => '   - ' + e).join('\n');
try {
  const claudeDir = join(root, '.claude');
  if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });
  writeFileSync(join(claudeDir, 'doctor-last-run.txt'), body);
} catch {}

if (errors.length) {
  process.stdout.write(JSON.stringify({ systemMessage: 'doctor 文档一致性检查\n' + body }));
}
process.exit(0);
