# PLAN48 - Remove meta-tooling and inert weight from both proof repositories

## Status

Active as of 2026-08-03. Single implementation authority for both sibling repositories:

- **Repository V:** this `dyninstruments/` repository, starting at `2819970d41540fc12bebedbe5162ec13e75d0b78`.
- **Repository P:** the adjacent Python-plus-browser AvNav plugin repository, starting at
  `51c19a1f2ee563485373804769d06acd8e9796f4`.

Do not create a companion plan in Repository P. Implementers in either repository update this file. When every
acceptance criterion passes, delete this file from the working tree; Git history is the archive, per the workflow phase
1 establishes.

**This file must never contain the sibling repository's directory name.** `tools/check-standalone-boundary.mjs` matches
it as a boundary token and exempts only `exec-plans/completed/`, not `exec-plans/active/`. A previous revision named it
three times and turned Repository V's gate red in two places. Say "Repository P" and describe its product identifiers
without quoting them. Verify with `node tools/check-standalone-boundary.mjs` after every edit here.

**This is a pure removal plan.** Repository V's `tools/` grew 4.8 times since the migration base while its product code
grew 7 percent; Repository P now carries two lines of quality tooling per line of product code. This plan removes three
things and adds nothing: the inert completed-plan history, the starter generator, and the committed format scope.

Reconciliation work — the release CLI wrappers, the residual single-field drifts, module byte-identity, and a mutation
suite — is deliberately **not** here. It is addition, it does not shrink either repository, and validation showed
several of its byte-identity targets are unreachable because `check:standalone` forbids a boundary token in a shared
file. It belongs in a separate follow-on plan.

Three validation passes on 2026-08-03 shaped this revision. They rejected three removals that rested on factual errors
(see "Rejected Removals"), caught the boundary-token defect above, and proved that the format-scope removal needs one
test case deleted per repository rather than two whole test files rehomed. An earlier revision was 641 lines for the
same three removals; that document had itself become the over-engineering this plan corrects.

## Goal

1. Remove 47 completed execution plans from Repository V and 13 from Repository P, about 51,400 lines, after repointing
   every referent and keeping the historical-exclusion assertions non-vacuous.
2. Remove the plugin starter generator and every referent from both repositories.
3. Stop committing `format-scope.json`, by deleting the one test case per repository that reads it and making the
   generator an in-process owner.
4. Keep both repositories green and provably aligned at every phase boundary, and lose no guarantee.

## Verified Baseline

Every fact was mechanically re-derived and survived, or was corrected by, three validation passes.

Measurement basis: `tools/` means all tracked files under `tools/`. Repository V product code means `plugin.js`,
`plugin.mjs`, `plugin.json`, `plugin.css`, `runtime/`, `cluster/`, `config/`, `shared/`, `widgets/`. Repository P
product code means `plugin.py`, `plugin.json`, `plugin.css`, `plugin.js`, `plugin.mjs`, `server/**.py`,
`viewer/*.{js,css}`. Figures are committed-tree unless stated.

1. Heads are `2819970d41540fc12bebedbe5162ec13e75d0b78` (V) and `51c19a1f2ee563485373804769d06acd8e9796f4` (P). Both
   trees are clean apart from Repository V's `tools/quality-policy/format-scope.json`, which carries this file's own
   registration row. Migration bases `8a61a3794c3dc67549a0f5e580b58e25dfc80895` and
   `908bd5ad2e2a985b885bd0fc6de2be47298f3719` are ancestors.
2. Both gates pass today. Repository V `npm run check:all` exits 0 with 2075 tests (193 contract, 623 Node, 1259 DOM),
   228 classified production files, 1158 pattern-scanned files with this file present, 1012 file-size-scanned files, and
   92.28% statement coverage. Repository P exits 0 with Python coverage 95.78% against a `--cov-fail-under=90` floor.
3. Alignment holds and must survive: `shared-core-manifest.json` is byte-identical in both with sha256
   `316222f0492f265fbe671b6c8585f6898eac37dee3474193b9bc245f2229fc16`, all 44 entries hash-verified in both;
   `node tools/check-alignment.mjs --peer=<other>` reports `{"ok":true,"findings":0,"peer":true}` both directions;
   `portable-core-contract.json` and `portable-role-graph.json` are identical, declaring `coreVersion` `3.2.0`, 44
   mandatory paths, and 17 roles.
