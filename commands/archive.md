---
description: 归档任务（翻 status 字段，文件不搬目录）；归档前先跑沉淀扫描
---
用户或收工阻断闸要归档任务。参数 `$ARGUMENTS` = 任务文件名或任务名（空则问用户是哪个）。

请执行：
1. 在 `${CLAUDE_PROJECT_DIR}/.ai/tasks/` 定位目标任务文件。
2. **先沉淀扫描**：按文件「收尾沉淀」段逐条判断，命中的提炼进 docs/ 并在 frontmatter `distilled_to` 填路径（可走 /gq-code-harness:distill）。
3. 定 `done` 还是 `cancelled`：
   - **步骤已全勾、无未尽事项 → 默认 `done`**（被收工阻断闸驱动的自维护场景不必追问用户）：`status` 改 `done`、`updated` 改今天。
   - 明确要作废 → `cancelled`：`status` 改 `cancelled`、`cancel_reason` 填一句原因。
   - 仅当不确定（步骤没全勾却要归档，或拿不准 done/cancel）才问用户。
4. **文件原地不动**，不要搬目录。
5. 清空或更新 `${CLAUDE_PROJECT_DIR}/.ai/session.md`。
