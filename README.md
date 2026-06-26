# gq-code-harness

> **AI 自我进化引擎**：把踩过的坑变成**机器能跑的检查**，hook 在 AI 的**真实改动**上「违反就拦」——硬强制、不靠 AI 自觉。
>
> 跨平台 Node 插件（Claude Code）· 自带测试与 CI · 当前 v0.6.0

![gq-code-harness 架构与流程](docs/architecture.png)

> 流程图：[PNG](docs/architecture.png) · [PDF](docs/architecture.pdf) · 源 [architecture.html](docs/architecture.html)

---

## 这是什么

一套让 **AI 写代码越用越可靠** 的护栏。它的核心信念一句话：

> 每个坑不再是"一段提醒"，而是**一段机器能跑的检查**；hook 在 AI 正要提交的改动上跑这个检查，**违反就直接拒绝**。捕获靠机器/用户，强制靠 hook，**全程不碰 AI 自觉**。

它解决三件长期靠"AI 记得"的事：

| 痛点 | 这套怎么解 |
| --- | --- |
| 业务约束只是提示词，AI 可能没读、没遵守 | 坑 → 可跑检查 → **PreToolUse 写入即拦 / Stop 收工拦** |
| 任务生命周期靠自觉、会退化堆积 | 单文件任务 + `status` 字段 + **收工"做完没收"自动驱动归档** |
| 新项目铺底全靠手写 | `/init` **多 agent 扇出**测绘 → 起草初稿（待人审） |

> **诚实边界**：能化简成检查的坑（用错 API、少鉴权、命名/分层不对……）→ 变检查后永不复发、全程硬。要理解语义才能判的坑（看错需求）→ 第一次只能靠**测试失败或用户纠正**抓到（都不是 AI 自省），抓到后能转检查的转检查。即"决不靠 AI 自觉"100% 达到，"全机器零人介入"做不到——这跟人类团队一样：出事故 → 加测试/告警 → 这类不再悄悄复发。

---

## 核心切分：插件管「机制」，项目管「内容」

| | 进**插件**（装一次、可复用、跨平台） | 留**项目**（每个项目各一份） |
| --- | --- | --- |
| 是什么 | 干活的机器：检查引擎、自动检查、命令、方法、铺底工作流 | 这个项目自己的知识、约束与状态 |
| 例子 | `hooks/` `commands/` `skills/` `workflows/` `lib/` | `docs/` 知识、`docs/harness/checks.json` **弹药**、`.ai/` 任务、`CLAUDE.md` 路由 |

**插件是"会跑检查、会拦的机器"，坑和检查本身永远是项目的。**

---

## 安装

```text
/plugin marketplace add noug12138/gq-code-harness
/plugin install gq-code-harness
```

安装后**重启** Claude Code 即生效（hook 在会话开始时注册）。改了插件代码后用 `/plugin marketplace update <marketplace>` + 重启刷新。

> 仅依赖 Node（Claude Code 本就依赖它），无第三方 npm 依赖。

---

## Hooks（机器在干的活）

| Hook | 时机 | 作用 |
| --- | --- | --- |
| `session-inject` | SessionStart | 把项目 `.ai/session.md` 注入会话开头，快速续上上次进度 |
| `check-runner` | PreToolUse（Edit/Write） | 对"将要写入的内容"跑 `checks.json` 里的检查，**命中即 DENY**（改不进去）；命中 override 则放行并消耗一次 |
| `doctor` | Stop | 扫 `docs/`+`.ai/` 的 Markdown 死链，收工报告（不阻断） |
| `stop-checks` | Stop | 跑 `checks.json` 的慢检查 + 扫"做完没收"任务，`block:true`/未归档 → **exit 2 拦住收工**；其余只报告 |
| `gen-index` | Stop | 把带 `gq-index` 标记的 `index.md` 按真实文件**自动重算**目录列表 |

> 任何 hook 自身异常 → **fail-open**（放行 + 报错，绝不因引擎 bug 把人锁死）。