4. Repository V `tools/` grew from 6,627 to 31,694 committed lines (4.8x) while product code grew from 42,469 to 45,548
   (7 percent); ratio 0.16 to 0.70. Repository P `tools/` grew from 8,562 to 19,742 (2.3x) while product code grew from
   8,712 to 9,819 (13 percent); ratio 0.98 to 2.01. The working-tree V figure is 31,698; the difference is this file's
   format-scope row.
5. Completed plans total 37,192 lines across 47 files in Repository V and 14,207 lines across 13 files in Repository P.
   The directory is inert for formatting and size: `.prettierignore`, `.markdownlint-cli2.jsonc`,
   `project-file-size-scope.json`, ESLint, and jscpd all exclude or exempt it.
6. Fifteen referents read or point into `exec-plans/completed/`:
   - Repository V `documentation/guides/exec-plan-authoring.md:73` carries a live link
     `[PLAN6.md](../../exec-plans/completed/PLAN6.md)`, one of the 108 `npm run docs:links` checks, whose checker fails
     on `BROKEN`. Line 12 of the same file states the retain-in-`completed/` workflow. Repository P's copy is 69 lines,
     has no such link, and its line 13 already documents removing completed plans.
   - Four assertions naming real plan files, which become vacuous once the directory is empty: Repository V
     `tests/contract/format-scope-contract.test.js:65` (`PLAN10.md`) and Repository P
     `tests/js/format-scope.test.mjs:74-76` (`PLAN1`, `PLAN5`, `PLAN7`).
   - `tools/check-standalone-boundary.mjs:63` exempts the directory in Repository V only; Repository P has no such
     exemption. Repository V `tests/portable-core/portable-core-contract.test.js:98-105` asserts that exemption against
     a synthetic seeded plan, so it survives deletion of the real plans but fails if the exemption is touched.
   - `tools/portable-core/suppression-engine.mjs:198`, a signed manifest entry in both **and** a
     `distribution-source.json` path, so editing it forces manifest, signature, and distribution-manifest regeneration
     in both; `check-distribution.mjs:52` raises `source-stale` otherwise, and `check:distribution` sits inside
     `package:check`.
   - Repository V `tools/quality-policy/project-format-scope.json:3` `historicalExclusionPatterns`, and Repository P
     `tools/quality-policy/generate-format-scope.mjs:20` `HISTORICAL_EXCLUSION_PATTERNS`.
   - Repository P `.prettierignore:10` and `.markdownlint-cli2.jsonc:16`.
   - Harmless synthetic fixtures: Repository V
     `tests/tools/check-patterns.blocksFallbacktextWrappersThatDuplicate.test.js:60` and Repository P
     `tests/js/check-patterns.test.mjs:426`.
   - Repository P `pyproject.toml:20`.
7. `exec-plans/completed/.gitkeep` does not exist in either repository and must not be created. A `gitkeepPaths` entry
   would be dead policy data: `buildFormatScope()` applies `historicalExclusionPatterns` at line 27, before the
   `gitkeepPaths` branch at line 49. The existing `releases/.gitkeep` entry proves it — it is declared and produces no
   row.
8. The starter generator is five files totalling 5,279 lines, byte-identical in both:
   `tools/create-avnav-plugin-starter.mjs`, `tools/starter-templates.mjs`, `tools/starter-quality-templates.mjs`,
   `tools/starter-quality-template-parts.mjs`, `tools/starter-quality/package-lock-template.json`.
9. All five paths are **already declared** in `alignment-inventory.json`'s `portable-identical` list, which holds 11
   entries. They must therefore be **removed from** that list, not added to the empty `remove` list:
   `check-alignment.mjs:119-131` emits a duplicate-owner finding for any path in two classifications, and `:139-145`
   stale-path-checks every classification including `remove`. `check:alignment` runs inside `package:check`, so either
   mistake turns the gate red.
