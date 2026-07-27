# PLAN39 — Finalize the generic quality migration and establish the aligned viewer-profile exemplar

## Status

Written after repository verification and the cross-repository quality-system review on 2026-07-26.

This plan covers the remaining Dyninstruments quality-migration defects, the common maintained-tool and release
contracts shared with Polar Recorder, portable policy evidence, quality-tool self-protection, generic AvNav metadata
schema separation, novice onboarding evidence, and final documentation synchronization.

The coding agent may choose equivalent internal helper names and file splits as long as the behavioral, structural,
negative-proof, and documentation outcomes below are met. The effective formatter ownership, common dependency/action
pin set, strict tool-code ownership, portable baseline behavior, shared schema corpus, and final command semantics are
prescriptive.

No pre-plan interview was run. The plan therefore makes these explicit assumptions:

1. Runtime plugin behavior, bundled layouts, widgets, AvNav integration, release contents, and user-facing visuals are
   unchanged.
2. The current local-first authority remains in force: no PR/push quality workflow, CODEOWNERS file, branch ruleset, or
   pre-commit framework is introduced. A novice-default remote-governance profile belongs to the later generic
   scaffolder, not this exemplar migration.
3. This repository remains independently buildable and testable. Its required gate must never read the sibling Polar
   Recorder checkout.
4. The paired Polar Recorder plan is
   `PLAN6 — Complete the quality migration and establish the aligned hybrid-profile exemplar`. The plans coordinate
   observable contracts; neither repository becomes a package dependency of the other.
5. Extracting a third, versioned `avnav-plugin-quality` package and `create-avnav-plugin` scaffolder is a subsequent
   productization task. This plan makes Dyninstruments extraction-ready but does not choose a package registry or
   ownership repository.

---

## Goal

Finish the Dyninstruments quality migration so it is a trustworthy JavaScript viewer/layout exemplar for a future
generic AvNav plugin environment and exposes the same common guarantees as Polar Recorder without copying
product-specific policy.

Expected outcomes after completion:

- Prettier scope completeness is based on Prettier's effective ignore/config semantics, and every claimed maintained
  file is actually checked.
- Tracked source contains no literal NUL bytes or other binary-classifying separators.
- Every maintained JavaScript quality tool is covered by the maintained ESLint baseline and strict no-emit typechecking.
- Common direct tool versions, npm overrides, actionlint checksums, GitHub Action pins, SemVer corpus, and public
  command semantics match the paired Polar Recorder outcome.
- `plugin.json` validation separates a generic AvNav metadata base from the Dyninstruments layout profile.
- Required quality checks work from a shallow clone/source archive without needing the historical Git commit object.
- Setup, optional advisory review, clone-local hooks, manual AvNav validation, and release preparation are documented
  accurately for inexperienced contributors.
- All project-specific mapper/widget/theme/coverage-debt policies remain intact and `npm run check:all` stays green.

---

## Verified Baseline

The following points were rechecked against Dyninstruments `fd9a977d99ed6d53f9c59a0271bc4fa75c34c6cd` before this plan
was written:

1. `package.json` defines the canonical final entry point exactly as `check:all = check:core && test:coverage:check`;
   `check:strict` is an exact alias.
2. `npm run setup`, `npm run hooks:doctor`, and `npm run check:all` all pass on the current Linux-x86_64/Node 26.4.0/npm
   12.0.1 checkout. The full gate executes 1,899 tests and reports 93.24% line and 79.77% branch coverage.
3. `package.json`, `.nvmrc`, and the lockfile pin Node 26/npm 12.0.1 with exact direct dev dependencies.
4. The common-version alignment snapshot verified on 2026-07-26 is: `@eslint/js` 10.0.1, `@types/node` 26.1.1, ESLint
   10.8.0, `globals` 17.8.0, jscpd 5.0.12, Linkinator 8.0.2, markdownlint-cli2 0.23.1, Prettier 3.9.6, Stylelint
   17.14.1, `stylelint-config-standard` 40.0.0, and TypeScript 7.0.2. Dyn currently differs on ESLint, `@eslint/js`,
   `globals`, Linkinator, markdownlint-cli2, Prettier, and Stylelint.
5. A post-setup `npm audit --json` reported eight development-tool findings: ESLint 9/minimatch/brace-expansion,
   Linkinator's brace-expansion, Ajv's `fast-uri`, and markdownlint-cli2 0.23.0/`js-yaml`. The shipped plugin has no npm
   runtime dependency chain.
6. `.prettierignore` excludes `package-lock.json`, all `.agents/`, and whole lint-fixture directories while the
   `format`/`format:check` scripts explicitly name those surfaces.
7. `tests/contract/formatting-scope-contract.test.js` expands package-script globs with `fs.globSync` but never calls
   Prettier's `getFileInfo` or otherwise applies `.prettierignore`.
8. Prettier reports both `.agents/skills/preflight/SKILL.md` and `package-lock.json` as ignored. Fifteen tracked files
   are claimed as formatter-owned but effectively ignored: seven skill files, seven broad-directory lint fixtures, and
   the lockfile.
