# CONTRIBUTING (Human + AI Workflow)

This document is for human contributors using AI coding tools.
It describes how to prompt, when to use planning mode, what the AI will do, and what the human must verify before merge.

## 1) Purpose and Audience

- Audience: human developers using Codex/Claude-style coding agents.
- Goal: fast implementation without quality drift.
- Rule: the human owns final correctness, architecture quality, and documentation quality.

## 2) How to Prompt AI Effectively

Use explicit prompts with scope, constraints, required checks, and documentation requirements.

### Prompt template: small change

```text
Implement this focused change only:
- Scope: <files/features>
- Out of scope: <what must not be changed>
- Constraints: follow AGENTS.md rules and existing architecture boundaries
- Validation required: npm run check:all
- Documentation requirement: update linked docs if behavior or configuration changed
```

### Prompt template: medium/complex change

```text
Work in planning mode first, then implement after plan approval.
Goal: <target outcome>
Success criteria:
- <criterion 1>
- <criterion 2>
Scope:
- In scope: <items>
- Out of scope: <items>
Constraints:
- follow AGENTS.md/CLAUDE.md
- keep runtime boundaries intact
Required validation:
- npm run check:all
- npm test
Documentation co-evolution:
- update docs that describe touched behavior in the same change
```

### Prompt template: refactor + docs sync

```text
Refactor this area without behavior regression:
- Target: <module/files>
- Keep external behavior stable
- Remove duplication and keep dependency direction rules
- Update related docs to match refactor
- Run npm run check:all and npm test
- Report exactly which docs were updated and why
```

## 3) Planning Mode Is a Human Decision

The AI does not decide whether planning mode should be enabled. The human must decide before prompting.

| Situation | Planning Mode |
|---|---|
| Single-file fix, low risk, no architecture impact | Optional |
| Multi-file change with mapper/runtime/shared interactions | Required |
| Refactor touching boundaries, deps, or checks | Required |
| Any unclear requirement or high ambiguity | Required |
| Pure doc typo/text cleanup | Usually not needed |

If unsure, choose planning mode.

## 4) What the AI Will Do

When correctly prompted, the AI will:

- follow rules in `AGENTS.md` / `CLAUDE.md`
- follow architecture and boundary constraints
- apply code + doc changes
- run required checks/tests and report results

This only works if the prompt includes clear scope and required validation.

## 5) Mandatory Human Review Responsibilities

Before merge, the human must verify:

1. Code and documentation match each other.
2. No AI slop was introduced, including:
   - unnecessary generic abstractions
   - duplicated helpers instead of shared utilities
   - host-boundary violations (for example `avnav.api` usage outside allowed runtime boundaries)
   - weakened assertions or superficial tests
   - stale docs after behavior/config changes
3. Validation outputs are real and complete for scope.

## 6) If AI Slop Is Found

Do not just patch symptoms.

At least one prevention action is required:

1. Strengthen/enhance linter or check scripts so this class of issue is caught automatically, or
2. Add/update documentation guardrails that define the correct pattern and where it belongs.

Prefer both when practical.

## 7) Execution and Validation Workflow

Run from repository root after implementation:

```bash
npm run check:all
```

If behavior/runtime logic changed:

```bash
npm test
```

If core logic or test tooling changed:

```bash
npm run test:coverage:check
```

Do not merge with failing checks.

## 8) Pre-Merge Human Checklist

- [ ] Prompt had explicit scope, constraints, and required checks.
- [ ] Planning mode was chosen deliberately by the human.
- [ ] Implementation matches requested intent and scope.
- [ ] Documentation was updated wherever behavior/config/contracts changed.
- [ ] AI slop review completed.
- [ ] `npm run check:all` passed.
- [ ] `npm test` passed when behavior/runtime changed.
- [ ] `npm run test:coverage:check` passed when required.