10. The generator's referent set is: its own test (`tests/tools/create-avnav-plugin-starter.test.js` in Repository V,
    `tests/js/create-avnav-plugin-starter.test.mjs` in Repository P); the `starter:create` script in both `package.json`
    files; catalogue entries in `alignment-inventory.json`, `distribution-manifest.json`, `distribution-source.json`,
    `format-scope.json`, `test-inventory.json`, `project-pattern-scopes.json` (Repository V only),
    `tsconfig.tests.json`, and `tsconfig.tools.json`; prose in both `README.md`, both `CONTRIBUTING.md`, and
    `documentation/conventions/quality-gates.md` at `:84` in Repository V and `:113` in Repository P; Repository P's
    `tests/js/command-graph.test.mjs:55` script allowance; Repository P's
    `tools/quality-policy/generate-format-scope.mjs:44` entry inside `IMMUTABLE_CAPTURE_JSON_FILES` declared at `:41`;
    and six completed plans (Repository V `PLAN40`, `PLAN45`, `PLAN46`, `PLAN47`; Repository P `PLAN7`, `PLAN12`) that
    phase 1 deletes. The five paths appear in no protected capture file and no release payload. Neither
    `ARCHITECTURE.md` mentions the generator, and Repository V's `tests/tools/package-scripts.test.js` has no
    script-allowance list.
11. `distribution-source.json` names `avnav-plugin-ai-environment` as `sourceOwner` and declares 16 paths as
    `vendored-contract-output`; five are the generator.
12. `format-scope.json` holds one `{path, owner}` row per maintained file plus a `countByOwner` summary. Committed:
    Repository V 4,550 lines, 1,108 rows, 1,053 `prettier` and 55 `unsupported`; Repository P 1,569 lines, 377 rows, 261
    `prettier`, 90 `ruff`, 26 `unsupported`.
13. Each repository has exactly **one** test case that reads the committed file, and deleting that one case removes the
    whole dependency:
    - Repository V `tests/contract/format-scope-contract.test.js` has 7 cases. Only the case at line 34, "keeps the
      committed scope matching fresh discovery", reads it (line 36). The other 6 obtain rows through a helper at line
      107 that calls `buildFormatScope()` in process.
    - Repository P `tests/js/format-scope.test.mjs` has 6 tests. Only "committed scope matches fresh discovery" at line
      33 reads it (line 36). The other 5 build in process.
    - Repository V additionally has `tests/contract/formatting-scope-contract.test.js`, 224 lines and 12 cases, whose
      `collectPrettierScope()` helper at line 144 reads the committed file; 4 of the 12 cases call it, one of those four
      being tautological, and two further cases are no-ops against an empty exclusion list. Six cases exercise
      Prettier's real `getFileInfo` ignore resolution and markdownlint scope and are already independent. Repository P
      has no counterpart: `getFileInfo` appears in exactly one file across both repositories.
14. Other `format-scope.json` referents: the `format:scope` script at Repository V `package.json:36` and Repository P
    `package.json:37`; the writer paths at Repository V `generate-format-scope.mjs:13` with `main()` at `:95` and
    Repository P `:18`; `alignment-inventory.json:21` in both, declaring the path `profile-owned`; Repository V
    `tools/quality-policy/run-format.mjs:26`, `tools/check-doc-links.mjs`, `tools/check-doc-links-proof.mjs:36`,
    `tests/tools/check-doc-links.test.mjs:25`, `tests/tools/run-format.test.mjs:22`; Repository P
    `tools/quality-policy/run-format.mjs:44`, `tools/check-doc-links.mjs:23,32`, `tools/check-doc-links-proof.mjs:38`,
    `tests/js/documentation-checkers.test.mjs:21,77`, `tests/js/run-format.test.mjs:29`,
    `tests/js/vitest-projects.test.mjs:113`, `tests/js/command-graph.test.mjs:46`, `.prettierignore:1`,
    `ARCHITECTURE.md:25,31`, `documentation/guides/documentation-maintenance.md:75`, `CONTRIBUTING.md:70`.
15. `project-format-scope.json` exists in **Repository V only**, 111 lines holding 13 `reason` and 13
    `alternateValidation` keys, from which the 55 unsupported rows are generated. Repository P has no such file; its
    exclusion patterns and gitkeep handling are hardcoded in `generate-format-scope.mjs` at `:20` and `:52`.
16. No maintained Markdown in Repository V mentions `format-scope` or `format:scope`, and neither repository's
    `quality-gates.md` has a format-scope entry. Documentation edits for this removal are therefore Repository P only.
17. `generate-format-scope.mjs` is `adapter-owned` in `alignment-inventory.json` and must not be reconciled to
    byte-identity: Repository V's copy is 99 lines with one formatter owner, Repository P's is 215 with two.

## Hard Constraints

- **This plan removes. It does not add.** Exactly one addition is permitted, because it preserves an existing guarantee:
  rewriting a vacuous assertion to test its rule against a synthetic path. No new checker, gate, schema, test file, or
  mechanism. Do not create `exec-plans/completed/.gitkeep` (verified fact 7).
