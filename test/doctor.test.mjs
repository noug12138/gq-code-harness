import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('../hooks/doctor.mjs', import.meta.url));
const run = (root) => execFileSync('node', [hook], { env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: 'utf8' });

test('有死链 → systemMessage 报出，且写 heartbeat', () => {
  const root = mkdtempSync(join(tmpdir(), 'doc-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, '.claude'), { recursive: true });
  writeFileSync(join(root, 'docs', 'a.md'), '[挂](./nope.md)');
  const out = run(root);
  assert.match(JSON.parse(out).systemMessage, /死链/);
  assert.ok(existsSync(join(root, '.claude', 'doctor-last-run.txt')));
  assert.match(readFileSync(join(root, '.claude', 'doctor-last-run.txt'), 'utf8'), /死链/);
});

test('无死链 → 空输出 + heartbeat 写"通过"', () => {
  const root = mkdtempSync(join(tmpdir(), 'doc-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, '.claude'), { recursive: true });
  writeFileSync(join(root, 'docs', 'a.md'), '没有链接');
  const out = run(root);
  assert.equal(out.trim(), '');
  assert.match(readFileSync(join(root, '.claude', 'doctor-last-run.txt'), 'utf8'), /全部通过/);
});
