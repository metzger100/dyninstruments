# CONTRIBUTING (Developer + AI Workflow)

This document is for contributors using AI coding tools.
It describes how to prompt, when to use planning mode, what the AI will do, and what the developer must verify before merge.

## 1) Purpose and Audience

- Audience: Developers using Codex/Claude Code.
- Goal: fast implementation without quality drift.
- Rule: the developer owns final correctness, architecture quality, and documentation quality.

## 2) Local Setup (AvNav + Plugin)

### 2.1 Clone AvNav and plugin (remeber to change the paths)

```bash
git clone https://github.com/wellenvogel/avnav.git ~/avnav-master
mkdir -p ~/avnav-master/run/avnavdata/plugins
git clone https://github.com/metzger100/dyninstruments.git ~/avnav-master/run/avnavdata/plugins/dyninstruments
```

### 2.2 Install plugin dev dependencies

Run inside the plugin folder:

```bash
cd ~/avnav-master/run/avnavdata/plugins/dyninstruments
npm ci
```

### 2.3 Install and watch AvNav viewer

```bash
cd ~/avnav-master/viewer
npm install
npm run watch
```

### 2.4 Run AvNav server

In another terminal:

```bash
python3 ~/avnav-master/server/avnav_server.py \
  -w ~/avnav-master/run/avnavdata \
  -o 8080 \
  -u viewer=~/avnav-master/viewer/build/debug,user=~/avnav-master/run/avnavdata/user
```

### 2.5 Verify plugin load

- Open AvNav in the browser.
- Enter layout edit mode.
- Confirm `dyninstruments_*` widgets are visible.

## 3) How to Prompt AI Effectively

Use explicit prompts with scope, constraints, required checks, and documentation requirements.

### Prompt template: small change

```text
Implement this focused change only:
- Scope: <files/features>
- Out of scope: <what must not be changed>
- Constraints: follow AGENTS.md rules and existing architecture boundaries
- Validation required: npm run check:strict
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
- npm run check:strict
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
- Run npm run check:strict
- Report exactly which docs were updated and why
```

## 4) Planning Mode helps improving the results

The AI does not decide whether planning mode should be enabled. The Developer must decide before prompting.

| Situation | Planning Mode |
|---|---|
| Single-file fix, low risk, no architecture impact | Optional |
| Multi-file change with mapper/runtime/shared interactions | Required |
| Refactor touching boundaries, deps, or checks | Required |
| Any unclear requirement or high ambiguity | Required |
| Pure doc typo/text cleanup | Usually not needed |

If unsure, choose planning mode.

## 5) What the AI Will Do

When correctly prompted, the AI will:

- follow rules in `AGENTS.md` / `CLAUDE.md`
- follow architecture and boundary constraints
- apply code + doc changes
- run required checks/tests and report results

This only works if the prompt includes clear scope and required validation.

## 6) Mandatory Human Review Responsibilities

Before merge, the developer must verify:

1. Code and documentation match each other.
2. No AI slop was introduced, including:
   - unnecessary generic abstractions
   - duplicated helpers instead of shared utilities
   - host-boundary violations (for example `avnav.api` usage outside allowed runtime boundaries)
   - weakened assertions or superficial tests
   - stale docs after behavior/config changes
3. Validation outputs are real and complete for scope.

## 7) If AI Slop Is Found

Do not just patch symptoms.

At least one prevention action is required:

1. Strengthen/enhance linter or check scripts so this class of issue is caught automatically, or
2. Add/update documentation guardrails that define the correct pattern and where it belongs.

Prefer both when practical.

## 8) Execution and Validation Workflow

Install tracked local hooks once per clone:

```bash
npm run hooks:install
npm run hooks:doctor
```

Run from repository root after implementation:

```bash
npm run check:smells
npm run check:strict
```

For faster local iteration before final validation, targeted checks are still useful:

```bash
npm run check:all
npm test
```

Do not merge with failing checks.

## 9) Pre-Merge Checklist

- [ ] Prompt had explicit scope, constraints, and required checks.
- [ ] Planning mode was chosen deliberately by the human.
- [ ] Implementation matches requested intent and scope.
- [ ] Documentation was updated wherever behavior/config/contracts changed.
- [ ] AI slop review completed.
- [ ] `npm run hooks:doctor` passed.
- [ ] `npm run check:smells` passed.
- [ ] `npm run check:strict` passed.
