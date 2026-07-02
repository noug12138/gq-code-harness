---
name: gq-override
description: Codex wrapper for gq-code-harness override. Use when the user explicitly grants one temporary bypass for a blocked check or stale task.
---

# gq override for Codex

This is the Codex entrypoint for the existing Claude command in `../../commands/override.md`.
Keep the Claude command file unchanged.

## Preconditions

Only do this when the user explicitly asks to override. The agent must not grant an override for itself.

## Inputs

- First argument: check id or stale task filename.
- Remaining text: reason.
- Target project root. Use the current working directory unless the user provides another root.

## Steps

1. Read `.ai/.harness-override.json`, or start with:

```json
{"ids":[],"log":[]}
```

2. Add the id to `ids` once.
3. Append a log entry:

```json
{"id":"...","reason":"...","at":"<ISO timestamp>","action":"grant"}
```

4. Write `.ai/.harness-override.json`, creating `.ai/` if needed.
5. Tell the user the override is single-use and will be consumed by the next matching hook.
