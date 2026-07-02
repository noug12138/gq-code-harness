---
name: gq-archive
description: Codex wrapper for gq-code-harness archive. Use when archiving a .ai/tasks task by flipping its frontmatter status without moving the file.
---

# gq archive for Codex

This is the Codex entrypoint for the existing Claude command in `../../commands/archive.md`.
Keep the Claude command file unchanged.

## Inputs

- Task filename or task name. If omitted, inspect `.ai/tasks/` and ask which active task should close.
- Target project root. Use the current working directory unless the user provides another root.

## Steps

1. Locate the task file in `.ai/tasks/`.
2. Run the distillation scan before changing status. Use `gq-distill` behavior for long-lived conclusions.
3. Decide status:
   - If all checklist steps are checked and there are no open items, set `status: done`.
   - If the task is explicitly abandoned, set `status: cancelled` and add a concise `cancel_reason`.
   - If checklist state conflicts with the requested outcome, ask the user before changing status.
4. Update `updated` to today's date.
5. Leave the file in place. Do not move it to another directory.
6. Clear or update `.ai/session.md` so it no longer points at a closed active task.

For Stop-hook self-maintenance, a fully checked active task defaults to `done` without asking.