- Every removal must leave its guarantee intact with a named surviving owner, or be recorded as dissolved because its
  subject no longer exists. Silent loss is forbidden.
- No assertion may be left vacuous. An assertion naming a deleted path must be rewritten against a synthetic path.
- Do not attempt any removal under "Rejected Removals".
- Preserve `tools/quality-policy/coverage-floors.json`, `coverage-floor-baseline.json`, `test-inventory.json`, and
  `test-exception-baseline.json` in both repositories. Three are non-derivable: `coverage-floor-baseline.json` holds 12
  frozen achieved-at-capture floors marked `legacyBelowDefault`, `test-inventory.json` holds 563 human classifications
  (543 `strict`, 16 `harness-fragment`, 4 `fixture`), and `test-exception-baseline.json` is a dated frozen capture.
  `coverage-floors.json` is in fact derivable given the baseline — its `classification` is the constant `measured` for
  all 228 entries — but it stays, because deriving it buys nothing and risks the floors.
- Do not lower coverage floors, complexity limits or baseline entries, duplication thresholds, type strictness,
  file-size limits, schema constraints, workflow checks, or lint severity. Do not add skips, suppressions, ignored
  paths, warning-only substitutions, or baseline debt to reach green.
- Do not change either product's runtime behavior, public AvNav API, user configuration, release payload, or platform
  floor.
- Do not create a second plan in Repository P, and do not split this work into repository-specific plans.
- Do not make any required gate depend on the sibling checkout, a parent-directory layout, an absolute local path, Git
  metadata, or network access. Peer comparison stays a parameterized maintainer command.
- Execute phases in numeric order. Other orders are possible but only this one keeps every intermediate state green:
  removing the plan history first is what makes phase 2's search condition satisfiable, because six completed plans
  reference the generator.
- Do not create the future environment repository or build any part of it here.
- Do not leave plan-number or phase-number citations outside `exec-plans/`.
- Do not publish, push, tag, or change remote settings.

## Rejected Removals

Validation rejected three removals an earlier revision proposed. Each rested on a factual error.

1. **The complexity ratchet stays.** Both repositories derive the four limits from the same shared owner,
   `tools/portable-core/complexity-engine.mjs`, byte-identical in both, whose `STRICT_LIMITS` are `complexity: 10`,
   `statements: 40`, `depth: 4`, `params: 6`. `eslint-complexity-config.mjs` states that `complexity-baseline.json` is
   "a Dyninstruments-local debt overlay layered on top of this shared owner; it holds per-function exceptions, not a
   second copy of these limit values." One mechanism, plus an overlay Repository V needs and Repository P does not. The
   baseline pins 175 findings — 118 `complexity` at maximum 37, 21 `max-statements` at 88, 35 `max-params` at 15, 1
   `max-depth` at 5 — so a single ceiling at the observed maximum would let every pinned function grow to 37, let new
   functions be authored at 37 instead of 10, and drop three metrics.
2. **`verified-baseline.json` stays.** Of its 11 sections only `complexityDiagnostic` concerns complexity, and of the 9
   cases in `tests/tools/verified-baseline.test.js` only 2 do. The other 7 are sole owners of unrelated guarantees: the
   whole-surface zero-suppression assertion, the coverage-floor-lowering guard, the unsafe-sink inventory, the frozen
   warn-only rule set, the policy-count cross-check, and the test-exception liveness check.
3. **The `tsconfig` `files[]` enumerations stay.** Repository P also enumerates — 20 `include`, 79 and 62 `files[]` —
   and `typecheck-source.mjs` requires the complete live inventory in `tsconfig.checkjs.json`, failing on
   `missingFromInventory` and `extraInInventory`. Same mechanism as Repository V's
   `typecheck-inventory-contract.test.js`; the 959-versus-212 gap is scale, 910 files against 161.

## Implementation Order

### 1. Remove the completed-plan history

Intent: delete inert weight, after repointing every referent and keeping the exclusion rule tested.

Dependencies: none.

Deliverables:

- Repository V `documentation/guides/exec-plan-authoring.md` updated **before** any deletion: the live `PLAN6.md` link
  at line 73 replaced by a non-link reference, and the retain-in-`completed/` workflow at line 12 rewritten to
  archive-in-history. Repository P's copy needs no edit (verified fact 6).
