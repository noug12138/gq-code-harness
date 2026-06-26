#!/usr/bin/env node
import { projectRoot } from '../lib/project.mjs';
import { regenerateAll } from '../lib/gen-index.mjs';
try {
  const root = projectRoot();
  const changed = regenerateAll(root);
  if (changed.length) {
    const rel = changed.map((f) => f.replace(root, '').replace(/^[\\/]/, '').replace(/\\/g, '/'));
    process.stdout.write(JSON.stringify({ systemMessage: '已自动重算索引：\n' + rel.map((r) => '   - ' + r).join('\n') }));
  }
} catch { /* fail-open */ }
process.exit(0);
