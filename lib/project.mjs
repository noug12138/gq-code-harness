// 返回被检查项目的根目录：插件 hook 运行时 Claude Code 注入 CLAUDE_PROJECT_DIR。
export function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
