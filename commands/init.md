---
description: 给项目一键铺底（确定性骨架 + 多 agent 测绘起草，全标待人审）
---
用户要给项目铺 gq-code-harness 底子。参数 `$ARGUMENTS` = 目标项目根（空=当前 `${CLAUDE_PROJECT_DIR}`）。

先定位本插件目录：用 Glob 找 `**/gq-code-harness/**/bin/scaffold.mjs`，取其上两级目录，下文记作 `<PLUGIN>`。

## 1. 铺骨架（确定性，不用 agent）
跑 `node "<PLUGIN>/bin/scaffold.mjs" --project "<目标项目根>"`。它把根 `AGENTS.md` / `CLAUDE.md`、`.ai/`、`docs/` 骨架复制过去，**已存在的文件自动跳过**。把返回的 created/skipped 简报给用户。

## 2. 探测子系统（确定性 + 判断）
用 Glob 找子系统/子仓：`**/package.json`、`**/pom.xml`、形如 `**/yudao-module-*` 的模块目录、`front`/`*-qywx` 等子仓。整理成测绘单元数组 `units = [{name, path, kind}]`（path 用绝对路径）。**合并/取舍到 10–16 个**：太细就按模块或子仓粒度合并，太粗（<3）就拆到模块级。把 units 列给用户看一眼。

## 3. 跑铺底工作流（多 agent 扇出）
读 `<PLUGIN>/workflows/init-bootstrap.mjs` 全文，用 **Workflow 工具**运行：`script` = 该文件内容，`args` = `{ "projectRoot": "<目标项目根>", "units": <上一步的 units> }`。
**降级**：
- 若本环境**没有 Workflow 工具** → 改为派**一个** general-purpose subagent，按工作流里 survey→draft 的思路顺序测绘并落盘草稿（项目小时够用）；
- 若连 subagent 也不便 → **只完成第 1 步骨架**，告诉用户"知识内容待手填/下次再铺"，结束。

## 4. 收尾（主循环，你来）
工作流返回 `{questions, filesWritten, selfCheckRounds}` 后：
- 把 `filesWritten`（草稿，已标"机器起草·待人审"）告诉用户，提示**逐一审阅、改对后去掉待审标记**。
- 把 `questions`（≤7）**一次性问用户**；答案用于订正草稿与补全「待确认」段。
- **不替用户拍板业务规则**；拿不准的留在「待确认」段直到用户确认。
