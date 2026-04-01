---
name: write-a-prd
description: Create a repo-local feature brief / PRD for dyninstruments through codebase exploration and user interview, then save it as an exec-plans/active/PLAN*.md artifact instead of a GitHub issue.
---

# Write a PRD

Use this skill when the user wants to define a feature, clarify requirements, or write an implementation-ready PRD that fits this repository.

## 1. Capture the problem and desired outcome

If the user already described the feature, start there. Otherwise ask for:

- the user problem
- the intended outcome
- who benefits
- constraints or must-haves
- any implementation ideas already on the table

## 2. Mandatory repo preflight

Always read first:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

Then read only the most relevant additional docs and code paths.

## 3. Explore the repo before making requirements claims

Verify the current architecture and existing feature surface so the PRD reflects the real codebase.

Look for:

- nearest existing widget, renderer, cluster, or guide
- current editable parameters and config ownership
- runtime or host constraints
- documentation that defines user-visible behavior
- existing tests or coverage gaps

## 4. Interview until the feature boundary is clear

Resolve the major branches of the design tree, including:

- target cluster and kind
- data inputs and store keys
- user-visible behavior and state changes
- interaction model, if any
- visual / layout expectations
- surface choice (`html` vs `canvas-dom`)
- settings/editables
- success criteria
- out-of-scope items

When a question can be answered from the repo, inspect the repo instead of asking the user.

## 5. Sketch the module impact in repo terms

Describe the likely modules, seams, and docs that the feature will touch. Prefer dyninstruments concepts over generic app architecture.

Typical areas include:

- cluster config and kind registration
- mapper / view-model shaping
- renderer/widget implementation
- shared layout or helper utilities
- CSS/state contract
- tests
- documentation

Deep modules are encouraged, but the proposal must respect this repo's existing ownership and file-size constraints.

## 6. Write the PRD as a repo-local artifact

Save the result to `exec-plans/active/PLAN<N>.md` using the next free plan number after checking active and completed plans.

Use a structure like this:

```md
# PLAN<N> — <Feature Name>

## Status

Why this feature brief exists and what request it came from.

## Problem Statement

The problem from the end-user or maintainer perspective.

## Goals

The outcomes this feature must achieve.

## User Stories

A numbered list of concrete user stories.

## Verified Baseline

Concrete repo facts checked before writing the PRD.

## Proposed Solution

High-level solution shaped around the real repo architecture.

## Implementation Decisions

Durable technical choices already understood.

## Testing Decisions

What should be tested, how success is verified, and any prior-art tests to mirror.

## Documentation Impact

Docs that must be created or updated.

## Out of Scope

Explicit non-goals.

## Open Questions

Any unresolved items.
```

## 7. Optional handoff

If the user wants an execution plan immediately after the PRD, convert the approved brief into phased work using the `prd-to-plan` approach and keep the output in the repo-local `exec-plans/active/` workflow.

## 8. Output rule

Do not default to a GitHub issue. In this repository, the primary artifact is the local markdown plan/brief under `exec-plans/active/`.
