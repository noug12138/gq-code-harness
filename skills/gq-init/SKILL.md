---
name: gq-init
description: Codex-native wrapper for gq-code-harness init bootstrap. Use to scaffold .ai/docs and draft a module map for a project without requiring the Claude Workflow runner.
---

# gq init for Codex

This is the Codex entrypoint for the existing Claude command in `../../commands/init.md`.
Keep the Claude command and `../../workflows/init-bootstrap.mjs` unchanged. In Codex, do not try to execute that workflow file as plain Node; it depends on a Claude Workflow runner. Recreate the same phases with Codex tools.

## Inputs

- Target project root. Use the current working directory unless the user provides another root.

## Phase 1: Scaffold

1. Locate the plugin root. It is the directory two levels above this skill directory. If unavailable, find `bin/scaffold.mjs`.
2. Run:

```bash
node "<plugin-root>/bin/scaffold.mjs" --project "<project-root>"
```

3. The scaffold must include root `AGENTS.md` and `CLAUDE.md` plus `.ai/` and `docs/`. Report created and skipped files briefly. If either root instruction file is missing after scaffolding, treat the init as incomplete and fix the scaffold before continuing.

## Phase 2: Detect Survey Units

Find likely subsystems using `rg --files` or equivalent:

- `package.json`
- `pom.xml`
- `yudao-module-*`
- `front`
- `*-qywx`
- obvious app/service/package roots

Merge or split to about 10-16 units when the repository is large. For small projects, use fewer units.

## Phase 3: Survey and Draft

If the user explicitly invoked `gq-init`, treat that as authorization for this bootstrap workflow's agent fan-out. If Codex subagent tools are available, spawn bounded survey agents for independent units. If they are not available, survey sequentially in the main thread.

Each survey should return only a compact summary:

- `name`
- `techStack`
- `keyModules` (up to 8)
- `dataFlows` (up to 5)
- `entryPoints` (up to 8)
- `candidateContracts` (up to 5)
- `openQuestions` (up to 3)

Run one critic pass over the summaries. If a specific unit looks guessed or incomplete, resurvey it once. Do not exceed two critic/resurvey rounds.

Write `docs/architecture/module-map.md` with:

- first line: `> 机器起草·待人审`
- subsystem and module summary
- data flows
- entry points
- `候选防复发契约（待定）`
- `待确认`

Do not create numbered Cxxx contracts during init. Leave candidate contracts as candidates until a human confirms them through `gq-contract`.

## Phase 4: Finish

Return:

- files written
- self-check rounds
- up to 7 user questions

Tell the user that machine-drafted docs must be reviewed before removing `机器起草·待人审`.
