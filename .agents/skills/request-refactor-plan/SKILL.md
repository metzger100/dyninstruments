---
name: request-refactor-plan
description: Create a dyninstruments refactor execution plan with safe incremental steps, concrete repo references, and a repo-local PLAN artifact instead of a GitHub issue.
---

# Request Refactor Plan

Use this skill when the user wants to plan a refactor, reduce architectural friction, or break a risky change into safe incremental steps.

## 1. Get the refactor problem into context

If the user has already described the problem, start from that description. Otherwise ask for:

- the pain they are seeing
- the area of the repo involved
- any ideas they already have
- constraints, risks, or deadlines

## 2. Mandatory repo preflight

Always read first:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

Then inspect only the most relevant docs, code paths, and nearest execution plans.

## 3. Verify the current state instead of trusting assumptions

Explore the repo to confirm:

- which modules currently own the behavior
- where the coupling or duplication lives
- what invariants must not break
- what tests already protect the area
- what docs currently describe the contract

Use concrete file and module references when they are verified. In this repo, that level of specificity is expected in plans.

## 4. Clarify scope and non-goals

Narrow the refactor until there is a crisp boundary around:

- what will change
- what must remain behaviorally identical
- what follow-up work is intentionally deferred

Be explicit about repo-specific constraints such as UMD boundaries, host integration, surface ownership, config ownership, and file-size limits.

## 5. Evaluate alternatives

Present at least 2 plausible approaches when the choice is non-trivial. Explain trade-offs in terms of:

- coupling reduction
- testability
- migration risk
- documentation churn
- compatibility with existing repo patterns

## 6. Inspect coverage and regression protection

Check what tests exist in the affected area and note any gaps. If the refactor is not well protected, include a step early in the plan to add safety coverage before deeper changes.

Good tests in this repo should focus on external behavior and stable contracts, not internal implementation trivia.

## 7. Break the work into small safe steps

Write the implementation as tiny working steps that keep the codebase usable after each step.

Use concrete module names and files when verified. Avoid only when the path is speculative.

A good step sequence usually looks like:

1. add or strengthen regression protection
2. extract or normalize contracts
3. migrate one call site or rendering path at a time
4. remove dead paths / duplication
5. update docs
6. run final validation

## 8. Write the repo-local plan artifact

Create `exec-plans/active/PLAN<N>.md` using the next free plan number after checking active and completed plans.

Use a structure like this:

```md
# PLAN<N> — <Refactor Name>

## Status

Why this refactor plan exists.

## Problem Statement

Describe the friction from the maintainer's perspective.

## Verified Baseline

Concrete repo facts verified before planning.

## Desired End State

What the architecture should look like after the refactor.

## Decision Log

Durable choices that shape the refactor.

## Stepwise Implementation Plan

### Step 1: ...
- goal
- affected areas
- safety checks

### Step 2: ...
...

## Testing Strategy

- protection to add first
- behaviors to verify
- prior-art tests to mirror

## Documentation Updates

Docs that must change if contracts or behavior move.

## Out of Scope

What this refactor intentionally does not do.

## Validation

- `npm run check:all`
- any cleanup or baseline commands if relevant
```

## 9. Output rule

Do not default to creating a GitHub issue. In this repo, the primary artifact is the local execution plan under `exec-plans/active/`. Only create an issue if the user explicitly asks for one.
