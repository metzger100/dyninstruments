---
name: grill-me
description: Stress-test a feature, design, or refactor idea against the dyninstruments repo until the scope, constraints, and risks are clear. Use when the user wants to be grilled on a plan or design.
---

# Grill Me

Interview the user rigorously about a feature, design, or refactor until there is a shared understanding of scope, constraints, and trade-offs.

## Repo contract

Before asking substantive questions or giving recommendations, always do the mandatory repo preflight:

1. Read `documentation/TABLEOFCONTENTS.md`
2. Read `documentation/conventions/coding-standards.md`
3. Read `documentation/conventions/smell-prevention.md`

Then identify only the 1-3 additional docs or source areas that are most relevant to the topic. Do not read the entire repo sequentially.

Ground every question and recommendation in the repo's actual constraints:

- AvNav plugin runtime
- browser-only code
- no runtime bundler
- no ES modules / no `import` / `export`
- UMD/global registration patterns
- HTML vs `canvas-dom` surface ownership
- repo-local planning in `exec-plans/active/`
- final code-change gate: `npm run check:all`

## Behavior

- Ask one question at a time.
- For each question, provide your recommended answer and explain why it fits this repo.
- If the answer can be obtained by exploring the repo or docs, inspect the repo instead of asking the user.
- Prefer concrete repo terms over generic web-app language.
- When the topic affects implementation, probe for:
  - cluster and kind ownership
  - mapper / view-model / renderer boundaries
  - surface choice (`html` vs `canvas-dom`)
  - editable parameter ownership
  - host-action / `avnav.api` boundaries
  - documentation impact
  - test coverage and regression risk
  - out-of-scope decisions

## Desired outcome

By the end of the interview, produce a concise grounded summary of:

- the problem being solved
- the recommended direction
- key open questions
- affected modules/docs
- validation expectations

If the discussion stabilizes into an implementation or refactor request, shape the summary so it can be turned directly into an `exec-plans/active/PLAN*.md` artifact.
