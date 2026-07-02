---
name: gq-new-task
description: Codex wrapper for gq-code-harness new-task. Use when the user wants to create a single-file task under .ai/tasks with status active.
---

# gq new-task for Codex

This is the Codex entrypoint for the existing Claude command in `../../commands/new-task.md`.
Keep the Claude command file unchanged.

## Inputs

- Task name from the user. Normalize to kebab-case ASCII when possible.
- Target project root. Use the current working directory unless the user provides another root.

## Steps

1. Read `.ai/templates/task.md` from the target project. If it is missing, tell the user to run `gq-init` first or create the harness scaffold.
2. Create `.ai/tasks/YYYY-MM-DD-<task-name>.md` with frontmatter:
   - `title: <task-name>`
   - `created: <today>`
   - `updated: <today>`
   - `status: active`
3. Fill goal, scope, and checklist with concrete content agreed with the user. Do not leave template placeholders.
4. Update `.ai/session.md` so it points to the new task and records the current next step.
5. Do not create `.ai/plans/` or `.ai/logs/`.

If the user has not given enough task detail, ask only for the missing goal/scope/checklist information before writing the task file.
