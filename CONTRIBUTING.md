# CONTRIBUTING (Developer + AI Workflow)

This document is for contributors using AI coding tools. It describes how to prompt, when to use planning mode, what the
AI will do, and what the developer must verify before merge.

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

The supported development runtime is Node 26 with npm 12.0.1. `npm run setup` runs the locked install and provisions the
checksum-verified actionlint binary in the persistent cache outside `node_modules`.

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

For final manual validation, complete the full profile-aware checklist in
[documentation/guides/manual-avnav-validation.md](documentation/guides/manual-avnav-validation.md): representative
radial/linear/HTML widgets, day/night switching, route/AIS interactions, and package upgrade/rollback. Record the date,
AvNav version, plugin commit/version, environment, and results before declaring a release validated; `release:prepare`
prints this checklist's location as a reminder but never completes it automatically.

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

| Situation                                                 | Planning Mode      |
| --------------------------------------------------------- | ------------------ |
| Single-file fix, low risk, no architecture impact         | Optional           |
| Multi-file change with mapper/runtime/shared interactions | Required           |
| Refactor touching boundaries, deps, or checks             | Required           |
| Any unclear requirement or high ambiguity                 | Required           |
| Pure doc typo/text cleanup                                | Usually not needed |

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

New custom checker code is allowed only for irreducible AvNav contracts with a documented reason.

## 8) Execution and Validation Workflow

Install the tracked local pre-push hook once per clone:

```bash
npm run hooks:install
npm run hooks:doctor
```

The hook runs `npm run check:all` before every push and blocks failures. Git does not activate a tracked hook directory
automatically, so repeat this setup for each clone; `hooks:doctor` provides the repair command when it drifts.

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

`check:standard` is the standard-tool layer: full-repository Prettier formatting (every maintained JS/MJS, CSS, and
Markdown file plus config/workflow files and the lockfile, checked against Prettier's real effective ignore resolution),
ESLint, Stylelint, pinned actionlint workflow validation, and jscpd. Any clone detected by jscpd fails this layer.
`check:fast` adds strict type checking and a bounded `test:unit` selection (`unit-node` plus `unit-dom`) without the
full coverage gate; it is fast local feedback, not the required final gate. `check:core` is the complete non-coverage
repository gate: it runs everything `check:fast` runs plus `typecheck` (production/config `checkJs`, inventory-owned
tests, and every maintained `tools/**/*.mjs` script under `tsconfig.tools.json`), `package:check`, the complete
configured Vitest suite exactly once via `test:split` (`unit-node` + `contract` + `unit-dom`), `check:complexity` (a
portable, Git-free digest proof plus the complexity no-regression budget; `npm run complexity:regenerate-audit` is the
maintainer-only Git-based regeneration audit), `check:scaling` (deterministic operation-count contracts, never timing),
and `docs:check`. `test:coverage:check` separately reruns the same three Vitest projects under V8 instrumentation
afterward for coverage evidence; the duplication with `check:core`'s ordinary run is intentional. `package:check`
derives registry fragments from the browser bootstrap manifest and proves component dependency/resource closure and
exact release staging contents. `npm run dependencies:audit` runs a networked `npm audit`; run it after dependency
updates and during scheduled maintenance, never as part of `check:all`.

This repository is a viewer-profile quality role model, not a blank-plugin starter:
`check:fast`/`check:core`/`check:all` share the same bounded/complete/coverage meaning across sibling AvNav plugin
repositories, while Vitest, coverage floors, and the historical complexity ratchet remain Dyninstruments-specific legacy
tracking. An optional `.codex/config.toml` provides portable Codex CLI defaults; it is contributor tooling only, never a
runtime or contribution requirement.

Do not merge with failing checks.

## 9) Releasing

Use the dedicated release guide for the full local-first workflow, SemVer decision rules, and release notes
expectations:

- [documentation/guides/release-workflow.md](documentation/guides/release-workflow.md)

In short: run `npm run release:prepare`, choose a full SemVer version, write notes in
`releases/dyninstruments-VERSION.md`, then run `npm run release:create -- --version=VERSION`. Prereleases such as
`4.0.0-beta.1` use the same flow.

Tag publication uses the committed release artifacts created locally. GitHub validates tag/artifact identity and
publishes the committed ZIP and notes without installing dependencies, rerunning quality, rebuilding, packaging,
committing, or tagging. It publishes SemVer prerelease tags as GitHub prereleases and stable tags as normal releases.
The documented manual AvNav validation supplements the blocking jsdom and VM contracts before release creation. Registry
fragments require no release-only inventory update; the package builder discovers them from `config.bootstrapManifest`
and fails when bootstrap, disk, dependencies, resources, or staging contents drift.

## 10) Pre-Merge Checklist

- [ ] Prompt had explicit scope, constraints, and required checks.
- [ ] Planning mode was chosen deliberately by the human.
- [ ] Implementation matches requested intent and scope.
- [ ] Documentation was updated wherever behavior/config/contracts changed.
- [ ] AI slop review completed.
- [ ] `npm run hooks:doctor` confirms the tracked pre-push hook is installed for this clone.
- [ ] `npm run check:all` passed (required final gate).
