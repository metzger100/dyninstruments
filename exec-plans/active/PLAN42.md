# PLAN42 — Make the generic quality surface byte-identical across both role-model repositories

## Status

Written after a third cross-repository quality-system audit on 2026-07-28, executed mechanically against both checkouts:
full `git ls-files` set arithmetic, `cmp` over every same-named file, a name-normalised re-diff of every shared tooling
file, rule-registry extraction and set comparison, SHA-256 recomputation of every agent skill file against both lock
files, suppression counts by kind and area, JSON reconciliation of every baseline against disk, and a complete
`npm run check:all` run in both repositories.

`PLAN41.md` converged the shared quality **contract**: one gate vocabulary, one command graph, one CI workflow, one
documentation shape, a generic/project rule split, and a marked `SHARED_INSTRUCTIONS` block. That work landed and holds.
This plan closes the gap `PLAN41.md` left open: the contract converged, but the **implementations behind it did not**.
After normalising away every project name, the shared tooling files still differ by 36 % to 98 % of their lines, and
`tools/check-patterns/shared.mjs` shares zero exported symbol names with its counterpart. "Shared" is currently asserted
by prose markers and per-repository token blocklists; nothing mechanically proves that any generic artifact is the same
artifact in both repositories.

This plan makes the generic surface byte-identical and mechanically proves it, while leaving every project-specific part
free to differ.

The coding agent may choose equivalent internal helper names, test names, and file splits inside a phase. The shared
core manifest, the canonical rule identifiers, the per-artifact donation table, the single genericness token owner, the
project-owned-data boundary, and the paired acceptance matrix are prescriptive.

No pre-plan interview was run. The audit resolved the relevant design branches, so this plan makes these assumptions
explicit:

1. Plugin runtime behavior, widgets, clusters, layouts, theming, AvNav integration, packaging, and release artifacts
   remain unchanged. No user-visible behavior changes.
2. This repository remains a JavaScript/browser **role model**, not a greenfield template. Neither repository can be
   used directly for a greenfield project, and this plan does not try to make that true. The greenfield environment will
   be written separately and derived from the byte-identical core this plan produces.
3. Required gates must remain independently runnable. No gate may read the sibling Polar Recorder checkout, at any
   phase, for any reason. Cross-repository identity is proven by both repositories committing the **same manifest
   digests**, verified locally in each.
4. The paired implementation plan is Polar Recorder `exec-plans/active/PLAN9.md`, with the same title. The two plans
   share the Shared Core Contract, the Canonical Rule Identifiers table, and the Paired Acceptance Matrix verbatim.
5. Donation direction is decided per artifact on audited merit, not per repository. This repository donates some
   implementations and adopts others.
6. Product test files keep their existing dialect. Only the self-tests of artifacts that enter the shared core change
   dialect.

Repository rules and core principles outrank this plan. If implementation reveals a conflict, amend the active plan with
repository evidence instead of weakening a gate or silently improvising.

---

## Goal

Turn the two independently healthy quality systems into one byte-identical generic core plus two project profiles, so
the core can be lifted into a greenfield generator without any further design decisions.

Expected outcomes after completion:

- A committed `tools/quality-policy/shared-core-manifest.json` lists every generic-surface path with its SHA-256, and
  `npm run check:shared-core` fails when any listed file drifts. Both repositories commit the **identical** manifest, so
  cross-repository identity is enforced without either gate reading the other checkout.
- One genericness token owner replaces the six inconsistent blocklists, and one shared checker applies it to the
  `SHARED_INSTRUCTIONS` block, every generic skill file, every generic rule definition (content and semantics), and
  every generic tool module.
- `tools/check-patterns.mjs`, its shared modules, and its generic rule definitions are byte-identical in both
  repositories. Rule scope globs and project remedy text move out of generic rule definitions into project-owned data.
- Every generic rule concept has exactly one canonical identifier and one classification, identical in both.
- The suppression marker grammar is de-branded: no generic-layer module contains a project prefix.
- Complexity, coverage-inventory, and test-inventory **mechanisms** are byte-identical; their **baseline data** stays
  project-owned. An empty complexity baseline reproduces strict, no-exception enforcement, which is the greenfield
  default.
- Every generic checker exports a `run*()` entry point, so a self-test is always possible; the three checkers in this
  repository that currently have no self-test gain one.
- Every immutable baseline entry is proven to resolve to a live path, and every hand-written count in
  `documentation/conventions/quality-gates.md` is asserted rather than narrated.
- The 1153 test-layer type suppressions are **gone**, not capped: the test layer is genuinely strict, and two
  independent rules make a reintroduced suppression fail the gate. Both repositories then sit at exactly zero, measured
  across the whole maintained surface.
- `npm run check:all` stays green in this repository at the end of every phase.

---

## Verified Baseline

Verified against this checkout at `c743f965` and the Polar Recorder checkout at `e03962b` on 2026-07-28. Both worktrees
clean, both on `main`.

1. `npm run check:all` exits 0 in both repositories. This repository reports 450 test files, 1980 tests, 92.26 %
   statements / 79.77 % branches, and "Coverage inventory check passed: 228 classified production files."
2. 91 tracked paths exist in both repositories. Exactly 6 are byte-identical: `.codex/config.toml`,
   `.github/workflows/quality.yml`, `.nvmrc`, `.prettierrc.json`, `schemas/avnav-plugin-base.schema.json`, and
   `exec-plans/active/.gitkeep`. The other 85 diverge.
3. After normalising `dyninstruments|polarrecorder|Dyni|DyniComponents|…` to a single token, collapsing whitespace, and
   dropping blank lines, residual divergence across shared tooling files is: `install.sh` 1 %,
   `tools/quality-policy/run-format.mjs` 36 %, `tools/release-prepare.mjs` 36 %, `linkinator.config.json` 38 %,
   `tools/quality-policy/generate-format-scope.mjs` 45 %, `tools/release-create.mjs` 50 %, `.githooks/pre-push` 55 %,
   `tools/quality-policy/eslint-complexity-config.mjs` 56 %, `tsconfig.tools.json` 60 %,
   `tools/check-patterns/generic/namespace-policy.mjs` 79 %, `eslint.config.mjs` 80 %, `tools/check-file-size.mjs` 87 %,
   `tools/check-schema.mjs` 89 %, `tools/quality-policy/test-inventory.mjs` 91 %, `tools/check-test-focus.mjs` 93 %,
   `tools/check-file-size/oneliner-rules.mjs` 93 %, `tools/quality-policy/check-coverage-inventory.mjs` 94 %,
   `tools/check-patterns/rules.mjs` 96 %, `tools/check-patterns/shared.mjs` 98 %.
4. `tools/check-patterns/shared.mjs` exports 17 symbols here (`resetContext`, `getWarnMode`, `getRoot`, `filesForScope`,
   `getFileData`, `lineAt`, `asGlobal`, `compareFindings`, `escapeRegex`, and others) and 6 there (`PATTERN_RULE_IDS`,
   `setRoot`, `suppressionMarker`, `isSuppressed`, `fail`, `toRel`). The intersection is empty.
   `tools/check-file-size/oneliner-rules.mjs` exports `detectOnelinerKind` here and `ONELINER_MESSAGE_BY_KIND` /
   `detectOneliners` / `countFindingsByKind` there. The intersection is empty.
5. `tools/check-test-focus.mjs` in this repository exports nothing; it is a pure CLI script and therefore not
   importable. Polar Recorder's exports `runTestFocusCheck`. Its `tools/check-file-size.mjs` exports `runFileSizeCheck`;
   this repository's does not.
6. Six separate token blocklists define "generic", and no two agree.
   `tests/contract/shared-instructions-block-contract.test.js` and `tests/contract/skill-layer-contract.test.js` use
   `Dyni, dyninstruments, AvNav, avnav, componentContext, ClusterWidget, mapper, ResponsiveScaleProfile, widget-kits`.
   `tests/contract/pattern-rule-generic-scope-contract.test.js` drops `dyninstruments` and `widget-kits` and adds
   `editable`. Polar Recorder uses a different list in each of three files, and its `tests/js/skills-lock.test.mjs` list
   forbids **this repository's** tokens while explicitly permitting its own.
7. `widget` and `cluster` appear in no blocklist in this repository. Consequence: `GENERIC_RULES` contains a rule named
   `console-in-widgets`, and `npm run test:contract` passes.
8. Grepping the generic tool layer here finds 26 or more project-token occurrences: `tools/check-patterns/shared.mjs`
   contains `cluster` 12 times and `renderer` 4 times; `tools/check-patterns/shared-suppressions.mjs` contains `dyni` 11
   times; five `tools/check-patterns/generic/rules-*-defs.mjs` files name `Dyninstruments` in comments. Polar Recorder's
   generic layer leaks 5 occurrences, all in `tools/check-patterns/shared.mjs`.
9. `tests/contract/pattern-rule-generic-scope-contract.test.js` checks only rule semantics (name, `detect` regex,
   rendered message) and documents in-file that scope globs are deliberately excluded. Polar Recorder's
   `tests/js/check-patterns-registry.test.mjs` scans whole generic rule-definition **file contents** instead. The two
   contracts check different things.
10. Rule-name sets: 19 generic and 23 project rules here; 16 generic and 12 project rules there. Exactly 8 generic names
    exist in both: `absolute-home-path`, `canvas-api-typeof-guard`, `default-truthy-fallback`, `exec-plan-reference`,
    `premature-legacy-support`, `redundant-null-type-guard`, `try-finally-canvas-drawing`, `unused-fallback`. Exactly 2
    project names exist in both: `namespace-token-consistency`, `hardcoded-runtime-default`.