---

## Commands（命令）

| 命令 | 作用 |
| --- | --- |
| `/gq-code-harness:contract` | 把一个坑**固化成可跑检查**：当场用"坏例必抓、好例不伤"双验证，通过才写入 `checks.json` |
| `/gq-code-harness:override <检查id> "<理由>"` | **临时放行**一条被拦的检查（**只有用户能运行**，AI 不能自我放行；留痕；下次该检查触发时消耗一次） |
| `/gq-code-harness:new-task <名>` | 在 `.ai/tasks/` 起一个**单文件任务**（`status: active`） |
| `/gq-code-harness:archive <任务>` | **归档**任务（翻 `status` 字段、文件不搬目录）；归档前先跑沉淀扫描 |
| `/gq-code-harness:distill <任务>` | 把任务里的**长期结论沉淀进 `docs/`** 对应分区 |
| `/gq-code-harness:init [项目根]` | 给项目**一键铺底**：骨架 + 多 agent 测绘起草（见下文） |

---

## Skill

| Skill | 作用 |
| --- | --- |
| `harness-lifecycle` | **任务生命周期方法论**——单文件任务 + `status` 字段的建 / 做 / 归档 / 沉淀全流程。在 `.ai/tasks/` 下开展任务、或被 `new-task`/`archive`/`distill` 命令调用时加载。 |

> 把"怎么跑生命周期"的方法论放进插件 skill（机制），项目的 `.ai/` 只留任务数据（内容）。

---

## 🧬 自我进化引擎（核心）

**闭环五步**（全程不碰 AI 自觉）：

1. **坑被抓到** —— 靠三种硬信号之一：① 已有检查没过 ② **用户当场纠正** ③ 编译/测试失败。
2. **`/contract` 把坑翻译成可跑检查** —— grep / 正则规则，当场用「坏例必须被抓、好例不能误伤」验证，通过才生效。
3. **检查进 hook，机器执行**：改代码当下（PreToolUse）违反 → 直接拒绝；收工（Stop）跑不过 → 不让结束。
4. 这个坑**再也不可能靠"AI 忘了"复发**。
5. 遇到老检查抓不到的新坑 → 回第 1 步再变成新检查。**每犯一次没见过的错，系统多长一颗牙。**

**检查长什么样**（`docs/harness/checks.json`，每条是一段可跑规则）：

```json
{
  "id": "NO-NEW-OBJECTMAPPER",
  "globs": ["**/yudao-module-*/**/src/main/**/*.java"],
  "kind": "forbid",
  "pattern": "new ObjectMapper[(]",
  "reason": "业务代码用 JsonUtils 代替 new ObjectMapper",
  "block": true
}
```

- `kind`：`forbid`（命中即违反）/ `require`（缺失即违反）。
- `block`：`true` → 连**收工全仓扫描**也拦（前提是现存违反≈0，否则锁死）；缺省 → 只在新写入(PreToolUse)拦、收工只报。
- **分级**：机器 100% 确定 + 一键能修的 → 拦；要动脑判断的 → 只报。

**安全阀**：`/override`（仅用户、留痕、一次性）+ fail-open。

---

## 🔁 任务生命周期（单文件 + status）

- **一个任务一个文件**：`.ai/tasks/YYYY-MM-DD-<task>.md`，计划 + 过程合一。
- **状态是字段不是目录**：frontmatter `status: active | done | cancelled`；**归档 = 翻字段、文件原地不动**（不再搬目录、不再维护双向链）。
- **防退化靠机器**：收工 `stop-checks` 扫 `.ai/tasks/`，发现 `status: active` 但**步骤已全勾**的任务 → `exit 2` 拦住收工，把「请 archive」喂回 agent → **agent 当场自己 `/archive`** → 下次干净放行。不靠"记得归档"。

---

## 🛰️ /init 多 agent 铺底（扇出工作流）

给**新项目**一键铺底。`/init` 做两件事：

