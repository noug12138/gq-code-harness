#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { projectRoot } from '../lib/project.mjs';

const root = projectRoot();
const sessionPath = join(root, '.ai', 'session.md');
if (!existsSync(sessionPath)) process.exit(0);

const session = readFileSync(sessionPath, 'utf8');
if (!session.trim()) process.exit(0);

let injected =
  '以下是上次会话留下的任务状态（.ai/session.md）。若与你当前任务相关，可据此快速接上进度；若无关，忽略本段即可。\n\n' +
  session;

const reportPath = join(root, '.claude', 'doctor-last-run.txt');
if (existsSync(reportPath)) {
  const report = readFileSync(reportPath, 'utf8');
  if (report.trim()) {
    injected +=
      '\n\n---\n以下是上次会话结束时 doctor（文档一致性检查）的结果。若有问题请优先帮我处理；若已解决或无关，忽略即可。\n\n' +
      report;
  }
}

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: injected }
}));
process.exit(0);