11. Same-concept rules carry different names: `unsafe-html-dom-sink` here versus `inner-html-assignment` there;
    `empty-catch` versus `promise-empty-catch`; `dead-code` versus `commented-out-code`;
    `catch-fallback-without-suppression` versus `catch-fallback`; `internal-hook-fallback` versus
    `internal-namespace-fallback`; one `todo-without-owner` rule here versus three
    `todo-without-owner:{js,markdown, python}` rules there.
12. Three rules are classified on opposite sides: `framework-method-typeof-guard` and `invalid-lint-suppression` are
    generic here and project there; `responsive-layout-hard-floor` is project here and generic there.
13. `tools/check-patterns/project/rules-responsive-defs.mjs` shows why fact 12's third case is the wrong way round: the
    `responsive-layout-hard-floor` **detection** is generic (an inline numeric floor in `Math.max`/`clamp`), and only
    its scope list and its message text (`Use ResponsiveScaleProfile-derived sizing`) are project-specific. Polar
    Recorder's copy in `tools/check-patterns/generic/structural-rules.mjs` carries the same detection with a
    project-free message.
14. `tools/quality-policy/eslint-complexity-config.mjs` freezes `STRICT_LIMITS` at complexity 10, max-statements 40,
    max-depth 4, max-params 6, and exports `STRICT_COMPLEXITY_RULES` at **warn** severity. Polar Recorder freezes the
    identical four values in a same-named file but builds its rules at **error** severity in a second file,
    `tools/quality-policy/eslint.complexity.config.mjs`, which does not exist here. Its own header states there is no
    baseline, scanner, or exception ledger anywhere in that repository.
15. `npm run check:complexity` here is `complexity-capture-integrity.mjs && complexity-budget.mjs`, over
    `PRODUCTION_ROOTS = ["config", "runtime", "cluster", "shared", "widgets"]`, against a 175-entry
    `tools/quality-policy/complexity-baseline.json`. There is
    `eslint --config tools/quality-policy/eslint.complexity.config.mjs viewer/*.js plugin.js plugin.mjs`.
16. Quality-policy data files share filenames but not schemas. `coverage-floors.json` here is
    `{note, generatedAgainstEntryCount, entries:{<path>:{classification, lines, branches}}}` with 228 entries; there it
    is
    `{families, pluginPy, viewerPerFileLinePercent, defaultNewFileLinePercent, defaultNewFileBranchPercent, contractOwned}`.
    `coverage-floor-baseline.json`, `test-exception-baseline.json`, and `test-inventory.json` differ the same way.
    `check-coverage-inventory.mjs` is 299 lines in one file here and 113 lines plus a four-module `coverage-inventory/`
    package there.
17. Suppression counts over maintained source, excluding `exec-plans/`, lint fixtures, and
    `tools/quality-policy/format-scope.json`: this repository has 1152 `@ts-ignore`, 13 `eslint-disable`, and one each
    of `@ts-expect-error`, `prettier-ignore`, and `istanbul ignore`, across 160 files, **all under `tests/`**. Polar
    Recorder has 0 of every kind. Production-code suppressions are 0 in both.
18. 1152 of those are the identical string `// @ts-ignore -- pre-existing untyped test mock boundary`. Nothing counts
    them: the `invalid-lint-suppression` rule scope in `tools/check-patterns/generic/rules-failfast-generic-defs.mjs`
    excludes `tests/**` and `tools/**`, and `tests/tools/verified-baseline.test.js` counts suppressions only over
    `PRODUCTION_ROOTS` plus `plugin.js` and `plugin.mjs`.
    `git grep "ts-ignore" -- documentation AGENTS.md CLAUDE.md CONTRIBUTING.md` returns no hits.
19. `tools/quality-policy/test-exception-baseline.json` holds 229 entries (16 `harness-fragment`, 209
    `split-spec-fragment`, 4 `fixture`). Reconciled against disk: 20 exist, **209 do not**. Zero of the 229 appear in
    `tsconfig.tests.json`, and only the 20 live ones appear in `test-inventory.json`. The 209 are the
    `.part2`…`.partN.test.js` fragments removed by `fd9a977d`. `npm run check:all` passes, so no gate flags a stale
    entry.
20. Baseline membership is the authorization to be non-strict, so those 209 filenames are pre-authorized: recreating
    `tests/cluster/mappers/NavMapper.part2.test.js` would inherit a strict-typing exception with no review.
21. `documentation/conventions/quality-gates.md` narrates counts that do not all match reality: `test-inventory.json`
    has **541** entries (521 `strict`, 16 `harness-fragment`, 4 `fixture`) but the document says 472;
    `test-exception-baseline.json` is described as "229 captured non-strict paths" when 20 are live;
    `complexity-baseline.json` has 175 entries, which matches; `coverage-floors.json` has 228 entries, which matches.
    `tsconfig.tests.json` lists 521 files, matching the strict count.
22. `documentation/conventions/quality-gates.md:121` records the focused-test gate's maintained owner as literally "no
    maintained owner". Mechanically, no file under `tests/**` references `tools/check-schema.mjs`,
    `tools/check-test-focus.mjs`, `tools/check-doc-links.mjs`, `tools/check-doc-links-proof.mjs`, or
    `tools/quality-policy/complexity-scan.mjs`. Polar Recorder self-tests all five equivalents.
23. Polar Recorder self-tests `prettier-config`, `eslint-config`, `vitest-projects`, `setup`, and `header-contract`;
    this repository has no equivalent. This repository self-tests `actionlint`, `check-file-size`,
    `check-file-size-oneliner`, `package-scripts`, and `operation-count-evaluator`; Polar Recorder has no equivalent.
24. `skills-lock.json` here holds 5 entries named `grill-me`, `improve-codebase-architecture`, `prd-to-plan`,
    `request-refactor-plan`, `write-a-prd`, with `sourceType: "github"` and source `mattpocock/skills`. The actual
    `.agents/skills/` directories are `add-widget`, `create-plan`, `doc-sync`, `grill-me-repo`, `mapper-review`,
    `preflight`, `scan-smells`. **No lock entry name matches any local skill directory.**
    `tests/contract/skill-layer-contract.test.js` checks only entry shape — a source string, a sourceType string, and a
    64-character hex hash. It never compares a hash to a file. The lock is therefore never verified against anything.
25. Polar Recorder's `skills-lock.json` names the 5 shared skills with `sourceType: "sibling-repository"` and source
    `dyninstruments/.agents/skills/<name>/SKILL.md`, and its `tests/js/skills-lock.test.mjs` does assert
    `sha256(local SKILL.md) === computedHash`. Recomputing confirms its hashes match **its own local files**
    (`preflight` → `dedbc2e3…`), while this repository's `preflight/SKILL.md` hashes to `af0e5f8b…`. The recorded
    provenance is false and the drift is undetected.
26. The `SHARED_INSTRUCTIONS` block is 67 lines here and 74 lines there. The `BEGIN` marker sits **before** the
    "AGENTS.md is a routing map" line here and **after** it there, so the two blocks do not enclose the same sections.
    Section 2 permits a literal `PLANn.md` pointer here and forbids plan-number citation outright there. The block there
    contains a "Required Documentation Shape" subsection that the block here omits, although `check:docformat` here
    enforces exactly that shape.
27. `documentation/conventions/documentation-format.md` here mandates an emoji `**Status:**` vocabulary
    (`✅ Implemented / ⏳ In Progress / ❌ Not Started`), a `## API/Interfaces` section, a `## Fixed Issues (if any)`
    section, and a "Token Budget Management" allocation table. There it mandates `**Status:** Current.` and the four
    sections only. The **enforced** contract in both is title plus `**Status:**` plus `## Overview` plus
    `## Key Details` plus `## Related`, with `documentation/TABLEOFCONTENTS.md` exempt — that is,
    `tests/contract/documentation-format-contract.test.js` and `tests/js/doc-format-contract.test.mjs` are functionally
    identical. All 77 documents here and all 28 there carry a `**Status:**` line.
28. `documentation/guides/exec-plan-authoring.md` diverges the same way: emoji status and different section names here,
    `**Status:** Current.` there.
29. `docs:check` here is
    `docs:lint && docs:links:proof && docs:links && check:doclinks && check:reachability && check:docformat`. There it
    is the first three only, with TOC, format, reachability, smell-catalog, and pointer contracts reached through
    `test:tools`. Polar Recorder has a dedicated `tests/js/doc-toc-contract.test.mjs`; this repository folds TOC into
    reachability.
30. `jscpd.config.json` here sets `threshold: 0.25`, `minLines: 30`, `minTokens: 120`, no `path`, and ignores `tests/**`
    and `documentation/**`. There it sets `threshold: 0`, default `minLines`/`minTokens`,
    `path: ["viewer", "plugin.js", "plugin.mjs"]`, and `gitignore: true`. This repository additionally has the
    `duplicate-functions` and `duplicate-block-clones` generic pattern rules; Polar Recorder instead has
    `tools/check-js-duplication.mjs` (with an `acorn` dependency) and `tools/check-duplication.py`.
