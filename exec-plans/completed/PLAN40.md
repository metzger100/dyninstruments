# PLAN40 — Close quality-contract gaps and establish the final viewer-profile role model

## Status

Written after repository verification and the cross-repository quality-system audit on 2026-07-27.

This plan closes the remaining Dyninstruments migration gaps: honest complete-suite command semantics, a bounded fast
gate, portable Codex configuration, corrected generic-schema provenance, synchronized contributor documentation, and
final mechanical alignment evidence with paired project.

The coding agent may choose equivalent test-helper names and file splits. The public command meanings, the exact
top-level `check:fast` composition, complete non-coverage ownership in `check:core`, portable Codex configuration,
schema-corpus truthfulness, independent repository operation, and paired acceptance matrix are prescriptive.

No pre-plan interview was run. The completed audit already resolved the relevant design branches, so this plan makes
these assumptions explicit:

1. Plugin runtime behavior, widgets, layouts, theming, AvNav integration, packaging, and release artifacts remain
   unchanged.
2. This repository remains a JavaScript/browser **role model**, not a greenfield template. Creating a generic
   scaffolder, shared quality package, default remote-CI profile, or generic `doctor` command is separate future work.
3. The current local-first governance remains deliberate for this repository. The transport-only tag publisher stays
   transport-only; no PR workflow, CODEOWNERS file, branch ruleset, or pre-commit framework is introduced here.
4. Required gates must remain independently runnable and must never read the sibling paired project checkout.
5. The paired implementation plan is paired project
   `exec-plans/active/PLAN7.md — Close quality-contract gaps and establish the final hybrid-profile role model`.
6. Common alignment means the same guarantees and contributor vocabulary, not byte-identical product-specific tools.

Repository rules and core principles outrank this plan. If implementation reveals a conflict, amend the active plan with
repository evidence instead of weakening a gate or silently improvising.

---

## Goal

Finish the Dyninstruments migration as an honest, extraction-ready viewer-profile role model whose shared quality
contracts align with paired project while its legitimate legacy ratchets remain intact.

Expected outcomes after completion:

- `check:fast` has the same bounded meaning in both exemplars: standard static checks, all typechecking, and a bounded
  unit-test selection, without the full contract aggregate, packaging, documentation, scaling, or coverage.
- `check:core` really is the complete non-coverage gate and executes every configured Vitest project through
  `test:split`.
- `check:all` remains exactly `check:core && test:coverage:check`, and `check:strict` remains its exact alias.
- The command graph has no obsolete direct `test:contract` substitute for the complete suite.
- `.codex/config.toml` is portable, byte-identical to the paired exemplar, and contains no OS-specific or unpinned MCP
  command.
- The plugin-schema corpus accurately records that paired project now shares the generic base/schema cases.
- Contributor and quality documentation distinguish the shared role-model contract from Dyninstruments-specific Vitest,
  coverage, complexity, mapper, widget, and layout policy.
- The current full quality gate, hook diagnostics, package checks, and paired mechanical comparison pass from clean
  worktrees.

---

## Verified Baseline

The following facts were rechecked against Dyninstruments `9a62c68b2cde6df4afb9be4248e18de46ef52af9` before this plan
was written:

1. The worktree is clean on `main`, tracking `origin/main`, and `exec-plans/active/` contains no active plan other than
   its marker file.
2. The completed audit ran `npm run check:all` successfully: 442 Vitest files and 1,924 tests passed; aggregate coverage
   was 93.24% lines and 79.77% branches.
3. Node 26, npm 12.0.1, `packageManager = npm@12.0.1`, and all direct development dependencies are exact. Twelve common
   maintained-tool versions currently match paired project exactly.
4. `check:all` is exactly `npm run check:core && npm run test:coverage:check`; `check:strict` is exactly
   `npm run check:all`.
5. `check:core` currently runs `test:contract` but never invokes `test:split`. It therefore omits the `unit-node` and
   `unit-dom` suites while `documentation/conventions/quality-gates.md` calls it the complete non-coverage repository
   gate.
6. `test:split = vitest run` is the canonical complete configured suite and covers `unit-node`, `contract`, and
   `unit-dom`.
