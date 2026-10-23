# specs/

One folder per feature, created by `node .sdd/scripts/sdd.mjs new "<title>"` (or `/sdd-spec`).

```text
specs/NNN-slug/
├── spec.md            WHAT & WHY — user stories, REQ-n, EARS AC-n.m, NFR-n   (product-analyst; frozen once approved)
├── plan.md            HOW — architecture, contracts, coverage, constitution check (architect)
├── research.md        optional — evidence for technical choices, with sources   (architect)
├── data-model.md      optional — entities, fields, constraints                  (architect)
├── contracts/         optional — OpenAPI / JSON Schema / proto                  (architect)
├── tasks.md           ordered, test-first task list T### → AC                   (task-planner)
├── analysis.md        cross-artifact consistency report + Verdict               (reviewer)
├── progress.md        append-only implementation log                            (implementer / test-engineer)
├── traceability.md    generated: AC → tasks → tests                             (`sdd trace --write`)
└── verification.md    evidence + reviews + Verdict                              (/sdd-verify)
```

Lifecycle (`status` in spec.md frontmatter, changed only via the CLI):

```text
draft → clarified → [human: sdd approve] approved → planned → tasked → implementing → verified → shipped
```