31. `eslint.config.mjs` differences: this repository does not set `noInlineConfig` and has no `no-warning-comments`
    rule; it uses `eqeqeq: ["error", "smart"]`, `no-unused-vars` with `caughtErrors: "none"`, no `no-console`, no
    `no-empty`, and it has `no-useless-assignment` and `@eslint-community/eslint-plugin-eslint-comments` with
    `reportUnusedDisableDirectives: "error"`. Polar Recorder sets `noInlineConfig: true` on every group, bans the six
    suppression terms via `no-warning-comments` at error, uses strict `eqeqeq` and `caughtErrors: "all"` with
    `caughtErrorsIgnorePattern: "^_"`, and sets `no-console` and `no-empty` with `allowEmptyCatch: false` on shipped
    runtime. Only this repository drives a relaxed test-file class from `test-inventory.json`.
32. `vitest.config.js` here is CommonJS `module.exports` with no `defineConfig`, `globals: true`, projects `unit-node` /
    `contract` / `unit-dom`, and explicit **file lists** for the first two with a catch-all `unit-dom`. Polar Recorder's
    `vitest.config.mjs` uses `defineConfig`, no globals, projects `tools` / `viewer` / `plugin`, and glob patterns only,
    with an in-file rationale that file lists risk silent exclusion. Test files here are `.test.js` using `require()`
    and `expect()`; there they are `.test.mjs` using `import` and `node:assert/strict`.
33. Absent here and present there: `tools/check-all.sh`, `tools/check-js-duplication.mjs` and its two submodules,
    `tools/check-duplication.py`, `tools/check-smell-contracts.mjs`, `tools/check-viewer-contracts.mjs`,
    `tools/check-dependencies.mjs`, `tools/check-publisher-workflow.mjs`, `tools/quality-policy/typecheck-source.mjs`,
    `tools/quality-policy/typecheck-tools.mjs`, `tools/setup.mjs`, `tools/release-runtime.mjs`,
    `tools/viewer-harness.mjs` and its two submodules, and `tools/quality-policy/canonical_json.py`.
34. `tools/check-file-size.mjs:33` excludes `/^exec-plans\//` here, and Polar Recorder's `collectTargetFiles` never
    collects `exec-plans/`, so plan files are exempt from the 400-line limit in both.
35. `tools/quality-policy/format-scope.json` has the identical schema in both (`{rows: [{path, owner}], countByOwner}`)
    and is generated. `tests/contract/format-scope-contract.test.js` asserts the committed rows equal fresh discovery,
    so adding any tracked file requires rerunning `npm run format:scope`.
36. `exec-plans/completed/PLAN41.md` is the most recent completed plan here; `exec-plans/active/` contains only
    `.gitkeep`. Polar Recorder's most recent completed plan is `PLAN8.md`.
37. The `todo-without-owner` scope divergence is observable, not theoretical. This repository's rule scopes
    `["**/*.js", "**/*.md"]` excluding only `node_modules/**`, `README.md`, `CONTRIBUTING.md`, and `ROADMAP.md`, so it
    scans `exec-plans/**` too. Polar Recorder's `todo-without-owner:markdown` uses `collectMarkdownTodoTargets`, which
    walks `documentation/` plus six root Markdown files and never reaches `exec-plans/`. Writing the bare marker word in
    a plan file therefore fails `npm run check:patterns` here and passes there — verified while authoring this plan.
    Fact 34's file-size exemption does not extend to the pattern rules.
38. Negative fact: no file named `shared-core-manifest.json`, `check-shared-core.mjs`, `generic-tokens.json`, or
    `pattern-scope-overrides.json` exists in either repository. Nothing anywhere compares an artifact in one repository
    to the same artifact in the other.
39. The cost of removing every test-layer type suppression is measured, not estimated. Method: `git archive HEAD`
    extracted to a disposable tree with `node_modules` symlinked, every whole-line
    `// @ts-ignore -- pre-existing untyped test mock boundary` deleted, then `npx tsc -p tsconfig.tests.json`. The
    unmodified tree exits 0; the stripped tree produces **1667 diagnostics across 19 TypeScript codes in 151 files**.
    All 156 files carrying a suppression are inside `tsconfig.tests.json`'s 521-file strict set, so **no suppression is
    dead** and none can be deleted for free. Class breakdown:
    - Implicit-any family — **1295 (78 %)**: TS7006 parameter 1110, TS7005 variable 97, TS7034 indeterminate 46, TS7053
      index expression 27, TS7017 no index signature 15.
    - Property-not-on-type — TS2339 **170**, of which 116 are on inferred `never` (empty array or object literal never
      widened) and 24 on `{}`. These are literal-inference defects, not missing product types.
    - Strict-null family — **120**: TS18047 possibly null 64, TS18048 possibly undefined 51, TS2532 4, TS2531 1.
    - Assignability and miscellaneous — **82**: TS2345 42, TS2722 11, TS2322 10, TS2551 6, TS2493 5, TS2683 4, TS2790 2,
      TS2721 1, TS2353 1.

    Concentration: **595 of 1667 (36 %) land in 35 shared `-setup.js` / `.harness.js` files**; the remaining 1072 are
    spread over 116 plain test files. Per-file distribution: 64 files carry 1–5 diagnostics, 57 carry 6–15, 24 carry
    16–40, and 6 carry 41 or more. The four worst are `tests/shared/radial/FullCircleRadialTextLayout-setup.js` (97),
    `tests/shared/radial/SemicircleRadialTextLayout-setup.js` (84),
    `tests/widgets/radial/WindRadialWidget.formatsSpeedViaComponentcontextFormat.test.js` (64), and
    `tests/widgets/text/ThreeValueTextWidget-setup.js` (45).

40. `tsconfig.tests.json` sets `strict: true` with `checkJs: true` and no TypeScript sources, so every annotation must
    be JSDoc in the `.js` file or a declaration in `types/`. `types/` already carries `globals/`, `kits/`, `pending/`,
    `bootstrap.d.ts`, and `runtime-init.d.ts`, so a shared test-harness declaration has an established home. Negative
    fact: no `types/test-harness.d.ts` exists today.
41. Adopting Polar Recorder's `no-warning-comments` rule (fact 31) bans the literal string `ts-ignore` anywhere in a
    linted file. Landing that rule while 1153 such comments exist would fail `npm run lint` immediately, so the
    suppressions must be eliminated **before** the rule lands, not alongside it.

---

## Shared Core Contract

This section is verbatim identical in Dyninstruments `PLAN42.md` and Polar Recorder `PLAN9.md`. Neither may be edited
without amending the other in the same task.

### Definitions

- **Generic surface (Tier 1).** Files whose content depends on no product concept of either repository. Tier 1 files
  must be **byte-identical** in both repositories and are listed in `shared-core-manifest.json` with their SHA-256.
- **Project profile (Tier 2).** Files that encode one product's concepts: runtime and viewer and server code, product
  schemas, product rule definitions, product documentation, and every baseline **data** file. Tier 2 files must differ
  freely and are never listed in the manifest.
- **Project-owned data.** JSON or config consumed by a Tier 1 tool that supplies the tool with this repository's paths,
  scopes, limits, remedies, or captured debt. Project-owned data is Tier 2; the tool reading it is Tier 1.
- No Tier 1 file may contain a project token. No Tier 1 file may hard-code a product path, a product prefix, or a
  product remedy sentence.

### Per-artifact donation table

Direction is decided on audited merit, per artifact.