9. `eslint.config.mjs` already layers `@eslint/js` recommended rules over every maintained JS/MJS surface and therefore
   rejects undefined globals in quality tools.
10. `tsconfig.checkjs.json` and `tsconfig.tests.json` contain no `tools/` paths. Despite that, the quality-gate
    documentation currently says the strict source boundary owns “production/config/tool declarations.”
11. The current `tools/` tree contains no maintained source file over 400 non-empty lines. Four checker modules are
    between 309 and 339 non-empty lines; `tools/test-data/check-patterns-failfast-cases.js` is a deliberately exempt
    fixture.
12. `tools/quality-policy/complexity-scan.mjs` contains three literal NUL bytes and
    `tools/quality-policy/complexity-budget.mjs` contains two, all used as tuple separators. Git/file tools classify
    these maintained sources as binary.
13. `check:complexity` first runs `historical-complexity-capture.mjs --check`, which calls `git ls-tree` and `git show`
    against the captured historical commit. A shallow clone or source archive without that object cannot pass.
14. The active complexity ledger has 175 shrinking legacy entries; the immutable historical findings contain 188
    entries. New functions remain limited to complexity 10, 40 statements, depth 4, and 6 parameters.
15. The coverage inventory owns 228 production files with an 80% line/65% branch default and 12 exact legacy
    below-default paths. The test inventory owns 528 JS test/helper files. Neither ledger may be weakened in this plan.
16. `schemas/plugin.schema.json` is Dyninstruments-specific: it requires a non-empty `layouts` array and rejects every
    other property. `tools/validate-schemas.mjs` validates it and the bundled layout schema with Ajv.
17. `tools/release-version.mjs` and Polar Recorder's implementation classify all 20 valid and 42 invalid entries in
    Polar's SemVer corpus identically, but Dyn has no committed shared corpus file.
18. The publisher pins checkout v6.0.2 but `softprops/action-gh-release` v2.2.2. Polar currently pins checkout v4.4.0
    and `action-gh-release` v2.6.2. Both use actionlint 1.7.12 with the same four official platform checksums.
19. Manual AvNav validation is already documented in `CONTRIBUTING.md`, `README.md`, and `AGENTS.md`: plugin load,
    representative radial/linear/HTML widgets, day/night switching, and route/AIS interactions.
20. `.github/workflows/publish-release.yml` is the only workflow and is deliberately a transport-only tag publisher.
21. No active execution plan exists; the next sequential Dyninstruments plan number is 39.

---

## Architecture Notes

### Alignment means common guarantees, not identical product policy

The common layer is the public command graph, maintained-tool baseline, formatting/link/schema semantics, quality-tool
self-protection, portable ratchet mechanics, hook/release behavior, and evidence vocabulary. Dyn's Vitest/jsdom
projects, mapper contracts, theme checks, layout schema, and existing debt ledgers remain viewer-profile extensions.

### Standard tools remain the first owner

Prettier, ESLint, TypeScript, Stylelint, markdownlint-cli2, Linkinator, actionlint, Ajv, Vitest/V8, and jscpd should own
the behavior they can express. Custom code is retained only for effective-scope completeness, AvNav/raw-script
contracts, historical ratchets, deterministic operation counts, packaging, and documentation graph/shape checks.

### Portable evidence is different from mutable debt

The 175-entry active complexity ledger must retain its historical provenance, but daily validation must not require a
full Git object database. A committed canonical findings capture with an independently anchored digest can be portable;
Git regeneration may remain an explicit maintainer audit command.

---

## Hard Constraints

### Runtime and architecture

- Do not modify plugin runtime behavior, widget registrations, mapper outputs, layouts, CSS visuals, or AvNav API
  integration.
- Do not add a bundler, runtime build output, ES-module conversion of classic runtime scripts, or runtime npm
  dependency.
- Do not make Dyninstruments invoke, import, or inspect Polar Recorder from `setup`, hooks, tests, `check:all`, package,
  or release commands.

### Quality integrity

- Do not lower coverage, complexity, file-size, inventory, duplication, type, lint, documentation, or package floors.
- Do not add a new baseline exception, formatter directory exclusion, lint/type suppression, skipped test, or
  contract-owned coverage entry to make the migration pass.
- Preserve all 175 legitimate active complexity entries at their current-or-lower value until product refactoring
  removes them.
- Every changed custom checker requires a focused clean case and a focused failing case.
- Network advisory checks remain opt-in maintainer commands; `check:all` stays offline after successful setup.

### Common alignment snapshot

- At implementation time, re-query current registry/advisory metadata. If the verified version snapshot in Baseline fact
  4 is still current, use it exactly in both repositories.
- If any version must change for a newly published fix, amend both active plans first and use the same compatible exact
  version in both repositories. Do not land new cross-repository version drift.
- Align publisher actions to checkout v6.0.2 (`de0fac2e4500dabe0009e67214ff5f5447ce83dd`) and
  `softprops/action-gh-release` v2.6.2 (`3bb12739c298aeb8a4eeaf626c5b8d85266b0e65`) unless a newer reviewed pair
  replaces both plan snapshots.
