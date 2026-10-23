---
name: sdd-clarify
description: Resolve ambiguities in a draft feature spec through targeted questions (max 5 per round), fold the answers in, and promote the spec to "clarified" so a human can approve it. Use after /sdd-spec or whenever a spec has [NEEDS CLARIFICATION] markers.
argument-hint: "[feature-id] [--headless]"
---

# /sdd-clarify — remove ambiguity before anyone designs

You are the **orchestrator**. Subagents cannot talk to the user, so **you** run the Q&A.
Input: `$ARGUMENTS` (feature id optional — resolved from branch; `--headless` or `SDD_HEADLESS=1` = no questions).

1. **Resolve** the feature: `node .sdd/scripts/sdd.mjs current <id?>`. Its status must be `draft`
   (if `clarified` or later, say so and stop).

2. **Find questions → `product-analyst`** (read-only pass):
   > Read specs/<feature>/spec.md. Do NOT edit it. Return up to 5 questions, highest impact first, covering
   > every [NEEDS CLARIFICATION] marker plus any other gap in: scope boundaries, user roles & permissions,
   > data lifecycle/retention, error & edge behaviour, non-functional targets, external integrations,
   > acceptance criteria that a test could not assert. For each: the question, why it matters,
   > 2–4 concrete options, and your recommended option with rationale.

3. **Ask.**
   - Interactive: put the questions to the user with AskUserQuestion (recommended option first,
     labelled "(Recommended)"). Up to 4 per call; do a second call if there are 5.
   - Headless: take the recommended option for each and label it `assumption — <rationale>`.

4. **Integrate → `product-analyst`:**
   > Apply these answers to specs/<feature>/spec.md: «Q/A list with sources». Update the affected
   > sections and ACs (EARS), remove the resolved markers, empty §11 Open Questions, append a
   > "### Session <today>" block to §12 Clarifications Log. Then run
   > `node .sdd/scripts/sdd.mjs set-status <id> clarified` and fix whatever it reports.

5. **Loop** at most 3 rounds if `set-status` still fails or new critical gaps appear. Then stop and report what blocks.

6. **Commit** `docs(<id>): clarify spec` and **report**:
   - Q&A summary (assumptions highlighted — a human must check those),
   - then the human gate, verbatim:

   ```
   ⛳ HUMAN GATE — review specs/<feature>/spec.md, then approve from YOUR terminal (agents are blocked from approving):
      node .sdd/scripts/sdd.mjs approve <id> --by "<your name>"
   On GitHub: add the label `sdd:approved` to the spec PR instead.
   Then continue with: /sdd-plan <id>   (or /sdd-auto --feature <id>)
   ```