| Artifact                                                                               | Canonical source        | Reason                                                                                          |
| -------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `tools/check-patterns.mjs`, `check-patterns/shared*.mjs`, `check-patterns/rules-*.mjs` | Dyninstruments          | Severity model, `--warn` mode, per-finding suppression, declarative default runner              |
| Suppression marker grammar                                                             | Dyninstruments, renamed | Owner, date, reason, and expiry validation; prefix must be de-branded                           |
| `tools/check-patterns/generic/*` rule definitions                                      | Merge                   | Union of both sets under canonical names, with scope and remedy externalised                    |
| `tools/check-file-size.mjs` and `check-file-size/*`                                    | Polar Recorder          | Exports `runFileSizeCheck`, so it is importable and self-testable                               |
| `tools/check-test-focus.mjs`                                                           | Polar Recorder          | Exports `runTestFocusCheck`; the Dyninstruments copy exports nothing                            |
| `tools/check-schema.mjs`                                                               | Polar Recorder          | Has a self-test; the Dyninstruments copy has none                                               |
| `tools/check-doc-links.mjs`, `check-doc-links-proof.mjs`                               | Polar Recorder          | Have self-tests                                                                                 |
| `tools/hooks-install.mjs`, `tools/hooks-doctor.mjs`                                    | Polar Recorder          | Have self-tests and richer repair output                                                        |
| `tools/quality-policy/run-format.mjs`, `generate-format-scope.mjs`                     | Polar Recorder          | Lowest residual divergence already, and self-tested                                             |
| `tools/quality-policy/check-coverage-inventory.mjs` and its data schema                | Dyninstruments          | "Every shipped file classified exactly once" is the stronger fail-closed invariant              |
| `tools/quality-policy/test-inventory.mjs` and its data schema                          | Dyninstruments          | Per-file classification generalises; the flat helper list does not                              |
| `complexity-scan.mjs`, `complexity-budget.mjs`, `complexity-capture-integrity.mjs`     | Dyninstruments          | An empty baseline reproduces strict enforcement, so one mechanism serves both postures          |
| `tools/quality-policy/eslint-complexity-config.mjs`                                    | Merge                   | One owner exporting `STRICT_LIMITS` plus a severity-parameterised rule fragment                 |
| `tools/release-*.mjs`, `tools/release-path-policy.mjs`, `release-zip-builder.mjs`      | Dyninstruments          | All-JavaScript; no Python release path                                                          |
| `install.sh`                                                                           | Dyninstruments          | Already 1 % residual divergence                                                                 |
| `eslint.config.mjs` base strictness                                                    | Polar Recorder          | `noInlineConfig`, banned suppression terms, strict `eqeqeq`, `caughtErrors: "all"`              |
| `eslint.config.mjs` test scoping                                                       | Dyninstruments          | Inventory-driven relaxation is the more precise mechanism                                       |
| `jscpd.config.json` thresholds                                                         | Polar Recorder          | `threshold: 0` at 5 lines / 50 tokens is the stronger bound                                     |
| Duplication second layer                                                               | Dyninstruments          | `duplicate-functions` and `duplicate-block-clones` replace two bespoke tools                    |
| `vitest.config` shape                                                                  | Polar Recorder          | `defineConfig`, ESM, glob-only projects, no silent-exclusion risk                               |
| `documentation/conventions/documentation-format.md`                                    | Polar Recorder          | Matches what both already enforce                                                               |
| `documentation/guides/exec-plan-authoring.md`                                          | Polar Recorder          | `**Status:** Current.`, no emoji vocabulary                                                     |
| `.githooks/pre-push`, `.githooks/README.md`                                            | Polar Recorder shape    | Documented shape, plus an optional repo-local virtualenv `PATH` block that is inert without one |
| `.markdownlint-cli2.jsonc`, `linkinator.config.json`                                   | Merge                   | Same rule set, union of ignores, strictest link options                                         |
| `tsconfig.*.json` `compilerOptions`                                                    | Merge                   | Identical options; `files` and `include` stay project-owned                                     |
| `skills-lock.json` semantics                                                           | Polar Recorder          | Hash is verified against the local file; Dyninstruments never compares a hash                   |
| `skills-lock.json` shape assertions                                                    | Dyninstruments          | Explicit generic/project skill classification                                                   |
| `SHARED_INSTRUCTIONS` block                                                            | Merge                   | Resolved per conflict in the table below                                                        |
| `.github/workflows/*`, `.nvmrc`, `.prettierrc.json`, `.codex/config.toml`, base schema | Already identical       | No change                                                                                       |

### Shared-instructions conflict resolutions

| Conflict                     | Resolution                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `BEGIN` marker position      | `BEGIN` goes immediately after the one-line file purpose and before the routing-map note, so both blocks enclose sections 0 through 4  |
| Plan-citation rule           | Adopt the Dyninstruments reading: a literal pointer to a real `PLANn.md` file is permitted; citing a plan or phase as authority is not |
| Required documentation shape | Adopt the Polar Recorder inclusion: the shape rule belongs inside the shared block, since both repositories enforce it                 |
| Quality-checklist skeleton   | Union of both item sets, with every product-specific item moved below the `END` marker                                                 |
| Gate-name references         | The block names only `check:all`, `check:fast`, and `check:core`; every other command name lives below the `END` marker                |

### Canonical rule identifiers

One identifier and one classification per concept. Both repositories rename to match.

| Concept                            | Canonical name                       | Class   | Was (Dyninstruments)                 | Was (Polar Recorder)                    |
| ---------------------------------- | ------------------------------------ | ------- | ------------------------------------ | --------------------------------------- |
| Unsafe HTML or DOM sink            | `unsafe-html-dom-sink`               | generic | `unsafe-html-dom-sink`               | `inner-html-assignment`                 |
| Swallowed catch                    | `empty-catch`                        | generic | `empty-catch`                        | `promise-empty-catch`                   |
| Dead or commented-out code         | `dead-code`                          | generic | `dead-code`                          | `commented-out-code`                    |
| Catch with unsanctioned fallback   | `catch-fallback-without-suppression` | generic | `catch-fallback-without-suppression` | `catch-fallback` (project)              |
| Re-defaulting an internal contract | `internal-contract-fallback`         | generic | `internal-hook-fallback`             | `internal-namespace-fallback` (project) |
| Undated or unowned work marker     | `todo-without-owner`                 | generic | `todo-without-owner`                 | three per-language rules                |
| Framework method typeof guard      | `framework-method-typeof-guard`      | generic | generic                              | project                                 |
| Invalid lint suppression           | `invalid-lint-suppression`           | generic | generic                              | project                                 |
| Inline responsive layout floor     | `responsive-layout-hard-floor`       | generic | project                              | generic                                 |
| NUL byte in maintained source      | `no-nul-byte`                        | generic | contract test only                   | `no-nul-byte`                           |
| Console call in shipped runtime    | `console-in-runtime`                 | generic | `console-in-widgets`                 | ESLint `no-console` only                |

`internal-contract-fallback` is a third name deliberately: neither existing name is project-neutral.
`console-in-runtime` replaces `console-in-widgets` because the old name is itself the proof that the blocklist gap is
real.

### Genericness token owner

One file, `tools/quality-policy/generic-tokens.json`, with three arrays, identical in both repositories:

- `projectTokens` — every product token of **both** repositories, so a Tier 1 file naming either is rejected: `dyni`,
  `dyninstruments`, `dynicomponents`, `dyniplugin`, `polarrecorder`, `polar recorder`, `polar.json`, `windy`.
- `domainTokens` — product-domain nouns that make a file un-liftable even when neither project is named: `widget`,
  `cluster`, `gauge`, `renderer`, `mapper`, `viewer`, `layout profile`, `componentContext`, `ClusterWidget`,
  `ResponsiveScaleProfile`, `widget-kits`, `editable`, `pluginhandler`, `configcache`.
- `hostTokens` — the AvNav host itself: `avnav`, `AVNAV_BASE_URL`, `avnav_api`, `plugin.py`, `plugin.js`, `plugin.mjs`.

One shared checker applies all three arrays, case-insensitively, to: the `SHARED_INSTRUCTIONS` block, every generic
skill file, every Tier 1 tool module's **full content**, and every generic rule definition's **content and rendered
semantics**. Scope globs and remedy sentences are not exempt — they move to project-owned data instead.

### Shared core manifest

`tools/quality-policy/shared-core-manifest.json`:

```json
{
  "note": "Digest of every generic-surface file. Both role-model repositories commit this file identically; a local digest mismatch means this repository has drifted from the shared core.",
  "entries": { "<repo-relative path>": "<sha256 of file bytes>" }
}
```

`tools/check-shared-core.mjs` exports `runSharedCoreCheck()` and fails when any entry's path is missing, any digest
mismatches, or any Tier 1 path on disk is absent from the manifest. It never reads outside its own repository.
Cross-repository identity holds because both repositories commit the same `entries` object; a paired contract test in
each repository asserts the manifest's own SHA-256 against a value recorded in that test, so changing one repository's
manifest without the other is a visible, reviewable event.

### Paired acceptance matrix

Both repositories must satisfy every row before either plan is complete.

| Row | Assertion                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------- |
| P1  | `npm run check:all` exits 0                                                                                       |
| P2  | `npm run check:shared-core` exits 0                                                                               |
| P3  | `shared-core-manifest.json` `entries` is byte-identical in both repositories                                      |
| P4  | Every Tier 1 file listed in the manifest is byte-identical in both repositories, verified by an out-of-band `cmp` |
| P5  | `generic-tokens.json` is byte-identical in both, and the genericness checker reports zero findings in both        |
| P6  | `GENERIC_RULES` name sets are identical in both; classifications match the canonical table                        |
| P7  | No Tier 1 file contains any token from `projectTokens`, `domainTokens`, or `hostTokens`                           |
| P8  | Every Tier 1 checker exports a `run*()` entry point and has at least one self-test with a negative fixture        |
| P9  | Every immutable baseline entry resolves to a live path                                                            |
| P10 | Every count narrated in `documentation/conventions/quality-gates.md` is asserted by a test, not hand-written      |
| P11 | Suppression comments in maintained source are exactly zero, asserted across the whole maintained surface          |
| P12 | `skills-lock.json` hashes match local skill files, and every entry names an existing local skill directory        |
| P13 | The `SHARED_INSTRUCTIONS` block is byte-identical in both                                                         |
| P14 | The five generic skill files are byte-identical in both                                                           |

---

## Architecture Notes

### Cross-repository identity without cross-repository reads

`PLAN41.md` constraint 4 forbids any gate reading the sibling checkout, and that constraint is right: a gate that
depends on a sibling directory cannot run in CI, cannot run in a fresh clone, and cannot survive extraction. That
constraint is also exactly why "shared" drifted — with no sibling read allowed and no canonical copy, nothing could
compare the two.

A committed digest manifest resolves the tension. Each repository verifies its own files against the manifest locally.
Identity across the pair is a property of the **manifest being the same file**, which is a review-time fact, not a
runtime dependency. This is the same trick Polar Recorder already applies correctly to its own skill files; it was
simply pointed at the wrong target.

### Externalising scope is what makes a rule generic

Fact 13 is the clearest case in the audit. `responsive-layout-hard-floor` detects an inline numeric floor — a completely
product-neutral idea — and was classified project only because its scope was a list of 17 Dyninstruments files and its
message named `ResponsiveScaleProfile`. The existing contract in this repository responds by **exempting** scope globs
from the genericness check. That is the wrong direction: it makes the check weaker so the file can stay impure. Moving
scope and remedy into project-owned data makes the rule genuinely generic and lets the check cover the whole file, which
is stronger and simpler at the same time.

