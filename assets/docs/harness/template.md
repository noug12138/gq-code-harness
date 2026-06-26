# Harness 条目模板

复制本模板新建：

```text
docs/harness/Cxxx-short-title.md
```

编号规则：

```text
C001
C002
C003
```

编号递增，不复用已经退役的编号。

````markdown
---
id: C0XX
title: <一句话说清这条契约防什么坑>
status: active | retired
created: 2026-MM-DD
source_log: <user-request:YYYY-MM-DD 或 spec/任务文件路径>
---

# C0XX <标题>

## §1 触发场景

什么情况下必须读取本 harness？

写清楚关键词和具体场景，例如：

```text
新增 Controller
修改状态流转
新增工具方法
修改 middleware
新增导出功能
```

## §2 背景（why）

这条契约为什么存在？

必须写真实来源：

- 哪次踩坑。
- 哪个用户明确要求。
- 哪个 Spec / RFC 拍板。
- 哪个 CI gate 已经存在但缺少解释。

不要写空话，例如：

```text
为了代码质量
为了规范
为了可维护
```

## §3 Required / Forbidden

必须这么做：

```text
写具体规则、正例或操作顺序。
```

禁止这么做：

```text
写具体反例、错误写法或禁止路径。
```

这一节要让 AI 可以直接照着执行。

## §4 Verification

写清楚怎么验证这条规则没有被破坏。

至少包含一种：

```text
grep / rg 命令
测试命令
CI gate
人工检查清单
```

示例：

```bash
rg -n "pattern" yudao-module-* yudao-framework
```

命令可以是"风险线索"，但要说明如何判断是否真的违规。

## §5 Recurrence Log

每次同根因再次发生，就追加一行。

| 日期 | session | commit | 现象 | 根因 |
| --- | --- | --- | --- | --- |
| 2026-MM-DD | <session> | <sha/pending> | <发生了什么> | <为什么又发生> |

不要把多次复现合并成一句话。

## §6 关联

关联相关文档、代码、测试、规范。

例如：

- 代码风格：
- 产品规则：
- 架构文档：
- 相关代码：
- 相关测试：
- 兄弟 harness：

## §7 历史与演进

记录状态变化：

- 2026-MM-DD：创建，状态为 `active`
- 2026-MM-DD：补充 Verification
- 2026-MM-DD：retired，原因是被 CI/规则接管或场景消失
````

## 最低合格标准

一条 harness 至少必须有：

```text
source_log
Required / Forbidden
Verification
Recurrence Log
```

如果写不出 `Verification`，它不是 harness。

如果没有真实来源，它可能只是个人偏好。
