# AGENTS.md

本文件是项目根级 agent 路由总则，适用于 Codex 与其他读取 `AGENTS.md` 的 coding agent。长期知识放 `docs/`，短期运行状态放 `.ai/`，不要把两者混写。

## 启动顺序

1. 先读本文件。
2. 再读 `.ai/session.md`，确认是否有活跃任务或未决上下文。
3. 按任务类型读取 `docs/index.md` 及对应分区索引。
4. 若进入子项目，继续读取更近的 `AGENTS.md` / `CLAUDE.md`。

## 知识路由

| 场景 | 读取位置 |
| --- | --- |
| 不确定模块边界、调用链、入口 | `docs/architecture/index.md` |
| 涉及业务口径、验收标准、功能边界 | `docs/product/index.md` |
| 涉及 UI、数据模型、接口契约 | `docs/design/index.md` |
| 涉及长期架构选择 | `docs/decisions/index.md` |
| 遇到重复踩坑、检查规则、硬性约束 | `docs/harness/index.md` |
| 当前任务状态、过程、下一步 | `.ai/index.md` 与 `.ai/session.md` |

## 工作规则

- 新任务使用 `.ai/tasks/YYYY-MM-DD-<task>.md`，状态写在 frontmatter `status` 字段。
- 任务完成前做沉淀扫描；长期结论必须提炼到 `docs/`。
- 不在 `.ai/` 写项目规范或用户偏好。
- 不在 `docs/` 写临时过程日志。
- 新增可机器检查的防复发规则时，先验证坏例和好例，再写入 `docs/harness/checks.json`。

## Codex 入口

- 新建任务：`$gq-new-task`
- 归档任务：`$gq-archive`
- 沉淀任务：`$gq-distill`
- 固化检查：`$gq-contract`
- 临时放行：`$gq-override`
- 重新铺底：`$gq-init`

## 验证

- 修改文档后，运行 gq-code-harness 的 doctor 检查死链。
- 修改带 `gq-index` 标记的索引时，优先让 gq-code-harness 自动重算。
- 修改代码时，遵循子项目自己的构建、测试、lint 命令。