7. `check:fast` currently expands to `check:standard`, `typecheck`, and `test:node`. A separate `test:unit` script
   already runs both `unit-node` and `unit-dom`.
8. `tests/tools/package-scripts.test.js` locks the current `check:fast` and `check:core` strings but does not prove that
   `check:core` reaches `test:split` exactly once or that the three project classes are complete.
9. `package:check` owns Ajv schema validation plus focused release-tool tests; `test:coverage:check` owns the complete
   coverage run plus the per-file coverage inventory.
10. The command graph has no current repeated npm-script path equivalent to paired project's duplicated `check:smells`;
    the Dyn change must not introduce one.
11. `schemas/avnav-plugin-base.schema.json` is byte-identical in both repositories, and both schema corpora contain the
    same generic valid and invalid case payloads.
12. `tools/quality-policy/plugin-schema-corpus.json` still says that no sibling has published a base/profile split.
    paired project now has `schemas/avnav-plugin-base.schema.json`, `schemas/plugin.schema.json`, and the matching
    generic corpus, so that note is false.
13. `.codex/config.toml` contains useful project-document and sandbox defaults, but also configures Windows `cmd`,
    Windows environment paths, and `chrome-devtools-mcp@latest`.
14. paired project currently tracks an empty file named `.codex`; neither current shape is a portable paired
    configuration.
15. `.github/workflows/publish-release.yml` is the only workflow. It is intentionally tag-only and pins
    `actions/checkout` v6.0.2 and `softprops/action-gh-release` v2.6.2 by reviewed commit SHA.
16. `.githooks/pre-push` invokes exactly one `npm run check:all`; `npm run hooks:doctor` passes after hook activation.
17. The complexity policy has 175 active legacy findings backed by a digest-anchored historical capture. The current
    gate rejects new identities and raises; this legitimate migration ratchet must not be replaced by paired project's
    greenfield strict-only model.
18. Coverage owns all 228 production files with 80% line/65% branch defaults and twelve frozen below-default legacy
    paths. No coverage floor or exception is in scope for change.
19. `README.md` has 237 non-empty lines, while the quality-gate and testing-infrastructure documents have 148 and 172
    non-empty lines respectively. All are below the 400-non-empty-line limit.
20. The next sequential execution-plan number is 40.

---

## Target Alignment Contract

The paired plans use this vocabulary. Profile-specific extensions are allowed only where shown.

| Interface                        | Shared meaning                                                             | Dyninstruments implementation                      |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| `setup`                          | Locked dependency install and checksum-verified tool provisioning          | npm plus actionlint cache                          |
| `check:fast`                     | Static standards, full typing, bounded unit tests                          | Exactly `check:standard && typecheck && test:unit` |
| `check:core`                     | Complete deterministic non-coverage repository gate                        | Includes `test:split` exactly once                 |
| `check:all`                      | Complete non-coverage gate plus native coverage enforcement                | Exactly `check:core && test:coverage:check`        |
| `check:strict`                   | Compatibility alias for the required final gate                            | Exactly `check:all`                                |
| `docs:check`                     | Markdown, link, shape, and reachability enforcement                        | Existing Markdown/Vitest owners                    |
| `schema:check`                   | Generic AvNav base plus product-profile validation                         | Ajv base + layouts profile                         |
| `check:complexity`               | No new complexity debt                                                     | Historical Dyn ratchet remains product-specific    |
| `check:scaling`                  | Deterministic counted-operation contracts                                  | Existing Vitest contracts                          |
| `hooks:install` / `hooks:doctor` | Explicit local hook activation and diagnosis                               | Existing hook owners                               |
| release commands                 | Local gated artifact creation; tag workflow transports committed artifacts | Existing release owners                            |

`check:fast` is defined by graph scope, not a wall-clock promise. It must exclude `test:split`, `test:contract`,
`test:coverage:check`, package/release validation, documentation checks, and complexity/scaling gates. Dyninstruments'
existing `unit-node` project may continue to exercise focused quality-tool unit tests.

---

## Architecture Notes

