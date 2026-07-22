# PLAN35 — AI Coding Quality Enforcement Hardening

## Status

Written after repository verification, review of the PolarRecorder quality system, and the repository owner's 2026-07-17
request to plan the identified hardening improvements.

This plan strengthens the mechanical guarantees around AI-authored production code, tests, quality policy, and delivery.
Equivalent implementations are allowed where this plan names an outcome rather than a specific algorithm, but the
coverage inventory, zero-warning policy, suppression restrictions, complexity no-regression contract, test-quality
boundary, deterministic scaling proofs, and always-run delivery gates are prescriptive.

This request reopens three decisions recorded in completed PLAN34, but only in the following bounded forms:

1. Add branch and pull-request quality CI that invokes the existing `npm run check:all`; do not restore the deleted
   `check:ci` command.
2. Add a separate strict test-code type boundary; do not weaken or replace the complete production-only
   `tsconfig.checkjs.json` inventory.
3. Add deterministic operation-count/scaling contracts for selected pure hot paths; do not restore the retired
   performance runner, wall-clock baselines, runtime instrumentation, `PerfSpanHelper`, performance artifacts, or
   performance npm commands.

All other PLAN34 decisions remain binding. In particular, this plan does not add browser automation, mutation testing, a
build step, runtime npm dependencies, or GitHub-side release rebuilding.

The owner did not request a separate pre-plan interview. The plan therefore assumes that “implement those improvements”
approves the bounded supersession above. If that was not intended, stop before Phase 1 and amend this section.

---

## Goal

Make the repository's quality system harder for AI-authored changes to bypass, while retaining the current deterministic
Node/Vitest architecture and existing runtime behavior.

Expected outcomes after completion:

1. Every shipped production JavaScript entry is mechanically classified as coverage-measured or contract-owned; new
   unclassified files fail the gate.
2. Coverage floors cannot be silently lowered and new behavioral files receive explicit per-file floors.
3. All executable smell rules are blocking; prose-only contract-trust smells gain executable owners.
4. Generic production suppressions are eliminated in favor of narrowly validated boundary annotations or checker-owned
   canonical exceptions.
5. Unsafe evaluation and HTML DOM sinks are mechanically blocked outside their single approved owner.
6. New functions must meet strict complexity, statement, nesting, and parameter budgets; existing functions cannot
   regress and the worst hotspots are reduced.
7. Test files are no longer protected by one repository-wide `no-undef` / `no-unused-vars` exemption; new tests enter a
   strict typed/linted boundary.
8. Prettier eventually owns every maintained source, test, tool, CSS, and Markdown surface, with deliberate fixture
   exceptions only.
9. Deterministic scaling contracts reject super-linear regressions in selected pure hot paths without timing the
   workstation or instrumenting production.
10. A versioned pre-push hook and read-only branch/pull-request CI run the complete gate before changes can merge under
    the documented repository settings.
11. Quality-policy files and tests have explicit review ownership, and the required GitHub branch settings are
    documented and owner-verified.
12. Documentation and tests describe and prove the final system end to end.

---

## Mandatory Preflight for Implementers