- The four vacuous-risk assertions rewritten against a synthetic path, in the same change as the deletion: Repository V
  `format-scope-contract.test.js:65`, Repository P `format-scope.test.mjs:74-76`.
- The remaining fact 6 referents resolved: leave `check-standalone-boundary.mjs:63` and its
  `portable-core-contract.test.js:98-105` owner untouched, so the exemption and its proof both survive; leave
  `suppression-engine.mjs:198` untouched, avoiding the manifest, signature, and distribution-manifest regeneration it
  would force; keep both repositories' historical-exclusion patterns; keep Repository P's `.prettierignore:10`,
  `.markdownlint-cli2.jsonc:16`, and `pyproject.toml:20`; leave the two synthetic check-patterns fixtures alone.
- All 47 completed plans in Repository V and all 13 in Repository P deleted, with no `.gitkeep` and no file placed in
  the emptied directory.
- Repository V's `.prettierignore:7` and `.markdownlint-cli2.jsonc:7` entries retained with a comment recording that the
  path stays excluded so a future plan can be archived there without reconfiguration.

Exit conditions:

- `npm run docs:check` passes in both repositories, with seeded-file and link counts recorded, proving the link was
  repointed rather than skipped.
- The four rewritten assertions fail when the historical-exclusion pattern is removed from its owner — Repository V
  `project-format-scope.json`, Repository P `generate-format-scope.mjs:20` — proving they are not vacuous.
- `npm run check:all` exits 0 in both repositories, and `check-alignment --peer` reports zero findings both directions.

### 2. Remove the starter generator

Intent: delete meta-tooling no product depends on.

Dependencies: phase 1, which removes the six completed plans that reference the generator.

Deliverables:

- The five generator files, both `create-avnav-plugin-starter` tests, and both `starter:create` scripts deleted.
- The five paths **removed from** `alignment-inventory.json`'s `portable-identical` list, leaving the `remove` list
  empty, per verified fact 9. Adding them to `remove` is a defect, not an alternative.
- The remaining fact 10 referents updated: `distribution-manifest.json` and `distribution-source.json` reduced from 16
  paths to 11 with the regenerated digest recorded; `format-scope.json`, `test-inventory.json`,
  `project-pattern-scopes.json`, `tsconfig.tests.json`, `tsconfig.tools.json`; prose in both `README.md`, both
  `CONTRIBUTING.md`, and `quality-gates.md` at `:84` and `:113`; Repository P's `command-graph.test.mjs:55` allowance;
  Repository P's `generate-format-scope.mjs:44` immutable-capture entry, which must clear before phase 3 touches that
  module.
- The five removed paths with their pre-removal sha256 digests recorded in the completion evidence, so the future
  environment repository can retrieve exactly these bytes from history.
- No `ARCHITECTURE.md` edit for the generator in either repository (verified fact 10).

Exit conditions:

- A case-insensitive repository-wide search finds no generator reference anywhere outside `exec-plans/active/`, output
  recorded. This is satisfiable only because phase 1 ran first.
- `npm run check:all` exits 0 in both repositories; `check:shared-core`, `check:distribution`, `check:profile`, and
  `check-alignment --peer` pass both directions with the reduced manifest.
- Repository P's `command-graph` test passes, proving the allowance was removed rather than orphaned.

### 3. Stop committing the format scope

Intent: stop storing a row per file for derivable data, by the smallest change that removes the dependency.

Dependencies: phase 2.

Deliverables:

- One test case deleted per repository — Repository V `format-scope-contract.test.js` line 34, Repository P
  `format-scope.test.mjs` line 33 — which per verified fact 13 removes the entire dependency on the committed file. Both
  files otherwise survive intact, with 6 and 5 cases respectively. No test is rehomed and no test file is created; the
  staleness guarantee is recorded as dissolved, because nothing committed can be stale.
- `format-scope.json` no longer committed in either repository; the `format:scope` script removed from both
  `package.json` files; the writer paths at Repository V `generate-format-scope.mjs:13` and `main()` `:95` and
  Repository P `:18` removed so the module only builds in process; `alignment-inventory.json:21` entry removed in both.
- Every remaining fact 14 reader repointed to `buildFormatScope()`, in both repositories.
- Repository V's `formatting-scope-contract.test.js` repointed at the in-process scope, and its honest post-removal
  strength recorded: 6 of 12 cases keep full independence through Prettier's real `getFileInfo` resolution and
  markdownlint scope; 4 lose their independent oracle, one of those four being already tautological; 2 are no-ops
  against an empty exclusion list. Each weakened case is either given an independent oracle or deleted with the loss
  recorded. No weakened case may be left presented as a proof.
