# Guide: Execution Plan Authoring

**Status:** Current.

## Overview

Use this guide when writing execution plans for complex work that spans files or sessions. The structure below is the
required baseline for consistent first-attempt implementation success.

## Key Details

- Active plans live in `exec-plans/active/`. When a plan completes, delete it from the working tree; Git history is the
  archive.
- Plan filenames use sequential numbering: `PLAN{N}.md`.
- For complex tasks, the plan is the implementation source of truth until completion.

## Required Plan Sections

| Section                          | Purpose                   | Contract                                                                                    |
| -------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| Status                           | Scope and authority       | State what the plan covers and what is prescriptive vs flexible                             |
| Goal                             | Observable outcomes       | List all user-visible/repo-visible results after completion                                 |
| Verified Baseline                | Repository-verified facts | Numbered facts checked against current repository state                                     |
| Hard Constraints                 | Non-negotiable boundaries | Explicit "must not change" rules, scope limits, architecture limits                         |
| Implementation Order             | Phased delivery           | Per phase: intent, dependencies, deliverables, exit conditions                              |
| User-Facing Documentation Impact | Public docs sync contract | Explicitly state whether `README.md` changes are required and list exact sections to update |
| Acceptance Criteria              | Done definition           | Group criteria by area and tie to implementation owners when needed                         |
| Related                          | Dependency chain          | Link dependent docs/plans needed to execute safely                                          |

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
- If the plan touches theming, clusters/kinds, layouts, installation, configuration, requirements, or development
  workflow, include explicit `README.md` deliverables and exit conditions in the relevant phase(s).

## Anti-Patterns

- Writing a plan without a verified baseline.
- Mixing implementation and documentation work inside the same phase.
- Defining acceptance criteria only after coding starts.
- Omitting `README.md` updates for user-facing changes in theming, clusters/kinds, layouts, installation, configuration,
  requirements, or development workflow.
- Having a phase's deliverables leave a permanent plan/phase citation behind (see Exec-Plan Citation Rule below).

## Exec-Plan Citation Rule

- Only plan documents themselves (`exec-plans/**`) may narrate their own plan number or phase numbers.
- Deliverables a phase produces outside `exec-plans/` — code comments, docstrings, JSON note fields, runtime error
  messages, test names, and filenames — must never cite a plan number (`PLANn`) or a phase number (`Phase N`) as
  authority (for example a comment reading "after `PLANn`" or a filename prefixed `phaseN-`). Describe the resulting
  code or config standalone instead; the citation goes stale the moment the plan is archived.
- A literal pointer to a real plan file (`PLANn.md`) is still fine as a factual reference.
- Enforced repo-wide (outside `exec-plans/`) by `check-patterns` (`exec-plan-reference`); run `npm run check:smells`
  before closing out a phase to confirm no citation leaked into shipped output.

## Related

- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [../conventions/documentation-format.md](../conventions/documentation-format.md)
- [documentation-maintenance.md](documentation-maintenance.md)