- Force markdownlint-cli2's vulnerable exact `js-yaml` 5.2.1 dependency to a tested fixed resolution (5.2.2 in the
  verified snapshot) through one documented exact npm override until upstream removes the need.

### File organization

- Keep every maintained JS/MJS/Markdown file within the repository's 400-line rule.
- Check the four 300+ line checker modules before and after edits; split by rule family/owner before any reaches 400.
- Keep exact negative fixtures in fixture directories and exercise them through owner tests; never broaden ignore
  patterns to a directory.
- Do not leave permanent plan/phase citations outside `exec-plans/`.

---

## Implementation Order

### Phase A — Freeze the paired alignment decisions and clean baseline

**Intent:** Record reproducible starting evidence and make shared choices explicit before changing owners.  
**Dependencies:** None.

#### A1. Capture the current proof

- Record current HEAD, clean status, Node/npm versions, `npm run setup`, `npm run hooks:doctor`, `npm run check:all`,
  coverage summary, dependency tree, and `npm audit --json` result in this plan's progress log.
- Record exact hashes for the common SemVer corpus, actionlint checksum table, selected Action SHAs, and common direct
  dependency set once the paired plans agree.

#### A2. Verify the AvNav metadata base

- Inspect the current AvNav plugin loader/schema behavior and both real `plugin.json` shapes before authoring a generic
  schema. Do not infer unsupported fields from either exemplar.
- Write the accepted generic cases and profile-specific cases into a small shared schema corpus design before changing
  `tools/validate-schemas.mjs`.

**Exit conditions:**

- Baseline commands are green and recorded without generated-file or worktree drift.
- The common pin/action/schema decisions are explicit and identical in the paired plans.

### Phase B — Repair effective formatting ownership and text-source integrity

**Intent:** Make the green formatter proof describe what Prettier and ordinary source tools really see.  
**Dependencies:** Phase A.

#### B1. Make maintained files effectively format-owned

- Remove the `package-lock.json` and `.agents/` exclusions from `.prettierignore`.
- Replace broad lint-fixture directory exclusions with exact file entries only for fixtures whose intentionally invalid
  syntax/content cannot be formatted.
- Keep the exact fixture list visible to `tests/contract/formatting-scope-contract.test.js`.

#### B2. Test Prettier's real decision

- Make the formatting-scope contract asynchronous and use Prettier's public `getFileInfo`/effective ignore resolution
  for every expanded path.
- Assert every maintained file is not ignored unless it is an exact, existing, owner-tested negative fixture.
- Assert no ignored exact fixture is a normal production, tool, documentation, lock, skill, or active-plan file.
- Retain the equality proof between write and check scopes.

#### B3. Remove binary source separators

- Replace literal NUL bytes in both complexity modules with source-level escaped separators while preserving tuple-key
  behavior.
- Add a focused source-text contract that fails on literal NUL bytes in maintained source/config/docs and proves the
  negative fixture.

**Exit conditions:**

- `prettier --file-info` reports the lockfile and every agent skill as owned.
- The formatter contract passes and a seeded newly ignored maintained file fails it.
- `file` and Git treat all maintained checker sources as text; a mechanical NUL scan returns zero.
- `npm run format:check`, the focused contract project, and `npm run check:smells` pass.

### Phase C — Align maintained tools, action pins, and advisory workflow

**Intent:** Eliminate common version/supply-chain drift without adding network access to the required gate.  
**Dependencies:** Phase B.

#### C1. Upgrade the exact common set

- Update `package.json` and `package-lock.json` to the agreed common versions in Hard Constraints.
- Keep Dyn-only dependencies such as Ajv, Vitest, jsdom, fast-check, and ESLint plugins exact and compatible.
- Add the tested exact `js-yaml` override and a package contract proving it resolves to the intended version.
- Run the maintained suites after the ESLint 10 migration; fix configuration/API changes without weakening rules.

#### C2. Align supply-chain pins

- Update the tag publisher to the agreed Action SHAs and retain the exact comments/tags.
- Keep actionlint 1.7.12 and its four shared checksums unless both plans deliberately update it.
- Extend release/workflow contract tests to assert the selected action identities and transport-only boundary.

#### C3. Add maintainer-only advisory ownership

- Add an explicitly networked `dependencies:audit` command using maintained npm audit behavior and document that it is
  run after dependency updates and during scheduled maintenance, not inside `check:all`.
- Document how an advisory exception is reviewed, time-bounded, and removed; do not create an exception for a fixable
  current finding.

**Exit conditions:**

- The paired repositories have the same exact common direct versions, override, actionlint version/checksums, and
  publisher action SHAs.
- `npm ls` has no invalid/peer dependency resolution.
- A fresh advisory query has no high/critical fixable finding in the selected common toolchain, or a still-unfixed
  upstream issue has explicit owner/date/expiry evidence.
- `npm run check:standard`, package/release contract tests, and actionlint pass offline after setup.

### Phase D — Put every JavaScript quality tool under strict static ownership

**Intent:** Make the gate implementation meet the standard it enforces on product/test code.  
**Dependencies:** Phase C.