- `project-format-scope.json` untouched in Repository V; Repository P has none (verified fact 15), so its hardcoded
  equivalents at `generate-format-scope.mjs:20` and `:52` are the targets there.
- Documentation edits are Repository P only, per verified fact 16: `CONTRIBUTING.md:70`, `ARCHITECTURE.md:25,31`, and
  `documentation/guides/documentation-maintenance.md:75`. Repository V needs none, and neither repository's
  `quality-gates.md` nor either `TABLEOFCONTENTS.md` requires an edit.
- `generate-format-scope.mjs` stays adapter-owned and is not reconciled to byte-identity (verified fact 17).

Exit conditions:

- `format-scope.json` and the `format:scope` script are absent from both repositories, and no gate output references
  them.
- Both surviving consumer tests pass with 6 and 5 cases, and the recorded case-by-case strength of
  `formatting-scope-contract.test.js` matches its actual assertions.
- Adding a maintained file of a Prettier-owned type, of a Ruff-owned type in Repository P, and of an unsupported type
  each classify correctly with no committed file edited.
- `npm run format:check` and `npm run docs:links` pass in both, and adding a Markdown file no longer needs a
  regeneration step before `docs:check` sees it.
- `npm run check:all` exits 0 in both repositories with unchanged coverage, duplication, file-size, and lint thresholds,
  and the after-measurement is recorded below.

## Progress Tracking

| Phase | Title                             | State       | Evidence |
| ----: | --------------------------------- | ----------- | -------- |
|     1 | Remove the completed-plan history | Not started | -        |
|     2 | Remove the starter generator      | Not started | -        |
|     3 | Stop committing the format scope  | Not started | -        |

## Measurement Record

Committed-tree figures on the basis stated in the Verified Baseline.

| Repository | Stage  | `tools/` lines | Product lines | Ratio |
| ---------- | ------ | -------------: | ------------: | ----: |
| V          | Before |         31,694 |        45,548 |  0.70 |
| V          | After  |              - |             - |     - |
| P          | Before |         19,742 |         9,819 |  2.01 |
| P          | After  |              - |             - |     - |

Expected, to be confirmed rather than assumed: about 9,800 tooling lines out of Repository V (5,279 generator, 4,550
format scope) and 6,850 out of Repository P (5,279 generator, 1,569 format scope), plus 37,192 and 14,207 lines of plan
history. Projected ratios about 0.48 and 1.31.

## User-Facing Documentation Impact

Deliberately minimal, because verified fact 16 shows most candidate edits are vacuous.

- Both `README.md` and both `CONTRIBUTING.md`: remove `npm run starter:create` and the greenfield starter.
- Both `documentation/conventions/quality-gates.md`: remove the `starter:create` entry at `:84` in Repository V and
  `:113` in Repository P. No format-scope entry exists in either.
- Repository V `documentation/guides/exec-plan-authoring.md`: replace the line 73 link and rewrite the line 12 workflow.
  Phase 1 prerequisite. Repository P needs no edit.
- Repository P only, for the format scope: `CONTRIBUTING.md:70`, `ARCHITECTURE.md:25,31`,
  `documentation/guides/documentation-maintenance.md:75`.
- No documentation page is deleted or renamed, so neither `TABLEOFCONTENTS.md` changes.
- No theming token, widget kind, or bundled layout changes, so `tests/css/theme-token-extremes.user.css`,
  `tests/layouts/gpspage-all-widgets.json`, and `tests/layouts/gpspage-all-widgets.test.js` stay untouched.

## Acceptance Criteria

### Removal completed

- Neither repository contains a completed execution plan, and `exec-plans/completed/` contains no file at all.
- Neither repository contains the starter generator, its tests, its scripts, or any referent from verified fact 10.
- The five generator paths are absent from `alignment-inventory.json` entirely, and its `remove` list is empty.
- `format-scope.json` and the `format:scope` script are committed in neither repository.
- The five removed generator paths and their pre-removal digests are recorded in this file.

### Nothing weakened

- Exactly one test case was deleted per repository in phase 3, and both consumer test files survive with 6 and 5 cases
  passing. No test file was created.
