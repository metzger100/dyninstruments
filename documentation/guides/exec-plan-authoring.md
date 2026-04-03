# Guide: Execution Plan Authoring

**Status:** ✅ Reference | Structural template for high-success multi-session plans

## Overview

Use this guide when writing execution plans for complex work that spans files or sessions. The structure below is the required baseline for consistent first-attempt implementation success.

## Key Details

- Active plans live in `exec-plans/active/`; completed plans move to `exec-plans/completed/`.
- Plan filenames use sequential numbering: `PLAN{N}.md`.
- For complex tasks, the plan is the implementation source of truth until completion.

## Required Plan Sections

| Section | Purpose | Contract |
|---|---|---|
| Status | Scope and authority | State what the plan covers and what is prescriptive vs flexible |
| Goal | Observable outcomes | List all user-visible/repo-visible results after completion |
| Verified Baseline | Repository-verified facts | Numbered facts checked against current repository state |
| Hard Constraints | Non-negotiable boundaries | Explicit "must not change" rules, scope limits, architecture limits |
| Implementation Order | Phased delivery | Per phase: intent, dependencies, deliverables, exit conditions |
| Acceptance Criteria | Done definition | Group criteria by area and tie to implementation owners when needed |
| Related | Dependency chain | Link dependent docs/plans needed to execute safely |

## Verified Baseline Rules

- Number every fact sequentially.
- Verify each fact against current repository files, not memory.
- Include file paths, API shapes, config values, tuples, and existing test patterns.
- Include explicit negative facts when introducing something new.

## Hard Constraints Rules

- Define exact files/directories that must not change.
- Define scope boundaries (file types, directories, systems in scope).
- Define architectural limits (no duplicate utilities, no parallel ownership of responsive policy, etc.).

## Phase Structure Rules

- Start each phase with a one-sentence intent.
- Declare dependencies on previous phases explicitly.
- Keep deliverables concrete: file paths, section names, registration entries, command gates.
- Keep exit conditions executable: required checks, required tests, required numeric/line-count limits.

## Anti-Patterns

- Writing a plan without a verified baseline.
- Mixing implementation and documentation work inside the same phase.
- Defining acceptance criteria only after coding starts.

## Related

- [PLAN6.md](../../exec-plans/completed/PLAN6.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [../conventions/documentation-format.md](../conventions/documentation-format.md)
- [documentation-maintenance.md](documentation-maintenance.md)