### An empty baseline is the greenfield default

Complexity is the one axis where the two repositories look irreconcilable: a warn-plus-ratchet here, hard error there.
They are the same mechanism at two points on one dial. With an empty `complexity-baseline.json`, the scan-plus-budget
pipeline fails on the first finding — behaviourally identical to error severity. So one mechanism serves both, Polar
Recorder keeps its zero-debt posture unchanged, this repository keeps its 175-entry ledger, and the greenfield
environment inherits the mechanism with an empty ledger. The same reasoning applies to the coverage-floor baseline and
the suppression budget.

### The test-layer suppressions are paid off, not capped

The 1153 test-layer type suppressions in fact 17 are not a lie about the gate — production code genuinely has zero, and
that is verified. Two things are wrong with them anyway. They are **uncounted**: the `invalid-lint-suppression` scope
excludes `tests/**` and the verified baseline counts only production, so the number could grow without any signal. And
they are **not real justifications**: 1152 of the 1153 are the same copy-pasted sentence, which satisfies the letter of
"a suppression must carry a reason" while carrying no per-site reasoning at all.

A budget would fix only the first problem. Fact 39 measures the second honestly, and the measurement is what makes
elimination the right call rather than an aspiration: 1667 diagnostics, but **78 % are a single mechanical class**
(implicit-any annotations) and **36 % are concentrated in 35 shared harness files**. This is annotation work against a
known surface, not a redesign. There is no product type to invent — fact 39 confirms the `never` and `{}` cases are
literal-inference defects in the tests themselves.

Sequencing carries the real risk, not volume. Fact 41: `no-warning-comments` bans the literal token, so landing the
strict ESLint base before the cleanup would redden the gate on contact. Hence G1 and G2 remove, and only G3 bans. The
inversion is the one way this phase can go wrong.

The complexity ratchet stays a ratchet because that debt is genuinely open-ended. This one is bounded and measured, so
it gets paid.

### Role model is not greenfield output

Neither repository can be used as a greenfield starting point, and this plan does not attempt that. It produces one
thing the greenfield generator needs and cannot otherwise get: a set of files that are known-good, known-generic, and
**known-identical**, so the generator's authors copy them rather than re-deciding them. Every Tier 2 file in this
repository stays exactly as project-specific as it is today.

---

## Hard Constraints

### Runtime and product behavior

- No change to widget rendering, cluster mapping, layouts, theming, editable parameters, AvNav host integration,
  packaging output, or release artifacts.
- No change to any file under `widgets/`, `cluster/`, `shared/widget-kits/`, `runtime/`, `config/`, `layouts/`,
  `assets/`, or `types/` except where a canonical rule rename requires a suppression-comment or marker text update.
- `plugin.js`, `plugin.mjs`, `plugin.json`, and `plugin.css` change only if a canonical rename touches them.
- No new runtime dependency. Dev-only tooling changes only.

### Quality integrity

- `npm run check:all` must be green at the end of every phase, not only at the end of the plan.
- No gate may be weakened to land a phase: no lowered threshold, no widened ignore list, no new suppression, no disabled
  rule, no deleted or skipped test. A rule rename must be proven behavior-preserving before the old name is removed.
- Adding a check is allowed; removing one requires an explicit equivalence proof in the same phase, naming the
  replacement owner.
- Every Tier 1 checker must export a `run*()` function. A checker that cannot be imported may not enter the manifest.
- Every immutable baseline that shrinks must be re-anchored in the same commit that shrinks it.
- Suppressions are removed, never re-parked. A type diagnostic exposed by removing a suppression may not be cleared by
  annotating as `any`, by widening a product type, by an unexplained non-null assertion, by adding a file-level
  `@ts-nocheck`, or by dropping the file from `tsconfig.tests.json`. Fix the type or fix the harness declaration.
- No suppression budget, ledger, or grandfathering list may be introduced for suppression comments. The target is zero
  and the only permitted end state is zero.

### Repository independence and paired work

- No gate, test, tool, or config may read, resolve, or stat a path outside this repository. `sibling-repository` as a
  `sourceType` value is forbidden.
- Tier 1 changes land in this repository and Polar Recorder in the same working session, verified by an out-of-band
  `cmp` before either side's phase is closed.
- If a Tier 1 file cannot be made identical, it is not Tier 1. Reclassify it to Tier 2, record the reason in this plan,
  and remove it from the manifest — do not weaken the manifest check.

### File organization

- Tier 1 tool modules live under `tools/` and `tools/quality-policy/` at the paths named in the manifest. No Tier 1
  module may live under a product directory.
- Project-owned data files carry a `project-` prefix or live under `tools/quality-policy/`, and are never manifest
  entries.
- The 400 non-empty-line limit applies unchanged to every maintained file. `exec-plans/` stays exempt (fact 34).
- No deliverable outside `exec-plans/` may cite this plan number or a phase letter, per the exec-plan citation rule.

---

## Implementation Order

Phases A through C are ordered; D through J may be reordered if their stated dependencies hold. Phase K is last. There
is no Phase I; the letter is skipped to avoid confusion with the digit 1.

### Phase A — Establish the manifest and the genericness owner

Intent: build the two mechanisms that prevent the next round of drift, before moving any content.

Dependencies: none.

#### A1. Record standalone evidence

- Run `npm run check:all` from a clean worktree. Record coverage percentages, the classified-production-file count, and
  per-project Vitest results.
- Record the current generic and project rule-name lists, the `test-inventory.json` and `test-exception-baseline.json`
  entry counts, the `complexity-baseline.json` entry count, and the suppression counts by kind from fact 17.
- Amend this plan's baseline with evidence if any number differs from facts 1, 10, 17, 19, or 21.

#### A2. Create the genericness token owner

- Add `tools/quality-policy/generic-tokens.json` with the three arrays exactly as specified in the Shared Core Contract.
  This file is Tier 1 and must be byte-identical in both repositories.
- Add `tools/check-generic-surface.mjs` exporting `runGenericSurfaceCheck()`, applying all three arrays
  case-insensitively to the four target sets named in the contract.
- Wire it into `check:smells`. Expect it to fail initially — fact 7 and fact 8 guarantee findings. Record the exact
  finding list; it is the work list for Phases C and E.

#### A3. Retire the six blocklists

- Delete the inline `PROJECT_TOKENS` arrays from `tests/contract/shared-instructions-block-contract.test.js`,
  `tests/contract/skill-layer-contract.test.js`, and `tests/contract/pattern-rule-generic-scope-contract.test.js`, and
  have all three read `generic-tokens.json` instead.
- Keep each test's positive and seeded-negative assertions. Add a negative assertion proving a token added to
  `generic-tokens.json` is picked up by all three call sites, so the single-owner property is itself checked.

#### A4. Create the shared core manifest

- Add `tools/quality-policy/shared-core-manifest.json` with an initially small `entries` object containing only the six
  already-identical paths from fact 2.
- Add `tools/check-shared-core.mjs` exporting `runSharedCoreCheck()`, failing on a missing path, a digest mismatch, or a
  Tier 1 path on disk that is absent from the manifest.
- Add `npm run check:shared-core` and include it in `check:core` immediately after `check:standard`.
- Add `tests/contract/shared-core-manifest-contract.test.js` asserting the manifest's own SHA-256 against a literal
  recorded in the test, plus negative fixtures for each failure mode.

Exit conditions: `npm run check:all` green; `npm run check:shared-core` green over the six seed entries;
`generic-tokens.json` is the only genericness token source in the repository; the Phase A finding list from A2 is
recorded in this plan.

---

### Phase B — Make every generic checker importable and self-tested

Intent: satisfy the manifest precondition that a Tier 1 checker must be importable, and close fact 22.

Dependencies: Phase A.

#### B1. Adopt the donated checker implementations

- Replace `tools/check-file-size.mjs` and `tools/check-file-size/*` with Polar Recorder's implementation, exporting
  `runFileSizeCheck`. Move this repository's scope lists and its `shared/widget-kits/` remedy sentence into
  `tools/quality-policy/project-file-size-scope.json`.
- Replace `tools/check-test-focus.mjs` with Polar Recorder's, exporting `runTestFocusCheck`.
- Replace `tools/check-schema.mjs`, `tools/check-doc-links.mjs`, `tools/check-doc-links-proof.mjs`,
  `tools/hooks-install.mjs`, `tools/hooks-doctor.mjs`, `tools/quality-policy/run-format.mjs`, and
  `tools/quality-policy/generate-format-scope.mjs` with Polar Recorder's implementations, with this repository's paths,
  schema profile, and owner classifications supplied as project-owned data.
- Prove each replacement behavior-preserving: run the old and new checker over the current tree and diff their findings
  before deleting the old one.

#### B2. Add the missing self-tests

- Add self-tests with negative fixtures for `check-schema`, `check-test-focus`, `check-doc-links`,
  `check-doc-links-proof`, and `complexity-scan` — the five owners fact 22 shows are untested here.
- Port Polar Recorder's `prettier-config`, `eslint-config`, `vitest-projects`, and `header-contract` self-tests (fact
  23). Skip `setup` unless `npm run setup` gains a script.
- Add a contract test asserting that every path in `shared-core-manifest.json` ending in `.mjs` exports at least one
  `run*` function, and that each has a referencing self-test.

#### B3. Converge the generic self-test dialect