### Complete core and coverage remain separate

`check:core` must run every ordinary test project even though `test:coverage:check` later executes tests again with V8
instrumentation. The first run proves the complete non-coverage contract and gives direct failures; the second owns
coverage evidence. The duplication between ordinary and instrumented execution is intentional and must be documented as
such.

### Alignment is semantic, not a copied tool tree

Dyninstruments keeps Vitest/jsdom, its 228-file coverage inventory, historical complexity capture, mapper boundaries,
theme contracts, and layout/package profile. paired project keeps Python, Node's test runner, c8, Ruff, mypy, and
server-plugin policy. Only public meanings, common maintained-tool pins, generic schema cases, AI configuration, hook
and release intent, and evidence vocabulary align.

### Role model is not greenfield output

The future generator must start without historical debt, but this repository must preserve its proven legacy ratchets.
No implementation phase may delete valid migration evidence merely to resemble an empty project.

---

## Hard Constraints

### Runtime and product behavior

- Do not modify `plugin.js`, `plugin.mjs`, `runtime/`, `cluster/`, `config/`, `shared/`, `widgets/`, layouts, CSS, or
  AvNav runtime behavior.
- Do not add a bundler, runtime build, browser driver, Playwright dependency, npm runtime dependency, or ES-module
  conversion of classic runtime scripts.
- Do not change release ZIP contents, widget registrations, user configuration, visuals, or formatter behavior.

### Quality integrity

- Do not lower or delete coverage floors, complexity values, hotspot budgets, file-size limits, strict test
  classifications, type checks, smell rules, documentation checks, or package checks.
- Do not add a suppression, skipped/focused test, coverage exception, formatter ignore, or new debt-baseline entry to
  make a gate pass.
- Keep `test:coverage:check` and all 175 legitimate complexity entries unchanged except for mechanically justified
  shrinkage caused by unrelated concurrent work.
- Every changed command/config contract needs a focused positive assertion and a focused negative or drift assertion.
- Required gates remain deterministic, external-browser-free, and offline after successful setup.

### Repository independence and paired work

- No required script, hook, test, release command, or documentation checker may resolve `../paired-project`.
- The paired checkout may be read only by the final one-off alignment comparison, never by a committed gate.
- Do not create the future scaffolder, shared npm package, remote-CI profile, CODEOWNERS file, or generic project
  manifest in this plan.
- Do not claim byte identity for product-coupled tools. Record justified differences instead.

### File organization

- Keep all maintained JS/MJS/declaration/Markdown files below 400 non-empty lines; exec-plans remain exempt.
- Check `README.md`, `documentation/conventions/quality-gates.md`, and
  `documentation/conventions/testing-infrastructure.md` before and after edits. Split focused documentation if any
  approaches the limit; do not compress prose.
- Keep active-plan prose inside `exec-plans/`; no shipped source, test name, config note, or documentation paragraph may
  cite this plan or its phases as authority.

---

## Implementation Order

### Phase A — Reconfirm the paired baseline and freeze the common contract

**Intent:** Prevent either implementation from landing against stale versions or different command meanings.  
**Dependencies:** None.

#### A1. Record standalone evidence

- Record HEAD, clean status, Node/npm versions, `npm run hooks:doctor`, and the current `npm run check:all` result in
  this plan's completion-evidence section.
- Record current test counts, coverage summary, complexity entry count, and coverage-inventory count.

#### A2. Compare paired common inputs

- Mechanically compare exact common dependency versions, Node/npm declarations, actionlint version/checksums, GitHub
  Action SHAs, generic AvNav schema, generic schema cases, and SemVer case payloads.
- Confirm the paired plan still specifies the same `check:fast`, `check:core`, Codex, independence, and role-model
  boundaries.
- If the sibling changed after this plan's verified commit, amend both active baselines before implementation.

**Exit conditions:**

- Both repositories start clean and pass their current required gates.
- Every common target is recorded with no unexplained disagreement.
- Neither plan requires a committed cross-repository dependency.

### Phase B — Make command names match their documented scope

**Intent:** Give contributors one honest fast path and one complete non-coverage path.  
**Dependencies:** Phase A.