#### D1. Add a strict tool type boundary

- Add `tsconfig.tools.json` for all maintained `tools/**/*.js` and `tools/**/*.mjs` plus tool-owned declarations.
- Exclude invalid fixtures/test-data by exact path or non-source extension, never with a broad maintained-tool gap.
- Add `typecheck:tools` to `typecheck` and add a completeness contract comparing tracked maintained tool source to the
  effective TypeScript project.

#### D2. Fix contracts rather than suppressing errors

- Add/narrow JSDoc types, result shapes, and external API declarations until strict no-emit checking is clean.
- Split any 300+ line checker before added typing/behavior pushes it toward 400 lines.
- Retain `@eslint/js` recommended and add a negative undefined-global fixture for the tool profile.

#### D3. Correct documentation

- Update `documentation/conventions/quality-gates.md` so its source/test/tool type ownership matches the live projects
  exactly.
- Update testing/documentation-maintenance guidance for new tool files and their clean/failing self-tests.

**Exit conditions:**

- Every maintained tool source is ESLint-owned and strict-TypeScript-owned.
- A new unclassified tool file and an undefined/mistyped tool symbol each fail the intended leaf.
- `npm run typecheck`, `npm run test:node`, and `npm run check:filesize` pass.

### Phase E — Separate generic AvNav metadata from the Dyn layouts profile

**Intent:** Turn schema validation into an extraction-ready base/profile composition without weakening layout checks.  
**Dependencies:** Phases A and D.

#### E1. Introduce the verified base/profile schema

- Add a generic AvNav `plugin.json` base schema containing only upstream-verified fields and types.
- Refactor the current schema into a Dyn layouts profile composed with the base; keep `layouts` non-empty and preserve
  the exact layout item/path rules for Dyn.
- Keep `layout.schema.json` project-specific.

#### E2. Add the common schema corpus

- Add the agreed valid/invalid base cases and profile cases. The generic subset must be byte-identical to the Polar
  corpus; project-specific cases remain local.
- Test development and release-version forms, unknown/invalid types, Dyn layout requirements, and layout file existence.

#### E3. Share the SemVer behavior corpus

- Add the paired valid/invalid SemVer corpus and run the real `release-version.mjs` implementation against every row.
- Preserve stable/prerelease classification and GitHub-output behavior.

**Exit conditions:**

- Ajv validates generic metadata separately from the Dyn layouts extension.
- All prior bundled layout/package tests remain green.
- Both repositories classify the common schema and SemVer corpus identically.

### Phase F — Make complexity provenance portable

**Intent:** Preserve the no-new-debt guarantee while allowing shallow clones and source archives to run the gate.  
**Dependencies:** Phase B.

#### F1. Separate daily proof from historical regeneration

- Keep `historical-complexity-findings.json` canonical and independently digest-anchored.
- Make the required `check:complexity` validate the committed capture's schema/digest and active-ledger provenance
  without reading a historical Git object.
- Retain Git-based regeneration only as an explicit maintainer audit command that reports unavailable history clearly
  and never runs from `check:all`.

#### F2. Prove portability and tamper detection

- Add fixture tests for a repository root with no `.git`, a shallow-history simulation, a modified findings capture, a
  new violation, a raised active value, and a resolved stale entry.
- Preserve duplicate-key validation and all 175 current active identities.

**Exit conditions:**

- `check:complexity` passes from a source copy without `.git`.
- Capture mutation and active-ledger self-grandfathering fail.
- Full-history regeneration still reproduces the committed capture on a maintainer checkout.

### Phase G — Synchronize onboarding, manual validation, and final evidence

**Intent:** Make the completed system accurately usable and auditable by a new contributor.  
**Dependencies:** Phases C–F.

#### G1. Consolidate contributor guidance

