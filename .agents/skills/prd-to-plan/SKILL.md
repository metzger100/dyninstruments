---
name: prd-to-plan
description: Turn a PRD or feature brief into a repo-local dyninstruments execution plan with phased vertical slices, saved in exec-plans/active/PLAN*.md.
---

# PRD to Plan

Convert a PRD into a phased, implementation-ready execution plan that matches this repository's planning style.

## 1. Confirm the source brief

The PRD, feature brief, or requirement set should already be in context. If it is not, ask the user to paste it or point to the file.

## 2. Mandatory repo preflight

Always read before planning:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

Then read only the most relevant additional docs and source areas for the requested feature. Prefer existing guides, widget docs, architecture docs, and the nearest current implementation.

Also inspect existing plans in:

- `exec-plans/active/`
- `exec-plans/completed/`

Match their tone, structure, and specificity.

## 3. Verify the current baseline in the repo

Before drafting phases, verify the current implementation reality and capture it concretely.

The baseline should use specific modules, configs, docs, and contracts when they are already stable and verified in the repo. In this repository, concrete references are preferred over vague guesses.

Typical baseline items include:

- relevant cluster config owners under `config/clusters/`
- mapper or view-model owners under `cluster/`
- renderer/widget owners under `widgets/` or `cluster/rendering/`
- shared helpers, formatters, and layout utilities
- existing docs that define the behavior or style contract
- existing tests or coverage gaps in the affected area

## 4. Capture durable repo-specific decisions

Before slicing work, identify decisions that are unlikely to change during implementation. Prefer dyninstruments-specific decisions such as:

- cluster / kind ownership
- surface choice (`html` vs `canvas-dom`)
- store keys and data sources
- editable parameter ownership
- host-action or `avnav.api` boundaries
- shared layout / fit / rendering ownership
- documentation owners that must stay in sync

Do not force generic sections like routes, database schema, or auth unless the feature genuinely needs them.

## 5. Draft thin vertical slices

Break the work into tracer-bullet phases.

### Vertical slice rules

- Each phase must be end-to-end through the real repo layers it touches.
- A phase should be demoable or verifiable on its own.
- Prefer many thin slices over a few large ones.
- Use concrete module references when they are verified and durable enough to guide the work.
- Avoid speculative file names or invented abstractions.
- Include tests and documentation in the slices where behavior or contracts change.

In this repo, a thin slice often cuts through some subset of:

- config and kind registration
- mapper or view-model shaping
- renderer / widget implementation
- CSS or visual contract updates
- tests
- documentation

## 6. Review the proposed phase breakdown with the user

Present the phase breakdown as a numbered list. For each phase include:

- title
- user stories or goals covered
- what becomes verifiable after that phase

Ask whether the granularity is right and whether any phases should be merged, split, or reordered.

## 7. Write the plan file

Write the approved plan to `exec-plans/active/PLAN<N>.md`, where `<N>` is the next free plan number after checking both `exec-plans/active/` and `exec-plans/completed/`.

Use a structure like this:

```md
# PLAN<N> — <Feature Name>

## Status

Short status note describing why the plan exists and what source brief it was derived from.

## Goal

What the feature should accomplish for the user.

## Verified Baseline

A numbered list of repo facts verified before planning. Include concrete files/modules/docs when relevant.

## Durable Decisions / Constraints

The stable architectural decisions and repo constraints that all phases must respect.

## Phase 1: <Title>

### Scope

Describe the thin vertical slice.

### Acceptance criteria

- [ ] ...

### Notes / affected areas

- ...

## Phase 2: <Title>

...

## Testing and Validation

- tests to add or update
- docs to update
- final verification expectations
- `npm run check:all` for code changes

## Out of Scope

Items intentionally excluded from this plan.
```

## 8. Final expectations

- The plan must fit the repo's real architecture, not a generic app template.
- If the plan changes behavior or contracts, name the docs that must be updated.
- If the plan implies cleanup work, note whether `npm run gc:status` and `npm run gc:update-baseline` will be needed.