#### B1. Normalize the fast gate

- Change `check:fast` in `package.json` to exactly: `npm run check:standard && npm run typecheck && npm run test:unit`.
- Keep the existing `test:unit` owner for the `unit-node` and `unit-dom` projects.
- Do not add contract, package, docs, scaling, complexity, coverage, or release checks to `check:fast`.

#### B2. Complete the core gate

- Replace the direct `test:contract` position in `check:core` with `test:split`.
- Keep `test:split = vitest run`; do not recreate its project inventory in a package-script allowlist.
- Preserve all other required groups: standard checks, typing, package/schema checks, focus proof, smells, complexity,
  scaling, documentation, and file size.

#### B3. Strengthen command-graph contracts

- Update `tests/tools/package-scripts.test.js`, or split a focused command-graph test if clearer, to prove:
  - exact `check:fast`, `check:all`, and `check:strict` strings;
  - `check:core` reaches `test:split` exactly once and does not use `test:contract` as a substitute;
  - the configured full suite contains all three Vitest projects;
  - every required core group remains reachable;
  - coverage and maintainer-only network commands remain outside `check:fast`;
  - `dependencies:audit` remains outside `check:core` and `check:all`.
- Add a deliberate package-script fixture or mutation assertion showing that removal of `test:split` fails the contract.

**Exit conditions:**

- `npm run check:fast`, `npm run test:split`, and the focused package-script tests pass.
- A mechanical graph walk sees `test:split` once from `check:core`.
- The package-script tests fail against a fixture that restores the incomplete old core composition.

### Phase C — Install one portable paired Codex configuration

**Intent:** Remove host-specific and unpinned AI-tool behavior from the role model.  
**Dependencies:** Phase A.

#### C1. Normalize `.codex/config.toml`

- Retain only repository-portable project-document, approval, sandbox, and cached-search defaults that are supported by
  the currently installed Codex configuration schema.
- Remove the Windows `cmd` launcher, Windows environment variables, and the `chrome-devtools-mcp@latest` server block.
- Do not replace it with a different networked or platform-specific MCP. Browser tooling is not required by the
  repository's quality gate.
- Use the exact same normalized file bytes as paired project.

#### C2. Add a local drift proof

- Add a focused test that reads the committed configuration as text and proves the required portable keys and absence of
  `@latest`, `cmd`, `powershell`, Windows environment paths, absolute user paths, and MCP server declarations.
- Keep the proof dependency-free; do not add a TOML parser solely for this small fixed configuration.
- The paired final comparison, not the local test, owns byte equality between repositories.

**Exit conditions:**

- The local configuration contract test passes.
- A deliberate forbidden-token fixture fails.
- The two `.codex/config.toml` files are byte-identical.

### Phase D — Correct generic schema provenance

**Intent:** Make the generic schema evidence describe the current paired reality.  
**Dependencies:** Phase A.

#### D1. Repair the corpus note

- Update only the note/provenance text in `tools/quality-policy/plugin-schema-corpus.json`.
- State that the generic AvNav base schema and generic case payloads are shared with paired project, while
  `dynLayoutsProfile` remains local.
- Do not change any generic or layouts-profile valid/invalid case in this phase.

#### D2. Lock the shared payload

- Extend the existing schema tests to assert the intended local generic case payload explicitly.
- In the final paired proof, compare `schemas/avnav-plugin-base.schema.json` byte-for-byte and compare the `genericBase`
  payload structurally while intentionally excluding repository-specific note/profile fields.

**Exit conditions:**

- `npm run schema:check` and `npm run package:check` pass.
- The old false “no sibling repository” phrase is absent.
- Generic schema and generic case comparisons pass without coupling the required gate to the sibling.

### Phase E — Synchronize contributor and quality documentation

**Intent:** Make the final command and role-model boundaries discoverable without relying on historical plans.  
**Dependencies:** Phases B–D.

#### E1. Update command-owner documentation

- Update `documentation/conventions/quality-gates.md` with the exact `check:fast` and `check:core` graphs.
- State explicitly that ordinary complete-suite execution in `check:core` and instrumented execution in
  `test:coverage:check` have different owners and therefore both run.
