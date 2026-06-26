---
description: 对一个任务跑「沉淀扫描」，把长期结论提炼进 docs/
---
用户要把某任务的长期结论沉淀到 docs/。参数 `$ARGUMENTS` = 任务文件名或任务名。

请执行：
1. 定位任务文件，读「目标/过程/踩坑」与「收尾沉淀」段。
2. 逐条判断命中类型并提炼到对应 docs 分区：
   - 模块结构 / 数据流 → `docs/architecture/`
   - 业务规则 / 功能边界 → `docs/product/`
   - 可复用设计 → `docs/design/<子分区>/`
   - 选型 / 跨模块约定 → `docs/decisions/`（新 ADR）
   - 同类问题二次出现 / 根因 → `docs/harness/`（新 Cxxx）
3. 双向标记：任务 frontmatter `distilled_to` 填 docs 路径；新 docs 文件底部注明来源任务文件。
4. 命中的分区补好 index 入口（见 docs/index.md「维护规则」）。