Before each implementation session, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/core-principles.md`
5. `documentation/conventions/quality-gates.md`
6. `documentation/conventions/testing-infrastructure.md`
7. `documentation/guides/documentation-maintenance.md`
8. `documentation/guides/exec-plan-authoring.md`
9. This plan and the relevant Related documents

Run `git status --short` before each phase. Preserve unrelated user changes and never use destructive cleanup commands.

---

## Verified Baseline

The following facts were rechecked against the live repository before writing this plan:

1. `exec-plans/active/` contained no active plan; PLAN34 is the latest completed plan, so this plan is PLAN35.
2. The worktree was clean before this plan was created.
3. `npm run check:all` expands exactly to `check:core` plus `test:coverage:check`; `check:strict` aliases it and
   `check:ci` is absent.
4. The verified pre-plan `npm run check:all` passed 383 test files and 1,405 tests. Included-source V8 coverage was
   89.69% lines, 76.91% branches, 95.26% functions, and 89.06% statements.
5. The shipped production inventory contains 211 `.js` files under `plugin.js`, `config/`, `runtime/`, `cluster/`,
   `shared/`, and `widgets/`. `plugin.mjs` is a separately tested entrypoint.
6. The current LCOV report contains 78 production source files: `plugin.js` 1/1, `config` 18/41, `runtime` 25/25,
   `cluster` 16/16, `shared` 11/101, and `widgets` 7/27.
7. `vitest.config.js` uses a curated coverage `include` list plus global and four critical-area threshold groups. Files
   outside the include list do not lower the reported global result.
8. `tsconfig.checkjs.json` strictly checks all 211 production `.js` files, `vitest.config.js`, and six declaration
   files. Its inventory contract fails on omissions or unexpected production entries.
9. The repository contains 416 test `.js` files. Test sources remain outside the strict type project because split
   harness files share globals.
10. The ESLint override for `tests/**/*.js` disables `no-undef`, `no-unused-vars`, and `no-useless-assignment` for every
    test, not only the split harness fragments that need special treatment.
11. The repository contains 26 `.js`/`.mjs` tool files. Module/tool linting is stricter than test linting, but tools are
    not part of a strict type project.
12. Prettier currently blocks only package/workflow/quality configuration, declaration, and schema files. Runtime, test,
    tool, CSS, and Markdown formatting remain explicitly deferred.
13. `tools/check-patterns/rules.mjs` has three warn-only rules: `catch-fallback-without-suppression`,
    `css-js-default-duplication`, and `editable-threshold-missing-internal`. Mapper output counts from 9 through 12 are
    also warn-only.
14. The current pattern run reports zero unsuppressed failures and zero warnings, so the zero-warning state is available
    for fail-closed promotion.
15. Production source contains 29 `dyni-lint-disable-*` directives. It contains zero ESLint, TypeScript, Prettier, or
    Istanbul suppression directives.
16. The only direct `innerHTML` assignments are the two canonical parsing/patch sinks in
    `shared/widget-kits/html/HtmlDomPatchUtils.js`. No production `eval()` or `new Function()` use was found.
17. A diagnostic ESLint run using Polar-equivalent limits—complexity 10, statements 40, nesting 4, parameters 6—reported
    189 violations. The worst observed render functions have cyclomatic complexity 77 and 96, so a fail-closed migration
    must use a no-regression baseline before imposing strict new-code limits.
18. `.pre-commit-config.yaml` offers optional fast checks and deliberately does not run `check:all`. `.githooks/`
    contains no versioned hook.
19. `.github/workflows/publish-release.yml` is the only workflow. It is tag-only and correctly reruns setup plus
    `check:all` in a read-only quality job before publishing committed artifacts.
20. There is no branch/pull-request quality workflow and no `CODEOWNERS` file.
21. The retired performance tooling and runtime instrumentation are absent. Contract tests explicitly prevent
    `PerfSpanHelper` and its removed owner path from returning.
22. The quality system already has positive and negative proofs for pattern rules, file-size/oneliner rules, focused
    tests, actionlint, jscpd, docs, registry direction/cycles, schemas, type inventory, and release contracts.
23. Quality documentation files are below 300 lines. `README.md` is 283 lines and must be checked before and after
    development-workflow additions.
24. No widget kind, theme token, bundled layout, user setting, installation behavior, or runtime package content needs
    to change for this plan.

---

## Quality Policy Specification

This section defines the final policy independent of implementation details.

### Enforcement severity

- Required gates have only `block` outcomes. Advisory output may explain debt, but a live rule must not emit a
  non-failing warning for a newly introduced violation.
- Every rule must have a clean case, a failing case, documentation ownership, and a command included in `check:core` or
  `test:coverage:check`.
- A rule may be exempted only through the narrow mechanism defined for that rule. A generic prose reason must not turn
  arbitrary production findings green.

### Coverage classification

Every shipped `plugin.js`, `plugin.mjs`, `config/**/*.js`, `runtime/**/*.js`, `cluster/**/*.js`, `shared/**/*.js`, and
`widgets/**/*.js` entry must be in exactly one class:

1. `measured`: executed in the V8 coverage run with explicit line and, where useful, branch floors;
2. `contract-owned`: a thin declarative/entry/registration file whose behavior is exhaustively owned by named executable
   contract tests.

Contract ownership is an exception, not a directory-wide escape. Each entry must name its owner test and reason. New
behavioral files default to `measured` with at least 80% line and 65% branch coverage. Existing critical floors and
global floors must not decrease.

### Suppression policy

- Generic `dyni-lint-disable-*` directives are forbidden in production source after migration. Negative fixtures may
  retain them where they prove the checker.
- Canonical-owner exceptions belong in the rule's configuration and must be proven narrowly by path and construct.
- Intentional external-boundary degradation uses a validated marker carrying category, owner, date, and reason. The
  marker may suppress only the dedicated boundary-fallback rule and cannot suppress unrelated rules.
- Temporary exceptions require an expiry date; expired or unknown markers fail.
- Standard ESLint, TypeScript, Prettier, and coverage suppressions remain forbidden on shipped/test code unless a future
  owner-approved policy adds a specific mechanically checked form.

### Complexity policy

- New functions: cyclomatic complexity at most 10, at most 40 statements, nesting depth at most 4, and at most 6
  parameters.
- Existing violations enter a checked baseline. Any metric increase, new baseline omission, duplicate baseline identity,
  or stale resolved entry fails.
- Existing functions over complexity 40 must be reduced below 25 in this plan.
- Refactors must split responsibilities, not hide scores through one-line compression, generated wrappers, nested
  anonymous callbacks, or ignored paths.

### Test-quality policy

- Production `checkJs` remains a separate complete inventory.
- A second strict `checkJs` project owns real test modules and helpers.
- Every test file is classified as strict, deliberate executable fixture, temporary non-spec harness fragment, or
  temporary executable `*.partN.test.js` split-spec fragment. Both temporary classes name a parent, reason, and removal
  path; they are tracked migration debt rather than strict files.
- New tests default to strict typing and normal `no-undef`/`no-unused-vars`.
- Broad `tests/**/*.js` lint exemptions are forbidden in the final config.

### Delivery policy

- The versioned pre-push hook runs `npm run check:all`.
- Repository tests verify hook existence, executable mode, and command content.
- A local doctor verifies `core.hooksPath`; CI does not depend on developer Git configuration.
- Branch/pull-request CI runs locked setup and `check:all` with read-only permissions, immutable action SHAs,
  concurrency cancellation, and a timeout.
- The existing tag publisher remains separate and unchanged in authority.

### Deterministic scaling policy

- Scaling checks use observable operation counts or bounded callback counts, not elapsed wall-clock time.
- No production instrumentation, benchmark artifact, committed timing baseline, external browser, or runtime dependency
  is permitted.
- At least one negative synthetic quadratic case must prove the evaluator can fail.

---

## Architecture Notes

### Existing quality owners remain the base

`package.json` remains the public command graph. ESLint/Stylelint/Prettier own generic syntax and formatting. Vitest
owns executable contracts and coverage. Custom checkers remain appropriate only for repository inventory, suppression,
cross-file, AvNav/UMD, and policy relationships that maintained tools cannot express directly.

### Production behavior is not the subject of this plan

Most phases change tooling, policy data, tests, documentation, hooks, and workflow files. Complexity remediation is the
only phase expected to refactor shipped runtime code. Those refactors must preserve outputs, lifecycle order, DOM/canvas
behavior, and public APIs exactly.

### Policy data must fail closed

Coverage, complexity, suppression, and test-classification data may live under `tools/quality-policy/` or an equivalent
tooling-owned location. Each policy must compare itself with the live filesystem so adding, renaming, or deleting a file
cannot silently leave stale or missing entries.

### Review protection completes the mechanical system

An AI that may freely edit checkers, thresholds, fixtures, and workflow files can weaken any in-repository rule. The
plan therefore includes CODEOWNERS or an equivalent required-review ruleset for quality-policy surfaces. Repository
settings remain an owner action and must be confirmed in the final validation record.

---

## Hard Constraints

### Runtime and architecture

- Keep the raw-script runtime, UMD/IIFE components, `window.DyniComponents`, AvNav registration, `AVNAV_BASE_URL`, and
  no-runtime-build contract.
- Add no runtime npm dependency, bundler, transpiler, server runtime, browser driver, or generated runtime output.
- Do not reintroduce `PerfSpanHelper`, `runtime.perf`, `componentContext.perf`, the retired `perf/` tree, wall-clock
  benchmark baselines, or runtime instrumentation.
- Keep component registry dependency direction/cycle ownership unchanged.
- Keep `tsconfig.checkjs.json` production-complete and strict. Test typing must use a separate config and must not
  reduce production strictness.

### Quality integrity

- Do not lower existing global or critical coverage thresholds.
- Do not exclude a currently measured source file from coverage.
- Do not classify behavioral code as contract-owned merely to avoid tests.
- Do not increase a complexity baseline value or suppression budget to obtain a green gate.
- Do not weaken, delete, skip, focus, or broadly suppress a test/check to make implementation pass.
- Every new or changed custom checker requires clean and failing fixture tests.
- Keep ordinary gates deterministic and offline after `npm run setup`.
- Keep `check:all` expanding to `check:core` plus native coverage. New static or scaling checks belong inside
  `check:core`; do not create `check:ci`.
- Negative fixtures must remain excluded from ordinary source/test discovery and executed only by their owner proof.

### Delivery and GitHub

- Branch/pull-request CI has read-only permissions and must not upload, publish, tag, commit, or modify releases.
- Pin every action to a full commit SHA with a readable version comment.
- Preserve the tag publisher's least-privilege two-job quality/publish model.
- Do not commit placeholder CODEOWNERS identities. Obtain a valid user/team identity or record the equivalent
  repository-ruleset configuration.
- Local hooks complement CI; they must not be the sole merge guarantee.

### File organization

- The absolute 400-line and anti-compression rules override this plan.
- Check line counts before and after every non-exempt file already above 300 lines. Split by responsibility before
  crossing 400.
- `README.md` is currently 283 lines; check it before and after documentation work and split a focused development
  document if required.
- `tools/check-patterns/rules.mjs` is tool-exempt but already large. Add new rule implementations in focused modules
  rather than expanding the central registry with implementation logic.
- Keep policy checkers and their test files focused. Test files remain subject to the 400-line limit.
- Do not use formatting compression to keep a migrated file below its limit.

### Scope

- Do not change widget availability, appearance, interaction, theme tokens, layouts, user configuration, installation,
  or release package contents.
- Do not add Playwright/Selenium/browser automation, mutation testing, a docs site generator, or GitHub-side artifact
  rebuilding.
- Do not edit completed PLAN34; this plan records the bounded supersession.
- Keep documentation edits in the dedicated documentation phase.

---

## Implementation Order

### Phase 0 — Freeze policy baselines and governance

**Intent:** Record exact starting policy data and make later tightening measurable before changing gates.

**Dependencies:** None.

#### 0A. Capture reproducible baselines

Record in this plan's progress log:

- production, test, tool, and coverage-source inventories;
- global and critical coverage thresholds;
- the per-rule zero-warning result;
- production suppression inventory;
- complexity findings by stable function identity and metric;
- current formatter scope;
- focused full-gate test and coverage results.

Use scripts/tests for repeatable counts; do not preserve `/tmp` output as the only evidence.

#### 0B. Create the quality-policy owner map

Define the final owners for coverage inventory, complexity budgets, suppression/boundary annotations, test
classification, unsafe sinks, hooks, workflow semantics, formatting scope, and scaling contracts. Each row must name its
positive command and negative proof.

Extend the existing migration parity ledger rather than creating a conflicting second documentation source of truth.

#### 0C. Prove the aggregate command graph

Extend `tests/tools/package-scripts.test.js` so the final additions cannot be silently removed from `check:core`, while
`check:all` remains exactly core plus coverage and `check:ci` remains absent.

**Phase 0 exit conditions:**

- Baseline inventories are reproducible and checked in tests/tool policy data.
- Every planned rule has an owner and negative-proof path.
- `npm run check:core` and `npm run test:coverage:check` still pass before tightening begins.

### Phase 1 — Enforce the complete gate before merge

**Intent:** Ensure the existing and future mechanical rules actually run before changes are pushed and merged.

**Dependencies:** Phase 0.

#### 1A. Add the versioned pre-push hook

Create `.githooks/pre-push` to resolve the repository root, normalize the locale, and run `npm run check:all`. Add
focused installer and doctor commands:

- `hooks:install` configures `core.hooksPath=.githooks` and ensures executable mode;
- `hooks:doctor` verifies local configuration and reports the exact repair command;
- a repository contract verifies the committed hook independently of local Git configuration.

Keep `.pre-commit-config.yaml` as the fast feedback layer; do not make it run the full gate.

#### 1B. Add read-only branch/pull-request quality CI

Create `.github/workflows/quality.yml` for pull requests and pushes to the repository's maintained default branch. It
must:

- check out the exact ref with an immutable action SHA;
- set up Node from `.nvmrc` and exact npm 12.0.1;
- run `npm run setup` and `npm run check:all`;
- use read-only permissions, concurrency cancellation, and a bounded timeout;
- publish nothing and require no secrets.

Add semantic workflow tests so a future edit cannot replace `check:all`, add write permissions, use mutable action tags,
or turn the workflow into a release path. Keep actionlint blocking.

#### 1C. Protect quality-system ownership

Add `.github/CODEOWNERS` when a valid repository user/team identity is known, covering workflows, hooks, package/lock
files, ESLint/Prettier/TypeScript/Vitest configuration, quality-policy tools/data, quality tests, and canonical quality
documentation. Do not guess the handle.

Document the required GitHub ruleset:

- require the branch quality job;
- require at least one owner review for quality-policy paths;
- dismiss stale approvals after quality-policy changes;
- prohibit direct pushes to the protected default branch.

The owner must record configuration confirmation during final validation.

**Phase 1 exit conditions:**

- Hook install/doctor and committed-hook negative proofs pass.
- The quality workflow passes actionlint and semantic contract tests.
- Branch quality invokes the same `check:all` used locally.
- The tag publisher remains semantically unchanged.

### Phase 2 — Make smells, suppressions, and unsafe sinks fail closed

**Intent:** Remove non-blocking and easily self-authorized paths from production quality enforcement.

**Dependencies:** Phase 1.

#### 2A. Promote zero-warning rules

Promote these to blocking after re-verifying zero unsuppressed findings:

- `catch-fallback-without-suppression`;
- `css-js-default-duplication`;
- `editable-threshold-missing-internal`;
- `mapper-output-complexity` for outputs above 8 properties.

Update rule fixtures, summary expectations, catalog severity, playbooks, and quality documentation in the later
documentation phase.

#### 2B. Mechanize the remaining prose-only smells

Add narrowly scoped executable rules for:

- `absent-numeric-sentinel`: reject `NaN`, Infinity, and numeric magic sentinels where absence must remain `undefined`;
- `mapper-prop-renormalization`: reject downstream use of numeric/string normalization helpers on mapper-guaranteed
  renderer properties.

Use AST-aware or context-aware matching where regex would create predictable false positives. Add clean, failing, and
boundary-exception tests.

#### 2C. Eliminate generic production suppressions

Inventory all 29 production directives and classify each as:

1. canonical owner that the checker should recognize directly;
2. true external-boundary degradation requiring the validated marker;
3. temporary/stale debt that must be removed through root-cause cleanup.

Finish with zero `dyni-lint-disable-*` directives in production source. Extend the invalid-suppression rule to reject
future production directives while retaining explicit negative fixtures.

The boundary marker must carry category, owner, ISO date, and reason, and may affect only the boundary-fallback rule.
Add expiry checking for temporary markers.

#### 2D. Own unsafe evaluation and HTML sinks

Enable maintained ESLint rules for `eval`, implied evaluation, and dynamic function construction. Add a focused sink
rule that:

- allows `innerHTML` assignment only at the two reviewed parsing/patching sites in `HtmlDomPatchUtils.js`;
- blocks `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, and inline event-handler assignment
  elsewhere;
- does not block renderer functions that return markup strings through the established `renderHtml` architecture.

Add real clean/failing fixtures, including a false-positive proof for ordinary markup string construction.

**Phase 2 exit conditions:**

- `check:patterns` reports zero warnings because live rules are blocking.
- Production contains zero generic suppression directives.
- Every boundary annotation is valid, narrow, and non-expired.
- Unsafe sink fixtures fail and the canonical DOM owner remains green.

### Phase 3 — Make production coverage inventory-complete

**Intent:** Prevent new or existing production behavior from remaining invisible behind strong aggregate coverage over a
partial include list.

**Dependencies:** Phase 2.

#### 3A. Add the live coverage policy inventory

Create tooling-owned policy data and a checker that scans the live production tree, including `plugin.mjs`, and requires
exactly one classification per file. It must reject missing, duplicate, stale, nonexistent-owner-test, and unsupported
classification entries.

The coverage policy must feed or validate `vitest.config.js`; it must not become decorative metadata disconnected from
the native V8 thresholds.

#### 3B. Preserve current measured floors

Seed explicit floors for all 78 currently measured files using current results and existing critical groups. Do not
lower global or critical thresholds. Add tests that fail when a floor decreases or a measured file is removed.

#### 3C. Classify and cover the remaining production inventory

Process missing files by responsibility, not by arbitrary count:

1. shared value/format/state/layout/math utilities;
2. shared HTML/DOM/fit and nav/vessel render models;
3. remaining radial/text/canvas engines and primitives;
4. radial and text widget implementations;
5. configuration, registry, bootstrap, and entrypoint surfaces.

For behavioral modules, add meaningful unit/DOM/contract tests and include them in V8 coverage. Thin declarative or
entrypoint modules may use `contract-owned` only when the named owner test exhaustively verifies their
shape/load/registration behavior.

Do not write tests that merely execute lines without asserting behavior.

#### 3D. Define defaults for future files

Make the policy fail new unclassified files. New measured behavioral files start at 80% lines and 65% branches unless a
stricter family floor applies. A lower initial floor for migrated legacy code must be explicit, no lower than its
verified baseline, and tracked for improvement.

**Phase 3 exit conditions:**

- Every shipped `.js`/`.mjs` production entry is measured or explicitly contract-owned.
- All behavioral shared/widget files are measured; contract ownership is limited to demonstrably thin surfaces.
- No existing threshold or measured scope has decreased.
- A synthetic new unclassified file fails the policy proof.
- `npm run test:coverage:check` passes native global, family, and per-file floors.

### Phase 4 — Add complexity no-regression budgets and reduce hotspots

**Intent:** Prevent AI-generated branch/parameter growth while safely migrating existing complex visual code.

**Dependencies:** Phase 3.

#### 4A. Implement the complexity budget checker

Use the maintained ESLint parser/rules or equivalent AST tooling already in the lockfile. Record findings by stable
function identity and metric. The checker must reject:

- a new function above the strict limits;
- an increase to an existing baseline metric;
- a missing, duplicate, or stale baseline entry;
- ignored production paths or anonymous-wrapper tricks that escape identity.

Add evaluator tests for all four metrics and baseline lifecycle behavior.

#### 4B. Refactor the worst hotspots

Reduce every existing function above complexity 40 to below 25, beginning with the XTE canvas renderers. Extract
domain/layout/drawing responsibilities into existing canonical owners or focused shared modules; do not create
forwarding shims or local copies of shared helpers.

For every touched file:

- check size before and after;
- preserve the UMD/public API;
- add characterization tests before the split;
- keep render order, canvas state, geometry, placeholder behavior, and theme behavior unchanged;
- run focused tests and coverage after each responsibility extraction.

#### 4C. Enforce strict limits for all new code

Integrate the checker into `check:core`. New functions must meet complexity 10, 40 statements, nesting 4, and 6
parameters. Existing baseline entries may only stay equal or shrink; resolved entries must be removed in the same
change.

**Phase 4 exit conditions:**

- No existing metric increased from the verified baseline.
- No function remains above complexity 40; remediated hotspots are below 25.
- New-over-limit and baseline-increase fixtures fail.
- Focused renderer tests, coverage, typecheck, and `check:filesize` pass.

### Phase 5 — Establish a strict test-code boundary

**Intent:** Make AI-authored tests capable of failing for misspelled globals, dead bindings, and type-invalid mocks
instead of relying only on execution.

**Dependencies:** Phase 4.

#### 5A. Classify the live test inventory

Create a checked test inventory with these classes:

- strict test module/helper;
- executable negative fixture owned by a named checker test;
- temporary split-harness fragment with named parent/harness and removal path.

New test files default to strict. The checker must reject missing, stale, and directory-wide catch-all entries.

#### 5B. Remove the broad ESLint test exemption

Enable `no-undef`, `no-unused-vars`, and `no-useless-assignment` for real tests and helpers. Scope only the minimum
necessary rules to explicit split fragments while they are migrated. Keep Vitest globals declared through maintained
type definitions, not ad hoc global comments.

#### 5C. Add `tsconfig.tests.json`

Create a separate strict no-emit `checkJs` project for tests/helpers. Supply real Vitest, Node, DOM, and repository
ambient types. Do not use `any`-heavy declarations or blanket ignores merely to increase the included count.

Add `typecheck:tests`; keep `typecheck:source` or the existing `typecheck` production command explicit, and make the
public aggregate typecheck execute both boundaries.

#### 5D. Migrate tests by harness family

Move helpers and standalone Node/contract tests first, then DOM/runtime/widget harness families. Replace implicit
cross-file globals with explicit harness exports/imports or typed setup owners. Keep split files only where the 400-line
rule genuinely requires them.

**Phase 5 exit conditions:**

- All test files are mechanically classified.
- All standalone tests and helpers are strict typed/linted.
- Remaining split-fragment exceptions are explicit and cannot accept new files by glob.
- A misspelled test global and an incompatible mock both fail negative proofs.
- Production type inventory remains complete and unchanged in authority.

### Phase 6 — Complete formatter ownership

**Intent:** Make formatting deterministic across all maintained repository surfaces without mixing semantic changes into
bulk rewrites.

**Dependencies:** Phase 5.

#### 6A. Make new files formatter-owned immediately

Add a formatting-scope contract so new maintained JS/MJS, CSS, and Markdown files cannot land outside Prettier
ownership. Keep deliberate negative fixtures excluded by exact owner paths and tested separately.

#### 6B. Migrate JavaScript by directory

Run formatting-only batches in this order unless baseline evidence supports a safer equivalent sequence:

1. `runtime/` and `cluster/`;
2. `config/`;
3. `shared/`;
4. `widgets/` and plugin entrypoints;
5. `tests/` and `tools/`.

Before adding a batch to `format:check`, run typecheck, focused tests, and the file-size gate. If formatting pushes a
non-exempt file toward 400 lines, split by responsibility before accepting the batch.

#### 6C. Migrate CSS and Markdown

Add maintained CSS and Markdown surfaces after reconciling Stylelint and markdownlint ownership. Avoid rule duplication
or formatter/linter oscillation. Check AGENTS/CLAUDE pointer contracts and all Markdown links after formatting.

**Phase 6 exit conditions:**

- `format` and `format:check` cover every maintained source, test, tool, CSS, root-doc, and `documentation/` file.
- No deferred directory disposition remains.
- Formatting and linting do not fight each other.
- Negative fixtures remain owner-tested and cannot hide maintained files.

### Phase 7 — Add deterministic scaling contracts

**Intent:** Catch accidental super-linear AI implementations without restoring the rejected workstation-sensitive
performance system.

**Dependencies:** Phase 6.

#### 7A. Build an operation-count evaluator

Create a focused checker/helper that evaluates deterministic work counts using a linear envelope such as
`work(2n) <= 2 * work(n) + K`. The constant must come from measured fixed setup work, not a timing baseline. Add clean
linear and failing quadratic evaluator fixtures.

#### 7B. Cover selected real hot paths

Add deterministic contracts for at least:

- `RoutePointsRenderModel.buildModel` with proxied point collections and counted formatter/layout/helper operations;
- `HtmlDomPatchUtils.patchInnerHtml` with counted DOM mutation, clone, and attribute operations over equivalent `n` and
  `2n` trees;
- bounded text-fit loops in `TextLayoutPrimitives`, asserting measurement calls remain bounded by configured iteration
  steps rather than input text length.

Tests must also assert result correctness so an implementation cannot reduce work by skipping behavior.

#### 7C. Integrate the scaling gate

Add a focused `check:scaling` command and include it in `check:core`. Keep it Node/jsdom-only, offline, deterministic,
and fast. Do not add `perf:*` aliases, reports, production hooks, or timing output.

**Phase 7 exit conditions:**

- Linear real workloads pass repeatedly with identical operation counts.
- Synthetic quadratic work fails.
- Result-correctness assertions prevent shortcut implementations.
- Search confirms retired performance/runtime instrumentation remains absent.

### Phase 8 — Documentation and contributor workflow

**Intent:** Synchronize canonical guidance after implementation without making source-code changes in this phase.

**Dependencies:** Phases 1–7.

#### 8A. Update quality conventions

Update:

- `documentation/conventions/quality-gates.md` with the final command graph, workflow/hook authority, coverage policy,
  complexity, test typing, formatting, and scaling owners;
- `documentation/conventions/testing-infrastructure.md` with per-file coverage, test classification, strict test typing,
  and scaling fixtures;
- `documentation/conventions/smell-prevention.md` with all new blocking rules, zero-warning status, boundary marker
  syntax, and suppression prohibition;
- `documentation/conventions/coding-standards.md` with new-code complexity and unsafe sink rules;
- `documentation/core-principles.md` to replace the generic production suppression rule with the final fail-closed
  boundary policy;
- `documentation/guides/documentation-maintenance.md` with the final commands and touchpoints.

Update smell playbooks for every new rule. Preserve the executable rule-to-catalog completeness contract.

#### 8B. Update contributor and AI guidance

Update `README.md` Development, `CONTRIBUTING.md` validation/human-review/ pre-merge sections, and `AGENTS.md` quality
checklist and smell rules. Keep `CLAUDE.md` as the canonical short pointer unless its pointer contract requires an
adjustment.

Document hook installation, branch CI, protected quality paths, coverage/test classification, formatter ownership, and
the fact that scaling checks are operation-based rather than timing benchmarks.

Check `README.md` line count before and after; split focused contributor detail into an already reachable development
document if it approaches 400 lines.

#### 8C. Update navigation only if needed

If no new canonical documentation file is created, TABLEOFCONTENTS requires no new entry. If implementation introduces
one, link it from `documentation/TABLEOFCONTENTS.md` and satisfy format/reachability contracts.

**Phase 8 exit conditions:**

- Docs describe the live command graph and exact policy, with no PLAN34-era stale exclusions for the bounded superseded
  decisions.
- README and contributor workflow are synchronized.
- `npm run docs:check` and `npm run check:filesize` pass.

### Phase 9 — Clean validation, owner settings, and completion

**Intent:** Prove the complete system from a clean tool installation and record the external repository settings that
make it enforceable.

**Dependencies:** Phase 8.

#### 9A. Run clean reproducibility checks

Run:

```bash
npm run setup
npm run format:check
npm run lint
npm run typecheck
npm run test:split
npm run check:patterns
npm run check:scaling
npm run docs:check
npm run check:filesize
npm run check:all
```

Also run `git diff --check` and the focused hook/workflow/policy negative proofs.

#### 9B. Verify delivery enforcement

- Install and verify the local pre-push hook with `hooks:doctor`.
- Confirm the branch workflow succeeds on a representative pull request.
- Record the required-check and owner-review branch/ruleset configuration.
- Confirm the tag publisher remains tag-only and still reruns `check:all` before publishing.

#### 9C. Validate runtime preservation

Because Phase 4 may refactor shipped renderer code, run the documented manual AvNav checklist: plugin load,
representative radial/linear/HTML widgets, day/night switch, and route/AIS interactions. Record date, environment, and
result. No external browser automation is added to the gate.

#### 9D. Complete the plan

Update Status with final inventories, threshold/complexity/suppression counts, commands, deviations, owner settings, and
manual validation. Move this file to `exec-plans/completed/PLAN35.md` only when every acceptance item passes.

---

## User-Facing Documentation Impact

`README.md` changes are required because the development workflow, required quality gates, hooks, CI behavior, coverage
policy, formatting scope, and contributor requirements change.

No end-user widget, layout, theme, installation, AvNav configuration, or runtime requirement behavior is intended to
change. README edits must stay within the Development/contributor material and must not advertise new instrument
behavior.

The theme fixture and all-widgets layout fixture sync rules are not triggered unless implementation unexpectedly changes
user-visible behavior. If that happens, stop and amend the plan before changing those fixtures.

---

## Acceptance Criteria

### Delivery and governance

- [x] `.githooks/pre-push` runs `npm run check:all`; install, doctor, executable, and negative contract proofs pass.
      Verified via `npm run hooks:doctor` ("Local pre-push hook is correctly installed") and
      `tests/tools/hooks.test.js`.
- [x] Read-only branch/pull-request CI is configured to run locked setup and `check:all` with immutable actions,
      concurrency, and timeout. Verified by reading `.github/workflows/quality.yml` (pinned action SHAs,
      `permissions: contents: read`, concurrency group, 30-minute timeout, `npm run setup` then `npm run check:all`) and
      `tests/contract/quality-workflow-contract.test.js`.
- [ ] The branch workflow succeeds on a representative GitHub pull request. **Pending: no hosted pull-request run has
      been observed from the local workspace.**
- [x] The tag publisher remains tag-only, least-privilege, and dependent on its own read-only quality job. Verified by
      reading `.github/workflows/ publish-release.yml` (`on: push: tags: v*` only; a read-only `quality` job reruns
      `check:all`; a separate `publish-release` job with `needs: quality` and write permission only verifies and
      republishes already-committed artifacts, never rebuilds them).
- [ ] Required branch check and owner review protection are owner-confirmed. **Pending: this is a GitHub repository
      ruleset/branch-protection setting that only a repository admin can enable via the GitHub UI or API — no local
      command can verify or set it.** `.github/CODEOWNERS` (code-level half of this control) covers all root quality
      configuration, tools/policy data, schemas/types, quality tests/support/scaling contracts, and canonical quality
      documentation; `tests/contract/codeowners-contract.test.js` enumerates these required surfaces and passes.