- Update `documentation/conventions/testing-infrastructure.md` and `documentation/guides/documentation-maintenance.md`
  where they describe the iteration/final gates.

#### E2. Update contributor-facing documentation

- Update the development/checking sections of `README.md` and `CONTRIBUTING.md`:
  - `check:fast` is bounded feedback, not the final gate;
  - `check:core` is complete except for coverage;
  - `check:all` is required before handoff/push/release;
  - hooks remain explicit local activation;
  - the tag workflow remains transport-only.
- Explain that the repository is a viewer-profile role model with product-specific legacy ratchets, not a blank-plugin
  starter.
- Mention the portable repository Codex configuration only as optional contributor tooling; do not make Codex a runtime
  or contribution requirement.

#### E3. Check routing documents

- Update `AGENTS.md` or `CLAUDE.md` only if their present command descriptions become inaccurate.
- Do not duplicate the quality-gate table into routing files; link to the canonical quality-gate document.

**Exit conditions:**

- `npm run docs:check` passes.
- README and contributor guidance use the same command meanings as `package.json`.
- Every edited maintained Markdown file remains below 400 non-empty lines.

### Phase F — Prove standalone quality and paired alignment

**Intent:** Close the migration with reproducible evidence, not prose-only parity claims.  
**Dependencies:** Phases B–E and completion of the paired paired project plan.

#### F1. Run focused and complete local gates

- Run `npm run check:fast`.
- Run `npm run check:core`.
- Run `npm run test:coverage:check`.
- Run `npm run check:all`.
- Run `npm run hooks:doctor`.
- Confirm the worktree contains only intended changes.

#### F2. Run the one-off paired comparison

- From the common parent or a temporary read-only script, assert:
  - identical Node/npm declarations and common direct dependency versions;
  - exact shared `check:fast`, `check:all`, and `check:strict` strings;
  - complete-suite reachability from both `check:core` graphs;
  - no repeated Polar smell leaf and no incomplete Dyn core;
  - identical generic base schema and generic schema case payload;
  - identical actionlint version/checksum table and portable checksum behavior;
  - identical pinned publisher Action SHAs;
  - identical `.codex/config.toml`;
  - no required command in either repository references the sibling path.
- Record justified profile differences: Vitest/V8/jsdom and historical ratchets here; Python/c8/Ruff/mypy and
  strict-zero-debt complexity in paired project.
- Keep this comparison one-off unless a separately approved shared-package design gives it a stable owner.

#### F3. Close the active plan

- Add exact commands, outcomes, test/coverage counts, and any justified deviations to the completion-evidence section.
- Move the plan to `exec-plans/completed/PLAN40.md` only after standalone and paired acceptance criteria pass.

**Exit conditions:**

- Both full gates pass from clean, independent checkouts.
- The paired comparison has no unexplained common-contract drift.
- The active plan is archived only after all required evidence is recorded.

---

## User-Facing Documentation Impact

`README.md` changes are mandatory because this plan changes contributor-visible command semantics and documents the
repository's role-model boundary.

Required documentation deliverables:

- `README.md`: update development commands, fast/final gate guidance, hook/release authority, and viewer-role-model
  scope.
- `CONTRIBUTING.md`: update iteration and completion workflow.
- `documentation/conventions/quality-gates.md`: own the exact command graph.
- `documentation/conventions/testing-infrastructure.md`: own ordinary versus coverage test execution.
- `documentation/guides/documentation-maintenance.md`: use the corrected smallest/final gates.
- `AGENTS.md` and `CLAUDE.md`: update only stale routing statements; do not re-expand canonical documentation.

No user-visible widget, theme, kind, layout, installation, configuration, or runtime requirement changes are planned.
Therefore widget/layout fixtures and theme-token extreme fixtures do not change.

---

## Acceptance Criteria

### Command semantics

- [ ] `check:fast` is exactly `check:standard && typecheck && test:unit`.
- [ ] `check:fast` excludes the full contract aggregate, package, docs, complexity, scaling, coverage, and release
      gates.
