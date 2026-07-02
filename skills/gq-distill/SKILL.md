---
name: gq-distill
description: Codex wrapper for gq-code-harness distill. Use to extract durable conclusions from a task into docs/.
---

# gq distill for Codex

This is the Codex entrypoint for the existing Claude command in `../../commands/distill.md`.
Keep the Claude command file unchanged.

## Inputs

- Task filename or task name.
- Target project root. Use the current working directory unless the user provides another root.

## Distillation Rules

Read the task's goal, process notes, pitfalls, and closing-distillation section. Move only durable conclusions into `docs/`:

- Module structure or data flow -> `docs/architecture/`
- Product rules or feature boundaries -> `docs/product/`
- Reusable design -> `docs/design/<subsection>/`
- Technical choice or cross-module convention -> `docs/decisions/`
- Repeated issue or root cause -> `docs/harness/`

## Steps

1. Create or update the smallest appropriate docs file.
2. Add a source marker in the docs file pointing back to the task.
3. Add or update task frontmatter `distilled_to` with the docs paths.
4. Update affected `index.md` entries if they are manually maintained. Generated index sections are handled by the Stop hook.
5. Do not invent business rules. If a conclusion is uncertain, keep it in a "pending confirmation" note.