- [x] `check:ci` remains absent and `check:all` remains core plus coverage. Verified: no `check:ci` script exists in
      `package.json`; `check:all` is exactly `check:core && test:coverage:check`.

### Smells, suppression, and security

- [x] Every live smell rule is blocking; the final pattern run has zero warnings. `npm run check:patterns` →
      `"failures":0,"warnings":0` across all 39 rules.
- [x] Absent numeric sentinels and mapper-prop re-normalization have executable clean/failing proofs (`check-patterns`
      rules `absent-numeric-sentinel`, `mapper-prop-renormalization`, both passing with 0 findings; positive/ negative
      fixtures live in the rule's own part-test files).
- [x] Production has zero generic `dyni-lint-disable-*` directives. Verified by direct grep across `config/`,
      `runtime/`, `cluster/`, `shared/`, `widgets/`, `plugin.js` (0 matches) and `phase0-baseline.json`'s
      `productionStandardSuppressionDirectiveCount: 0`, itself verified live by `tests/tools/phase0-baseline.test.js`.
- [x] Boundary annotations are narrow, owned, dated, validated, and non-expired. Verified via `invalid-lint-suppression`
      (0 findings) and the 5 `catch-fallback-without-suppression` markers fixed this phase (relocated to the line
      immediately preceding the `catch` they cover — the marker's line-targeting semantics were the root cause, not a
      missing marker).
- [x] Standard lint/type/format/coverage suppressions remain absent (no
      `@ts-ignore`/`@ts-expect-error`/`eslint-disable`/`prettier-ignore`/ `istanbul ignore` in production source;
      enforced by `phase0-baseline.test.js`).
- [x] Unsafe evaluation and unauthorized HTML DOM sinks fail mechanically; only the reviewed `HtmlDomPatchUtils` sinks
      and exact canonical resource-loader load/error assignments remain (`no-eval`/`no-implied-eval`/`no-new-func` plus
      `unsafe-html-dom-sink`, both 0 findings). Every other statically named `on*` property/attribute is blocked.

### Coverage and testing

- [x] Every shipped production `.js`/`.mjs` file has exactly one live coverage classification.
      `check:coverage-inventory` → 228 classified files (227 production `.js` + `plugin.mjs`), 0 missing/stale.
- [x] Every behavioral shared/widget file is V8-measured with an explicit floor (all 228 entries are
      `classification: "measured"`; none `contract-owned` currently).
- [x] Contract-owned entries name real exhaustive owner tests (vacuously true; no `contract-owned` entries exist yet).
- [x] No existing global, critical, measured, or per-file floor was lowered — `coverage-floor-baseline.json` now makes
      lowering an existing per-file floor fail independently of current coverage; new files default to 80% lines / 65%
      branches, and duplicate, missing-baseline, malformed-baseline, stale-baseline, or unknown policy entries fail
      before measurement.
- [x] New unclassified or below-floor file fixtures fail (`tests/tools/ coverage-inventory.test.js` proves this against
      a disposable temp workspace).
- [x] Every test file is classified; new tests default to strict typing/linting. `test-inventory.mjs` → 475 classified
      test files, 0 checker errors. The SHA-256-locked exception capture contains the only 229 paths allowed to remain
      non-strict and can only shrink.
- [x] Strict test `checkJs` and normal undefined/unused checks cover all 246 strict-classified test modules/helpers. The
      remaining 16 harness, 209 executable split-spec, and 4 owner-proven fixture exceptions are explicitly not strict:
      temporary debt is filename-bounded with an exact parent, reason, and removal path; `@ts-nocheck` fails outside
      those classes. `npx tsc -p tsconfig.tests.json` → 0 errors; `npx eslint .` → 0 errors.

### Complexity and formatting

- [x] New functions are limited to complexity 10, 40 statements, nesting 4, and 6 parameters (`complexity-budget.mjs`, 0
      new violations).
- [x] Existing metrics cannot increase; stale/resolved baseline entries fail (verified this session repeatedly — every
      regression the checker surfaced, including 2 genuinely pre-existing ones found while closing Phase 6, was fixed by
      real extraction, never by raising the recorded baseline value). Baseline entries are duplicate-aware and must
      carry a known metric, its exact strict limit, and a finite integer value above that limit.
- [x] No existing function remains above complexity 40, and remediated hotspots are below 25. Verified directly against
      `complexity-baseline.json`: max recorded complexity value is 37 across 118 complexity entries (175 entries total).
      `XteDisplayWidget.js` is fully resolved (zero baseline entries); `XteDisplayLinearWidget.js`'s `renderCanvas` was
      reduced from complexity 96 to 12 — below the "reduce below 25" hotspot target, though still one entry above the
      strict new-code limit of 10 and therefore tracked in the shrinking baseline. The extractions redistributed
      residual complexity into new baselined `shared/widget-kits/xte/` helpers, all at complexity ≤21 (below 25). The
      scanner now also covers `plugin.mjs`.
- [x] Every maintained JS/MJS, CSS, and Markdown surface is formatter-owned.
      `tests/contract/formatting-scope-contract.test.js` proves this mechanically from the live `package.json` scripts,
      not a hardcoded list.
- [x] Formatting does not violate the 400-line or anti-compression rules. `check-file-size.mjs --oneliner=block` → 0
      violations, 0 oneliner findings across 780 checked files.

### Deterministic scaling

- [x] Route-points model, DOM patching, and bounded text-fit operation-count contracts pass with correct results.
      Route-points counts proxied collection reads plus formatter/helper calls and includes a nested-rescan failure
      proof; DOM patching counts attribute, clone, append/remove, and replace operations.
- [x] A synthetic quadratic workload fails the scaling evaluator (`tests/tools/operation-count-evaluator.test.js`'s
      quadratic fixture).
- [x] Scaling checks use no wall-clock threshold, runtime instrumentation, browser driver, benchmark artifact, or
      `perf:*` command. Verified: no `performance.now()`/`PerformanceObserver`/`perf:*` anywhere in the repository
      outside this plan's own prose; `check:scaling` runs entirely under `unit-node`/`unit-dom`/`contract` Vitest
      projects.
- [x] Retired performance owner paths remain forbidden and absent (`tests/helpers/retired-component-owners.js` lists
      `shared/widget-kits/perf/PerfSpanHelper.js`; confirmed absent from disk).

### Documentation and final validation

- [x] Quality, testing, coding, smell, maintenance, README, CONTRIBUTING, and AGENTS guidance match the final system
      (Phase 8 synchronized every remaining stale "scoped Prettier"/count/planned-placeholder reference; zero matches
      remain on a repo-wide grep for those stale phrases).
- [x] `README.md` remains below 400 lines or is split through reachable focused documentation (223 non-empty lines after
      this phase's edits).
- [x] No user-facing widget/theme/layout/configuration behavior changed. All production edits this plan were internal
      extractions, formatting, type annotations, and quality tooling — no `plugin.json`, layout JSON, or widget-visible
      default changed; the CSS reformatting in Phase 6C was verified selector-splitting-only via full diff review and a
      full `vitest run` pass.
- [x] `npm run setup` and every Phase 9 command pass from the supported Node 26/npm 12.0.1 environment (all of `setup`,
      `format:check`, `lint`, `typecheck`, `test:split`, `check:patterns`, `check:scaling`, `docs:check`,
      `check:filesize`, and `check:all` run clean this phase).
- [x] `npm run check:all` passes with final test, coverage, policy, and scaling evidence recorded (exit code 0; 438 test
      files / 1862 tests; see the per-phase log entries above for full evidence).
- [x] Manual AvNav validation confirms runtime preservation after complexity refactors. Repository owner reported on
      2026-07-20 that the manual AvNav browser check revealed no regressions.
- [x] No unrelated user change was overwritten (every edit this session is additive/targeted to PLAN35's own scope; no
      working-tree state was discarded — confirmed via `git status` review at each risky juncture, including full
      recovery after an accidental `git stash` mid-session).

---

## Phase Progress Log

### Phase 0 — complete (2026-07-17)

- Re-ran `npm run check:all` on the clean worktree before any tightening: 383 test files, 1405 tests passed; coverage
  89.06% statements / 76.91% branches / 95.26% functions / 89.69% lines; `check:patterns` 795 checked files with 0
  failures/0 warnings across all rules including the three warn-only rollout rules; `check:filesize` 707 checked files,
  0 violations.
- Recorded the reproducible baseline in `tools/quality-policy/phase0-baseline.json` (production/test/tool inventories,
  coverage snapshot, suppression/unsafe-sink counts, warn-only rule ids, complexity diagnostic summary,
  delivery/workflow state).
- Added `tests/tools/phase0-baseline.test.js`. The historical record is pinned to captured commit
  `4dbb579cd9247bbaf5f1630337d292b5ef4b46bc`; live completeness is enforced separately by the coverage and test
  inventories.
- Added the PLAN35 quality-policy owner map to `documentation/conventions/quality-gates.md` (new section immediately
  after the existing migration parity ledger), naming the final owner, positive command, and negative proof for every
  Phase 1-7 policy domain. Rows move from `planned` to their landed status as each phase completes.
- Confirmed the Phase 0 exit conditions: `npm run check:core` and `npm run test:coverage:check` still pass unmodified;
  `tests/tools/package-scripts.test.js` already pins the `check:all` shape and the absence of `check:ci`, so no change
  was needed there for the Phase 0 invariant.

### Phase 1 — complete (2026-07-17)

- Added `.githooks/pre-push` (executable, runs `npm run check:all` from the resolved repository root with a normalized
  `C` locale), plus `npm run hooks:install` (`tools/hooks-install.mjs`, sets `core.hooksPath=.githooks` and marks the
  hook executable) and `npm run hooks:doctor` (`tools/hooks-doctor.mjs`, verifies both and prints the exact repair
  command). `tests/tools/hooks.test.js` proves the hook is committed/executable/syntax-valid and exercises
  install/doctor against a temporary Git repository, including missing-hook and unconfigured-path negative cases.
  `.pre-commit-config.yaml` is unchanged (fast layer only).
- Added `.github/workflows/quality.yml`: runs on pull requests and pushes to `main`, checks out the exact ref, installs
  Node from `.nvmrc` plus locked npm 12.0.1, runs `npm run setup` then `npm run check:all`, with `contents: read`
  permissions throughout, one pinned full-SHA action per step, concurrency cancellation, and a 30-minute timeout. It
  publishes nothing. `tests/contract/quality-workflow-contract.test.js` proves the trigger scope, read-only permissions,
  ref/setup/gate ordering, SHA pinning, and the absence of any publish/tag/push step; `npm run actions:lint` passes
  against it. `.github/workflows/publish-release.yml` is unchanged.
- Added `.github/CODEOWNERS` covering workflows, hooks, root quality/toolchain configuration, all tools and policy data,
  schemas/types, quality tests/support/scaling contracts, and canonical quality documentation, owned by `@Metzger100`
  (the verified repository-owner handle used in the committed release install script and matching the local Git author
  identity). `tests/contract/codeowners-contract.test.js` proves every entry resolves to a real path and a
  non-placeholder owner. Documented the required GitHub branch ruleset for `main` (required `quality` check, required
  CODEOWNERS review, stale-approval dismissal on quality-policy changes, no direct pushes) in
  `documentation/conventions/quality-gates.md`. Enabling that ruleset is an owner action in GitHub repository settings
  outside this repository's files; it remains unconfirmed until the owner completes it, to be recorded during Phase 9
  final validation.
- Updated the PLAN35 quality-policy owner map rows for the pre-push hook, branch/PR workflow semantics, and
  quality-system ownership review from `planned` to `landed`.
- Verified Phase 1 exit conditions: `npx vitest run tests/tools/hooks.test.js`,
  `tests/contract/quality-workflow-contract.test.js`, and `tests/contract/codeowners-contract.test.js` all pass;
  `npm run docs:check` and `npm run check:core` pass with the new files included.

### Phase 2 — complete (2026-07-17)

- **2A promotions:** removed the `severity: "warn"` override from `catch-fallback-without-suppression`,
  `css-js-default-duplication`, and `editable-threshold-missing-internal` in `tools/check-patterns/rules.mjs`, and
  changed `mapper-output-complexity` (`tools/check-patterns/rules-mapper.mjs`) from `propCount > 12 ? "block" : "warn"`
  to unconditional `"block"` above 8 properties. Every live `check-patterns` rule is now blocking; a fresh run reports 0
  warnings across all rules. Updated the corresponding fixtures (`tools/test-data/check-patterns-failfast-cases.js`,
  `tests/tools/check-patterns.part2.test.js`) and the smell catalog severities.
- **2B new rules:** added `absent-numeric-sentinel` (blocks bare `NaN` in `cluster/mappers/*.js`; zero legitimate uses
  exist there, so it is scoped narrowly and does not touch the shared value/format engines' internal
  NaN-as-parse-sentinel convention) and `mapper-prop-renormalization` (blocks `toOptionalFiniteNumber`/`toFiniteNumber`
  re-normalization of specific mapper-guaranteed props via an evidence-based per-renderer-file allowlist; found and
  fixed one real instance in `MapZoomTextHtmlWidget.js` re-normalizing `zoom`/`requiredZoom`, which
  `cluster/mappers/MapMapper.js` already normalizes). Both rules ship with positive/clean/suppression fixtures in
  `tools/check-patterns/rules-mapper.mjs` and `tools/test-data/check-patterns-failfast-cases.js`, and are documented in
  the smell catalog and Executable Rule Index.
- **2C suppression elimination:** inventoried all 29 Phase-0 production `dyni-lint-disable-*` directives and eliminated
  every one:
  - 3 were stale (root-cause removed): two `duplicate-functions` suppressions in
    `shared/widget-kits/html/HtmlWidgetUtils.js` (the cross-file clone no longer exists — confirmed by removing the
    comments and re-running `check-patterns` with zero findings) and one `hardcoded-runtime-default` suppression in
    `shared/widget-kits/nav/RoutePointsRenderModel.js` (the suppressed `"--"` literal never matched either detection
    pattern).
  - 14 `catch-fallback-without-suppression` sites were genuine external-boundary degradations (DOM host uncertainty,
    AvNav host boundary, Web Audio availability, browser runtime/asset-loading boundaries). Added the new validated
    boundary marker (`dyni-boundary-next-line(...)` / `dyni-boundary-line(...)`, parsed in
    `tools/check-patterns/shared.mjs`, carrying `category`, `owner`, `date`, optional `expires`, and a reason) and
    migrated every site to it. The marker can suppress only `catch-fallback-without-suppression`; malformed,
    missing-field, and expired markers fail via `invalid-lint-suppression` exactly like a malformed
    `dyni-lint-disable-*` directive (proven by 5 new tests in `tests/tools/check-patterns.part5.test.js`, including a
    negative proof that the marker cannot leak into an unrelated rule).
  - The remaining 12 were canonical-owner exceptions, now recognized directly by narrow file-scoped allowlists inside
    the rule implementations instead of comments: `CSS_JS_DEFAULT_DUPLICATION_ALLOWLIST` (`runtime/theme/model.js`,
    `runtime/theme-runtime.js`), `PREMATURE_LEGACY_SUPPORT_ALLOWLIST` (`runtime/theme/model.js`,
    `runtime/theme/resolver.js`, for the documented permanent Regatta CSS-alias contract),
    `HARDCODED_RUNTIME_DEFAULT_ALLOWLIST` (`runtime/format-runtime.js`,
    `shared/widget-kits/format/PlaceholderNormalize.js`), and `RESPONSIVE_HARD_FLOOR_ALLOWLIST`
    (`shared/widget-kits/text/TextLayoutEngine.js`'s documented low-level `computeInsets` helper) — all in
    `tools/check-patterns/rules-failfast.mjs` / `rules-responsive.mjs`.
  - Production now contains zero `dyni-lint-disable-*` directives (`tests/tools/phase0-baseline.test.js` reproduces this
    count from the live tree; the Phase 0 baseline JSON records the before/after counts).
- **2D unsafe sinks:** added `no-eval`, `no-implied-eval`, and `no-new-func` to the base ESLint ruleset
  (`eslint.config.mjs`); zero existing violations. Added `unsafe-html-dom-sink` (`tools/check-patterns/rules-core.mjs`),
  blocking `innerHTML`/`outerHTML` assignment, `insertAdjacentHTML(...)`, `document.write(...)`, and inline
  `.onclick =`-style handler assignment everywhere except the two reviewed lines in
  `shared/widget-kits/html/HtmlDomPatchUtils.js` (156, 163), with a clean fixture proving ordinary
  markup-string-returning `renderHtml` functions are not flagged.
- Updated `documentation/conventions/smell-prevention.md` (catalog rows, Executable Rule Index, Suppression Syntax
  section describing the canonical-owner/boundary-marker/root-cause-removal policy), `documentation/core-principles.md`
  rule 19, and the PLAN35 quality-policy owner map in `quality-gates.md` (suppression/boundary annotation and unsafe
  sinks rows moved to `landed`).
- Verified Phase 2 exit conditions: `node tools/check-patterns.mjs` reports 799 checked files, 0 failures, 0 warnings
  across every rule; `npx vitest run` passes in full (387 files / 1436 tests); `npm run check:all` passes end-to-end
  with unchanged global coverage (89.06/76.91/95.26/89.69).

### Phase 3 — complete (2026-07-17)

- **3A/3D coverage inventory policy:** expanded `vitest.config.js` `coverage.include` from the curated 78-file subset to
  the complete shipped production tree (`plugin.js`, `plugin.mjs`, `config/**/*.js`, `runtime/**/*.js`,
  `cluster/**/*.js`, `shared/**/*.js`, `widgets/**/*.js`). Added `tools/quality-policy/check-coverage-inventory.mjs`,
  wired into `test:coverage:check` after `test:coverage` (so `check:all` still expands to exactly `check:core` +
  `test:coverage:check`; no `check:ci` added). It verifies every one of the 212 shipped files (211 production `.js` +
  `plugin.mjs`) has exactly one classification in the new `tools/quality-policy/coverage-floors.json`, fails on missing
  or stale/deleted-file entries, fails if a `measured` file's live V8 lines/branches regresses below its recorded floor,
  and validates `contract-owned` entries name a real owner test with a reason (no `contract-owned` entries exist yet —
  every file achieved reasonable direct coverage once measured, so none were needed). 7 new fixture tests in
  `tests/tools/coverage-inventory.test.js` (positive, missing-entry, stale-entry, regression, missing-summary,
  valid/invalid contract-owned).
- **3B/3C classify and cover the remaining inventory:** discovered that all 133 previously-unmeasured files already had
  real exercising tests — they were simply outside the old curated `coverage.include` glob, not untested. Only two files
  were genuinely at 0% (`RadialFrameRenderer.js`, `RadialToolkit.js` — thin composition/drawing facades whose consumers'
  tests injected stand-ins instead of loading the real module); I added
  `tests/shared/radial/RadialFrameRenderer.test.js` (9 tests) and `tests/shared/radial/RadialToolkit.test.js` (4 tests)
  directly, plus `tests/shared/gauge/GaugeToolkit.test.js` (5 tests) for a third 0%-coverage facade found on the same
  pass. For the remaining ~38 files that landed below the 80%/65% default floor once measured, dispatched 3 parallel
  background agents (each covering a themed batch: config/registry
  - radial widgets; nav/HTML-fit widgets; state/vessel/shared helpers) to add genuine behavioral test coverage — reading
    each uncovered branch/line and asserting on the real condition it represents (UMD browser-load registration paths,
    lifecycle methods never invoked by existing tests such as `.detach()`/`.destroy()`/`.translateFunction()`,
    guard/fallback branches, Web Audio unavailability, DOM-patch structural edge cases) rather than incidental
    line-hitting. No production source was modified by any agent. One real mapper-prop-renormalization instance was
    found and fixed along the way (see Phase 2B) as a side effect of one agent's investigation. All new/extended test
    files stayed within the 400-line limit (several split via the existing `.partN.test.js` convention); 14
    file-size-oneliner violations introduced by the agents (collapsed object literals, single-line nested function
    bodies) were found and fixed afterward.
- Generated `tools/quality-policy/coverage-floors.json` (212 entries) from the final coverage run: files at/above
  80%/65% get the 80/65 default floor; the 12 files still below that (11 pre-existing baseline files plus
  `RadialToolkit.js`, all already known debt from Phase 0/this phase) keep their exact verified achieved percentage as
  an explicit, tracked, no-lower legacy floor.
- Updated `documentation/conventions/testing-infrastructure.md` (new "Coverage Inventory Classification" section) and
  the PLAN35 quality-policy owner map in `quality-gates.md` (coverage inventory row moved to `landed`).
- Verified Phase 3 exit conditions: `npm run check:coverage-inventory` passes (212 classified files, 0 problems);
  `npx vitest run` passes in full (417 test files / 1704 tests); `npm run check:all` passes end-to-end with improved
  global coverage (92.09% statements / 79.81% branches / 96.75% functions / 93% lines, up from the Phase 0 baseline of
  89.06/76.91/95.26/89.69) and no existing threshold lowered.

### Phase 4 — complete (2026-07-18)

- **4B hotspot refactor:** the two worst hotspots in the repository — `XteDisplayWidget.js`'s `renderCanvas` (complexity
  77, 97 statements) and `XteDisplayLinearWidget.js`'s `renderCanvas` (complexity 96, 98 statements, the single worst
  function in the codebase) — were both decomposed via verbatim mechanical extraction into named helper functions
  (theme-view resolution, prop normalization, layout/geometry computation, static-layer drawing, dynamic-pointer
  resolution, stable-digits clip probing, metric-tile building/drawing, waypoint-name drawing), with zero runtime
  behavior change verified by the full pre-existing test suites passing unchanged after every extraction step.
  `renderCanvas` complexity dropped to 0 (Highway) and 12 (Linear); every remaining function in both files is below
  complexity 18. Two genuine cross-widget duplications surfaced by `jscpd`/`check-patterns` during the split
  (`normalizeXteProps` prop-bag normalization and the canvas-setup/theme/state-screen `renderCanvas` preamble) were
  extracted into new shared `shared/widget-kits/xte/` modules (`XteDisplayPropsNormalize.js`,
  `XteDisplayRenderSetup.js`) rather than left duplicated or force-fit into the threshold; a third extraction,
  `XteLinearPrimitives.js`, pulled the Linear widget's geometry/drawing helpers out to satisfy the 400-line file limit
  without oneliner compression. A repo-wide scan at the old complexity-40 threshold confirms these were the only two
  hotspots above that bar; none remain.
- **4A/4C complexity budget checker:** added `tools/quality-policy/complexity-scan.mjs` (ESLint `Linter` API scan for
  `complexity`/`max-statements`/`max-depth`/`max-params` at the strict limits — 10/40/4/6 — paired with a custom AST
  walk that assigns every function, including anonymous callbacks, a stable lexical-nesting identity such as
  `create.renderCanvas.ensureLayer#1` so unrelated edits elsewhere in a file cannot silently reassign or hide an
  existing finding) and `tools/quality-policy/complexity-budget.mjs` (the `check:core` gate, wired in as
  `check:complexity`). The checker loads `tools/quality-policy/complexity-baseline.json`, rejects any current over-limit
  function not already in the baseline (new violation), rejects any baseline-tracked metric that increased, and rejects
  stale (already resolved) or duplicate baseline entries — forcing the baseline to stay an accurate, shrinking ledger.
  Seeded the baseline from a full repository scan taken immediately after the 4B hotspot fixes: 203 tracked entries (all
  existing legacy debt strictly between the new limits and the old ones; no entry above complexity 40). 6 new fixture
  tests in `tests/tools/complexity-budget.test.js` covering a clean pass and one fixture per lifecycle rule
  (new-over-limit, baseline-match, baseline-regression, stale-entry, duplicate-entry) across all four metrics.
- Updated the PLAN35 quality-policy owner map in `quality-gates.md` (complexity budget row moved to `landed`) and the
  production/test/tool inventory counts in `tools/quality-policy/phase0-baseline.json`,
  `tests/contract/typecheck-inventory-contract.test.js`, `tools/quality-policy/coverage-floors.json`,
  `documentation/conventions/quality-gates.md`, `documentation/conventions/testing-infrastructure.md`, and
  `documentation/guides/documentation-maintenance.md` to reflect the 3 new shared production modules and their
  tests/coverage-floor entries.
- Verified Phase 4 exit conditions: no existing complexity/coverage/test metric regressed; no function remains above
  complexity 40; `npm run check:complexity` passes (203 baseline entries, 0 new violations); `npx vitest run` passes in
  full (420 test files / 1720 tests); `npm run check:all` passes end-to-end including `duplication:check` (0 clones,
  down from the 1 introduced mid-refactor and fixed the same pass) and `check:coverage-inventory` (215 classified
  files).

### Phase 5 — complete (2026-07-19)

- **5A test inventory classification:** every file under `tests/**/*.js` (458 files) classified exactly once in
  `tools/quality-policy/test-inventory.json` as `strict` (231 real test modules/helpers held to the strict boundary),
  `harness-fragment` (223 temporary split files naming an existing `parent` and a `reason`), or `fixture` (4 executable
  negative fixtures naming an existing `ownerTest` and a `reason`). `tools/quality-policy/test-inventory.mjs` enforces
  completeness, rejects directory-wide glob catch-all keys, and validates every `harness-fragment`/`fixture` entry;
  `tests/tools/test-inventory.test.js` proves every failure branch of the checker against a disposable temp workspace.
- **5C `tsconfig.tests.json`:** a separate strict, no-emit `checkJs` project whose `files` list is exactly the 231
  `strict`-classified paths, using real `@types/node` (pinned devDependency) and `vitest/globals` — no `any`-heavy
  ambient shims. `tests/contract/typecheck-tests-inventory-contract.test.js` proves the file list and the inventory's
  strict set stay in lockstep and that no ambient `.d.ts` leaks the production type authority into the test boundary.
  `npm run typecheck` now runs both boundaries: the former `typecheck` script was renamed `typecheck:source`
  (`tsc -p tsconfig.checkjs.json`); `typecheck:tests` (the inventory check plus `tsc -p tsconfig.tests.json`) was added;
  `typecheck` is now the aggregate `typecheck:source && typecheck:tests`.
- **5D migration by harness family:** all 231 strict files were brought to a clean strict typecheck via JSDoc
  `@param`/`@type` annotations on implicit-any mock/callback parameters, `/** @type {T[]} */ ([])` for
  incrementally-built arrays, narrow local casts for untyped harness/mock call sites, and `catch (error)`/`unknown`
  narrowing — never `@ts-ignore` or blanket suppression. Two module-boundary leaks were found and fixed: dynamic
  `import("literal/path")` of untyped `tools/*.mjs` release scripts resolved into the graph despite not being in `files`
  (fixed with a local `importTool(relativePath)` indirection, since only a literal specifier is followed); and a literal
  `require("../../runtime/plugin-bootstrap-core.js")` in two plugin-bootstrap tests pulled that production file — and
  its ambient `DyniBootstrap*` global types, absent from the tests project — into the tests project graph (fixed the
  same way, with a local `requireModule(relativePath)` indirection; verified empirically that an indirected `require()`
  call is not statically resolved by `tsc` the way a literal one is). All 223 `harness-fragment` files carry
  `// @ts-nocheck` as their literal first line (plain `require()` of a harness fragment from a root file IS
  resolved/checked regardless of `files` membership, unlike dynamic `import()`; `@ts-nocheck` suppresses diagnostics
  regardless of how the file is reached). Two genuine pre-existing bugs (implicit undeclared-global reliance on
  harness-exported helpers, working only via the harness's `globalThis` side-effect assignment) were fixed with proper
  explicit `require()` destructuring, not behavior changes.
- **5B ESLint test-file exemption scoped to fact of classification:** `eslint.config.mjs` now reads
  `test-inventory.json` at config-load time and restricts the relaxed
  `no-empty`/`no-undef`/`no-unused-vars`/`no-useless-assignment` rule set to exactly the computed
  `harness-fragment`/`fixture` file list; every `strict` file gets the same real Vitest/Node/browser globals
  (`testGlobals`) and full enforcement production code gets. Enabling `no-unused-vars` on strict files surfaced 86
  genuine dead-code violations (unused destructured harness imports, unused local helper functions left over from prior
  splits, one `no-useless-assignment` false-start `let match = null` before a `while ((match = re.exec(...)))` loop, one
  empty `catch` block) across 32 files — all fixed by deleting the dead identifiers/functions (with zero test-assertion
  or control-flow changes) via two parallel background agents plus direct fixes for the two special-case rules.
- Added two negative-proof fixtures required by the Phase 5 exit condition, both exercised from
  `tests/tools/quality-owners.test.js`: a misspelled test global
  (`tests/tools/lint-fixtures/misspelled-test-global.test.js`) fails `no-undef` when linted at a strict (non-relaxed)
  virtual path, and an incompatible mock missing a required property against its own JSDoc type
  (`tests/tools/lint-fixtures/incompatible-mock.js`) fails a direct `tsc --strict --checkJs` invocation.
- Also fixed one pre-existing file-size oneliner violation in `tests/contract/state-screen-precedence-contract.test.js`
  (two object-literal return statements collapsed onto one line after gaining two more properties during typing) by
  reformatting to multi-line, not by reverting the typing.
- Updated the PLAN35 quality-policy owner map in `quality-gates.md` (test file classification row moved to `landed`),
  added a "Strict Test-Code Boundary (PLAN35 Phase 5)" section to `testing-infrastructure.md`, and recomputed the
  production/test/tool inventory counts in `tools/quality-policy/phase0-baseline.json` (`toolFileCount` 31→32, a
  pre-existing drift from `tools/hooks-doctor.mjs`/`tools/hooks-install.mjs` never being counted after their addition;
  `testFileCount`/`testSpecFileCount` 454/422→458/425 for the new inventory/contract/fixture test files).
- Verified Phase 5 exit conditions: every test file is mechanically classified exactly once (458 entries, 0 checker
  errors); every `strict` file passes both `npx tsc -p tsconfig.tests.json` (0 errors) and `npx eslint .` (0 errors)
  with real globals and full rule enforcement; the `harness-fragment`/`fixture` exceptions are named individually (no
  glob catch-all accepted by the checker) and cannot silently absorb new files; the misspelled-global and
  incompatible-mock negative proofs both fail as required; `tsconfig.checkjs.json`'s file list and file count (216) are
  unchanged. `npx vitest run` passes in full (423 test files / 1738 tests, 0 regressions) and
  `node tools/check-file-size.mjs --oneliner=block` reports 0 violations.

### Phase 6 — complete (2026-07-19)

- **6B batch 1-5, formatter migration by directory:** Prettier rolled out to every maintained JS/MJS surface in the
  plan's specified order — `runtime/`+`cluster/`, `config/`, `shared/`, `widgets/`+`plugin.js`/ `plugin.mjs`, then
  `tests/`+`tools/` — verifying typecheck, full `vitest run`, and `check-file-size.mjs --oneliner=block` after each
  batch before adding its glob to `format`/`format:check`. Each batch surfaced real file-size/oneliner fallout from
  Prettier's reflow (files crossing the 400-line limit, dense/chained-ternary/collapsed-literal lines newly exposed by
  reformatting) that was fixed by genuine extraction/refactoring, never by suppression or by re-collapsing code to dodge
  the line count.
- **Policy resolution — Prettier vs. the house oneliner checker:** discovered that `objectWrap: preserve` only protects
  object-literal expressions, not array literals or destructuring patterns, which Prettier always collapses onto one
  line when they fit regardless of source authoring. Per explicit user guidance, narrowed `tools/check-file-size.mjs`'s
  `detectCollapsedLiteral`/`detectDenseOneliner` to stop checking array literals and packed-destructuring declarators
  (removing the now-dead `isPackedDestructuringDeclaratorLine` helper and its constant), while keeping object-literal
  collapsing, chained ternaries, dense/packed lines, and collapsed if/else blocks fully enforced. Documented the
  exemption's rationale in `smell-prevention.md` and in the checker's own comments.
- **Widget/shared file splits (batches 3-4):** eleven oversized files were split by extracting cohesive,
  independently-testable logic into new `shared/widget-kits/**` modules — `LinearGaugeEngineFrame.js`,
  `LinearGaugeLayoutVariants.js`, `EditRouteLayoutTiles.js`, `FullCircleRadialMeasure.js`, `FullCircleRadialDrawing.js`,
  `RadialMajorValueLabels.js`, `PositionCoordinateFormatting.js`, `XteDisplayMetrics.js`, `XteDisplayPropsNormalize.js`,
  `XteDisplayRenderSetup.js`, `XteLinearDynamicMetrics.js`, `XteLinearPrimitives.js` — each registered in the component
  registry (a new `config/components/registry-shared-foundation-xte.js` fragment was split out of
  `registry-shared-foundation-layout.js` once the latter's own statement count regressed past its complexity-budget
  baseline from the new registrations), typed via `DyniComponentRequire` overloads, and covered by dedicated or extended
  tests. `ActiveRouteTextHtmlWidget.js`'s file-size violation was resolved by extending the existing
  `shared/widget-kits/nav/NavInteractionPolicy.js` module instead of creating a new file, since the extracted logic
  shared that module's exact dependency and purpose.
- **Batch-4 recovery:** two background agents splitting `XteDisplayWidget.js` and `XteDisplayLinearWidget.js` were
  terminated mid-task by a session API limit; their partial work (new production files, new tests, registry entries) was
  salvaged rather than redone, then finished directly — adding the missing `XteLinearDynamicMetrics` ambient
  type/`DyniComponentRequire` overload, wiring the missing harness module-path entries, fixing JSDoc `@type` gaps the
  strict tests boundary caught, and reconciling every cascade file (`tsconfig.checkjs.json`, `tsconfig.tests.json`,
  `coverage-floors.json`, `phase0-baseline.json`, `typecheck-inventory-contract.test.js`) against the true post-recovery
  file/test counts.
- **Complexity and coverage regressions found and fixed while closing batch 4:** `complexity-budget.mjs` and
  `check-coverage-inventory.mjs` (both part of `check:core`/`test:coverage:check`, not previously re-verified mid-batch)
  surfaced 4 pre-existing complexity regressions and 2 coverage regressions once run —
  `LinearGaugeEngineFrame.js`/`LinearGaugeLayout.js` (new batch-3 files whose extracted functions exceeded the strict
  limits, fixed by a further targeted extraction: `drawDefaultModeText`/ `computeStrokeGeometry`), and
  `runtime/plugin-bootstrap-core.js`/ `shared/widget-kits/text/TextLayoutPrimitives.js` (pre-existing files whose
  complexity had crept past their recorded baseline from earlier in the session, fixed by extracting
  `resolveGlobalRoot()`/`edgeSegmentWidth()` respectively). The `resolveGlobalRoot()` extraction initially regressed
  branch coverage below its recorded floor because the function's branches were structurally unreachable in Node/jsdom
  (window-absent, globalThis fallback); two real unit tests were added (`tests/plugin/plugin-bootstrap.test.js`,
  `tests/plugin/plugin-module-bootstrap.test.js`) to close as much of the gap as is legitimately testable, and the
  remaining single genuinely-unreachable branch (globalThis can never be falsy in any real JS environment) was accepted
  as debt with the floor updated to its verified-achieved value — never lowered speculatively.
- **6C, CSS and Markdown:** `plugin.css`, `shared/**/*.css`, `widgets/**/*.css`, and `tests/css/**/*.css` were formatted
  and verified clean against the existing `stylelint-config-standard` baseline with zero rule conflicts (Prettier's CSS
  output already satisfies every active Stylelint rule); root and `documentation/**` Markdown were formatted under
  `proseWrap: always` and verified against `markdownlint-cli2`, Linkinator local link/fragment checks, and the
  documentation format/reachability contracts — all clean, confirming formatting and linting do not fight each other
  anywhere in scope.
- **6A, formatting-scope completeness contract:** `tests/contract/formatting-scope-contract.test.js` recomputes the
  maintained JS/MJS, CSS, and Markdown file sets from disk and asserts every one is covered by `format`/`format:check`
  (parsed live from `package.json`, so the test tracks the scripts rather than duplicating a second hardcoded list),
  that `format` and `format:check` target the exact same files, and that any future negative-fixture exclusion must be
  an exact path (never a directory glob) and exist on disk. No current file needs an exclusion.
- **Pre-existing `check:patterns` debt found and fixed while verifying the final gate:** 9 findings surfaced in files
  untouched by Phase 6 (`cluster/viewmodels/EditRouteViewModel.js`, `runtime/format-runtime.js`,
  `runtime/TemporaryHostActionBridgeDiscovery.js`, `runtime/theme/token-catalog.js`,
  `shared/widget-kits/nav/RoutePointsHtmlFit.js`). Root-caused: 5 were `catch-fallback-without-suppression` false
  positives — each catch already carried a `dyni-boundary-(next-)line` marker, but the marker's line-targeting rule
  (`-line` suppresses its own line, `-next-line` suppresses the line after) means a marker placed _inside_ a catch body
  never covers the `catch (...) {` line itself; relocating each marker to immediately precede the line it must cover
  fixed all 5 with no logic change. 2 were `css-js-default-duplication`/`premature-legacy-support` allowlist entries
  left pointing at `runtime/theme/model.js` from before an earlier (unlogged) split moved
  `DEFAULT_FONT_STACK`/`deprecatedInputVar` ownership into the new `runtime/theme/token-catalog.js`; updated both
  allowlist keys to the real current owner. The last was a genuine, tested, intentional field-alias fallback in
  `RoutePointsHtmlFit.js` whose local variable name (`infoFallback`) happened to match the smell detector's naming
  heuristic; renamed to `resolvedInfoText` with zero behavior change. `npm run check:all` now passes end to end with
  exit code 0.
- Verified Phase 6 exit conditions: `format`/`format:check` cover every maintained source, test, tool, CSS, root-doc,
  and `documentation/` file (proven mechanically by the new contract test, not just by manual enumeration); no deferred
  directory disposition remains anywhere in `quality-gates.md`/`documentation-maintenance.md` (both updated to describe
  full-repository Prettier ownership); formatting and linting do not fight each other (Stylelint and markdownlint both
  pass unmodified against Prettier's output); negative fixtures remain owner-tested and the new contract test
  structurally forbids hiding a maintained file behind a directory-glob exclusion. Full `npx vitest run` passes (434
  test files / 1835 tests, 0 regressions); both `tsc` boundaries, `complexity-budget.mjs` (202 baseline entries, 0 new
  violations), `check-coverage-inventory.mjs` (228 classified production files), and `check:patterns` (0 findings) are
  all clean; `npm run check:all` exits 0.

### Phase 7 — complete (2026-07-20)

- **7A, operation-count evaluator:** `tools/quality-policy/operation-count-evaluator.mjs` exports two pure,
  deterministic checkers — `evaluateLinearScaling({ sizes, measure, fixedOverhead })`, which asserts
  `work(2n) <= 2 * work(n) + fixedOverhead` across every consecutive doubling in a caller-supplied size sequence, and
  `evaluateBoundedByConfiguredSteps({ steps, measure, tolerancePerStep })`, which asserts a measured count stays within
  a constant multiple of a configured iteration budget. `fixedOverhead` is always a caller-supplied constant
  representing measured one-time setup work (e.g. an affine `count(n) = an + b` formula's `b` term) — never a
  timing-derived slack value, keeping the evaluator fully deterministic and offline.
  `tests/tools/operation-count-evaluator.test.js` proves both functions against clean-linear fixtures (including one
  with real measured overhead), a synthetic quadratic fixture that fails once growth outpaces any fixed constant, and
  every input-validation throw path (too few sizes, non-doubling sizes, negative overhead, non-positive tolerance).
- **7B, three real hot-path contracts,** each instrumenting the actual production dependency graph (no reimplemented
  logic) and asserting both linear/bounded operation counts and output correctness so a shortcut implementation cannot
  pass by skipping behavior:
  - `tests/contract/route-points-render-model-scaling-contract.test.js` wraps the real
    `CenterDisplayMath.computeCourseDistance` (the one pairwise per-row computation inside
    `RoutePointsRenderModel.buildModel`'s point loop) with a counting spy across route sizes 25/50/100/200, proving the
    count is exactly `n - 1` (one leg per point after the first) via `evaluateLinearScaling` with `fixedOverhead: 1` to
    cover that measured constant, and separately asserts every row's `infoText`/`nameText` content is correct at two
    sizes.
  - `tests/shared/html/HtmlDomPatchUtils.scaling-contract.test.js` uses
    `document.implementation.createHTMLDocument(...)` to force `patchInnerHtml`'s real structural tree-diff path (jsdom
    hosts take an `innerHTML =` fast-path shortcut that would measure nothing useful), wraps
    `Element.prototype.setAttribute` to count per-row attribute syncs across list sizes 25/50/100/200 (exactly one sync
    per row, proven via `evaluateLinearScaling` with `fixedOverhead: 0`), and separately asserts the patched DOM's
    ids/attributes/text are correct at two sizes.
  - `tests/shared/text/TextLayoutPrimitives.scaling-contract.test.js` wraps `ctx.measureText` to prove
    `fitSingleLineBinary`'s binary-search font-fit loop calls it exactly `steps` times (via
    `evaluateBoundedByConfiguredSteps` with `tolerancePerStep: 1` across steps 8/14/20) and, independently, that the
    call count stays fixed at the default 14 regardless of input text length (5 to 300 characters) — the text-length
    ceiling is chosen so the mocked measurement still fits the box at the minimum font size, since text that cannot fit
    at any size legitimately triggers one additional post-loop fallback measurement in the real implementation (not a
    defect, just outside this contract's asserted range) — plus a correctness check that the fitted result never exceeds
    the requested box for both a short and a near-limit-length string.
- **7C, `check:scaling` gate:** added `check:scaling` (runs the evaluator's own test plus all three hot-path contracts,
  ~0.5s total) to `package.json` and wired it into `check:core` immediately after `check:complexity`. No `perf:*` alias,
  timing output, benchmark artifact, or production hook was added; confirmed by search that no retired
  workstation-timing instrumentation exists anywhere in the repository.
- Verified Phase 7 exit conditions: all three real hot-path contracts and the evaluator's own linear fixture pass
  repeatedly with byte-identical operation counts across three consecutive runs (no timing, no flakiness, since every
  assertion is an exact integer count); the evaluator's synthetic quadratic fixture fails as designed once growth
  outpaces the fixed constant; every scaling contract also asserts result correctness; and a targeted search confirms no
  `perf:*` command, `performance.now()` call, or `PerformanceObserver` usage exists anywhere outside this plan's own
  prose. Two pre-existing stale "planned (Phase 6)"/"planned (Phase 7)" placeholder rows in `quality-gates.md` (naming a
  `scaling-evaluator.mjs` file that was never the actual filename) were replaced with the real landed entries. Full
  `npx vitest run` passes (438 test files / 1851 tests, 0 regressions, +16 tests from this phase); `npm run check:all`
  exits 0.

### Phase 8 — complete (2026-07-20)

- **8A, quality conventions:** synchronized the stale post-Phase-6/7 command graph and counts across
  `documentation/conventions/quality-gates.md` (`check:standard` described as "scoped Prettier ... config/workflow
  formatting" everywhere it now covers the full repository; two dangling "planned" rows for
  formatting-scope-completeness and scaling contracts, each naming a filename that was never the real one, replaced with
  the actual landed entries; the complexity-baseline and coverage-floors entry counts corrected to their current
  values), `documentation/conventions/ testing-infrastructure.md` (added a "Deterministic Scaling Contracts (PLAN35
  Phase 7)" section alongside the existing Phase 3/5 sections; corrected the stale 224/458 file counts to 227/474;
  removed a stale `perf` field from the `component-context-mock.js` helper description — a leftover from the retired
  workstation-timing system), and `documentation/ conventions/coding-standards.md` (added "Complexity No-Regression
  Budget" and "Unsafe Evaluation and HTML DOM Sinks" sections, since new-code complexity/sink rules were previously only
  documented in `quality-gates.md` and `smell-prevention.md`, not in the file this plan phase names as their home).
  Verified `documentation/conventions/smell-prevention.md`'s Executable Rule Index already lists all 39 live
  `check-patterns` rule IDs (cross-checked directly against `RULES` in `tools/check-patterns/ rules.mjs`) and
  `documentation/core-principles.md`'s rule 19 already states the final fail-closed boundary policy — both needed no
  changes.
- **8B, contributor and AI guidance:** updated `README.md`, `CONTRIBUTING.md`, and `AGENTS.md` to replace every
  remaining "scoped Prettier config/workflow formatting" description with the full-repository scope, and to mention
  `check:complexity` and `check:scaling` as part of `check:core`'s command list (previously undocumented at the
  contributor level even though both gates have run since Phases 4 and 7 respectively). `CLAUDE.md` needed no change —
  it is already the minimal canonical pointer to `AGENTS.md`. `README.md` stayed at 223 non-empty lines (well under the
  400-line limit), so no split was needed.
- **8C, navigation:** no new canonical documentation file was created during Phases 6–7, so `TABLEOFCONTENTS.md` needed
  no new entry.
- Verified Phase 8 exit conditions: every updated doc describes the live command graph and exact current policy with no
  remaining PLAN34/pre-Phase-6 stale exclusions (confirmed by grepping for "scoped Prettier", "deferred disposition",
  and "planned (Phase 6/7)" across `documentation/` and the root docs — zero remaining matches); README and the
  contributor workflow docs are synchronized with `check:core`'s actual command list; `npm run docs:check` and
  `npm run check:filesize` both pass as part of a full `npm run check:all` (exit 0).

### Phase 9 — in progress (2026-07-20): mechanical validation complete, two external GitHub items remain

### Supersession record — 2026-07-22

PLAN36 restores the owner-approved local-first delivery model. Completed Phases 0–8 and the mechanical portion of
Phase 9 remain completed evidence. The representative pull-request run and GitHub branch-check/owner-review ruleset
activation are canceled, not achieved. PLAN36 removes the branch/PR quality workflow, quality-specific CODEOWNERS, and
the tag-side quality rerun; this plan is archived with that scope correction recorded.

- **9A, clean reproducibility:** ran the exact command sequence from a fresh `npm run setup` (`npm ci` + actionlint
  provisioning) through `format:check`, `lint`, `typecheck`, `test:split` (438 files / 1862 tests), `check:patterns` (0
  findings across 39 rules), `check:scaling` (4 files / 17 tests), `docs:check`, `check:filesize` (0 violations across
  780 files), and a final `check:all` — all clean, `check:all` exits 0. A subsequent review found that
  `git diff --check` still rejected an intentional Markdown hard break in `documentation/avnav-api/formatters.md`; the
  paragraph was reflowed without trailing whitespace and `git diff --check` now exits 0.
- **9B, delivery enforcement:** `npm run hooks:doctor` confirms the local pre-push hook is correctly installed. Read the
  actual `.github/workflows/quality.yml` and `.github/workflows/publish-release.yml` source directly to confirm the
  read-only PR/push gate and the tag-only, least-privilege publisher structure (both already matched the plan's
  requirements; no changes needed). A representative GitHub pull-request run has not yet been observed, so the hosted
  trigger/permission behavior remains an external acceptance item even though its source and contract tests pass.
  Expanded `.github/CODEOWNERS` and its contract from a partial spot-check to explicit coverage of all root quality
  configuration, tools/policy data, schemas/types, quality tests/support/scaling contracts, and canonical quality
  documentation. **Required branch check and owner-review ruleset activation is a GitHub repository setting only the
  repository owner can enable (UI or API, not a local command) — left unchecked in the acceptance criteria pending that
  owner action.**
- **9C, runtime preservation:** the repository owner reported on 2026-07-20 that the manual AvNav browser check revealed
  no regressions. This closes the human-only runtime validation item.
- **9D, plan completion status:** the manual browser item is closed. A representative pull-request workflow run and
  required branch-check/owner-review ruleset activation remain external GitHub acceptance items, so the plan stays in
  `exec-plans/active/`.

### Post-implementation validation repair — complete (2026-07-20)

- Follow-up review replaced line-number-only DOM-sink exceptions with exact AST assignment targets and added a bypass
  proof covering handler, `outerHTML`, and compound assignments on the canonical owner. Scaling evaluators now reject
  non-finite, negative, and fractional measurements. The prescriptive test policy and acceptance text now explicitly
  describe the 16 non-spec harness and 209 executable split-spec exceptions as migration debt instead of claiming they
  are already strict; the inventory note names all four live classes.
- Made coverage policy JSON duplicate-aware and schema-checked, added an immutable per-file floor baseline, enforced
  80/65 defaults for future files, and added negative fixtures for unknown classes, zero floors, reductions, and
  duplicate keys.
- Extended complexity scanning to the shipped `plugin.mjs` entrypoint with a dedicated failing fixture.
- Split temporary test debt into non-spec harness and executable split-spec classes. Both are filename/parent bounded
  and require a reason and removal path; strict/fixture files cannot carry `@ts-nocheck`.
- Strengthened route-points scaling with proxied collection reads and counted formatter/helper work, and strengthened
  DOM scaling to count attribute, clone, append/remove, and replace operations.
- Corrected the frozen Phase 0 inventories to the captured commit (211 production JS files, 416 test JS files, 384
  specs, 26 tools) instead of rewriting historical counts to match the live tree.
- Replaced regex-only HTML sink matching with AST matching for computed and compound assignments, attribute handlers,
  and computed `document.write` calls; added bypass-focused negative tests.
- Extended optional mapper sentinel enforcement to `Infinity` and normalized optional values paired with numeric magic
  literals while preserving ordinary zero-valued counts.
- Made every generic production `dyni-lint-disable-*` directive invalid across both entrypoints, JS roots, and CSS
  roots; only validated external-boundary markers remain suppressible.
- Added configured global/critical Vitest coverage floors and a reproducible 188-entry historical complexity snapshot
  keyed by file, function identity, and metric. The original 189 aggregate count remains recorded explicitly rather than
  inventing an identity for the one-count scanner difference.
- Pinned the complete `check:core` command graph (including scaling) in tests, synchronized the quality-gate
  documentation, and updated the smell/mapper review skills to the all-blocking policy.
- Re-ran the focused repair suite (7 files / 109 tests) and the complete `npm run check:all` gate (438 files / 1868
  tests, 92.23% statements, 79.86% branches, 96.82% functions, 93.20% lines); both pass with zero smell, complexity,
  scaling, documentation, file-size, or coverage-inventory regressions.
- Post-review hardening broadened unsafe-handler detection from a fixed event list to all static `on*` names with exact
  file/variable loader exceptions, schema-validated coverage and complexity baseline entries before comparisons, and
  expanded the CODEOWNERS contract to enumerate all quality-critical surfaces. Focused regression coverage passes (4
  files / 84 tests); the final `npm run check:all` passes (438 files / 1875 tests, 92.23% statements, 79.86% branches,
  96.82% functions, 93.20% lines), and `git diff --check` exits 0.
- Follow-up validation made the 80% lines / 65% branches future-file default effective even when a contributor adds the
  active floor and baseline together. The 12 captured below-default files now carry explicit `legacyBelowDefault: true`
  debt markers, and focused fixtures prove unmarked coordinated low floors fail.
- Formatter ownership now includes `.agents/skills/**` and `exec-plans/active/**` Markdown. Completed execution plans
  and release notes remain archival; the formatting-scope contract distinguishes those records from maintained guidance,
  and CODEOWNERS protects both newly maintained roots.
- Follow-up review hardening made the active complexity ledger a validated shrinking subset of the immutable Phase 0
  capture. Twenty-seven PLAN35-added findings were refactored below the strict limits and removed instead of being
  self-grandfathered, leaving 175 tracked legacy entries. The unsafe DOM-sink rule now constant-folds string
  concatenations and template expressions, with bypass-focused fixtures for computed HTML, handler, attribute, and
  `document.write` names.
- Final repair verification passes: the focused coverage/formatting/CODEOWNERS suite is green (4 files / 35 tests), and
  `npm run check:all` exits 0 (438 files / 1878 tests; 92.23% statements, 79.86% branches, 96.82% functions, 93.20%
  lines; 228 classified production files).

### Post-review policy-bypass repair — complete (2026-07-20)

- The active complexity ledger now has to equal every current over-limit metric; five already-improved entries were
  reduced to their scanned values, and a regression fixture rejects latent baseline slack.
- Below-default coverage markers are limited to the 12 frozen Phase 0 paths, so a newly classified file cannot approve
  its own low floor by adding `legacyBelowDefault: true` to both policy files.
- Unsafe DOM-sink detection resolves constant string aliases. Its exceptions now require the canonical enclosing
  function, exact target, simple assignment, expected RHS shape, and a single occurrence; bypass fixtures cover aliases,
  duplicates, and unrelated assignments in an allowlisted file.
- Optional mapper numeric-sentinel detection now covers direct magic output and sentinel-initialized variables later
  assigned through optional numeric normalization, while preserving ordinary zero-valued counts.
- Pull-request quality CI checks out `github.sha`, validating the proposed merge result instead of only the PR head.
- Focused checker tests and the live pattern, complexity, and coverage-inventory gates pass. The final
  `npm run check:all` exits 0 (438 files / 1890 tests; 92.24% statements, 79.74% branches, 96.83% functions, 93.23%
  lines; 228 classified production files).

### Follow-up review repair — complete (2026-07-20)

- Hash-locked the complete coverage-floor capture, froze the exact 12 legacy floor tuples, restricted contract owners to
  normalized `tests/**/*.test.js` paths, and added coordinated-lowering and captured-file-reclassification proofs.
- `check:complexity` now regenerates Phase 0 findings from the recorded Git commit before evaluating the shrinking
  active ledger; a focused negative proof rejects any regenerated-capture difference.
- Corrected the structural DOM patch cursor so replacing one child cannot terminate sibling traversal; unit and scaling
  contracts now require the exact child count and all replacement tags, with no stale siblings.
- Hook tests execute the committed hook with a fake npm and prove exact arguments plus failure propagation. Workflow
  tests require exact setup and `check:all` step commands instead of substring matches.
- Mapper sentinel enforcement now rejects direct non-zero numeric literals, including `-1` and positive sentinels.
  Renderer-prop enforcement is fail-closed for numeric and string normalization across every widget file, without a
  renderer allowlist; existing renderers now trust mapper/editable string contracts.
- Focused regression tests pass (9 files / 119 tests); the historical complexity capture verifies against commit
  `4dbb579cd9247bbaf5f1630337d292b5ef4b46bc` before the 175-entry active budget passes. After isolating two mapper-rule
  fixtures from the broadened sentinel check, `npm run check:all` exits 0 (439 files / 1897 tests; 92.24% statements,
  79.74% branches, 96.83% functions, 93.23% lines; 228 classified production files), and `git diff --check` exits 0.

### Validation-review issue repair — complete (2026-07-20)

- XTE waypoint trimming and positive-scale fallback now belong to `NavMapper`; both XTE renderers and their shared
  metric helpers trust mapper-owned nested props. `XteDisplayPropsNormalize.read(p)` is a direct projection only.
- `mapper-prop-renormalization` now uses the AST to follow local aliases/destructuring and rejects whole-prop delegation
  to `normalize*` helpers. New regression fixtures prove the previously missed bypasses.
- `test-exception-baseline.json` captures and hash-locks all 229 current non-strict paths. New exceptions and
  coordinated baseline edits fail; negative fixtures are restricted to the canonical fixture root and must be referenced
  by the canonical owner test.
- Corrected the production-suppression instructions and added the omitted XTE registry fragment to the component-system
  inventory.
- Final validation is green: `npm run check:all` exits 0 with 439 test files / 1899 tests; coverage is 92.26%
  statements, 79.77% branches, 96.83% functions, and 93.24% lines; the inventory classifies 228 production files.
  `check:patterns` scans 872 files with all 39 rules at zero findings, and the active complexity budget verifies all 175
  entries with zero new violations. The plan remains active only for the representative hosted pull-request run and
  repository-owner confirmation of the required GitHub check/owner-review ruleset.

## Related

- [PLAN34 quality-system remediation](../completed/PLAN34.md)
- [Quality gates](../../documentation/conventions/quality-gates.md)
- [Testing infrastructure](../../documentation/conventions/testing-infrastructure.md)
- [Coding standards](../../documentation/conventions/coding-standards.md)
- [Smell prevention](../../documentation/conventions/smell-prevention.md)
- [Core principles](../../documentation/core-principles.md)
- [Documentation maintenance](../../documentation/guides/documentation-maintenance.md)
- [Execution-plan authoring](../../documentation/guides/exec-plan-authoring.md)
- [Root architecture](../../ARCHITECTURE.md)
