---
description: 把一个踩过的坑固化成一条"可跑检查"（先用坏例/好例验证，再写入项目）
---
用户要把一个反复踩的坑变成引擎能硬拦的检查。`$ARGUMENTS` 是对这个坑的简述（可空，空则向用户问清）。**任何一步不清楚就问用户，不要自己编 pattern 或例子。**

1. 与用户确认 5 要素：`id`（大写短横线、唯一）、`globs`（命中哪些文件，如 `["**/*Controller.java"]`）、`kind`（`forbid`=出现即违规 / `require`=缺失即违规）、`pattern`（正则）、`reason`（一句话，拦下时给 AI 看）；外加**坏例**（应被拦的内容）和**好例**（正常、不该被拦的内容）。
2. 校验：把 `{"check":{"id":...,"globs":[...],"kind":...,"pattern":...,"reason":...},"bad":"...","good":"..."}` 经 stdin 交给校验器：
   ```bash
   echo '<上面的 JSON>' | node "${CLAUDE_PLUGIN_ROOT}/bin/contract.mjs" --project "${CLAUDE_PROJECT_DIR}"
   ```
   - `{"ok":false,"errors":[...]}` → 把错误告诉用户、一起改 pattern/例子后重试。坏例没抓住=太松；好例被误伤=太严。**必须 `ok:true` 才算合格。**
3. 合格后请用户确认写入；确认则带 `--add` 再跑一次（同一 JSON）：
   ```bash
   echo '<同一 JSON>' | node "${CLAUDE_PLUGIN_ROOT}/bin/contract.mjs" --project "${CLAUDE_PROJECT_DIR}" --add
   ```
   `{"ok":true,"id":...,"count":N}`=成功；`{"ok":false,"error":"id 已存在"}`=换个 id。
4. 告知用户：检查已写入 `docs/harness/checks.json`，**下次新会话生效**（PreToolUse 钩子才会拦）；可选给它配 `docs/harness/Cxxx.md` 写清"为什么"。