- Update `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, quality-gate docs, testing docs, release docs, and documentation
  maintenance guidance for the effective formatter, strict tool boundary, common versions, optional advisory command,
  schema base/profile, portable baseline, and aligned action pins.
- Add the same optional, digest-pinned development-container entry path used by the paired exemplar, containing the
  common Node 26/npm 12.0.1 toolchain. Keep native `npm run setup` fully supported and do not make containers a runtime
  or required-gate dependency. Prove setup and `check:all` inside the container before documenting it as supported.
- Keep `CLAUDE.md` a short pointer.
- State clearly that hook installation is opt-in, bypass remains possible, and `check:all` is still mandatory.

#### G2. Normalize the manual AvNav record

- Put the existing manual checks into one profile-aware release checklist with fields for date, AvNav version, plugin
  commit/version, environment, and results.
- Cover install/activate/load, representative radial/linear/HTML widgets, day/night, route/AIS interactions, logs, and
  package upgrade/rollback.
- Make `release:prepare` print the checklist location without claiming it was completed automatically.

#### G3. Run final standalone and paired proofs

- From a clean install, run setup, hook doctor, targeted negative proofs, `npm run check:all`, package dry run, and
  maintainer advisory query.
- Mechanically compare the two repositories' common versions, overrides, command semantics, actionlint tables, Action
  SHAs, schema corpus, SemVer corpus, and manual-checklist vocabulary. This comparison is completion evidence only and
  must not become a required repository command.

**Exit conditions:**

- Documentation lint/link/shape/reachability gates pass.
- The worktree stays clean after setup and all gates.
- The paired comparison reports no unexplained common-contract drift.
- The completion evidence is recorded before moving this plan to `exec-plans/completed/`.

---

## User-Facing Documentation Impact

Runtime behavior and plugin configuration do not change. `README.md` still requires an update because contributor setup,
dependency maintenance, schema terminology, and release validation are user/contributor-visible workflows.

Required documentation updates:

- `README.md`: development setup, authoritative gates, advisory command, manual release validation.
- `CONTRIBUTING.md`: strict tool-code ownership, effective formatter exclusions, dependency/action updates, manual
  evidence fields.
- `AGENTS.md`: quality checklist and generic base/profile schema routing.
- `documentation/conventions/quality-gates.md`: exact command graph and owner map.
- `documentation/conventions/coding-standards.md` and `smell-prevention.md`: text-source/tool-code rules if introduced.
- `documentation/conventions/testing-infrastructure.md`: tool typecheck and negative-proof inventory.
- `documentation/guides/documentation-maintenance.md`: formatter/link/schema/advisory touchpoints.
- `documentation/guides/release-workflow.md`: aligned Action pins and manual checklist.
- `documentation/TABLEOFCONTENTS.md`: only if a new focused manual-validation document is added.

No widget, theme, kind, or layout behavior changes, so the showcase layout and theme-token fixture sync rules are not
triggered.

---

## Acceptance Criteria

### Gate integrity

- [x] Prettier effective ownership matches the documented/package-script scope.
- [x] `package-lock.json` and all active agent skills are actually formatted.
- [x] Negative formatter fixtures are excluded only by exact path and are owner-tested (the approved exclusion set is
      currently empty; every prior directory-glob exclusion was replaced by real formatting or removed).
- [x] Maintained tracked source contains zero literal NUL bytes.
- [x] Every custom checker changed by the plan has clean and failing self-tests.

### Static ownership and policy portability

- [x] All maintained JavaScript tools pass ESLint recommended rules and strict no-emit typechecking.
- [x] New tool files fail closed until they enter the tool type boundary.
- [x] `check:complexity` passes without the captured Git object and still rejects capture/ledger tampering.
- [x] The active complexity and coverage debt sets are not enlarged or weakened.

### Cross-repository alignment

- [x] Common exact dev dependencies and the `js-yaml` override match Polar Recorder's target snapshot.
- [x] Node/npm, actionlint version/checksums, publisher Action SHAs, and public `check:all` semantics match.
- [x] The SemVer corpus is byte-identical to Polar Recorder's and passes the real `release-version.mjs` implementation.
- [~] The generic AvNav schema corpus is **not yet** byte-identical to a Polar Recorder corpus — Polar Recorder's own
  PLAN6 has not executed its schema base/profile phase, so no upstream corpus exists to match (verified read-only
  2026-07-27). Dyninstruments' corpus is written so its `genericBase` section can be adopted byte-for-byte once Polar
  Recorder lands a matching profile. See Completion Evidence for detail.
- [x] Differences in test runners, language gates, coverage families, and project-specific contracts are documented as
      profile extensions rather than unexplained drift.

### Schema, release, and onboarding

- [x] Generic AvNav metadata and Dyn layout validation are separate composed schema owners.
- [x] Existing bundled layouts and release ZIP contents are unchanged.
- [x] Advisory checks remain maintainer-only/networked; required gates remain offline after setup.
- [x] Native setup passes without dirtying the worktree.
- [~] The optional pinned development-container path is **deferred** (not added) — Polar Recorder has no such path to
  mirror yet, and this execution environment has no Docker/Podman available to prove one. Shipping an unverified
  container config would violate the no-unverified-success rule. See Completion Evidence.
- [~] The manual AvNav checklist exists, is referenced by `release:prepare`, and defines the exact fields/coverage areas
  to record, but **no live AvNav host was available in this session** to produce real human validation evidence. See
  Completion Evidence for the explicit request.
- [x] Local-first hook/publisher authority is preserved and described honestly.

### Completion

- [x] All touched non-exempt files remain within 400 lines; 300+ line checker files were measured before/after (see
      Completion Evidence).
- [x] `npm run setup` succeeds from the supported environment and does not install hooks implicitly.
- [x] `npm run hooks:doctor` passes after explicit installation.
- [x] `npm run check:all` passes.
- [x] Documentation and package/release checks pass.
- [x] This repository's worktree is clean of unintended changes after final proof; Polar Recorder was verified read-only
      and remains at its pre-session state (only its own pre-existing uncommitted
      `tools/quality-policy/format-scope.json` change and untracked `PLAN6.md`, unchanged by this session).
- [x] Completion evidence is recorded below; the plan is moved to `exec-plans/completed/PLAN39.md` after this edit.

---

## Completion Evidence

Implemented and verified on 2026-07-27, starting from `fa36fb6f` (clean tree, no drift beyond this plan's own file).

### Baseline reverification (Phase A)

- HEAD `fa36fb6f`, `git status` clean before starting.
- Node v26.4.0, npm 12.0.1.
- `npm run setup`, `npm run hooks:doctor`, `npm run check:all` all passed on the untouched baseline: 437 test files,
  1,899 tests, coverage 93.24% lines / 79.77% branches / 92.26% statements / 96.83% functions, complexity 175 tracked
  baseline entries. `npm audit --json` reported 8 findings (1 moderate, 7 high) in dev-only tooling.
- Polar Recorder's paired `PLAN6.md` was read in full, read-only, at its own HEAD
  `addd6656a5293988a9457934af87515ef3c082b8`. **Key finding: PLAN6 had not been executed** — Polar Recorder was still in
  its own pre-migration baseline state (no `@eslint/js`, version drift on `eslint`/`globals`/`@types/node`, checkout
  pinned to v4.4.0 not v6.0.2, no schema base/profile split, still Git-blob-anchored complexity provenance, no live-host
  checklist). This changed the cross-repo alignment strategy: items with an explicit shared target already stated
  identically in both plans' Hard-Constraints text (common tool versions, `js-yaml` override, actionlint
  version/checksums, Action SHA target, and the existing shared `tools/quality-policy/semver-corpus.json` file) could
  still be matched exactly; items with no upstream artifact yet (the generic schema corpus, a development-container
  path) could not be byte-matched and are recorded as explicit, evidence-backed deviations below instead of silently
  claimed.

### Phase B — Prettier ownership and NUL bytes

- Removed the `package-lock.json` and `.agents/` exclusions from `.prettierignore`; removed the four lint-fixture
  directory-glob exclusions (`tests/css/lint-fixtures/`, `tests/tools/lint-fixtures/`, `widgets/lint-fixtures/`,
  `tools/lint-fixtures/`) after confirming every fixture file inside them is genuinely Prettier-parseable (only
  `tools/lint-fixtures/isfinite.js` needed a trivial reformat; its consumer test only asserts ESLint output,
  unaffected). The negative-fixture exclusion list is currently empty. All 7 `.agents/skills/*/SKILL.md` files and
  `package-lock.json` are now actually formatted (`package-lock.json` was already compliant).
- Rewrote `tests/contract/formatting-scope-contract.test.js` to call Prettier's real `getFileInfo`/ignore resolution
  (async) for every maintained file, keeping the glob-based scope-completeness checks, and added a seeded-ignore proof
  showing the check fails closed when a maintained file becomes newly ignored.
- Replaced the 3 literal NUL-byte tuple separators in `complexity-scan.mjs` and the 1 in `complexity-budget.mjs` with
  the source-level `\0` escape sequence (2 ASCII characters), matching the pattern already used in
  `tests/tools/verified-baseline.test.js`. `file`/Git now classify both as text; behavior is unchanged
  (`check:complexity` output identical before/after).
- Added `tests/contract/source-text-integrity-contract.test.js`: scans maintained source/config/docs for literal NUL
  bytes (0 found) and proves detection against a new negative fixture, `tools/test-data/source-nul-byte-fixture.dat` (an
  out-of-scan-extension file so it never pollutes the real gates).

### Phase C — Common tool versions, action pins, advisory workflow

- Upgraded to the common snapshot stated identically in both plans: `@eslint/js` 10.0.1, `eslint` 10.8.0, `globals`
  17.8.0, `linkinator` 8.0.2, `markdownlint-cli2` 0.23.1, `prettier` 3.9.6, `stylelint` 17.14.1 (all verified to exist
  on the registry at implementation time). `jscpd`, `@types/node`, `stylelint-config-standard`, and `typescript` were
  already at the target versions.
- Added `"overrides": { "js-yaml": "5.2.2", "fast-uri": "3.1.4" }`. `js-yaml` matches the shared target exactly;
  `fast-uri` is a Dyninstruments-only fix (transitive via `ajv`, which Polar Recorder does not have yet) discovered by a
  fresh `npm audit` after the version bumps. `npm audit` now reports 0 vulnerabilities (down from 8).
- Re-pinned `.github/workflows/publish-release.yml`'s `softprops/action-gh-release` from v2.2.2 to v2.6.2
  (`3bb12739c298aeb8a4eeaf626c5b8d85266b0e65`), matching the Hard Constraints target exactly; `actions/checkout` was
  already at v6.0.2. `tools/actionlint.sh`'s version/checksums were already byte-identical to Polar Recorder's. Extended
  `tests/contract/release-workflow-contract.test.js` with an exact-SHA assertion for both pinned actions.
  `npm run actions:lint` passes. Verified with the sibling repo: Polar Recorder's own workflow is still pinned to
  checkout v4.4.0 (unexecuted PLAN6); the Dyninstruments target now matches the value both plans specify, and the
  difference is Polar's own remaining work, not something this session can or should change there. **Real regression
  caught and fixed**: Linkinator 8.0.2 changed its internal static-server host from `localhost` to `127.0.0.1`; the
  existing `linkinator.config.json` `linksToSkip` pattern (`^(https?://(?!localhost))`) started matching the local
  server's own URLs and silently skipped every real link check (the fixture proof caught this: it expected a broken-link
  case to fail and it didn't). Fixed by extending the pattern to also exempt `127.0.0.1` and `[::1]`;
  `npm run docs:links` again reports the same 98-link count as before the version bump. Added
  `"dependencies:audit": "npm audit"` (networked, maintainer-only, excluded from `check:all`/`check:core`) and a
  package-script contract test for it.

### Phase D — Strict `tools/**/*.mjs` type boundary

- Added `tsconfig.tools.json` (strict, `noEmit`, ES2022/ES2023, `module: "es2022"`) listing all 54 maintained
  `tools/**/*.mjs` files (53 pre-existing plus the new `complexity-capture-integrity.mjs`), excluding
  `tools/lint-fixtures/` and `tools/test-data/`. Added `typecheck:tools` and wired it into `typecheck`. Added
  `tests/contract/typecheck-tools-inventory-contract.test.js` proving the `files` list matches the live tree exactly.
- Fixed all ~880 initial strict-mode errors via JSDoc-only annotations (no runtime behavior changes), split across 4
  parallel isolated-worktree passes by file family (`check-file-size/*`, `quality-policy/*`, `release-*`/misc,
  `check-patterns/*`); each pass was merged back file-by-file and independently re-verified (typecheck, the family's own
  runtime output/summary counts, and its Vitest suite) before the next merge. `npx tsc -p tsconfig.tools.json` now
  reports 0 errors.
- **Regression found and fixed during final verification**: the parallel JSDoc annotation of two already-similar
  rule-runner functions in `rules-core.mjs` (`runLegacyComponentLoaderApiRule`, `runRuntimeReachThroughRule`) made their
  now-identical annotated bodies cross jscpd's clone-detection threshold (a 31-line clone that did not exist in the
  original file, confirmed by running `jscpd` against the pre-session version). Fixed by extracting the shared
  scan/dedupe loop into one local `runMaskedExpressionRule` helper; `npm run duplication:check` now reports 0 clones
  again, with identical runtime output. Making `tests/tools/release-version-semver-corpus.test.js` `require()`
  `tools/release-version.mjs` (an ES module with an `import.meta` CLI-entry guard) surfaced a real `tsconfig.tests.json`
  incompatibility (`module: "commonjs"` does not permit `import.meta`). Changed `tsconfig.tests.json`'s `module` to
  `"es2022"` (verified safe: `moduleDetection` stays `"legacy"`, so CommonJS `require`/`module.exports` test files are
  unaffected; `npx tsc -p tsconfig.tests.json` and the full Vitest run both stayed green).

### Phase E — Generic AvNav schema base/profile and shared SemVer corpus

- Added `schemas/avnav-plugin-base.schema.json` (a minimal `{"type": "object"}` base — AvNav's host loader does not
  itself require any specific `plugin.json` field, confirmed against this repository's own loader/schema behavior and
  documentation; no unverified upstream field was invented).
- Refactored `schemas/plugin.schema.json` into an `allOf` composition of the base schema plus the existing Dyn
  layouts-profile constraints (`required: ["layouts"]`, `additionalProperties: false`, item shape unchanged). Wired
  `tools/validate-schemas.mjs` to `ajv.addSchema()` the base before compiling the profile. Verified Ajv's `allOf`
  composition does not leak `additionalProperties` false-positives between subschemas (manual probe plus the new
  contract test).
- Added `tools/quality-policy/plugin-schema-corpus.json` (generic base + Dyn-profile valid/invalid cases) and
  `tests/contract/plugin-schema-base-profile-contract.test.js` proving every case against the real schemas, plus the
  real `plugin.json`. Documented in the corpus's own `note` field (and above) that the generic section cannot yet be
  byte-matched against a Polar Recorder corpus because none exists.
- Copied `tools/quality-policy/semver-corpus.json` from Polar Recorder byte-identical for the `valid`/`invalid` arrays
  (20 valid / 42 invalid, diffed byte-for-byte against the sibling file) with a Dyninstruments-appropriate `note`. Added
  `tests/tools/release-version-semver-corpus.test.js` running the real `tools/release-version.mjs` against every row.

### Phase F — Portable complexity provenance

- Added `tools/quality-policy/complexity-capture-integrity.mjs`: a Git-free SHA-256 digest proof of
  `historical-complexity-findings.json` against a hardcoded `CAPTURED_FINDINGS_SHA256` constant, following the exact
  pattern already used for `coverage-floor-baseline.json`/`test-exception-baseline.json`. Rewired `check:complexity` to
  run it instead of `historical-complexity-capture.mjs --check`. Added `complexity:regenerate-audit` as an explicit
  maintainer-only command that still performs the full Git-based regeneration/comparison, excluded from
  `check:all`/`check:core`.
- Added `tests/tools/complexity-capture-integrity.test.js`: proves the script contains no `execFileSync`/`child_process`
  call at all, passes from a real temp copy of the capture with no `.git` directory present, and fails closed when the
  capture is tampered with. All 175 active complexity entries, their historical provenance checks, and the existing
  self-grandfathering/stale-entry/duplicate fixtures in `complexity-budget.mjs`/its tests are unchanged.

### Phase G — Documentation and onboarding

- Added `documentation/guides/manual-avnav-validation.md`: a consolidated, profile-aware checklist (date, AvNav version,
  plugin commit/version, environment, pass/fail per area) covering install/activate/load, representative
  radial/linear/HTML widgets, day/night switching, route/AIS interactions, and package upgrade/rollback. Linked from
  `documentation/TABLEOFCONTENTS.md` and `CONTRIBUTING.md`.
- Made `tools/release-prepare.mjs` print the checklist's path to stderr after a successful run, explicitly labeled "not
  run automatically" — it never claims completion.
- Updated `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `documentation/conventions/quality-gates.md`,
  `documentation/conventions/testing-infrastructure.md`, `documentation/guides/documentation-maintenance.md`, and
  `documentation/guides/release-workflow.md` for: the real Prettier ignore-resolution behavior, the three-way
  `typecheck` split, the portable `check:complexity`/maintainer-only regeneration audit, the schema base/profile split,
  the pinned Action SHAs, and the `dependencies:audit`/manual-checklist pointers.
- **Deliberate deviation — development container**: not added. Polar Recorder (the paired exemplar this item says to
  mirror) has no development-container path of its own yet, so there is nothing to copy, and this execution environment
  has no Docker or Podman available to build and prove one. Shipping an unverified container configuration would violate
  the plan's own "never claim unverified success" rule, so this deliverable is deferred rather than faked. Native
  `npm run setup` remains the only supported, proven path.

### Final verification

- `npm run setup` → 0 vulnerabilities, no unintended generated changes (`git status` identical before/after).
- `npm run hooks:install` + `npm run hooks:doctor` → hook correctly installed (`core.hooksPath=.githooks`, executable).
- `npm run check:all` → **passes**. `check:core` (standard/lint/actionlint/duplication, all three typecheck scopes,
  package/schema/contract tests, focused-test proof, smells, complexity, scaling, docs, file-size) and
  `test:coverage:check` both green.
- Full suite: **442 test files, 1,924 tests, all passing** (1,899 baseline + 25 new, across the new/extended contract
  and tool test files listed above).
- Coverage: 93.24% lines / 79.77% branches / 92.26% statements / 96.83% functions — **identical** to the pre-session
  baseline (only `tools/`, `tests/`, `documentation/`, and config/schema files changed; no production runtime path
  touched). 228 classified production files, unchanged.
- Complexity: 175 tracked baseline entries, 0 new violations, digest-verified with no Git object read.
- Test inventory: 533 classified test files (was 528; +5 new strict files, 0 non-strict).
- `npm audit` → 0 vulnerabilities (was 8).
- `npm ls` → no invalid/unmet dependency resolution.
- Targeted negative-proof re-run (14 files, 105 tests): complexity budget/capture-integrity tamper and
  self-grandfathering fixtures, coverage/test-inventory policy fixtures, formatting-scope seeded-ignore proof,
  source-text-integrity NUL fixture, schema base/profile corpus, tools-inventory contract, SemVer corpus,
  `quality-owners` negative fixtures (misspelled global, focused test, missing overview, incompatible mock, bare
  `isFinite`), release-workflow pinned-action assertions, and package-script exact-string assertions — all pass.
- Every touched file stays within 400 non-empty lines. The four originally 300+-line checker files measured after
  typing: `rules-atomicity.mjs` 337→369, `atomicity-parser.mjs` 320→343, `rules-redundant-fallback.mjs` 309→327,
  `rules-failfast.mjs` 298→307; also `rules-legacy-support.mjs` 339→351, `rules-mapper.mjs` 280→315,
  `rules-duplicates.mjs` 272→279, `rules-core.mjs` 261→262 (after the de-duplication fix),
  `check-coverage-inventory.mjs` 258→273 — none reached 400 and none needed splitting.
- Polar Recorder verified unchanged: only its own pre-existing uncommitted `tools/quality-policy/format-scope.json` and
  untracked `PLAN6.md`, identical to the state observed at the start of this session.
- No commit, push, tag, or release was created in either repository.

### Remaining external/manual evidence (not automatable in this session)

1. **Live AvNav manual validation** — no live AvNav host/browser environment is available in this execution environment.
   `documentation/guides/manual-avnav-validation.md` is ready and referenced by `release:prepare`, but no human has yet
   completed it for this change set. **Requesting**: a maintainer with an AvNav environment complete the checklist
   (install/activate/load, one radial/linear/HTML widget, day/night switch, route/AIS interactions, package
   upgrade/rollback) before the next release that ships this migration.
2. **Development-container proof** — deferred, not implemented (see Phase G above); no action needed unless a maintainer
   wants to pursue it once Docker/Podman is available and/or Polar Recorder publishes one to mirror.

## Related

- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Release workflow](../../documentation/guides/release-workflow.md)
- [Core principles](../../documentation/core-principles.md)