- Generic-tool self-tests become ESM `.test.mjs` using explicit `vitest` imports and `node:assert/strict`, matching the
  donated implementations. Add `tests/**/*.test.mjs` to the `contract` and `unit-node` project includes.
- Product tests under `tests/cluster/`, `tests/widgets/`, `tests/shared/`, `tests/runtime/`, `tests/config/`,
  `tests/layouts/`, `tests/css/`, and `tests/plugin/` keep `.test.js` and their current dialect. Only the self-tests of
  manifest entries convert.
- Record the exact converted file list in this plan.

Exit conditions: `npm run check:all` green; every replaced checker exports a `run*()` function; the five previously
untested owners each have a self-test with at least one negative fixture; the converted-file list is recorded;
`documentation/conventions/quality-gates.md:121` no longer reads "no maintained owner".

---

### Phase C — Adopt the canonical pattern engine and de-brand it

Intent: make the pattern engine and its generic rule layer byte-identical, which is the largest single Tier 1 block.

Dependencies: Phases A and B.

#### C1. De-brand the suppression grammar

- Rename the marker grammar in `tools/check-patterns/shared-suppressions.mjs` from `dyni-lint-disable-*` and
  `dyni-boundary-*` to project-neutral `plugin-lint-disable-*` and `plugin-boundary-*`, keeping the owner, date, reason,
  and expiry validation and the rule that generic production suppressions are forbidden.
- Update every occurrence in source, tests, and documentation. Fact 8 gives the count in `shared-suppressions.mjs`
  as 11.
- Add a negative assertion that a `dyni-` prefixed marker is no longer recognised, so the old grammar cannot linger.

#### C2. Purge project tokens from the engine's shared modules

- Move the `cluster` and `renderer` knowledge out of `tools/check-patterns/shared.mjs` (fact 8: 12 and 4 occurrences)
  into `tools/quality-policy/project-pattern-context.json`, read by project rule definitions only.
- `getClusterPascalPrefixes` and `RENDER_PROP_OBJECT_NAMES` become project-owned data supplied to project rules, not
  generic-module exports.
- Rerun `runGenericSurfaceCheck()` and confirm the engine modules report zero findings.

#### C3. Externalise scope and remedy from generic rule definitions

- Every generic rule definition's `scope` resolves from `tools/quality-policy/project-pattern-scopes.json`, keyed by
  canonical rule name. No generic rule definition contains a literal product path.
- Every generic rule's message splits into a project-neutral diagnosis (Tier 1) and a project-owned remedy sentence
  (Tier 2), joined at render time. `responsive-layout-hard-floor`'s `ResponsiveScaleProfile` sentence is the worked
  example from fact 13.
- Remove the scope-glob exemption from the genericness check. Scope globs are now data, so the exemption has no
  remaining purpose. Delete the in-file comment that documented it.

#### C4. Add the manifest entries

- Add `tools/check-patterns.mjs`, `tools/check-patterns/rules.mjs`, `shared.mjs`, `shared-source-scan.mjs`,
  `shared-suppressions.mjs`, `ast-utils.mjs`, `duplicate-utils.mjs`, every `rules-*.mjs` runner, and every
  `generic/*.mjs` definition file to `shared-core-manifest.json`.
- Verify out-of-band with `cmp` that each added path is byte-identical to Polar Recorder's after its paired phase.

Exit conditions: `npm run check:all` green; `npm run check:shared-core` green; `runGenericSurfaceCheck()` reports zero
findings over `tools/check-patterns/**` excluding `project/`; no generic-layer file contains `dyni`, `cluster`,
`renderer`, `widget`, or a literal product path; `npm run check:patterns` finding set is unchanged from the A1 recording
except for renamed identifiers.

---

### Phase D — Adopt the canonical rule identifiers

Intent: give every rule concept one name and one classification in both repositories.

Dependencies: Phase C.

#### D1. Prove equivalence before renaming

- For each row of the Canonical Rule Identifiers table where this repository's name changes, run the old and new rule
  over the current tree and confirm identical finding sets.
- For `console-in-widgets` to `console-in-runtime`, confirm the scope moves to project-owned data and the finding set is
  unchanged.
- For `internal-hook-fallback` to `internal-contract-fallback`, confirm the detection is unchanged.

#### D2. Apply the renames and reclassifications

- Rename per the canonical table. Move `responsive-layout-hard-floor` from `PROJECT_RULES` to `GENERIC_RULES` once C3
  has externalised its scope and remedy.
- Adopt `no-nul-byte` as a generic pattern rule. Keep `tests/contract/source-text-integrity-contract.test.js` and
  `tools/test-data/source-nul-byte-fixture.dat` as the negative-fixture owner for the new rule rather than deleting
  them.
- Update every documentation reference: `documentation/conventions/smell-prevention.md` catalog, tooling matrix, and
  executable rule index; `documentation/conventions/smell-fix-playbooks.md` playbook titles;
  `documentation/conventions/quality-gates.md` owner rows; and the `scan-smells` skill's category list.

#### D3. Lock the identifier set

- Add a contract test asserting `GENERIC_RULES` names equal a canonical list committed as Tier 1 data, so a rule added
  to one repository and not the other fails.
- Add the classification assertion: every canonical generic name is in `GENERIC_RULES`, every other name is in
  `PROJECT_RULES`, and `RULES` is exactly their concatenation.

Exit conditions: `npm run check:all` green; `npm run check:smells` finding set equivalent to the A1 recording under the
new names; the canonical generic name list is a manifest entry; no documentation file references a retired rule name.

---

### Phase E — Converge the shared instruction, skill, and documentation-shape texts

Intent: make the human-facing generic core byte-identical, closing facts 24 through 28.

Dependencies: Phase A.

#### E1. Converge the `SHARED_INSTRUCTIONS` block

- Rewrite the block per the five conflict resolutions in the Shared Core Contract. Move the `BEGIN` marker to sit after
  the one-line file purpose and before the routing-map note, so the block encloses §0 through §4.
- Add the Required Documentation Shape subsection inside the block. Adopt the Dyninstruments plan-citation reading.
  Union the checklist skeletons, pushing every product-specific item below the `END` marker.
- Add the block, extracted, as a manifest entry via a generated `tools/quality-policy/shared-instructions.md` that
  `AGENTS.md` is asserted to contain verbatim. `AGENTS.md` itself stays Tier 2, since §5 onward is project-specific.

#### E2. Converge the five generic skill files

- Reconcile `preflight`, `create-plan`, `doc-sync`, `scan-smells`, and `grill-me-repo` into one text each. The audited
  differences are mostly vocabulary: "component" versus "module", "Layout Concept" versus "Behavior Concept",
  "Archetype" versus "Category". Choose the project-neutral term in every case.
- Resolve the two real content differences: `doc-sync` must mandate the four-section shape both repositories enforce,
  not five, so `## API/Interfaces` becomes optional guidance; and `scan-smells` must carry the suppression-discipline
  category, since this repository has the richer suppression grammar and currently omits the category.
- Route every project-specific instruction into `add-widget` and `mapper-review`, which stay Tier 2.
- Add all five `SKILL.md` paths to the manifest.

#### E3. Repair the skill lock

- Rewrite `skills-lock.json` so every entry names an existing local skill directory and `computedHash` is the SHA-256 of
  that local file. Record `sourceType: "vendored-generic"` for the five generic skills and `sourceType: "project-local"`
  for `add-widget` and `mapper-review`.
- Move the five `mattpocock/skills` provenance records (fact 24) to a separate `upstreamInfluences` object that is
  explicitly documentation, not a verified lock, or drop them.
- Extend `tests/contract/skill-layer-contract.test.js` with the assertion it lacks: `sha256(local SKILL.md)` equals
  `computedHash` for every entry, plus a tampered-file negative fixture. Assert no entry uses
  `sourceType: "sibling-repository"`.

#### E4. Converge the generic convention documents

- Replace `documentation/conventions/documentation-format.md` with Polar Recorder's text: `**Status:** Current.`, the
  four sections, no emoji vocabulary, no `## Fixed Issues` section, no Token Budget table. Add both as manifest entries
  once identical.
- Replace `documentation/guides/exec-plan-authoring.md` with Polar Recorder's text, keeping this repository's Exec-Plan
  Citation Rule section, which is stronger and product-neutral.
- Sweep the emoji `**Status:**` vocabulary out of all 77 documents so the documented and enforced rules agree.
- Move the hand-maintained ASCII `documentation/` tree out of `AGENTS.md` §6. It is accurate today but is an unchecked
  manual duplicate of `documentation/TABLEOFCONTENTS.md` inside a code fence, invisible to `docs:links`. Replace it with
  a pointer to the index.

Exit conditions: `npm run check:all` green; `npm run check:shared-core` green over the block, the five skills, and the
two convention documents; every skill-lock hash verified against its local file; no document carries an emoji
`**Status:**` value; `AGENTS.md` §6 no longer duplicates the index.

---

### Phase F — Converge the policy mechanisms with project-owned data

Intent: make complexity, coverage, and test inventory one implementation each, with per-repository data.

Dependencies: Phases A and B.

#### F1. Converge the complexity owner

- Rewrite `tools/quality-policy/eslint-complexity-config.mjs` to export `STRICT_LIMITS` plus a severity-parameterised
  rule-fragment factory, so one file serves both a warn-mode scan and an error-mode lint.
- Keep `complexity-scan.mjs`, `complexity-budget.mjs`, and `complexity-capture-integrity.mjs` as the canonical
  mechanism, with `PRODUCTION_ROOTS` moving to project-owned data.