- [ ] `check:core` reaches `test:split` exactly once and no longer substitutes `test:contract`.
- [ ] `test:split` still runs all three configured Vitest projects.
- [ ] `check:all` and `check:strict` retain their exact shared definitions.
- [ ] A negative command-graph fixture proves the former incomplete core composition is rejected.

### Quality integrity

- [ ] All 175 active legacy complexity entries retain their protected current-or-lower values.
- [ ] Coverage floors, coverage classifications, test classifications, scaling limits, and package rules are not
      weakened.
- [ ] No new suppression, ignored path, skipped test, coverage exception, or debt entry is introduced.
- [ ] Required gates remain offline after setup and require no external browser.

### Portable role-model configuration

- [ ] `.codex/config.toml` contains no OS-specific command/environment and no unpinned MCP.
- [ ] The file is byte-identical to paired project's normalized configuration.
- [ ] A local test proves required keys and forbidden-token rejection.
- [ ] The schema corpus no longer makes the false no-sibling claim.
- [ ] Generic schema and generic case payloads still match the paired repository.

### Documentation

- [ ] README, CONTRIBUTING, quality-gate, testing, and maintenance guidance match the live command graph.
- [ ] Documentation clearly separates the viewer role model from a future greenfield environment.
- [ ] No shipped file cites this plan or a phase as authority.
- [ ] All edited maintained files remain below their size limits.
- [ ] `npm run docs:check` passes.

### Completion

- [ ] `npm run check:fast` passes.
- [ ] `npm run check:core` passes.
- [ ] `npm run test:coverage:check` passes.
- [ ] `npm run check:all` passes.
- [ ] `npm run hooks:doctor` passes.
- [ ] The paired mechanical comparison reports no unexplained common-contract drift.
- [ ] Both repositories remain independently runnable and clean apart from their intended plan implementations.

---

## Progress / Completion Evidence

### Phase A — Baseline reconfirmation

- Verified starting HEAD `3285cc787adf9c9626772a4a6052929470f6089a` on `main` (this commit is "Added PLAN40.md" itself,
  one commit ahead of the plan's cited verification commit `9a62c68b2cde6df4afb9be4248e18de46ef52af9`; no other drift).
  Worktree was clean; `exec-plans/active/` contained only this plan.
- Node `v26.4.0`, npm `12.0.1` — matches the declared `engines`/`packageManager` contract.
- Re-verified every "Verified Baseline" claim (items 1–20) directly against the live worktree before changing anything:
  `check:fast`/`check:core`/`check:all`/`check:strict` strings, `test:split` composition, `.codex/config.toml`
  Windows/MCP content, the schema-corpus false no-sibling note, and README/quality-gate/testing-infrastructure line
  counts all matched exactly as recorded. No baseline drift found; no plan amendment was required.
- Read paired project's `exec-plans/active/PLAN7.md` read-only to confirm the shared contract (same `check:fast` string,
  same `check:core`/`check:all`/`check:strict` aliasing, same Codex/independence/role-model boundaries). No sibling file
  was edited.

### Phase B — Command graph

- `package.json`: `check:fast` changed to exactly `npm run check:standard && npm run typecheck && npm run test:unit`;
  `check:core` changed to run `npm run test:split` in place of the former direct `npm run test:contract` position,
  keeping every other group and its order.
- `tests/tools/package-scripts.test.js` extended with: exact-string proofs for the new `check:fast`/`check:core`; a
  `test:split`-reaches-once assertion; a positive proof that `test:split` still fans out to all three configured Vitest
  projects (`unit-node`, `contract`, `unit-dom`, read directly from `vitest.config.js`); a full reachability/no-cycle
  graph walk from `check:all` proving every required core group is reachable and `test:contract` is not; and a
  **negative** mutation-fixture proof (`assertCompleteCheckCoreGraph`) showing the former incomplete composition
  (`test:split` replaced by `test:contract`) throws under the same assertion.
- Focused run: `npx vitest run --project unit-node tests/tools/package-scripts.test.js` → 17/17 passed.

### Phase C — Portable Codex configuration

