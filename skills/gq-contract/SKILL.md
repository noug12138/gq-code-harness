---
name: gq-contract
description: Codex wrapper for gq-code-harness contract. Use to turn a known pitfall into a validated docs/harness/checks.json rule.
---

# gq contract for Codex

This is the Codex entrypoint for the existing Claude command in `../../commands/contract.md`.
Keep the Claude command file unchanged.

## Required Inputs

Do not invent these. Ask the user when any item is missing:

- `id`: unique uppercase kebab-case check id.
- `globs`: affected file globs.
- `kind`: `forbid` or `require`.
- `pattern`: JavaScript regular expression source.
- `reason`: concise explanation shown when blocked.
- Bad example: content that must violate.
- Good example: content that must pass.

## Steps

1. Locate the plugin root. It is the directory two levels above this skill directory. If unavailable, find `bin/contract.mjs`.
2. Build JSON:

```json
{
  "check": {
    "id": "...",
    "globs": ["..."],
    "kind": "forbid",
    "pattern": "...",
    "reason": "..."
  },
  "bad": "...",
  "good": "..."
}
```

3. Validate without writing:

```bash
node "<plugin-root>/bin/contract.mjs" --project "<project-root>"
```

Pass the JSON on stdin.

4. If validation returns `ok: false`, show the error and revise with the user.
5. Only after validation returns `ok: true`, ask the user to confirm writing.
6. On confirmation, rerun the same command with `--add`.
7. Tell the user the rule was written to `docs/harness/checks.json` and will be enforced by trusted hooks in new Codex/Claude sessions.