- Add all four to the manifest. `complexity-baseline.json`, `historical-complexity-findings.json`, and
  `verified-baseline.json` stay Tier 2 project data with this repository's 175 entries unchanged.
- Add a contract test proving an empty baseline makes the pipeline fail on the first finding, so the greenfield default
  is checked rather than assumed.

#### F2. Converge the coverage inventory

- Keep this repository's per-file `entries` schema and 299-line checker as canonical, refactored so the language-
  specific coverage reader is an injected adapter rather than inline logic. Polar Recorder supplies a Python adapter
  through the same extension point.
- Add `check-coverage-inventory.mjs` and its adapter contract to the manifest. `coverage-floors.json` and
  `coverage-floor-baseline.json` stay Tier 2 with this repository's 228 entries unchanged.

#### F3. Converge the test inventory

- Keep the per-file `classification` schema as canonical. Add `test-inventory.mjs` to the manifest;
  `test-inventory.json` and `test-exception-baseline.json` stay Tier 2.
- Add the staleness assertion the audit shows is missing: every entry in every immutable baseline must resolve to a live
  path, with a negative fixture proving a dead entry fails.

#### F4. Converge the remaining configs

- `jscpd.config.json`: adopt `threshold: 0` with default `minLines` and `minTokens`, keeping this repository's ignore
  list as project-owned data and retaining `duplicate-functions` and `duplicate-block-clones` as the second layer.
  Record the resulting finding count; if it is non-zero, fix the clones rather than raising the threshold.
- `.markdownlint-cli2.jsonc` and `linkinator.config.json`: adopt the merged form — same three disabled rules, union of
  ignores, `recurse` and `redirects: "error"` and the `[::1]` skip pattern together. Add both to the manifest.
- `tsconfig.checkjs.json`, `tsconfig.tests.json`, `tsconfig.tools.json`: make `compilerOptions` identical across both
  repositories; keep `files` and `include` project-owned. Add a contract test asserting the shared options block rather
  than adding whole files to the manifest.
- `install.sh`: extract the five project constants into a header block and add the remainder to the manifest.
- `.githooks/pre-push` and `.githooks/README.md`: adopt Polar Recorder's shape including the optional repo-local
  virtualenv `PATH` block, which is inert here. Bring the README into the four-section documentation shape. Add both to
  the manifest.

Exit conditions: `npm run check:all` green; `npm run check:shared-core` green over every path added in this phase;
`jscpd` at `threshold: 0` reports zero duplication; the empty-baseline complexity contract test passes; the baseline
staleness assertion has a negative fixture.

---

### Phase G — Eliminate every test-layer type suppression, then make zero structural

Intent: pay the debt down to zero rather than capping it, and only then land the rules that keep it there.

Dependencies: Phases C and F.

There is no suppression budget, no grandfathering, and no `suppression-budget.json`. The target is exactly zero, and the
work is bounded by facts 39 and 40: 1667 diagnostics in 151 files, 78 % of them a single mechanical class.

Fact 41 fixes the ordering. `no-warning-comments` bans the literal string `ts-ignore`, so it cannot land while any
suppression remains — the elimination comes first and the rule lands last, as the ratchet that makes zero permanent. Do
not reverse these sub-phases.

#### G1. Type the shared harness layer and measure the cascade

- Add `types/test-harness.d.ts` declaring the shared mock and harness shapes: component context, canvas context,
  toolkit, view model, formatter, and theme snapshot. Fact 40 establishes `types/` as the home and confirms no such file
  exists yet.
- Annotate the 35 `-setup.js` and `.harness.js` files that carry the 595 concentrated diagnostics, worst-first:
  `FullCircleRadialTextLayout-setup.js` (97), `SemicircleRadialTextLayout-setup.js` (84),
  `ThreeValueTextWidget-setup.js` (45), `HostCommitController-setup.js` (36), `CenterDisplayTextWidget-setup.js` (33),
  then the remainder.
- Remove the suppressions in those 35 files only, and leave the other 121 files untouched in this sub-phase.
- **Re-run the fact-39 probe over the whole suite** and record the new stripped-tree diagnostic total. The drop below
  1072 in the 116 plain test files is the cascade dividend from typing the harness layer. Amend this plan with the
  measured number before starting G2; it is the only honest input to G2's sequencing.

#### G2. Eliminate the remaining suppressions in class-ordered waves

Each wave removes suppressions, fixes the diagnostics it exposes, and ends with `npm run check:all` green. A wave is
never left half-landed.

- **Wave 1 — implicit-any (fact 39: 1295 diagnostics, TS7006/7005/7034/7053/7017).** Annotate parameters and variables
  via JSDoc, reusing `types/test-harness.d.ts` shapes rather than restating them. Never annotate as `any` to clear a
  diagnostic; if a shape is genuinely unknown, that is a defect in the harness type, not a licence for `any`.
- **Wave 2 — literal inference (TS2339, 170 diagnostics; 116 on `never`, 24 on `{}`).** These are untyped empty
  accumulators. Give each literal an explicit JSDoc type. Fact 39 records that these are inference defects, not missing
  product types, so no product type should need to change.
- **Wave 3 — strict null (120 diagnostics, TS18047/18048/2532/2531).** Prefer narrowing or a genuine assertion helper
  over non-null assertions. Where a test legitimately guarantees presence, express the guarantee in the harness type.
- **Wave 4 — assignability and the tail (82 diagnostics, nine codes).** Fix case by case; this wave has no shared
  pattern.
- After each wave, re-run the fact-39 probe and record the remaining count in this plan, so progress is evidence, not
  assertion.
- The 64 files carrying 1–5 diagnostics may be cleared opportunistically inside any wave; the 6 files carrying 41 or
  more are scheduled explicitly.

#### G3. Land the structural ban

Only after G2 reports zero suppressions repository-wide.

- Add `linterOptions: { noInlineConfig: true }` to every ESLint group, including the test groups, and add
  `no-warning-comments` at error over the six suppression terms, matching Polar Recorder.
- Tighten `eqeqeq` from `["error", "smart"]` to `"error"`, and `no-unused-vars` from `caughtErrors: "none"` to
  `caughtErrors: "all"` with `caughtErrorsIgnorePattern: "^_"`. Fix the resulting findings; do not relax the rules.
- Add `no-console` and `no-empty` with `allowEmptyCatch: false` on shipped runtime, keeping `console-in-runtime` as the
  pattern-level owner for scopes ESLint does not reach.
- Keep `no-useless-assignment`. Re-evaluate the inventory-driven relaxed-test class: with the suppressions gone and
  every test strict, it may no longer have a purpose. Remove it if it does not, and record the decision either way.
- Extract the shared rule block into `tools/quality-policy/eslint-shared-rules.mjs` and add it to the manifest.
  `eslint.config.mjs` itself stays Tier 2 because its file globs are product paths.

#### G4. Prove zero and close every escape route

- Extend the `invalid-lint-suppression` rule scope to include `tests/**` and `tools/**`, removing the exclusion fact 18
  identifies. With the count at zero there is nothing to grandfather.
- Extend `tests/tools/verified-baseline.test.js` to count suppressions across the whole maintained surface rather than
  only `PRODUCTION_ROOTS` plus the two entrypoints, and assert the total is exactly **0** — not "not growing".
- Add a negative fixture proving that a single reintroduced `@ts-ignore` anywhere under `tests/` fails the gate, and a
  second proving `no-warning-comments` rejects it independently. Two owners, so removing one does not silently reopen
  the hole.
- Record in `documentation/conventions/testing-infrastructure.md` that the test layer is fully strict with zero
  suppressions, and what to do instead when a mock boundary is genuinely untypeable: extend `types/test-harness.d.ts`.
  Fact 18 shows the previous state was undocumented; the new state must not be.

Exit conditions: `npm run check:all` green;
`git grep -c "@ts-ignore\|@ts-expect-error\|@ts-nocheck\|eslint-disable\|prettier-ignore\|istanbul ignore"` over
maintained source returns **0** in every file; `tsc -p tsconfig.tests.json` passes with no suppression present anywhere;
`noInlineConfig` and `no-warning-comments` active on every group; `invalid-lint-suppression` scopes `tests/**` and
`tools/**`; both negative fixtures fail as designed; the zero state is documented and the relaxed-test-class decision is
recorded.

---

### Phase H — Repair the baseline and documentation data

Intent: remove the fail-open surface in fact 19 and the stale counts in fact 21.

Dependencies: Phase F.

#### H1. Prune the dead exception baseline

- Remove the 209 entries in `tools/quality-policy/test-exception-baseline.json` whose paths no longer exist, leaving the
  20 live entries, and re-anchor the file's digest in the same commit.
- Confirm the pruned file passes the F3 staleness assertion, and that recreating one of the removed filenames now
  requires a reviewed addition rather than inheriting an exception.

#### H2. Make narrated counts asserted

- Replace every hand-written count in `documentation/conventions/quality-gates.md` with a value asserted by a test: the
  `test-inventory.json` entry count (541, not 472), the live exception count (20, not 229), the
  `complexity-baseline.json` entry count, and the `coverage-floors.json` entry count.
- Add a contract test that reads each policy file and asserts the document's stated number matches, so a future drift
  fails instead of misleading.

Exit conditions: `npm run check:all` green; `test-exception-baseline.json` has 20 entries, all resolving to live paths,
with a re-anchored digest; every count in `quality-gates.md` is test-asserted.

