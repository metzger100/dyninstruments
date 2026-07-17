# CONTRIBUTING (Developer + AI Workflow)

This document is for contributors using AI coding tools.
It describes how to prompt, when to use planning mode, what the AI will do, and what the developer must verify before merge.

## 1) Purpose and Audience

- Audience: Developers using Codex/Claude Code.
- Goal: fast implementation without quality drift.
- Rule: the developer owns final correctness, architecture quality, and documentation quality.

## 2) Local Setup (AvNav + Plugin)

### 2.1 Clone AvNav and plugin (remember to change the paths)

```bash
git clone https://github.com/wellenvogel/avnav.git ~/avnav-master
mkdir -p ~/avnav-master/run/avnavdata/plugins
git clone https://github.com/metzger100/dyninstruments.git ~/avnav-master/run/avnavdata/plugins/dyninstruments
```

### 2.2 Install plugin dev dependencies

Run inside the plugin folder:

```bash
cd ~/avnav-master/run/avnavdata/plugins/dyninstruments
npm run setup
```

The supported development runtime is Node 26 with npm 12.0.1. `npm run setup`
runs the locked install and provisions the checksum-verified actionlint binary
in the persistent cache outside `node_modules`.

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

For final manual validation, also verify one radial gauge, one linear gauge,
and one HTML widget from the bundled layouts; switch day/night appearance; and
exercise the route/AIS interaction controls. Record the date, AvNav version,
browser, representative widgets/layouts, and any limitation in the active
execution plan before declaring the migration complete.

## 3) How to Prompt AI Effectively

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
- follow `AGENTS.md` (canonical agent guidance; `CLAUDE.md` points there)
- keep runtime boundaries intact
Required validation:
- npm run check:all
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
- Run npm run check:all
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

- follow rules in `AGENTS.md`
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

1. Add or strengthen a standard lint/type/schema rule when the problem is static.
2. Add or strengthen a behavior or contract test when the problem is semantic.
3. Add focused documentation when the correct design is not discoverable.

New custom checker code is allowed only for irreducible AvNav contracts with a
documented reason.

## 8) Execution and Validation Workflow

Optional local hooks can be installed when `pre-commit` is available:

```bash
pre-commit install
pre-commit run --all-files
```

The hooks run fast local checks only. The complete local `check:all` gate is the
quality authority; tag pushes rerun it before GitHub publishes only the locally
prepared, committed release artifacts.

Run from repository root after implementation:

```bash
npm run check:all
```

For faster local iteration before final validation, targeted checks are still useful:

```bash
npm run check:standard
npm run check:fast
npm run check:core
npm run test:split
npm test
```

`check:standard` is the standard-tool layer: scoped Prettier config/workflow
formatting, ESLint, Stylelint, pinned actionlint workflow validation, and jscpd.
Any clone detected by jscpd fails this layer.
`check:fast` adds strict type checking and Node-only unit/tool tests without
the full coverage gate.
`check:core` includes it plus
`typecheck`, `package:check`, and `docs:check` before the remaining
project-specific Dyni gates.
`test:split` separates Node-only tool tests from jsdom runtime/widget tests.

Do not merge with failing checks.

## 9) Releasing

Use the dedicated release guide for the full local-first workflow, SemVer decision rules, and release notes expectations:

- [documentation/guides/release-workflow.md](documentation/guides/release-workflow.md)

In short: run `npm run release:prepare`, choose a full SemVer version, write
notes in `releases/dyninstruments-VERSION.md`, then run
`npm run release:create -- --version=VERSION`. Prereleases such as
`4.0.0-beta.1` use the same flow.

Tag publication uses the committed release artifacts created locally. The
tag workflow reruns locked setup and `check:all`, validates SemVer, and never
rebuilds the ZIP. It publishes SemVer prerelease tags as GitHub prereleases and
stable tags as normal releases. The documented manual AvNav validation
supplements the blocking jsdom and VM contracts before release creation.

## 10) Pre-Merge Checklist

- [ ] Prompt had explicit scope, constraints, and required checks.
- [ ] Planning mode was chosen deliberately by the human.
- [ ] Implementation matches requested intent and scope.
- [ ] Documentation was updated wherever behavior/config/contracts changed.
- [ ] AI slop review completed.
- [ ] Optional `pre-commit run --all-files` passed when pre-commit is installed.
- [ ] `npm run check:all` passed (required final gate).
