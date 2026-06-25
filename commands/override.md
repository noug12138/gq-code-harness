---
description: 临时放行一条被引擎拦下的检查（只有你能运行；留痕；下次该检查触发时消耗一次）
---
用户要求临时放行被 gq-code-harness 引擎拦下的某条检查。参数：`$ARGUMENTS`（第一个词是检查 id，其余是理由）。

请执行：
1. 从 `$ARGUMENTS` 解析出检查 id 与理由。
2. 读取 `${CLAUDE_PROJECT_DIR}/.ai/.harness-override.json`（不存在则当作 `{"ids":[],"consumed":[],"log":[]}`）。
3. 把该 id 加入 `ids`（去重）；向 `log` 追加 `{id, reason, at}`（at 用当前时间）。
4. 写回该文件（若 `.ai` 目录不存在先建）。
5. 回复用户：已放行检查 <id> 一次，下次它触发会自动消耗这次放行。
