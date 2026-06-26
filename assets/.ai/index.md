<!--
受众：AI agent。.ai/ 是 AI 运行时短期工作区，与 docs/（长期知识库）严格分离。
生命周期「怎么做」已移入插件 skill：gq-code-harness:harness-lifecycle。本文件只留 .ai/ 的数据约定与指针。
-->

# `.ai/` — AI 运行时系统

## 0. 定位
| 维度 | `.ai/` | `docs/` |
| --- | --- | --- |
| 时效 | 短期（任务周期内） | 长期（项目生命周期） |
| 受众 | 当前 / 近期会话 AI | 所有未来会话 AI |
| 内容 | 任务状态、过程、临时上下文 | 业务规则、设计、决策、防复发契约 |

**黄金法则**：任务完成时若产生长期结论 → **必须**提炼到 `docs/`（沉淀扫描见任务模板「收尾沉淀」段或 `/gq-code-harness:distill`），否则知识丢失。

## 1. 目录结构
| 路径 | 用途 |
| --- | --- |
| `index.md` | 本文件，`.ai/` 数据约定 |
| `session.md` | 当前会话精简状态；每次对话开头由插件 `session-inject` 自动注入 |
| `templates/task.md` | 单文件任务模板 |
| `tasks/` | **当前任务（单文件 + status 字段）** |
| `plans/`、`logs/` | **旧两文件制历史，冻结只读**；新任务一律走 `tasks/` |

## 2. 单文件任务模型
- **一个任务一个文件**：`tasks/YYYY-MM-DD-<task>.md`，计划 + 过程合一。
- **状态是字段不是目录**：frontmatter `status: active | done | cancelled`。
- **归档 = 翻字段**，文件**原地不动**（不再搬目录、不再维护双向链）。
- 建用 `/gq-code-harness:new-task`，归档用 `/gq-code-harness:archive`，沉淀用 `/gq-code-harness:distill`。
- 完整方法论见插件 skill **`gq-code-harness:harness-lifecycle`**。

## 3. session.md
开头由插件 `session-inject` 自动注入，帮助快速续上。**简短为宜**——建议含「当前任务 / 关键上下文 / 未决问题 / 下一步」，但不强制行数与段落格式。不写已在任务文件或 docs 中的内容，不写项目规范与用户偏好（归 CLAUDE.md / docs）。

## 4. 防退化（机器把关，不靠自觉）
- 收工（Stop）插件 `stop-checks` 扫 `tasks/`：**status 仍 active 但步骤全勾**的任务 → exit 2 拦住结束、驱动 agent 跑 `/archive` 收口。
- 把「生命周期靠自觉」换成「机器把关 + agent 自维护」，堆积不再隐形。

## 5. `.ai/` → `docs/` 提炼规则
任务归档前**必须**扫描，命中任一类型 → 沉淀到 docs：

| 命中 | 提炼到 |
| --- | --- |
| 新增 / 变更模块、跨模块数据流 | `docs/architecture/` |
| 新业务规则或功能边界 | `docs/product/<feature>.md` |
| 可复用的设计方案 | `docs/design/<ui\|data-model\|api-contracts>/` |
| 跨模块约定 / 选型决策 | `docs/decisions/`（新 ADR） |
| 同类问题第二次出现 / 事故根因 | `docs/harness/`（新 Cxxx） |

**双向标记**：任务 frontmatter `distilled_to` 填 docs 路径；新 docs 文件底部注明 `> 来源：.ai/tasks/<file>`。

## 6. 反模式
- ❌ 启动任务不建 `tasks/` 文件（凭口头执行）。
- ❌ 完成不走沉淀扫描（长期知识被埋）。
- ❌ 在 `.ai/` 写项目规范 / 用户偏好（归 CLAUDE.md / docs）。
- ❌ 回头往 `plans/`、`logs/` 写新内容（已冻结）。