- `.codex/config.toml`: removed the `[mcp_servers.chrome-devtools]` block (Windows `cmd` launcher,
  `SystemRoot=C:\Windows` env, unpinned `chrome-devtools-mcp@latest`), keeping only `project_doc_fallback_filenames`,
  `project_doc_max_bytes`, `approval_policy`, `sandbox_mode`, and `web_search`.
- Added `tests/tools/codex-config.test.js` (dependency-free text-based proof, no TOML parser): asserts every required
  portable key is present, asserts no MCP server block, and includes two negative fixtures — a reintroduced
  Windows/`@latest` MCP block fails the violation check, and a fixture missing `sandbox_mode` fails it too.
- `diff .codex/config.toml ../paired-project/.codex` shows paired project's file is still the pre-existing zero-byte
  marker (paired project's PLAN7 Phase D — replacing that marker with its own `config.toml` — has not landed yet; see
  the paired-comparison note below). Byte-identity therefore cannot be proven this round; the Dyninstruments file
  matches the exact minimal portable shape both plans specify verbatim.
- Focused run: `npx vitest run --project unit-node tests/tools/codex-config.test.js` → 4/4 passed.

### Phase D — Schema-corpus provenance

- `tools/quality-policy/plugin-schema-corpus.json`: rewrote only the `note` field. It no longer claims "no sibling
  repository has published its own schema base/profile split"; it now states paired project publishes the same
  base/profile split with a byte-identical `genericBase` corpus. No `genericBase`/`dynLayoutsProfile` case array was
  changed.
- Verified byte-identity directly:
  `diff dyninstruments/schemas/avnav-plugin-base.schema.json paired-project/schemas/avnav-plugin-base.schema.json` → no
  output (identical); paired project's `tools/quality-policy/plugin-schema-corpus.json`
  `genericBase.valid`/`genericBase.invalid` arrays are structurally identical to Dyninstruments' (compared by inspection
  of both files; paired project's own note explicitly says it is "kept byte-identical to Dyninstruments' equivalent
  genericBase corpus").
- `tests/contract/plugin-schema-base-profile-contract.test.js`: added a locking assertion that `corpus.genericBase`
  deep-equals the exact intended local payload (independent of the sibling), so a future accidental edit to the local
  generic cases fails closed without needing the sibling checkout.
- Focused run: `npx vitest run --project contract tests/contract/plugin-schema-base-profile-contract.test.js` → 5/5
  passed. `npm run schema:check` → "Ajv schema validation passed."

### Phase E — Documentation sync

