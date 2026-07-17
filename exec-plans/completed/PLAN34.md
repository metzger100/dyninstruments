# PLAN34 — Quality-System Migration Remediation and Finalization

## Status

Written after repository verification, a complete post-migration audit, and a
26-finding decision interview with the repository owner on 2026-07-16.

This plan is the implementation authority for finalizing the quality-system
migration. It preserves every meaningful pre-migration rule/check unless this
plan records an explicit owner-approved exception. It supersedes conflicting
scope or acceptance language in the archived migration plan.

### Progress record

- Phase 0 baseline completed on 2026-07-16 against the existing user-owned
  worktree: `check:core`, `test:coverage:check`, `test:split`, and
  `package:check` all passed.
- Baseline test evidence: 382 test files, 1,396 tests; global V8 coverage was
  94.03% lines, 81.37% branches, and 93.24% functions. The current jscpd
  report still identifies the known 83-line checker clone and the
  performance-runner clone.
- Baseline production inventory evidence: 214 production JavaScript files plus
  six declaration files are documented in the current typecheck contract; the
  repository currently contains 1,471 JavaScript files outside dependency,
  coverage, and artifact directories because tests/tools are intentionally
  outside that production boundary.
- Performance removal map: `runtime/PerfSpanHelper.js` only installs the
  instrumentation facade; `HostCommitController`, `SurfaceSessionController`,
  `HtmlSurfaceController`, `CanvasDomSurfaceAdapter`, and `ClusterWidget` use
  spans only around existing lifecycle/translation/render statements. The
  bootstrap manifest, loader context, type declarations, and test harnesses
  carry the wiring/assertions. No inspected consumer branches on span results;
  all lifecycle callbacks, cleanup, commit ordering, and error paths remain
  required after hook removal.
- Phase 1 completed: performance/mutation/retired-CI surfaces and runtime-only
  instrumentation were removed, with focused runtime/typecheck/core proofs.
- Phase 2 completed: Node 26/npm 12.0.1 and exact direct dependencies are
  declared; setup provisions actionlint into a persistent checksum-verified
  cache outside `node_modules`, with missing-cache and bad-checksum proofs.
- Phase 3 completed: Stylelint owns `--dyni-*`, ESLint/Vitest own focused and
  disabled tests plus bare `isFinite`, generic module/tool rules are scoped,
  and the deferred Prettier disposition is documented.
- Phase 4 completed: Linkinator 7.6.1 owns offline local Markdown links and
  fragments; fixture proofs cover valid links, missing files/anchors,
  duplicate slugs, and external-link skips. The custom helper now retains only
  project-specific documentation contracts and reachability.
- Phase 5 completed: the 83-line checker clone was removed by using the
  canonical masking helper; a strict production inventory contract now guards
  `tsconfig.checkjs.json` and package contracts remain executable.
- Phase 6 completed: release preparation has side-effect-free help and dirty
  state rejection, release creation runs exactly one blocking `check:all`, and
  the tag-only publisher uses immutable action SHAs without rebuilding.
- Phase 7 completed: README, contributor, quality-gate, release, maintenance,
  and agent guidance describe the final local authority, toolchain, offline
  docs checks, and manual AvNav validation checklist.
- Phase 8A–8C completed on 2026-07-16: a clean `npm run setup` completed;
  actionlint reused its checksum-verified cache; static residue, exact
  dependency, immutable-workflow, no-custom-Markdown-parser, and
  `git diff --check` audits passed; and `npm run test:split` passed with 381
  files and 1,391 tests.
- Final aggregate evidence after the 2026-07-16 remediation audit:
  `npm run check:all` passed with 382 test files and 1,397 tests; global V8
  coverage was 88.98% statements, 89.61% lines, 76.80% branches, and 95.13%
  functions. The contract project passed 110 tests, jscpd found zero clones,
  schemas were valid, and all documentation/file-size gates passed. Negative
  proofs now cover direct, chained, computed, skipped, and todo test APIs;
  below-threshold jscpd clones; and cross-boundary release renames. The
  deliberate focused-test fixture is excluded from ordinary Vitest discovery
  and remains covered by `npm run test:focus:check`.
- Phase 8D completed on 2026-07-17: the repository owner reported that the
  documented manual AvNav check was positive. This owner confirmation satisfies
  the manual acceptance condition and validates the plan's location in
  `exec-plans/completed/`.
- The repository owner reconfirmed on 2026-07-17 that removing the former
  performance system is intentional because `perf:check` was not a sufficiently
  reliable quality gate. Its removal remains an explicit approved exception,
  not an unowned parity regression.
- Post-completion validation findings F-003 through F-008 were remediated on
  2026-07-17. Maintained ESLint now owns shipped-file `@file` overviews; tag
  pushes rerun `check:all` before publication; release dirty-state and workflow
  policies fail closed; dependency declarations reject every defined non-array;
  and the missing shared-module documentation touchpoints are synchronized.
  The post-remediation `npm run check:all` passed with 382 test files and 1,404
  tests, zero jscpd clones, zero smell warnings, and global V8 coverage of
  89.61% lines, 76.80% branches, and 95.13% functions.

The implementation agent may choose equivalent maintained Node tooling where
this plan explicitly allows it, but may not weaken parity, negative-proof,
offline, release, file-size, or documentation outcomes. Complete phases in
order. Do not combine deletions with replacements until the replacement's
positive and negative proofs pass.

---

## Goal

Finish the migration as a deterministic, locally owned quality system that is
reproducible on the supported development toolchain, preserves the repository's
pre-migration protections, and removes additive systems the owner rejected.

Expected outcomes after completion:

1. `npm run setup` installs the locked Node dependencies and provisions a
   checksum-verified persistent actionlint binary.
2. `npm run check:all` is the single complete deterministic gate and consists
   of `check:core` plus full native Vitest/V8 coverage.
3. `npm run check:strict` remains a compatibility alias for `check:all`;
   misleading CI, browser, mutation, and performance commands are absent.
4. Generic formatting, JavaScript/CSS linting, focused-test prevention, and
   Markdown links/anchors are owned by maintained tools with deliberate
   negative proofs.
5. Custom checks remain only where they enforce irreducible Dyninstruments,
   AvNav, UMD, documentation-graph, package, or structural contracts.
6. The production JavaScript inventory remains complete under strict no-emit
   TypeScript checking; tests and tools remain outside that type boundary but
   are linted and executed.
7. Release preparation and creation are fail-closed, locally validated, and
   publish the committed deterministic release ZIP without rebuilding it on
   GitHub.
8. GitHub contains only the hardened tag-triggered publisher; pull-request and
   branch quality workflows introduced by the migration are removed.
9. Browser automation, Stryker mutation testing, and the workstation-sensitive
   performance system are completely removed as explicit owner-approved scope
   exceptions.
10. Contributor, agent, quality, documentation, and release guidance describe
    the final command and authority model without stale migration claims.
11. A clean `npm run setup` followed by `npm run check:all` exits zero.

---

## Owner-Approved Decision Contract

The following decisions are prescriptive. Do not reopen them during
implementation unless repository evidence makes one technically impossible.

| Finding | Required disposition |
|---|---|
| 1 | Restore parity-first acceptance; exceptions must be explicit |
| 2 | Exclude external browser automation; retain jsdom/VM contracts and a manual visual/release checklist |
| 3 | Use a maintained Node link/anchor checker; do not add MkDocs |
| 4 | Expand Prettier incrementally by directory after required file splits |
| 5 | Migrate generic custom rules incrementally to maintained ESLint/Vitest/comment rules |
| 6 | Enforce the `--dyni-*` CSS custom-property namespace in Stylelint |
| 7 | Reduce custom checkers rule by rule under a parity ledger; no arbitrary line cap |
| 8 | Remove known checker duplication; do not hide it with a jscpd exclusion |
| 9 | Keep strict TypeScript production-only and enforce its complete inventory |
| 10 | Keep the generated release manifest as an executable contract; add no decorative schema |
| 11 | Cache checksum-verified actionlint persistently outside `node_modules`; setup owns acquisition |
| 12 | Remove the complete performance system as an explicit parity exception |
| 13 | Restore the pre-migration GitHub model: hardened tag-only publishing |
| 14 | Remove the complete Stryker mutation-testing surface |
| 15 | Make `check:all` core plus coverage; retain focused commands and `check:strict` |
| 16 | Make fast/core actionlint offline after setup and fail with setup guidance when missing |
| 17 | Require the redesigned aggregate gate to be green |
| 18 | Delete `check:ci` and all references |
| 19 | Make `release:create` invoke `check:all` once as its blocking prerequisite |
| 20 | Keep committed release ZIPs authoritative; the tag publisher must not rebuild |
| 21 | Let maintained tooling own generic Markdown parsing; retain only project-specific contracts |
| 22 | Exactly pin direct dev dependencies and declare the Node/npm development toolchain |
| 23 | Add real `release:prepare --help`/`-h` and fail on dirty release-relevant state |
| 24 | Move bare `isFinite` enforcement to scoped ESLint before deleting its custom rule |
| 25 | Reject `.only` and `.skip` through ESLint and reject `.only` at Vitest runtime |
| 26 | Close the mutation-runtime finding through the removal required by Finding 14 |
| 27 | Replace the three-field custom header gate with maintained `@file` enforcement; documentation targets remain a focused contract and the registry owns dependencies |
| 28 | Rerun `check:all` on tag pushes and make publication depend on that read-only job |
| 29 | Permit only the current canonical release-notes path during `release:create`; `release:prepare` requires a completely clean tree |
| 30 | Semantically enforce tag triggers, permissions, concurrency, timeouts, immutable actions, SemVer validation, and no publisher rebuild |

---

## Mandatory Preflight for the Implementer