**① 铺骨架（确定性，不用 agent）**：把 `.ai/`、`docs/` 骨架复制过去（已存在的文件自动跳过）。

**② 起草内容（多 agent 扇出工作流）**：

```text
探测子系统(10–16 个)
   └─ 并行派"测绘"agent（扇出）—— 各读一个子系统，只回压缩小结，重读留各自即弃上下文
        └─ critic 自检查漏 —— 漏了/像猜的就绕回补扫（保护上限 ≤2 轮）
             └─ writer 起草落盘 —— 全标「机器起草·待人审」
                  └─ 汇总 ≤7 个待确认问题 → 一次性问你
```

**为什么这么设计**：

- **编排器是确定性 JS，且不碰文件系统**——读由测绘 agent、写由 writer agent，编排只在内存里倒腾**压缩小结**（不是原始代码）→ 主上下文不爆。
- 用 **subagent 扇出**（不用 agent team）：测绘彼此独立、无需通信，避免丢消息；结果对不上 schema 自动重试、agent 挂了返回 null 可查，**不静默丢失**。
- 扇出是为 **"规模 / 独立"**（一个上下文装不下大仓），**不是角色扮演**（没有 PM/前端/后端 这种常驻人设——真正的"专精"由项目的路径规则 + 文档路由提供）。

> **降级**：无 Workflow 运行时 → 退化为单 agent 顺序测绘；连 subagent 也不便 → 只铺骨架、内容待手填。

---

## 🗂️ 索引自动生成

任何 `index.md` 可**自愿**接入：圈一段标记，收工由 `gen-index` 按真实文件重算，**标记外手写内容一字不动**：

```markdown
<!-- gq-index:start kind=docs -->
（这中间自动生成，勿手改）
<!-- gq-index:end -->
```

- `kind=docs`：列同目录文档 `- [标题](文件) — 说明`（标题/说明从各文档 frontmatter 读）。
- `kind=tasks`：把任务按 `status` 分组（进行中 / 已完成 / 已取消 / 其它）。
- **没标记的索引完全不碰**——curated 的目录页要不要接入由你决定。`/init` 铺的新项目骨架自带标记。

---

## 给项目放什么（内容层）

```text
项目根/
├─ docs/                      # 长期知识库（自动生成目录页可选）
│  └─ harness/checks.json     # 引擎的"弹药"：可跑检查
├─ .ai/
│  ├─ session.md              # 会话精简状态（被 session-inject 注入）
│  ├─ templates/task.md       # 单文件任务模板
│  └─ tasks/                  # 当前任务（单文件 + status）
└─ CLAUDE.md                  # 路由与落地总则（每次加载）
```

---

## 跨平台 & 测试

- **全 Node**：hook 是 Claude Code 直接执行的，对运行时最敏感。PowerShell 偏 Windows、bash 在 Windows 要 Git Bash——**Node 是三系统都有的那一个运行时**，最稳。
- **测试**：`npm test`（`node --test`，纯 `node:test`、无依赖）。
- **CI**：`.github/workflows/test.yml`，每次 push / PR 自动跑全部测试。

---

## 目录结构（插件仓）

```text
gq-code-harness/
├─ .claude-plugin/            # plugin.json / marketplace.json
├─ hooks/                     # session-inject · check-runner · doctor · stop-checks · gen-index · hooks.json
├─ commands/                  # init · new-task · archive · distill · contract · override
├─ skills/harness-lifecycle/  # 生命周期方法论
├─ workflows/init-bootstrap.mjs   # /init 的多 agent 扇出工作流
├─ lib/                       # 纯逻辑（checks/override/scan/scaffold/gen-index/stale-tasks …）
├─ bin/                       # contract · scaffold（CLI）
├─ assets/                    # /init 铺底用的 .ai/ + docs/ 通用骨架
├─ test/                      # node:test 单测
└─ docs/architecture.{html,png,pdf}   # 本架构图
```