- Updated `documentation/conventions/quality-gates.md` (exact `check:fast`/`check:core` command-graph table and Key
  Details, plus the explicit "ordinary `test:split` in `check:core` vs. instrumented `test:coverage:check` rerun is
  intentional duplication" statement), `documentation/conventions/testing-infrastructure.md` (same duplication note),
  `documentation/guides/documentation-maintenance.md` (check:core/check:fast bullet lists corrected to `test:split`/
  `test:unit`), `README.md`, and `CONTRIBUTING.md` (check:fast/check:core prose corrected from the stale "Node-only
  unit/tool tests" wording to the real `test:unit`/`test:split` composition; added the viewer-profile role-model
  boundary statement and the optional-Codex-tooling note per the Hard Constraints/User-Facing Documentation Impact
  sections).
- `AGENTS.md`/`CLAUDE.md` were checked and left unchanged: neither names `test:contract` or the old `check:fast`
  composition, so neither became inaccurate.
- No shipped file cites this plan or a phase as authority (`check-patterns`'s `exec-plan-reference` rule, which is part
  of `check:smells`, passed with 0 findings across 1008 checked files).
- `npm run docs:check` passed in full: `docs:lint` (0 issues/80 files), `docs:links:proof`, `docs:links` (99 local
  links), `check:doclinks` (5/5), `check:docformat` (5/5), `check:reachability` (4/4).
- Non-empty line counts after edits, all below the 400-line limit: `README.md` 247, `CONTRIBUTING.md` 177,
  `documentation/conventions/quality-gates.md` 154, `documentation/conventions/testing-infrastructure.md` 176,
  `documentation/guides/documentation-maintenance.md` 173.

### Phase F — Standalone verification

Commands run from a worktree containing only this plan's intended changes (confirmed via `git status --short`):

| Command                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check:fast`          | Passed. `test:unit` → 413 files / 1794 tests passed.                                                                                                                                                                                                                                                                                                                                                                  |
| `npm run check:core`          | Passed. `test:split` → 443 files / 1934 tests passed (up from the pre-plan 442/1924 baseline: +1 file/+10 tests from the new `codex-config.test.js` file and the new assertions added to existing files). `check:complexity` → 175 tracked baseline entries, 0 new violations, digest verified. `check:scaling` → 4 files / 25 tests passed. `check:filesize` → 931 files checked, 0 violations, 0 oneliner findings. |
| `npm run test:coverage:check` | Passed. Coverage: 93.24% lines (12918/13854), 79.77% branches (9311/11671), 92.26% statements, 96.83% functions — identical to the pre-plan baseline (no production code changed). `check:coverage-inventory` → 228 classified production files.                                                                                                                                                                      |
| `npm run check:all`           | Passed (exit code 0; `check:core` + `test:coverage:check`, same evidence as above).                                                                                                                                                                                                                                                                                                                                   |
| `npm run hooks:doctor`        | Passed: "Local pre-push hook is correctly installed (core.hooksPath=.githooks, executable)."                                                                                                                                                                                                                                                                                                                          |

Final worktree diff scope (`git status --short`): `.codex/config.toml`, `CONTRIBUTING.md`, `README.md`,
`documentation/conventions/quality-gates.md`, `documentation/conventions/testing-infrastructure.md`,
`documentation/guides/documentation-maintenance.md`, `package.json`,
`tests/contract/plugin-schema-base-profile-contract.test.js`, `tests/tools/package-scripts.test.js`,
`tools/quality-policy/plugin-schema-corpus.json`, `tools/quality-policy/test-inventory.json`, `tsconfig.tests.json`,
plus the new file `tests/tools/codex-config.test.js`. No file under `plugin.js`, `plugin.mjs`, `runtime/`, `cluster/`,
`config/`, `shared/`, `widgets/`, or any layout/CSS was touched. No suppression, skip, coverage exception, or
debt-baseline entry was added anywhere.

Repository independence:
`grep -rl "paired-project" package.json .githooks tools tests documentation AGENTS.md CLAUDE.md README.md CONTRIBUTING.md`
(excluding `exec-plans/`, where this plan's own prose names the paired repository by design) returns no match — no
required script, hook, test, release command, or documentation checker resolves the sibling repository.

### Paired comparison with paired project PLAN7 — complete

Re-ran the one-off, read-only comparison on 2026-07-27 after paired project archived `PLAN7.md`; both worktrees were
clean. The shared Node/npm declarations, all 12 common direct development-dependency versions, and the exact
`check:fast`, `check:all`, and `check:strict` script strings match. Dyninstruments' `check:core` reaches `test:split`
exactly once; paired project's complete core graph has the same meaning with its documented Python-specific leaf.

The repositories have byte-identical `.codex/config.toml` files (SHA-256
`be6ded57d66fa0d9101ef7eb2b9fb1aa3105e2871f8eca93218da1c6dc937f64`), generic AvNav base schemas, and
`genericBase` schema-corpus payloads. Their actionlint version/checksum tables and pinned publisher Action SHAs also
match. Required commands in neither repository resolve a sibling path; remaining sibling-name references are
provenance/documentation only. No unexplained common-contract drift was found.

The current Dyninstruments `npm run check:all` gate passed after this comparison. With the prior local evidence and
paired project's archived PLAN7 evidence, all PLAN40 acceptance criteria are now met. This plan was moved to
`exec-plans/completed/PLAN40.md` on 2026-07-27.

---

## Related

- [Core principles](../../documentation/core-principles.md)
- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Testing infrastructure](../../documentation/conventions/testing-infrastructure.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Completed migration plan](../completed/PLAN39.md)
- paired project paired plan: `../../../paired-project/exec-plans/active/PLAN7.md`
