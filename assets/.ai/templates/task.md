<!--
模板：/gq-code-harness:new-task 复制本文件到 .ai/tasks/YYYY-MM-DD-<task-name>.md。
单文件任务：计划 + 过程合一；归档=翻 status 字段，文件不搬目录。
-->
---
status: active          # active | done | cancelled
title: <一句话任务名>
created: YYYY-MM-DD
updated: YYYY-MM-DD
distilled_to:           # done 时填沉淀去向，如 docs/design/ui/xxx.md；无则留空
cancel_reason:          # cancelled 时填一句原因
---

# <任务名>

## 目标 / 范围
- **目标**：为什么做、要达到什么状态（不写实现细节）。
- **包含**：明确要做的。
- **不包含**：明确不做的（防蔓延）。

## 步骤
- [ ] 步骤 1
- [ ] 步骤 2

> 执行中勾掉；步骤变更直接改本段（保持真实）。

## 过程 / 决策 / 踩坑
- 关键决策（为什么这么做，≤3 句；可升级 ADR 的标 ✦）。
- 踩坑：现象 → 根因 → 解决 →（是否升级 docs/harness/Cxxx）。
- 偏离计划之处与原因。

## 验收
- 可执行的判定方式（命令 / UI / 用户验收）。

## 收尾沉淀（done 前必跑）
逐条勾选；命中即提炼到 docs/ 并在 frontmatter `distilled_to` 填路径。
- [ ] 模块结构 / 数据流变化 → `docs/architecture/`
- [ ] 业务规则 / 功能边界 → `docs/product/`
- [ ] 可复用设计方案 → `docs/design/<子分区>/`
- [ ] 选型 / 跨模块约定 → `docs/decisions/`（新 ADR）
- [ ] 同类问题第二次出现 / 根因 → `docs/harness/`（新 Cxxx）

均未命中 → 纯执行，直接 `/gq-code-harness:archive`。