---

### Phase J — Converge the documentation-gate wiring

Intent: make `docs:check` mean the same thing in both repositories.

Dependencies: Phase E.

#### J1. Settle the wiring

- Keep this repository's wiring as canonical: `docs:check` includes the documentation contract tests, so the command
  name means "all documentation gates". Polar Recorder moves its five contracts into `docs:check` to match.
- Add the dedicated table-of-contents contract this repository lacks, ported from Polar Recorder's
  `doc-toc-contract.test.mjs`, rather than leaving it folded into reachability.
- Add a contract test asserting `docs:check` composition, so the wiring cannot silently diverge again.

Exit conditions: `npm run check:all` green; `npm run docs:check` includes lint, links, links-proof, TOC, format, and
reachability; the composition assertion passes.

---

### Phase K — Pair verification and closeout

Intent: prove every row of the Paired Acceptance Matrix in both repositories.

Dependencies: all previous phases, and Polar Recorder `PLAN9.md` Phases A through H.

#### K1. Verify identity out of band

- Run `cmp` over every manifest path against the Polar Recorder checkout and record a zero-difference result for every
  entry. This is a review action, not a gate: no committed check may read the sibling checkout.
- Confirm `shared-core-manifest.json` `entries`, `generic-tokens.json`, the extracted shared-instructions text, and the
  five generic skill files are byte-identical.
- Confirm `GENERIC_RULES` name sets are identical and match the canonical table.

#### K2. Verify both gates

- Run `npm run check:all` in both repositories from clean worktrees and record the results.
- Record the final coverage percentages, rule counts, baseline entry counts, and suppression counts, and compare them to
  the A1 recording. Any regression blocks closeout.

#### K3. Record the greenfield handoff

- Add a `documentation/conventions/quality-gates.md` subsection listing the manifest as the authoritative generic-core
  inventory, and stating that the greenfield environment is derived from it rather than from either repository.
- Record in this plan which Tier 1 candidates were reclassified to Tier 2 and why, so the greenfield authors inherit the
  reasoning and not just the result.
- Move `PLAN42.md` to `exec-plans/completed/` and update the Polar Recorder plan's pointer.

Exit conditions: every row P1 through P14 of the Paired Acceptance Matrix verified and recorded in both plans; both
gates green; no reclassification left unexplained.

---

## User-Facing Documentation Impact

`README.md` changes are **not required**. This plan changes no installation step, no configuration key, no bundled
layout, no theming input, no widget or cluster availability, no requirement, and no user-visible behavior. The only
contributor-visible change is the addition of `npm run check:shared-core`, which is documented in
`documentation/conventions/quality-gates.md` rather than `README.md`, consistent with how the other gate commands are
documented.

Documentation files that must change:

- `documentation/conventions/quality-gates.md` — add the `check:shared-core` row, add the generic-core inventory
  subsection, replace narrated counts with asserted ones, and correct the focused-test owner row.
- `documentation/conventions/smell-prevention.md` — canonical rule names in the catalog, tooling matrix, executable rule
  index, and suppression-syntax section.
- `documentation/conventions/smell-fix-playbooks.md` — playbook titles under canonical rule names.
- `documentation/conventions/testing-infrastructure.md` — the generic self-test dialect, the converged inventory
  schemas, the fully strict zero-suppression test layer, and `types/test-harness.d.ts` as the place to extend when a
  mock boundary is genuinely untypeable.
- `documentation/conventions/coding-standards.md` — the zero-suppression rule and its two enforcing owners.
- `documentation/conventions/documentation-format.md` — replaced with the converged text.
- `documentation/guides/exec-plan-authoring.md` — replaced with the converged text, keeping the citation rule.
- `documentation/TABLEOFCONTENTS.md` — only if a document is added, moved, or removed.
- `AGENTS.md` — converged shared block, §6 index pointer, and the `check:shared-core` mention in §9.
- `CONTRIBUTING.md` — the new gate command and the generic self-test dialect.
- `.githooks/README.md` — converged text in the four-section shape.

---

## Acceptance Criteria

### Shared core identity

- `tools/quality-policy/shared-core-manifest.json` exists, is committed identically in both repositories, and lists
  every Tier 1 path with a matching SHA-256.
- `npm run check:shared-core` is part of `check:core` and fails on a missing path, a digest mismatch, or an unlisted
  Tier 1 path.
- An out-of-band `cmp` shows zero differences for every manifest entry.
- A contract test anchors the manifest's own digest, so a one-sided change is visible in review.

### Genericness

- `tools/quality-policy/generic-tokens.json` is the only genericness token source, is byte-identical in both, and
  carries all three arrays.
- `runGenericSurfaceCheck()` reports zero findings over the shared-instructions text, the five generic skill files,
  every Tier 1 tool module's full content, and every generic rule definition's content and rendered semantics.
- No Tier 1 file contains `dyni`, `dyninstruments`, `polarrecorder`, `widget`, `cluster`, `gauge`, `renderer`, `mapper`,
  `viewer`, `avnav`, or any other listed token.
- The scope-glob exemption is gone, and scope globs live in project-owned data.

### Rules

- `GENERIC_RULES` name sets are identical in both repositories and match the Canonical Rule Identifiers table.
- Every renamed rule was proven finding-equivalent before its old name was removed.
- `responsive-layout-hard-floor` is generic in both; `console-in-runtime` and `internal-contract-fallback` replaced
  their branded predecessors; `no-nul-byte` is a generic rule in both.
- A contract test locks the canonical generic name list and the classification split.

### Policy mechanisms

- Complexity, coverage-inventory, and test-inventory checkers are manifest entries; their baselines are not.
- A contract test proves an empty complexity baseline fails on the first finding.
- Every immutable baseline entry resolves to a live path, with a negative fixture.
- `jscpd` runs at `threshold: 0` with zero findings.

### Suppressions

- Suppression comments in maintained source are **exactly zero**, in every file, of every kind — `@ts-ignore`,
  `@ts-expect-error`, `@ts-nocheck`, `eslint-disable`, `prettier-ignore`, and `istanbul ignore` — asserted across the
  whole maintained surface, not only `PRODUCTION_ROOTS`.
- All 1153 test-layer suppressions were removed, and the 1667 diagnostics they were hiding are fixed by real
  annotations. No diagnostic was cleared by annotating as `any`, by widening a type to silence it, or by moving a file
  out of `tsconfig.tests.json`.
- `types/test-harness.d.ts` exists and is the declared home for shared mock and harness shapes.
- `tsc -p tsconfig.tests.json` passes with no suppression present anywhere in the tree.
- Two independent owners reject a reintroduced suppression — the `invalid-lint-suppression` rule, now scoping `tests/**`
  and `tools/**`, and ESLint `no-warning-comments` — each with its own negative fixture.
- `noInlineConfig` is set on every ESLint group, including the test groups.
- No `suppression-budget.json` exists; nothing grandfathers a suppression.
- The zero state and the "extend `types/test-harness.d.ts` instead" instruction are documented in
  `documentation/conventions/testing-infrastructure.md`.
- The relaxed-test-class decision from G3 is recorded either way.

### Data and documentation truth

- `test-exception-baseline.json` contains only live paths, with a re-anchored digest.
- Every count narrated in `documentation/conventions/quality-gates.md` is asserted by a test.
- No document uses an emoji `**Status:**` value; the documented and enforced documentation shapes agree.
- `AGENTS.md` §6 points at the index instead of duplicating it.

### Skills

- Every `skills-lock.json` entry names an existing local skill directory, and its hash is verified against that file.
- No entry uses `sourceType: "sibling-repository"`.
- The five generic skill files are byte-identical in both repositories and are manifest entries.
- `add-widget` and `mapper-review` remain project skills and are exempt from the genericness check.

### Gate integrity

- `npm run check:all` is green at the end of every phase in this repository.
- No threshold lowered, ignore list widened, rule disabled, test deleted or skipped, or suppression added to reach
  green.
- Every removed checker has a named replacement owner and a recorded equivalence proof.
- No gate, test, tool, or config reads any path outside this repository.

### Project profile preservation

- No change to widget rendering, cluster mapping, layouts, theming, editable parameters, host integration, packaging
  output, or release artifacts.
- `documentation/` content outside the two converged convention documents stays project-specific.
- `tools/check-patterns/project/*`, the product schemas, and every baseline data file stay Tier 2.

---

## Progress / Completion Evidence

Record per phase, in order: the commands run, the recorded numbers, the equivalence proofs, and the out-of-band `cmp`
results. Every retirement records its replacement owner and parity proof here. Every Tier 1 candidate reclassified to
Tier 2 records its reason here.

---

## Related

- Paired plan: Polar Recorder `exec-plans/active/PLAN9.md`
- [PLAN41.md](../completed/PLAN41.md) — the contract convergence this plan completes
- [PLAN40.md](../completed/PLAN40.md) — the fail-closed gate set this plan must not weaken
- [PLAN39.md](../completed/PLAN39.md) — the test split that produced the 209 dead baseline entries
- [exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md)
- [quality-gates.md](../../documentation/conventions/quality-gates.md)
- [smell-prevention.md](../../documentation/conventions/smell-prevention.md)
- [coding-standards.md](../../documentation/conventions/coding-standards.md)
- [testing-infrastructure.md](../../documentation/conventions/testing-infrastructure.md)
- [documentation-format.md](../../documentation/conventions/documentation-format.md)
