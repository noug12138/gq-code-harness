---
description: 新建一个单文件任务到 .ai/tasks/（status=active）
---
用户要新建任务。参数 `$ARGUMENTS` = 任务名（kebab-case、ASCII）。

请执行：
1. 取今天日期 YYYY-MM-DD 与任务名，组成文件名 `<日期>-<任务名>.md`。
2. 读 `${CLAUDE_PROJECT_DIR}/.ai/templates/task.md` 作模板。
3. 在 `${CLAUDE_PROJECT_DIR}/.ai/tasks/` 下创建该文件（目录不存在先建）：frontmatter `title` 填任务名、`created`/`updated` 填今天、`status: active`。
4. 与用户对齐「目标 / 范围 / 步骤」并填好，**不留模板占位**。
5. 更新 `${CLAUDE_PROJECT_DIR}/.ai/session.md` 指向本任务。
