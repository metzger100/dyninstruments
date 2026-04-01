---
name: improve-codebase-architecture
description: Analyze a dyninstruments subsystem, compare several interface designs, and write a repo-local architectural improvement plan in exec-plans/active/PLAN*.md.
---

# Improve Codebase Architecture

Use this skill when the user wants to simplify a subsystem, deepen a module, reduce coupling, or redesign an interface.

## 1. Mandatory repo preflight

Always start by reading:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

Then read only the most relevant architecture docs, guides, and source files for the subsystem under discussion.

Also inspect nearby execution plans in `exec-plans/active/` and `exec-plans/completed/` so the artifact matches existing repo expectations.

## 2. Explore the subsystem and verify the pain

Inspect the codebase and verify:

- the current owners of the behavior
- the entry points callers use today
- duplicated logic or shallow seams
- where host/browser/config coupling enters
- current tests and docs for the area

Capture this as concrete repo facts. Use specific files, modules, and docs when verified.

## 3. Define the architectural target

State clearly what should improve. Examples:

- fewer entry points
- simpler caller ergonomics
- clearer ownership boundaries
- better host isolation
- less registration/config duplication
- easier testing at a stable interface

## 4. Classify the dominant boundary

Use the dependency categories in `REFERENCE.md` to classify the main dependency shape involved:

- pure in-process
- browser / DOM boundary
- host integration boundary
- registry / configuration boundary
- true external boundary

Use the classification to shape the design and testing recommendation.

## 5. Produce 3-4 interface designs

Compare several concrete interface designs. Do this sequentially; do not assume any special sub-agent tooling.

Give each design a different constraint:

- Design A: minimize the interface, target 1-3 entry points
- Design B: maximize flexibility and extension room
- Design C: optimize for the common caller so the default case is trivial
- Design D: ports/adapters shape for boundary-heavy code, only if it genuinely fits

For each design, provide:

1. interface signature
2. short usage example
3. what complexity it hides internally
4. dependency strategy using the repo-specific categories from `REFERENCE.md`
5. trade-offs

## 6. Recommend one direction

Do not stop at a menu. Give a strong recommendation for the best design for this repo.

If a hybrid is best, say which pieces should be combined and why.

Ground the recommendation in:

- current repo patterns
- expected testability
- migration cost
- documentation churn
- fit with AvNav/plugin/runtime constraints

## 7. Write the architectural plan artifact

Create `exec-plans/active/PLAN<N>.md` using the next free plan number after checking active and completed plans.

Use the template in `REFERENCE.md` as the base, adapted to the concrete subsystem.

## 8. Output rule

Do not default to GitHub issues or `gh issue create`. In this repository, the primary artifact is the local execution plan under `exec-plans/active/`.