Before changing files, read these in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/core-principles.md`
5. `documentation/conventions/quality-gates.md`
6. `documentation/conventions/testing-infrastructure.md`
7. `documentation/guides/documentation-maintenance.md`
8. `documentation/guides/release-workflow.md`
9. This plan's Related section and the decision tracker

Run `git status --short` before each phase. The worktree was already heavily
modified when this plan was written; preserve unrelated user changes and never
use destructive cleanup commands.

---

## Verified Baseline

The following facts were rechecked against the live repository before writing
this plan:

1. The completed migration plan is archived at
   `exec-plans/completed/PLAN33` and points
   here for remediation authority.
2. `package.json` currently defines `setup` as only `npm ci`.
3. `check:all` currently runs `check:core`, `test:coverage:check`, and
   `perf:check`; `check:ci` and `check:strict` both alias it.
4. `perf:run`, `perf:check`, and `test:mutation` are currently public scripts.
5. Direct Stryker dependencies, `stryker.conf.json`, and
   `vitest.mutation.config.js` are present.
6. The performance implementation includes `perf/baselines/`,
   `tools/perf-run.mjs`, `tools/perf-check.mjs`, `tools/perf/`, dedicated tests,
   and `documentation/guides/performance-gate.md`.
7. Performance hooks also cross production boundaries through
   `runtime/PerfSpanHelper.js`, `config/bootstrap-manifest.js`,
   `runtime/component-loader.js`, `runtime/HostCommitController.js`,
   `runtime/SurfaceSessionController.js`,
   `runtime/surface/HtmlSurfaceController.js`,
   `runtime/surface/CanvasDomSurfaceAdapter.js`, `cluster/ClusterWidget.js`, and
   `types/misc-kit.d.ts`.
8. Those runtime hooks are tested by runtime, surface, component-loader, and
   cluster suites. Performance removal therefore requires behavior-preserving
   lifecycle edits; it is not a directory-only deletion.
9. `.github/workflows/quality.yml` currently runs branch/pull-request core,
   coverage, and performance jobs.
10. `.github/workflows/publish-release.yml` currently repeats core, coverage,
    and performance on tags before publishing.
11. Both workflows currently use mutable major action tags such as
    `actions/checkout@v4`, `actions/setup-node@v4`, and
    `softprops/action-gh-release@v2`.
12. `tools/actionlint.sh` currently pins actionlint `1.7.12` and verifies
    platform-specific SHA-256 digests, but its default cache lives below
    `node_modules/.cache` and it downloads during ordinary lint execution.
13. The current development environment reports Node `26.4.0` and npm `12.0.1`;
    `package.json` does not declare `engines` or `packageManager` and has no
    local Node-major hint.
14. Most direct development dependencies are exact, but Vitest, V8 coverage,
    and jsdom currently use caret ranges.
15. `eslint.config.mjs` loads the maintained eslint-comments plugin and ESLint
    recommended rules, but globally disables `no-unused-vars` and
    `no-useless-assignment`.
16. The test override disables `no-empty` and `no-undef`, and no Vitest ESLint
    plugin/rules are configured.
17. The runtime source override prohibits ES import/export syntax, preserving
    classic browser-script delivery.
18. `.stylelintrc.json` explicitly disables `custom-property-pattern`.
19. `vitest.workspace.mjs` defines `unit-node`, `contract`, and `unit-dom`;
    neither it nor `vitest.config.js` sets `allowOnly: false`.
20. `tsconfig.checkjs.json` is strict and no-emit, covers the production
    JavaScript inventory, and currently includes `runtime/PerfSpanHelper.js`.
21. The audit counted 212 shipped production JavaScript files plus the two
    Vitest configuration files; the typecheck boundary intentionally covers
    shipped production JavaScript, not test/tool sources.
22. Native V8 coverage thresholds are configured in `vitest.config.js` for a
    global baseline plus mapper, runtime, radial, and cluster-config critical
    areas.
23. `tests/helpers/markdown-docs.js` is 302 lines and currently owns generic
    Markdown fenced-code, link, and anchor parsing as well as project-specific
    graph support.
24. `docs:check` currently combines markdownlint with three Vitest contracts
    for links, format, and reachability; there is no maintained Node link
    checker dependency.
25. `tools/check-patterns.mjs` still owns generic language checks including
    bare global `isFinite`; retained project-specific rules also exist.
26. The audit measured the remaining repository-owned checker implementation
    at approximately 5,215 source lines, plus approximately 1,932 helper/test
    lines. Reduction must be based on ownership and parity, not a line quota.
27. A known 83-line duplicate checker block was reported by jscpd; the current
    duplication threshold still allows it.
28. `tools/release-create.mjs` separately runs required core/coverage checks and
    an advisory `perf:check`; advisory failure currently allows packaging to
    continue.
29. `tools/release-prepare.mjs` currently emits JSON unconditionally, so
    `--help` is not real help and dirty worktree state is not checked.
30. The release ZIP builder and package tests already enforce executable
    runtime-only package behavior; no release-manifest JSON schema exists.
31. The tag publisher reads committed
    `releases/dyninstruments-X.Y.Z.zip` and matching Markdown notes and does not
    need to rebuild them.
32. The audit's final functional evidence includes a successful manual visual
    check with no observed plugin regression.
33. Existing jsdom and VM contract suites cover browser-facing lifecycle,
    bootstrap, registry, and DOM behavior without an external browser binary.
34. Documentation and agent instructions still contain performance, mutation,
    `check:ci`, or branch-CI claims in `README.md`, `CONTRIBUTING.md`,
    `AGENTS.md`, quality/release/maintenance guides, smell guidance, and at least
    one skill file.
35. Exec plans and agent-skill files are exempt from the 400-line gate; all
    non-exempt implementation and documentation files remain subject to the
    absolute limit and anti-compression rules.

---

## Hard Constraints

### Runtime and architecture

- Keep raw browser-loaded JavaScript, the existing IIFE/UMD component pattern,
  AvNav registration, `AVNAV_BASE_URL`, and the no-runtime-build contract.
- Add no runtime npm dependency, bundler, transpilation output, ES-module
  conversion, server runtime, or browser driver.
- Performance instrumentation may be removed, but renderer ordering, host
  commits, surface-session ownership, DOM/canvas lifecycle, cleanup, and error
  behavior must remain unchanged.
- Before removing `runtime.perf`, prove every consumer is instrumentation-only.
  If a consumer affects non-performance behavior, preserve a minimal neutral
  contract or stop and record the unexpected dependency before proceeding.
- Keep strict TypeScript `checkJs` production-only and no-emit. Do not expand it
  into tests/tools merely to increase a count.
- Do not add a release-manifest schema. Executable package tests remain the
  release-manifest authority.

### Quality ownership

- Preserve every pre-migration rule/check unless the Owner-Approved Decision
  Contract explicitly removes it.
- A custom rule may be deleted only after its maintained-tool or focused
  contract replacement passes on the repository and fails on a deliberate
  negative fixture.
- Keep the parity ledger current in the same commit/phase as each migration.
- Do not satisfy checker reduction by raising thresholds, adding broad ignores,
  weakening coverage, suppressing jscpd, or reducing scan roots.
- Keep `check:fast`, `check:core`, focused test commands, `check:all`, and
  `check:strict`. Remove only commands explicitly rejected by the decisions.
- `check:all` must expand to exactly the deterministic core gate plus the full
  native coverage gate; it must not perform network access after setup.
- No local or release gate may require Playwright, Chromium, Selenium, or any
  external browser/driver.

### Reproducibility and security

- Pin every direct development dependency exactly and commit the regenerated
  lockfile.
- Declare Node major 26 and exact npm `12.0.1` unless dependency installation
  proves this verified baseline unsupported. If it is unsupported, stop and
  document the evidence instead of silently choosing a new toolchain.
- Keep actionlint version and platform checksums explicit. Its ordinary lint
  path must never download; only `npm run setup` may provision it.
- The default actionlint cache must live outside `node_modules` so `npm ci`
  cannot erase it. Support `ACTIONLINT_CACHE_DIR` for isolated tests.
- Pin every GitHub Action to a full commit SHA and retain a readable version
  comment.
- The publisher remains tag-only, least-privilege, timeout-bounded, and
  concurrency-controlled.

### File organization

- The absolute 400-line rule and oneliner rules override this plan.
- Check line counts before and after touching any non-exempt file over 300
  lines. Split by responsibility before adding behavior.
- In particular, plan to split or shrink `tests/helpers/markdown-docs.js` and
  split any test file that would cross the limit.
- Do not place generic Markdown parsing into a differently named custom helper.
- Do not introduce a second release command runner, Git wrapper, or fixture
  loader when an existing helper can be extended cleanly.

### Scope exclusions

- Do not change widget kinds, visual design, layout geometry, theming inputs,
  AvNav configuration defaults, plugin installation behavior, or runtime
  packaging contents except removal of performance-only instrumentation.
- Do not add MkDocs or another documentation site generator.
- Do not add browser automation, Stryker replacements, performance benchmarks,
  branch quality CI, or a rebuild-on-GitHub release flow.
- Do not modify committed release ZIP contents during this remediation unless a
  normal future release is explicitly requested.

---

## Implementation Order

### Phase 0 — Freeze the parity ledger and establish safety baselines

**Intent:** Turn the audit evidence into an implementation checklist before any
checker is removed.

**Dependencies:** None.

#### 0A. Create the implementation parity ledger

Add or update the quality documentation's rule-ownership table so every current
custom rule has these fields:

- rule identifier and current owner;
- pre-migration provenance;
- selected final owner: maintained tool, focused Vitest contract, retained
  custom Dyninstruments rule, or explicit approved deletion;
- positive command;
- negative fixture/test;
- migration status.

Seed it from the independent parity ledger in the audit tracker. Do not mark a
row migrated based only on equivalent-looking configuration.

#### 0B. Capture focused baselines

Before structural edits, run and record:

```bash
npm run check:core
npm run test:coverage:check
npm run test:split
npm run package:check
```

Also record current production inventory count, coverage threshold values,
release ZIP manifest/entry contract counts, and relevant test counts. Existing
failures must be distinguished from remediation regressions.

#### 0C. Map performance consumers

For each file in Baseline item 7, record whether `startSpan`, `endSpan`, or the
presence of `runtime.perf` changes any non-instrumentation branch. Trace test
harnesses and component registration too. The exit result must be a concrete
removal map, not an assumption based on names.

**Phase 0 exit conditions:**

- Every current custom rule has one final owner and a proof path.
- Performance consumers are classified as instrumentation-only or blocked with
  evidence.
- Baseline counts and commands are recorded before deletion work.

### Phase 1 — Remove rejected additive systems and restore local authority

**Intent:** Delete the systems the owner explicitly excluded while preserving
runtime behavior and release assets.

**Dependencies:** Phase 0.

#### 1A. Remove branch/pull-request quality CI

- Delete `.github/workflows/quality.yml`.
- Remove branch/pull-request quality workflows.
- Leave the release workflow triggered only by `v*` tags. Per the later owner
  decision, it contains a tag-scoped read-only quality job and the publisher
  depends on that job.
- Do not add a replacement branch, pull-request, scheduled, or dispatch quality
  workflow.

#### 1B. Remove Stryker mutation testing completely

- Delete `stryker.conf.json` and `vitest.mutation.config.js`.
- Remove both direct Stryker dependencies, `test:mutation`, formatting entries,
  tests, ignores, and documentation/skill references that exist only for
  mutation testing.
- Regenerate `package-lock.json`; verify no `stryker` package or command remains.

#### 1C. Remove performance tooling and artifacts

- Delete `perf/`, `tools/perf-run.mjs`, `tools/perf-check.mjs`, `tools/perf/`,
  performance-only tests, report paths/ignores, and
  `documentation/guides/performance-gate.md`.
- Remove `perf:run`, `perf:check`, advisory release handling, documentation
  commands, and artifact upload steps.
- Remove performance-only dependency entries if the dependency graph proves
  they have no other owner.

#### 1D. Remove production performance instrumentation safely

Using the Phase 0 map:

- remove `runtime/PerfSpanHelper.js` from the bootstrap manifest and strict
  inventory;
- remove `runtime.perf` and `componentContext.perf` types, required-service
  assertions, context plumbing, span creation/completion calls, and
  performance-only test doubles/assertions;
- preserve the statements previously wrapped by spans in the same execution
  order and existing `try`/`finally` semantics;
- update manifest/registry/loader contracts to assert the final production
  inventory rather than merely deleting expectations;
- run the focused host-commit, surface-session, HTML surface, canvas surface,
  component-loader, cluster-widget, bootstrap, manifest, typecheck, and coverage
  suites after each responsibility group.

Do not remove a `try`/`finally`, callback, cleanup, measurement, commit, or error
path solely because it was adjacent to a span.

#### 1E. Normalize public commands

Set command semantics to:

```text
check:all    = npm run check:core && npm run test:coverage:check
check:strict = npm run check:all
```

Delete `check:ci` and all removed-system scripts. Keep focused commands and the
pre-commit fast/core behavior unless a later phase explicitly changes their
implementation owner.

**Phase 1 exit conditions:**

- Repository search finds no Stryker, mutation config, performance command,
  performance artifact, performance runtime hook, or `check:ci` outside
  historical completed plans/releases where preservation is intentional.
- `.github/workflows/quality.yml` is absent.
- Tag publishing still verifies and uploads the committed ZIP and notes.
- Focused runtime lifecycle suites, `typecheck`, `test:split`, and
  `test:coverage:check` pass.

### Phase 2 — Make setup and direct tooling reproducible

**Intent:** Make installation the only dependency/bootstrap step that may use
the network and make subsequent gates deterministic.

**Dependencies:** Phase 1.

#### 2A. Pin the development runtime

- Add `engines.node` for major 26, `packageManager: "npm@12.0.1"`, and a local
  Node-major hint such as `.nvmrc` containing `26`.
- Update contributor setup guidance with the exact npm package-manager contract
  and supported Node major.
- Add a focused package contract that fails if the declarations drift from the
  documented values.

#### 2B. Exactly pin direct dependencies

- Convert every direct `devDependency` to an exact version.
- Add the chosen maintained Markdown link checker and the maintained Vitest
  ESLint plugin as exact versions only after their Phase 3/4 proof spike passes.
- Use `npm install --save-dev --save-exact ...` or an equivalent lockfile-safe
  process; do not hand-edit resolved integrity data.
- Run `npm ci` from the regenerated lock and verify no package.json direct range
  begins with `^`, `~`, `>`, `<`, or a tag such as `latest`.

#### 2C. Move actionlint acquisition into setup

Refactor `tools/actionlint.sh` into two explicit modes:

1. install/provision mode downloads the pinned release, verifies the existing
   per-platform SHA-256, and installs it into a persistent cache outside
   `node_modules`;
2. normal lint mode executes an already verified/cached binary and never
   downloads.

The default may use `${XDG_CACHE_HOME:-$HOME/.cache}` with a
Dyninstruments/version/platform subpath. Preserve `ACTIONLINT_CACHE_DIR` so
tests can use a temporary directory. A missing binary in normal mode must fail
with an actionable message containing `npm run setup`.

Change `setup` to run locked npm installation followed by actionlint
provisioning. Add isolated tests proving checksum mismatch failure, supported
platform selection, cached reuse, missing-cache offline failure, and successful
setup provisioning without writing below `node_modules/.cache`.

**Phase 2 exit conditions:**

- A clean `npm run setup` provisions dependencies and actionlint.
- Deleting only `node_modules` and rerunning `npm ci` does not remove the
  actionlint cache.
- With network disabled after setup, `actions:lint`, `check:fast`, and
  `check:core` reach actionlint without a download attempt.
- Package/lock/runtime declarations and their tests agree.

### Phase 3 — Establish maintained lint/test owners with negative proofs

**Intent:** Move generic JavaScript, CSS, and focused-test guarantees to
maintained configuration before deleting overlapping custom rules.

**Dependencies:** Phase 2.

#### 3A. Enforce the CSS namespace with Stylelint

- Enable `custom-property-pattern` so owned custom properties must start with
  `--dyni-` and continue with the repository's accepted lower-case naming form.
- Scope or ignore genuine third-party/fixture variables narrowly; do not disable
  the rule globally.
- Add a positive fixture for `--dyni-*` and a negative fixture for an unprefixed
  owned property. The test must invoke the real Stylelint configuration.

#### 3B. Reject focused and skipped tests

- Add maintained ESLint core `no-restricted-syntax` selectors for `.only` and
  `.skip` on Vitest suite/test APIs under `tests/**/*.test.js`.
- Set `allowOnly: false` in all three configured Vitest projects and in every
  direct Vitest configuration used by normal or coverage commands.
- Add deliberate `.only` and `.skip` ESLint negative fixtures.
- Add a direct Vitest negative proof that `.only` exits non-zero even if lint is
  bypassed. `.skip` is owned by ESLint; do not invent an unstable runtime test
  counter unless Vitest exposes a maintained fail-on-skip option.

#### 3C. Move bare `isFinite` to ESLint

- Add a maintained-source override using `no-restricted-globals` with an
  actionable `Number.isFinite` message.
- Prove the current repository passes.
- Prove a deliberate `isFinite(value)` fixture fails through ESLint.
- Only then delete the `global-isfinite` implementation and its old custom
  fixture from `tools/check-patterns.mjs` and associated tests/ledger row.

#### 3D. Tighten generic ESLint rules incrementally

For each globally disabled generic rule (`no-unused-vars`,
`no-useless-assignment`, and broad test exceptions such as `no-empty` or
`no-undef`):

1. inventory current violations by directory;
2. classify browser/global/harness constraints;
3. enable the maintained rule on the cleanest directory;
4. fix real defects or add the narrowest justified override;
5. add/retain negative proof;
6. update the parity ledger;
7. proceed to the next directory.

Do not enable a repository-wide rule and silence fallout with blanket disables.
Preserve UMD/browser globals and shared Vitest harness realities explicitly.

#### 3E. Expand Prettier by directory

- Inventory maintained JS/CSS/Markdown not yet under Prettier.
- Before formatting a directory, split any non-exempt file whose formatted
  result would violate the absolute 400-line rule.
- Add one coherent directory at a time to `format` and `format:check`, review
  semantic diffs, and run its focused tests plus `check:filesize`.
- Keep runtime classic-script semantics untouched. Formatting-only changes must
  not be mixed with behavioral remediation in the same reviewable step.
- Continue until all maintained source/test/tool/config/documentation surfaces
  have an explicit Prettier disposition. Generated fixtures may be narrowly
  excluded only with a documented reason.

**Phase 3 exit conditions:**

- Real Stylelint rejects an invalid owned CSS variable.
- ESLint rejects `.only`, `.skip`, and bare `isFinite` fixtures.
- Direct Vitest rejects `.only` for every relevant configuration path.
- Each generic ESLint rule has a scoped owner and no unjustified global disable.
- Prettier scope is documented and incrementally green without a 400-line or
  oneliner violation.

### Phase 4 — Replace generic Markdown parsing with a maintained link checker

**Intent:** Let a maintained Node tool own file links and heading fragments
while preserving Dyninstruments-specific documentation contracts.

**Dependencies:** Phases 2 and 3.

#### 4A. Prove the maintained checker before integration

Use Linkinator as the default candidate because it supports Markdown input and
fragment checking. An equivalent actively maintained Node checker is allowed
only if the same proof passes.

Create isolated fixtures proving the actual CLI/configuration:

- accepts a valid relative Markdown link;
- rejects a missing local file;
- rejects a missing local heading fragment;
- handles repository-relative paths and duplicate/generated heading slugs the
  same way the documentation contract requires;
- runs deterministically without contacting external URLs.

Configure the required gate for local repository links only. External-link
availability must not make local checks network-dependent or flaky.

#### 4B. Integrate the checker into `docs:check`

- Add an exact direct dependency and committed configuration.
- Add a focused script such as `docs:links` and place it after markdownlint in
  `docs:check`.
- Ensure the command scans root Markdown, `documentation/`, relevant agent
  instructions/skills, and active plan links according to the existing
  documentation contract.
- Keep Markdown style linting separate from semantic link validation.

#### 4C. Reduce the custom Markdown helper

Delete generic fenced-code, inline-link, destination, and heading-anchor parsing
once maintained-tool positive/negative parity passes. Retain only small focused
helpers/contracts for:

- documentation graph reachability from `TABLEOFCONTENTS.md` and approved root
  entry points;
- stale/forbidden phrase detection;
- required document shape/metadata;
- JavaScript `Documentation:` target existence and traceability.

Split the retained helper by responsibility if necessary. Do not copy generic
Markdown parsing into the reachability tests. Preserve a deliberate negative
fixture for every retained project-specific rule.

#### 4D. Confirm the documentation-generator decision

Do not add MkDocs. Remove any migration wording that presents a documentation
site build as an unfinished requirement. Markdown files plus maintained lint,
link/anchor validation, and project-specific contracts are the final system.

**Phase 4 exit conditions:**

- Missing files and missing anchors fail through the maintained tool.
- External network availability cannot fail `docs:check`.
- Project-specific graph, stale-phrase, shape, and JS-target negative fixtures
  still fail.
- `tests/helpers/markdown-docs.js` no longer owns generic Markdown parsing and
  all resulting non-exempt files obey the 400-line rule.

### Phase 5 — Complete rule-by-rule custom checker reduction

**Intent:** Finish migration of generic checker rules while retaining genuinely
project-specific protections.

**Dependencies:** Phases 3 and 4.

#### 5A. Process the parity ledger one rule at a time

For each remaining generic rule in repository-owned checker scripts:

1. identify the maintained ESLint, Stylelint, Prettier, markdownlint, Vitest,
   TypeScript, Ajv, jscpd, or package-contract owner;
2. add/configure that owner narrowly;
3. pass the current repository;
4. prove a deliberate violation fails;
5. delete only the superseded custom implementation and fixtures;
6. update docs, test counts, and ledger status.

Retain custom rules only for contracts that standard tools cannot express
reliably, including AvNav/UMD registration relationships, deterministic package
contents, documentation graph/traceability, and the absolute repository
file-size/oneliner policy.

#### 5B. Remove the reported checker clone

Refactor the 83-line duplicate into one canonical helper or eliminate both
copies through a maintained-tool migration. Keep jscpd scope and thresholds
unchanged. Add focused tests around the canonical helper if it remains.

#### 5C. Preserve the production typecheck inventory

- Update the authoritative inventory after `PerfSpanHelper.js` removal and any
  legitimate production splits.
- Add/retain a contract that discovers all shipped production JS and fails when
  `tsconfig.checkjs.json` omits or unexpectedly includes a file.
- Keep tests and tools protected by ESLint and execution, not by forced
  TypeScript inclusion.
- Keep `strict`, `checkJs`, and `noEmit` enabled and do not lower thresholds to
  accommodate remediation.

#### 5D. Preserve the executable release-manifest contract

Keep Ajv schemas for `plugin.json` and layouts only. Keep release prepare/create
and ZIP-builder tests as the generated manifest/package authority. Add no schema
whose only purpose is restating generated data already proven by executable
contracts.

**Phase 5 exit conditions:**

- Every ledger row is marked migrated, retained with project-specific rationale,
  or removed by an explicit owner-approved exception.
- No generic checker implementation remains solely because migration was
  deferred.
- jscpd reports no known clone and no new exclusion/threshold weakening.
- Production inventory and executable package contracts pass.

### Phase 6 — Make local release commands fail-closed

**Intent:** Make local tooling the single quality and packaging authority while
preserving committed release archives.

**Dependencies:** Phases 1 through 5.

#### 6A. Add real `release:prepare` help

- Parse `--help` and `-h` before repository reads.
- Print concise usage, output format, clean-worktree requirement, and examples.
- Exit zero without Git calls, payload generation, or filesystem changes.
- Reject unknown arguments with usage and non-zero status.

#### 6B. Fail preparation on dirty release-relevant state

- Reuse or extract the established porcelain-status path normalization used by
  release creation instead of implementing a divergent parser.
- Abort normal preparation when tracked or untracked release-relevant paths are
  dirty, with an actionable list or summary.
- Define allowed release-note/output exceptions explicitly and identically in
  tests and documentation; do not broadly ignore directories.
- Test clean, tracked-dirty, untracked-dirty, rename, help, and unknown-argument
  cases using isolated temporary repositories or injected command runners.

#### 6C. Make `release:create` run one aggregate gate

- Replace separate core, coverage, and advisory performance calls with exactly
  one blocking `npm run check:all` invocation before manifest/archive creation.
- If it fails, abort before ZIP creation, release-note mutation, Git commit, or
  tag creation.
- Keep clean-worktree, version/tag, required-note, deterministic runtime-only ZIP,
  commit, and annotated-tag behavior intact.
- Update tests to prove one invocation on success and no packaging/Git mutation
  on failure.

#### 6D. Harden the tag-only publisher

- Keep top-level `contents: read` and grant `contents: write` only to the
  publishing job.
- Keep concurrency and a finite timeout.
- Pin checkout and release-upload actions to full immutable SHAs with readable
  version comments.
- Verify the tag version, committed ZIP, and matching notes. The tag-scoped
  read-only job installs the locked quality tooling and reruns `check:all`; the
  publisher uploads the exact committed files without rebuilding.
- Add/retain workflow contract tests that reject mutable action tags, unexpected
  triggers, broad permissions, missing timeout/concurrency, or a rebuild step.

**Phase 6 exit conditions:**

- Help is side-effect free and dirty preparation fails closed.
- A failing `check:all` prevents every release artifact/Git side effect.
- A successful release uses the existing committed-archive model.
- The only GitHub workflow is the hardened tag-only publisher, except any
  unrelated pre-existing workflow verified outside this migration's scope.

### Phase 7 — Synchronize documentation and agent instructions

**Intent:** Make the final authority model discoverable and remove stale
migration-era claims without changing runtime code.

**Dependencies:** Phases 1 through 6.

Update at least these touchpoints where relevant:

- `README.md` development setup, quality commands, browser-test scope, and
  release summary;
- `CONTRIBUTING.md` setup, local validation, manual visual checklist, and release
  workflow;
- `AGENTS.md` quality checklist and required completion gate;
- `.agents/skills/preflight/SKILL.md`, `.agents/skills/create-plan/SKILL.md`,
  `.agents/skills/doc-sync/SKILL.md`, and any other skill containing removed
  performance/CI/mutation commands;
- `documentation/TABLEOFCONTENTS.md` after deleting the performance guide;
- `documentation/conventions/quality-gates.md` command matrix, ownership model,
  parity ledger, and retained custom-rule rationale;
- `documentation/conventions/coding-standards.md` after removing performance
  hook guidance;
- `documentation/conventions/smell-prevention.md` and
  `documentation/conventions/smell-fix-playbooks.md` when rule owners change;
- `documentation/conventions/testing-infrastructure.md` for focused-test and
  browser-boundary policy;
- `documentation/guides/documentation-maintenance.md` for the maintained link
  checker and final documentation gate;
- `documentation/guides/release-workflow.md` for help, clean-state, one aggregate
  gate, committed ZIPs, and the tag-only publisher;
- `CLAUDE.md` only if its pointer contract needs updating.

Documentation must state plainly:

- browser automation is intentionally excluded, not pending;
- manual AvNav visual/release validation supplements blocking jsdom/VM tests;
- performance and mutation systems were intentionally removed;
- local `check:all` and release tooling own quality, and tag pushes rerun the
  same aggregate gate before publication;
- GitHub only publishes locally prepared committed artifacts and never rebuilds
  them;
- actionlint provisioning belongs to setup;
- TypeScript remains a production-only strict/no-emit boundary;
- the release manifest remains an executable contract.

The manual checklist must include plugin load/activation, representative canvas
and HTML widgets, day/night rendering, resize/layout behavior, edit mode, data
updates, console errors, and release ZIP installation. Record results in the
release notes or designated validation record; do not automate the checklist.

No widget/theming/layout behavior changes are planned, so theme-token and
all-widget showcase fixtures do not require changes. If implementation changes
visible behavior unexpectedly, stop and apply the fail-closed fixture/README
rules instead of treating it as incidental.

**Phase 7 exit conditions:**

- Repository-wide searches find no active claim that performance, mutation,
  `check:ci`, branch CI, or browser automation is part of the required gate.
- All command examples match `package.json` exactly.
- README and contributor/release guidance agree on local authority and the
  manual checklist.
- `docs:check` and `check:filesize` pass.

### Phase 8 — Clean-install final validation and handoff

**Intent:** Prove the finalized migration from a reproducible state and record
evidence for plan completion.

**Dependencies:** All previous phases.

#### 8A. Static residue audit

Search active code/config/docs for:

```text
perf:check
perf:run
check:ci
test:mutation
stryker
runtime.perf
componentContext.perf
.github/workflows/quality.yml
```

Classify intentional historical references in completed plans/releases; active
references must be zero unless explicitly justified by this plan.

Also verify:

- no mutable GitHub Action reference remains;
- no direct dependency has a range/tag;
- no ordinary gate contains a download command;
- no release publisher installs dependencies or rebuilds the ZIP;
- no production file is omitted from strict typecheck inventory;
- no generic Markdown parser remains custom;
- no checker clone is hidden by an exclusion.

#### 8B. Clean reproducibility run

From the declared Node/npm toolchain, perform the repository's approved clean
dependency reset, then run:

```bash
npm run setup
npm run check:all
```

Both must exit zero. After setup, repeat representative `actions:lint` and
`check:core` execution with network unavailable or download commands intercepted
to prove cache-only behavior.

#### 8C. Focused final proofs

Run and record at minimum:

```bash
npm run format:check
npm run lint
npm run actions:lint
npm run typecheck
npm run docs:check
npm run package:check
npm run test:split
npm run test:coverage:check
npm run check:filesize
npm run check:all
```

Run negative-fixture tests for invalid CSS variables, missing Markdown files and
anchors, `.only`, `.skip`, bare `isFinite`, missing actionlint cache, bad
actionlint checksum, dirty release preparation, failed release gate, mutable
workflow action tags, typecheck inventory drift, and every retained custom rule.

#### 8D. Manual validation record

Reference the owner's already successful visual check as pre-remediation
evidence, then perform the documented manual checklist again if production
performance-hook removal changed shipped runtime files. Record date,
environment, representative widgets/layouts, result, and any limitation. No
external browser automation is required.

#### 8E. Complete the plan

Update this Status section with final command evidence, material deviations, and
the manual validation result. Move `PLAN34.md` to `exec-plans/completed/` only
after every acceptance item is satisfied.

---

## User-Facing Documentation Impact

`README.md` changes are required because this plan changes contributor setup,
quality commands, release workflow, platform/tooling requirements, and the
documented browser-validation boundary.

No end-user widget, layout, theme, installation, or AvNav configuration behavior
is intended to change. README edits should therefore stay within development,
requirements, validation, and release sections and must not advertise new
runtime behavior.

---

## Acceptance Criteria

### Scope and parity

- [x] Every pre-migration rule/check has a final owner or an explicit approved
  exception in the parity ledger.
- [x] Browser automation is absent; jsdom/VM contracts and the manual checklist
  are documented and passing.
- [x] Performance and mutation systems are completely absent from active
  code/config/tests/commands/docs.
- [x] No generic checker was deleted before positive and negative replacement
  proof.

### Commands and reproducibility

- [x] `setup` installs locked dependencies and provisions checksum-verified
  actionlint outside `node_modules`.
- [x] Ordinary gates never download actionlint and missing cache errors point to
  `npm run setup`.
- [x] Direct dev dependencies are exact; Node 26 and npm 12.0.1 are declared and
  documented.
- [x] `check:all` is core plus full native coverage only.
- [x] `check:strict` aliases `check:all`; `check:ci` is absent.
- [x] `npm run setup` followed by `npm run check:all` exits zero from a clean
  dependency state.

### Maintained tooling and retained contracts

- [x] Prettier covers all maintained surfaces by explicit inclusion/disposition
  without violating the 400-line rule.
- [x] ESLint owns generic JavaScript/comment rules and rejects bare `isFinite`,
  `.only`, and `.skip` fixtures.
- [x] Every Vitest project/config rejects `.only` at runtime.
- [x] Stylelint enforces the `--dyni-*` namespace with a real negative fixture.
- [x] A maintained offline Node link checker rejects missing files and anchors.
- [x] Custom Markdown code owns only reachability, stale phrases, document shape,
  and JS Documentation targets.
- [x] The known checker clone is removed with no jscpd weakening.
- [x] Strict no-emit production inventory, coverage thresholds, file-size rules,
  schemas, and executable package contracts remain blocking.

### Release and GitHub

- [x] `release:prepare --help` and `-h` are side-effect-free and accurate.
- [x] Normal release preparation rejects tracked and untracked
  release-relevant dirty state.
- [x] `release:create` runs `check:all` exactly once before packaging and aborts
  without side effects on failure.
- [x] Committed release ZIPs remain authoritative and runtime-only.
- [x] GitHub has no migration-added branch/pull-request quality workflow.
- [x] The tag-only publisher has least privilege, concurrency, timeout, and
  immutable SHA-pinned actions and does not rebuild artifacts.
- [x] Tag pushes rerun `check:all` in a read-only job and publication depends on
  that result.

### Documentation and hygiene

- [x] README, CONTRIBUTING, AGENTS, relevant skills, TOC, quality, testing,
  maintenance, smell, coding, and release guidance match the final system.
- [x] No stale active references to removed commands/systems remain.
- [x] No non-exempt file exceeds 400 lines or uses compression workarounds.
- [x] `npm run docs:check`, `npm run check:filesize`, and `git diff --check` pass.
- [x] Manual validation is recorded if shipped runtime instrumentation was
  removed.
- [x] No unrelated user change was overwritten.

---

## Related

- [Archived migration plan](../completed/PLAN33)
- `/tmp/dyninstruments-quality-migration-remediation-decisions.md` — complete
  owner-approved 26-finding decision log (temporary local audit artifact)
- `/tmp/dyninstruments-quality-migration-audit-tracker.md` — step-by-step audit
  tracker and parity ledger source (temporary local audit artifact)
- `/tmp/dyninstruments-quality-migration-audit-report.md` — consolidated audit
  evidence (temporary local audit artifact)
- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Testing infrastructure](../../documentation/conventions/testing-infrastructure.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Release workflow](../../documentation/guides/release-workflow.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
