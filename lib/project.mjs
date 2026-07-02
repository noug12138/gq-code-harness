// 返回被检查项目的根目录：Claude Code 注入 CLAUDE_PROJECT_DIR；Codex hook 以会话 cwd 运行。
export function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.env.CODEX_PROJECT_DIR || process.cwd();
}
