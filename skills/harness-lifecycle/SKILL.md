---
name: harness-lifecycle
description: gq-code-harness 任务生命周期方法论——单文件任务 + status 字段的建/做/归档/沉淀全流程。在 .ai/tasks/ 下开展任务，或被 new-task/archive/distill 命令调用时使用。
---

# 任务生命周期（单文件 + status）

`.ai/tasks/` 一个任务一个文件；**状态是 frontmatter 字段，不是目录**。

## 建
- `/gq-code-harness:new-task <name>` → 从 `.ai/templates/task.md` 生成 `.ai/tasks/YYYY-MM-DD-<name>.md`，`status: active`。
- 先与用户对齐「目标 / 范围 / 步骤」再落笔，不留占位。
- 更新 `.ai/session.md` 指向本任务。

## 做
- 勾步骤 checklist；决策 / 踩坑 / 偏离写进**同一文件**「过程」段（不再另开 log）。
- 关键上下文变化时同步 `.ai/session.md`。

## 归档（翻字段，不搬目录）
- `/gq-code-harness:archive` → **先沉淀扫描**，再把 `status` 翻成 `done` / `cancelled`，**文件原地不动**。
- 步骤全勾、无未尽事项 → 默认 `done`，不必追问；cancelled 必填 `cancel_reason`。

## 沉淀（黄金法则：长期结论必须进 docs/）
- `/gq-code-harness:distill` → 按「收尾沉淀」五类判断提炼到 docs/ 对应分区，双向标记来源。

## 防退化（机器把关，不靠自觉）
- 收工（Stop）`stop-checks` 扫 `tasks/`：**active 但步骤全勾** → exit 2 拦住结束、驱动 agent 跑 `/archive` 收口（这就是"agent 自维护"）。
- 确属待外部验收的全勾任务，由用户 `/gq-code-harness:override <文件名>` 放行。

## 不要
- 不往 `.ai/plans/`、`.ai/logs/` 写新内容（旧两文件制，已冻结只读）。
- 不在 `.ai/` 写项目规范 / 用户偏好（归 CLAUDE.md / docs/）。
