# 项目文档总入口

本目录保存长期有效的项目知识。AI 先读本文件，再按任务类型读相关子目录索引。

## 目录职责
| 目录 | 说明 | 何时读 |
| --- | --- | --- |
| [architecture/index.md](architecture/index.md) | 架构、模块地图、数据流 | 不确定落点 / 跨模块依赖前 |
| [product/index.md](product/index.md) | 产品规则、功能边界 | 涉及业务口径 / 验收标准时 |
| [design/index.md](design/index.md) | UI / 数据模型 / 接口契约 | 新增或调整页面、数据结构、接口前 |
| [harness/index.md](harness/index.md) | 防复发契约（坑 → 可跑检查） | 命中重复踩坑场景时 |
| [decisions/index.md](decisions/index.md) | ADR 架构决策 | 新增 / 查看长期决策时 |

## 维护规则
- 新增长期文档时，把入口补到对应 index.md。
- 执行计划、会话状态放 `.ai/`，不放 `docs/`。
- `.ai/` 产生长期结论 → 提炼回 `docs/`。
