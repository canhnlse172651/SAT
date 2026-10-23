---
name: sdd-status
description: Show every feature's pipeline status, task progress, blockers and the recommended next command. Use when the user asks where things stand or what to do next.
argument-hint: "[feature-id]"
allowed-tools: Bash(node .sdd/scripts/sdd.mjs:*), Bash(git status:*), Bash(git log:*), Read, Grep, Glob
---

# /sdd-status

Current state:

!`node .sdd/scripts/sdd.mjs status`

Branch: !`git rev-parse --abbrev-ref HEAD`

1. If a feature id was given (`$ARGUMENTS`), also run `node .sdd/scripts/sdd.mjs check <id>` and
   `node .sdd/scripts/sdd.mjs next-task <id>`, and read the last 10 lines of its `progress.md`.
2. Summarise in a short table: feature · status · progress · blockers · **next command** (the NEXT column;
   `HUMAN:approve` means a person must run `node .sdd/scripts/sdd.mjs approve <id> --by "<name>"`).
3. If the toolchain in `.sdd/config.json` is all `null`, say the project is not bootstrapped and suggest `/sdd-init`.
Do not change anything.
