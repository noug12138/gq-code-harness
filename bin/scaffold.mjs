#!/usr/bin/env node
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffold } from '../lib/scaffold.mjs';

const args = process.argv.slice(2);
const get = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const target = get('--project') || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
try {
  process.stdout.write(JSON.stringify(scaffold(target, assetsDir)));
} catch (e) {
  process.stderr.write('scaffold 失败：' + (e && e.message) + '\n');
  process.exit(1);
}