- The four rewritten historical-exclusion assertions fail when their exclusion pattern is removed.
- `check-standalone-boundary.mjs:63`, its `portable-core-contract.test.js:98-105` owner, and
  `suppression-engine.mjs:198` are unchanged, so no manifest or signature regeneration was needed for phase 1.
- The post-removal strength of `formatting-scope-contract.test.js` is recorded case by case, with no weakened case left
  presented as a proof.
- The complexity ratchet, its baselines, `verified-baseline.json` and its nine-case test, and all `tsconfig`
  enumerations are unchanged, per "Rejected Removals".
- The four protected capture files are intact in both repositories.
- No coverage floor, complexity baseline entry, hotspot budget, duplication threshold, type strictness setting,
  file-size limit, schema constraint, workflow check, or lint severity is weaker than at the baseline, and no skip,
  suppression, ignored path, or warning-only substitution was added.

### Green and aligned throughout

- `npm run check:all` exits 0 in both repositories at the end of every phase.
- `node tools/check-standalone-boundary.mjs` passes in Repository V with this file present.
- `check-alignment --peer` reports zero findings in both directions at the end of every phase.
- The signed manifest verifies in both repositories, with `check:distribution` passing after the phase 2 digest change.
- `npm run docs:links` passes with a recorded link count.
- The recorded tooling-to-product ratio improved in both repositories.
- Both repositories pass their full gate from an isolated copy containing only that repository, with no network access
  after setup and no Git metadata.

## Required Validation Commands

Run from each repository at the end of every phase:

```bash
npm run check:all
node tools/check-standalone-boundary.mjs
node tools/check-alignment.mjs --peer=<absolute-path-to-other-repository>
```

`npm run check:all` already composes the 15 gate roles including `check:shared-core`, `check:profile`,
`check:generic-surface`, `check:standalone`, `check:suppressions`, `typecheck`, `package:check` (which contains
`check:distribution` and `check:alignment`), `test:focus:check`, `check:smells`, `check:complexity`, `check:scaling`,
`docs:check`, `check:filesize`, and coverage. Do not add `npm run dependencies:audit` to a phase gate: it is networked
and maintainer-only, which conflicts with the isolation requirement.

Isolation validation copies only maintained files and committed lock inputs into a disposable directory, omitting
`.git`, siblings, dependencies, caches, coverage, and prior artifacts, then runs setup and the full gate. Record
normalized digests, never machine-local absolute paths.

## Out of Scope

Deferred to a separate follow-on plan, because each adds rather than removes:

- Reconciling the four release CLI wrappers, the 18 token-free shared modules, and the residual single-field drifts
  (`semver-corpus.json` `schemaVersion`, `generic-tokens.json` `profileType` and `note`, `skills-lock.json` `source`
  semantics, `.githooks/pre-push` shebang and trailing newline, `CLAUDE.md`). Note for that plan: byte-identity is
  unreachable for `generic-tokens.json` and for two release wrappers, because `.json` is in
  `check-standalone-boundary.mjs`'s scanned extensions and those files carry a boundary token. "One implementation with
  declared per-product differences" is the reachable target.
- Declaring `schemas/avnav-plugin-base.schema.json`, whose identity rests on discipline. Adding it to
  `portable-identical` would give in-gate existence checking only; byte comparison happens in `compareShared()`, which
  runs only under the maintainer-only `--peer` flag.
- A mutation suite, and any new checker, doctrine mechanism, skill, or host API reference tier.

Deferred to the future `avnav-plugin-ai-environment` repository, which `distribution-source.json` already names as
`sourceOwner`: owning and evolving the starter generator (phase 2 records its digests for exact retrieval), a canonical
doctrine source, an extended agent skill layer, and host API reference coverage. When that repository exists it becomes
the manifest origin and these two become conformance-tested consumers, using the peer comparison that passes today.

## Completion Evidence

Record, at minimum: final head revisions and confirmation that Repository P holds no copy of this plan; manifest,
generic-rule, alignment-inventory, and regenerated distribution-manifest digests from both repositories; the five
removed generator paths with pre-removal sha256 digests; the completed measurement record with deltas; `docs:links`
counts before and after phase 1; the case counts of both surviving consumer tests and the recorded strength of
`formatting-scope-contract.test.js`; peer alignment results both directions; full-gate results with test counts and
coverage for both repositories and both isolated copies; and confirmation that every item under "Rejected Removals" is
untouched.

## Related

- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
