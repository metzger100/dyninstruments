# PLAN35 — AI Coding Quality Enforcement Hardening

## Status

Written after repository verification, review of the PolarRecorder quality
system, and the repository owner's 2026-07-17 request to plan the identified
hardening improvements.

This plan strengthens the mechanical guarantees around AI-authored production
code, tests, quality policy, and delivery. Equivalent implementations are
allowed where this plan names an outcome rather than a specific algorithm, but
the coverage inventory, zero-warning policy, suppression restrictions,
complexity no-regression contract, test-quality boundary, deterministic scaling
proofs, and always-run delivery gates are prescriptive.

This request reopens three decisions recorded in completed PLAN34, but only in
the following bounded forms:

1. Add branch and pull-request quality CI that invokes the existing
   `npm run check:all`; do not restore the deleted `check:ci` command.
2. Add a separate strict test-code type boundary; do not weaken or replace the
   complete production-only `tsconfig.checkjs.json` inventory.
3. Add deterministic operation-count/scaling contracts for selected pure hot
   paths; do not restore the retired performance runner, wall-clock baselines,
   runtime instrumentation, `PerfSpanHelper`, performance artifacts, or
   performance npm commands.

All other PLAN34 decisions remain binding. In particular, this plan does not
add browser automation, mutation testing, a build step, runtime npm
dependencies, or GitHub-side release rebuilding.

The owner did not request a separate pre-plan interview. The plan therefore
assumes that “implement those improvements” approves the bounded supersession
above. If that was not intended, stop before Phase 1 and amend this section.

---

## Goal

Make the repository's quality system harder for AI-authored changes to bypass,
while retaining the current deterministic Node/Vitest architecture and existing
runtime behavior.

Expected outcomes after completion:

1. Every shipped production JavaScript entry is mechanically classified as
   coverage-measured or contract-owned; new unclassified files fail the gate.
2. Coverage floors cannot be silently lowered and new behavioral files receive
   explicit per-file floors.
3. All executable smell rules are blocking; prose-only contract-trust smells
   gain executable owners.
4. Generic production suppressions are eliminated in favor of narrowly
   validated boundary annotations or checker-owned canonical exceptions.
5. Unsafe evaluation and HTML DOM sinks are mechanically blocked outside their
   single approved owner.
6. New functions must meet strict complexity, statement, nesting, and parameter
   budgets; existing functions cannot regress and the worst hotspots are
   reduced.
7. Test files are no longer protected by one repository-wide `no-undef` /
   `no-unused-vars` exemption; new tests enter a strict typed/linted boundary.
8. Prettier eventually owns every maintained source, test, tool, CSS, and
   Markdown surface, with deliberate fixture exceptions only.
9. Deterministic scaling contracts reject super-linear regressions in selected
   pure hot paths without timing the workstation or instrumenting production.
10. A versioned pre-push hook and read-only branch/pull-request CI run the
    complete gate before changes can merge under the documented repository
    settings.
11. Quality-policy files and tests have explicit review ownership, and the
    required GitHub branch settings are documented and owner-verified.
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

Run `git status --short` before each phase. Preserve unrelated user changes and
never use destructive cleanup commands.

---

## Verified Baseline

The following facts were rechecked against the live repository before writing
this plan:

1. `exec-plans/active/` contained no active plan; PLAN34 is the latest completed
   plan, so this plan is PLAN35.
2. The worktree was clean before this plan was created.
3. `npm run check:all` expands exactly to `check:core` plus
   `test:coverage:check`; `check:strict` aliases it and `check:ci` is absent.
4. The verified pre-plan `npm run check:all` passed 383 test files and 1,405
   tests. Included-source V8 coverage was 89.69% lines, 76.91% branches, 95.26%
   functions, and 89.06% statements.
5. The shipped production inventory contains 211 `.js` files under
   `plugin.js`, `config/`, `runtime/`, `cluster/`, `shared/`, and `widgets/`.
   `plugin.mjs` is a separately tested entrypoint.
6. The current LCOV report contains 78 production source files: `plugin.js`
   1/1, `config` 18/41, `runtime` 25/25, `cluster` 16/16, `shared` 11/101, and
   `widgets` 7/27.
7. `vitest.config.js` uses a curated coverage `include` list plus global and
   four critical-area threshold groups. Files outside the include list do not
   lower the reported global result.
8. `tsconfig.checkjs.json` strictly checks all 211 production `.js` files,
   `vitest.config.js`, and six declaration files. Its inventory contract fails
   on omissions or unexpected production entries.
9. The repository contains 416 test `.js` files. Test sources remain outside
   the strict type project because split harness files share globals.
10. The ESLint override for `tests/**/*.js` disables `no-undef`,
    `no-unused-vars`, and `no-useless-assignment` for every test, not only the
    split harness fragments that need special treatment.
11. The repository contains 26 `.js`/`.mjs` tool files. Module/tool linting is
    stricter than test linting, but tools are not part of a strict type project.
12. Prettier currently blocks only package/workflow/quality configuration,
    declaration, and schema files. Runtime, test, tool, CSS, and Markdown
    formatting remain explicitly deferred.
13. `tools/check-patterns/rules.mjs` has three warn-only rules:
    `catch-fallback-without-suppression`, `css-js-default-duplication`, and
    `editable-threshold-missing-internal`. Mapper output counts from 9 through
    12 are also warn-only.
14. The current pattern run reports zero unsuppressed failures and zero
    warnings, so the zero-warning state is available for fail-closed promotion.
15. Production source contains 29 `dyni-lint-disable-*` directives. It contains
    zero ESLint, TypeScript, Prettier, or Istanbul suppression directives.
16. The only direct `innerHTML` assignments are the two canonical parsing/patch
    sinks in `shared/widget-kits/html/HtmlDomPatchUtils.js`. No production
    `eval()` or `new Function()` use was found.
17. A diagnostic ESLint run using Polar-equivalent limits—complexity 10,
    statements 40, nesting 4, parameters 6—reported 189 violations. The worst
    observed render functions have cyclomatic complexity 77 and 96, so a
    fail-closed migration must use a no-regression baseline before imposing
    strict new-code limits.
18. `.pre-commit-config.yaml` offers optional fast checks and deliberately does
    not run `check:all`. `.githooks/` contains no versioned hook.
19. `.github/workflows/publish-release.yml` is the only workflow. It is tag-only
    and correctly reruns setup plus `check:all` in a read-only quality job
    before publishing committed artifacts.
20. There is no branch/pull-request quality workflow and no `CODEOWNERS` file.
21. The retired performance tooling and runtime instrumentation are absent.
    Contract tests explicitly prevent `PerfSpanHelper` and its removed owner
    path from returning.
22. The quality system already has positive and negative proofs for pattern
    rules, file-size/oneliner rules, focused tests, actionlint, jscpd, docs,
    registry direction/cycles, schemas, type inventory, and release contracts.
23. Quality documentation files are below 300 lines. `README.md` is 283 lines
    and must be checked before and after development-workflow additions.
24. No widget kind, theme token, bundled layout, user setting, installation
    behavior, or runtime package content needs to change for this plan.

---

## Quality Policy Specification

This section defines the final policy independent of implementation details.

### Enforcement severity

- Required gates have only `block` outcomes. Advisory output may explain debt,
  but a live rule must not emit a non-failing warning for a newly introduced
  violation.
- Every rule must have a clean case, a failing case, documentation ownership,
  and a command included in `check:core` or `test:coverage:check`.
- A rule may be exempted only through the narrow mechanism defined for that
  rule. A generic prose reason must not turn arbitrary production findings
  green.

### Coverage classification

Every shipped `plugin.js`, `plugin.mjs`, `config/**/*.js`, `runtime/**/*.js`,
`cluster/**/*.js`, `shared/**/*.js`, and `widgets/**/*.js` entry must be in
exactly one class:

1. `measured`: executed in the V8 coverage run with explicit line and, where
   useful, branch floors;
2. `contract-owned`: a thin declarative/entry/registration file whose behavior
   is exhaustively owned by named executable contract tests.

Contract ownership is an exception, not a directory-wide escape. Each entry
must name its owner test and reason. New behavioral files default to `measured`
with at least 80% line and 65% branch coverage. Existing critical floors and
global floors must not decrease.

### Suppression policy

- Generic `dyni-lint-disable-*` directives are forbidden in production source
  after migration. Negative fixtures may retain them where they prove the
  checker.
- Canonical-owner exceptions belong in the rule's configuration and must be
  proven narrowly by path and construct.
- Intentional external-boundary degradation uses a validated marker carrying
  category, owner, date, and reason. The marker may suppress only the dedicated
  boundary-fallback rule and cannot suppress unrelated rules.
- Temporary exceptions require an expiry date; expired or unknown markers fail.
- Standard ESLint, TypeScript, Prettier, and coverage suppressions remain
  forbidden on shipped/test code unless a future owner-approved policy adds a
  specific mechanically checked form.

### Complexity policy

- New functions: cyclomatic complexity at most 10, at most 40 statements,
  nesting depth at most 4, and at most 6 parameters.
- Existing violations enter a checked baseline. Any metric increase, new
  baseline omission, duplicate baseline identity, or stale resolved entry
  fails.
- Existing functions over complexity 40 must be reduced below 25 in this plan.
- Refactors must split responsibilities, not hide scores through one-line
  compression, generated wrappers, nested anonymous callbacks, or ignored
  paths.

### Test-quality policy

- Production `checkJs` remains a separate complete inventory.
- A second strict `checkJs` project owns real test modules and helpers.
- Every test file is classified as strict, deliberate executable fixture, or a
  temporary split-harness fragment with a named owner and removal path.
- New tests default to strict typing and normal `no-undef`/`no-unused-vars`.
- Broad `tests/**/*.js` lint exemptions are forbidden in the final config.

### Delivery policy

- The versioned pre-push hook runs `npm run check:all`.
- Repository tests verify hook existence, executable mode, and command content.
- A local doctor verifies `core.hooksPath`; CI does not depend on developer Git
  configuration.
- Branch/pull-request CI runs locked setup and `check:all` with read-only
  permissions, immutable action SHAs, concurrency cancellation, and a timeout.
- The existing tag publisher remains separate and unchanged in authority.

### Deterministic scaling policy

- Scaling checks use observable operation counts or bounded callback counts,
  not elapsed wall-clock time.
- No production instrumentation, benchmark artifact, committed timing
  baseline, external browser, or runtime dependency is permitted.
- At least one negative synthetic quadratic case must prove the evaluator can
  fail.

---

## Architecture Notes

### Existing quality owners remain the base

`package.json` remains the public command graph. ESLint/Stylelint/Prettier own
generic syntax and formatting. Vitest owns executable contracts and coverage.
Custom checkers remain appropriate only for repository inventory, suppression,
cross-file, AvNav/UMD, and policy relationships that maintained tools cannot
express directly.

### Production behavior is not the subject of this plan

Most phases change tooling, policy data, tests, documentation, hooks, and
workflow files. Complexity remediation is the only phase expected to refactor
shipped runtime code. Those refactors must preserve outputs, lifecycle order,
DOM/canvas behavior, and public APIs exactly.

### Policy data must fail closed

Coverage, complexity, suppression, and test-classification data may live under
`tools/quality-policy/` or an equivalent tooling-owned location. Each policy
must compare itself with the live filesystem so adding, renaming, or deleting a
file cannot silently leave stale or missing entries.

### Review protection completes the mechanical system

An AI that may freely edit checkers, thresholds, fixtures, and workflow files
can weaken any in-repository rule. The plan therefore includes CODEOWNERS or an
equivalent required-review ruleset for quality-policy surfaces. Repository
settings remain an owner action and must be confirmed in the final validation
record.

---

## Hard Constraints

### Runtime and architecture

- Keep the raw-script runtime, UMD/IIFE components, `window.DyniComponents`,
  AvNav registration, `AVNAV_BASE_URL`, and no-runtime-build contract.
- Add no runtime npm dependency, bundler, transpiler, server runtime, browser
  driver, or generated runtime output.
- Do not reintroduce `PerfSpanHelper`, `runtime.perf`, `componentContext.perf`,
  the retired `perf/` tree, wall-clock benchmark baselines, or runtime
  instrumentation.
- Keep component registry dependency direction/cycle ownership unchanged.
- Keep `tsconfig.checkjs.json` production-complete and strict. Test typing must
  use a separate config and must not reduce production strictness.

### Quality integrity

- Do not lower existing global or critical coverage thresholds.
- Do not exclude a currently measured source file from coverage.
- Do not classify behavioral code as contract-owned merely to avoid tests.
- Do not increase a complexity baseline value or suppression budget to obtain a
  green gate.
- Do not weaken, delete, skip, focus, or broadly suppress a test/check to make
  implementation pass.
- Every new or changed custom checker requires clean and failing fixture tests.
- Keep ordinary gates deterministic and offline after `npm run setup`.
- Keep `check:all` expanding to `check:core` plus native coverage. New static or
  scaling checks belong inside `check:core`; do not create `check:ci`.
- Negative fixtures must remain excluded from ordinary source/test discovery
  and executed only by their owner proof.

### Delivery and GitHub

- Branch/pull-request CI has read-only permissions and must not upload, publish,
  tag, commit, or modify releases.
- Pin every action to a full commit SHA with a readable version comment.
- Preserve the tag publisher's least-privilege two-job quality/publish model.
- Do not commit placeholder CODEOWNERS identities. Obtain a valid user/team
  identity or record the equivalent repository-ruleset configuration.
- Local hooks complement CI; they must not be the sole merge guarantee.

### File organization

- The absolute 400-line and anti-compression rules override this plan.
- Check line counts before and after every non-exempt file already above 300
  lines. Split by responsibility before crossing 400.
- `README.md` is currently 283 lines; check it before and after documentation
  work and split a focused development document if required.
- `tools/check-patterns/rules.mjs` is tool-exempt but already large. Add new
  rule implementations in focused modules rather than expanding the central
  registry with implementation logic.
- Keep policy checkers and their test files focused. Test files remain subject
  to the 400-line limit.
- Do not use formatting compression to keep a migrated file below its limit.

### Scope

- Do not change widget availability, appearance, interaction, theme tokens,
  layouts, user configuration, installation, or release package contents.
- Do not add Playwright/Selenium/browser automation, mutation testing, a docs
  site generator, or GitHub-side artifact rebuilding.
- Do not edit completed PLAN34; this plan records the bounded supersession.
- Keep documentation edits in the dedicated documentation phase.

---

## Implementation Order

### Phase 0 — Freeze policy baselines and governance

**Intent:** Record exact starting policy data and make later tightening
measurable before changing gates.

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

Use scripts/tests for repeatable counts; do not preserve `/tmp` output as the
only evidence.

#### 0B. Create the quality-policy owner map

Define the final owners for coverage inventory, complexity budgets,
suppression/boundary annotations, test classification, unsafe sinks, hooks,
workflow semantics, formatting scope, and scaling contracts. Each row must name
its positive command and negative proof.

Extend the existing migration parity ledger rather than creating a conflicting
second documentation source of truth.

#### 0C. Prove the aggregate command graph

Extend `tests/tools/package-scripts.test.js` so the final additions cannot be
silently removed from `check:core`, while `check:all` remains exactly core plus
coverage and `check:ci` remains absent.

**Phase 0 exit conditions:**

- Baseline inventories are reproducible and checked in tests/tool policy data.
- Every planned rule has an owner and negative-proof path.
- `npm run check:core` and `npm run test:coverage:check` still pass before
  tightening begins.

### Phase 1 — Enforce the complete gate before merge

**Intent:** Ensure the existing and future mechanical rules actually run before
changes are pushed and merged.

**Dependencies:** Phase 0.

#### 1A. Add the versioned pre-push hook

Create `.githooks/pre-push` to resolve the repository root, normalize the
locale, and run `npm run check:all`. Add focused installer and doctor commands:

- `hooks:install` configures `core.hooksPath=.githooks` and ensures executable
  mode;
- `hooks:doctor` verifies local configuration and reports the exact repair
  command;
- a repository contract verifies the committed hook independently of local
  Git configuration.

Keep `.pre-commit-config.yaml` as the fast feedback layer; do not make it run the
full gate.

#### 1B. Add read-only branch/pull-request quality CI

Create `.github/workflows/quality.yml` for pull requests and pushes to the
repository's maintained default branch. It must:

- check out the exact ref with an immutable action SHA;
- set up Node from `.nvmrc` and exact npm 12.0.1;
- run `npm run setup` and `npm run check:all`;
- use read-only permissions, concurrency cancellation, and a bounded timeout;
- publish nothing and require no secrets.

Add semantic workflow tests so a future edit cannot replace `check:all`, add
write permissions, use mutable action tags, or turn the workflow into a release
path. Keep actionlint blocking.

#### 1C. Protect quality-system ownership

Add `.github/CODEOWNERS` when a valid repository user/team identity is known,
covering workflows, hooks, package/lock files, ESLint/Prettier/TypeScript/Vitest
configuration, quality-policy tools/data, quality tests, and canonical quality
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

**Intent:** Remove non-blocking and easily self-authorized paths from production
quality enforcement.

**Dependencies:** Phase 1.

#### 2A. Promote zero-warning rules

Promote these to blocking after re-verifying zero unsuppressed findings:

- `catch-fallback-without-suppression`;
- `css-js-default-duplication`;
- `editable-threshold-missing-internal`;
- `mapper-output-complexity` for outputs above 8 properties.

Update rule fixtures, summary expectations, catalog severity, playbooks, and
quality documentation in the later documentation phase.

#### 2B. Mechanize the remaining prose-only smells

Add narrowly scoped executable rules for:

- `absent-numeric-sentinel`: reject `NaN`, Infinity, and numeric magic sentinels
  where absence must remain `undefined`;
- `mapper-prop-renormalization`: reject downstream use of numeric/string
  normalization helpers on mapper-guaranteed renderer properties.

Use AST-aware or context-aware matching where regex would create predictable
false positives. Add clean, failing, and boundary-exception tests.

#### 2C. Eliminate generic production suppressions

Inventory all 29 production directives and classify each as:

1. canonical owner that the checker should recognize directly;
2. true external-boundary degradation requiring the validated marker;
3. temporary/stale debt that must be removed through root-cause cleanup.

Finish with zero `dyni-lint-disable-*` directives in production source. Extend
the invalid-suppression rule to reject future production directives while
retaining explicit negative fixtures.

The boundary marker must carry category, owner, ISO date, and reason, and may
affect only the boundary-fallback rule. Add expiry checking for temporary
markers.

#### 2D. Own unsafe evaluation and HTML sinks

Enable maintained ESLint rules for `eval`, implied evaluation, and dynamic
function construction. Add a focused sink rule that:

- allows `innerHTML` assignment only at the two reviewed parsing/patching sites
  in `HtmlDomPatchUtils.js`;
- blocks `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, and
  inline event-handler assignment elsewhere;
- does not block renderer functions that return markup strings through the
  established `renderHtml` architecture.

Add real clean/failing fixtures, including a false-positive proof for ordinary
markup string construction.

**Phase 2 exit conditions:**

- `check:patterns` reports zero warnings because live rules are blocking.
- Production contains zero generic suppression directives.
- Every boundary annotation is valid, narrow, and non-expired.
- Unsafe sink fixtures fail and the canonical DOM owner remains green.

### Phase 3 — Make production coverage inventory-complete

**Intent:** Prevent new or existing production behavior from remaining invisible
behind strong aggregate coverage over a partial include list.

**Dependencies:** Phase 2.

#### 3A. Add the live coverage policy inventory

Create tooling-owned policy data and a checker that scans the live production
tree, including `plugin.mjs`, and requires exactly one classification per file.
It must reject missing, duplicate, stale, nonexistent-owner-test, and unsupported
classification entries.

The coverage policy must feed or validate `vitest.config.js`; it must not become
decorative metadata disconnected from the native V8 thresholds.

#### 3B. Preserve current measured floors

Seed explicit floors for all 78 currently measured files using current results
and existing critical groups. Do not lower global or critical thresholds. Add
tests that fail when a floor decreases or a measured file is removed.

#### 3C. Classify and cover the remaining production inventory

Process missing files by responsibility, not by arbitrary count:

1. shared value/format/state/layout/math utilities;
2. shared HTML/DOM/fit and nav/vessel render models;
3. remaining radial/text/canvas engines and primitives;
4. radial and text widget implementations;
5. configuration, registry, bootstrap, and entrypoint surfaces.

For behavioral modules, add meaningful unit/DOM/contract tests and include them
in V8 coverage. Thin declarative or entrypoint modules may use
`contract-owned` only when the named owner test exhaustively verifies their
shape/load/registration behavior.

Do not write tests that merely execute lines without asserting behavior.

#### 3D. Define defaults for future files

Make the policy fail new unclassified files. New measured behavioral files
start at 80% lines and 65% branches unless a stricter family floor applies. A
lower initial floor for migrated legacy code must be explicit, no lower than
its verified baseline, and tracked for improvement.

**Phase 3 exit conditions:**

- Every shipped `.js`/`.mjs` production entry is measured or explicitly
  contract-owned.
- All behavioral shared/widget files are measured; contract ownership is
  limited to demonstrably thin surfaces.
- No existing threshold or measured scope has decreased.
- A synthetic new unclassified file fails the policy proof.
- `npm run test:coverage:check` passes native global, family, and per-file floors.

### Phase 4 — Add complexity no-regression budgets and reduce hotspots

**Intent:** Prevent AI-generated branch/parameter growth while safely migrating
existing complex visual code.

**Dependencies:** Phase 3.

#### 4A. Implement the complexity budget checker

Use the maintained ESLint parser/rules or equivalent AST tooling already in the
lockfile. Record findings by stable function identity and metric. The checker
must reject:

- a new function above the strict limits;
- an increase to an existing baseline metric;
- a missing, duplicate, or stale baseline entry;
- ignored production paths or anonymous-wrapper tricks that escape identity.

Add evaluator tests for all four metrics and baseline lifecycle behavior.

#### 4B. Refactor the worst hotspots

Reduce every existing function above complexity 40 to below 25, beginning with
the XTE canvas renderers. Extract domain/layout/drawing responsibilities into
existing canonical owners or focused shared modules; do not create forwarding
shims or local copies of shared helpers.

For every touched file:

- check size before and after;
- preserve the UMD/public API;
- add characterization tests before the split;
- keep render order, canvas state, geometry, placeholder behavior, and theme
  behavior unchanged;
- run focused tests and coverage after each responsibility extraction.

#### 4C. Enforce strict limits for all new code

Integrate the checker into `check:core`. New functions must meet complexity 10,
40 statements, nesting 4, and 6 parameters. Existing baseline entries may only
stay equal or shrink; resolved entries must be removed in the same change.

**Phase 4 exit conditions:**

- No existing metric increased from the verified baseline.
- No function remains above complexity 40; remediated hotspots are below 25.
- New-over-limit and baseline-increase fixtures fail.
- Focused renderer tests, coverage, typecheck, and `check:filesize` pass.

### Phase 5 — Establish a strict test-code boundary

**Intent:** Make AI-authored tests capable of failing for misspelled globals,
dead bindings, and type-invalid mocks instead of relying only on execution.

**Dependencies:** Phase 4.

#### 5A. Classify the live test inventory

Create a checked test inventory with these classes:

- strict test module/helper;
- executable negative fixture owned by a named checker test;
- temporary split-harness fragment with named parent/harness and removal path.

New test files default to strict. The checker must reject missing, stale, and
directory-wide catch-all entries.

#### 5B. Remove the broad ESLint test exemption

Enable `no-undef`, `no-unused-vars`, and `no-useless-assignment` for real tests
and helpers. Scope only the minimum necessary rules to explicit split fragments
while they are migrated. Keep Vitest globals declared through maintained type
definitions, not ad hoc global comments.

#### 5C. Add `tsconfig.tests.json`

Create a separate strict no-emit `checkJs` project for tests/helpers. Supply
real Vitest, Node, DOM, and repository ambient types. Do not use `any`-heavy
declarations or blanket ignores merely to increase the included count.

Add `typecheck:tests`; keep `typecheck:source` or the existing `typecheck`
production command explicit, and make the public aggregate typecheck execute
both boundaries.

#### 5D. Migrate tests by harness family

Move helpers and standalone Node/contract tests first, then DOM/runtime/widget
harness families. Replace implicit cross-file globals with explicit harness
exports/imports or typed setup owners. Keep split files only where the 400-line
rule genuinely requires them.

**Phase 5 exit conditions:**

- All test files are mechanically classified.
- All standalone tests and helpers are strict typed/linted.
- Remaining split-fragment exceptions are explicit and cannot accept new files
  by glob.
- A misspelled test global and an incompatible mock both fail negative proofs.
- Production type inventory remains complete and unchanged in authority.

### Phase 6 — Complete formatter ownership

**Intent:** Make formatting deterministic across all maintained repository
surfaces without mixing semantic changes into bulk rewrites.

**Dependencies:** Phase 5.

#### 6A. Make new files formatter-owned immediately

Add a formatting-scope contract so new maintained JS/MJS, CSS, and Markdown
files cannot land outside Prettier ownership. Keep deliberate negative fixtures
excluded by exact owner paths and tested separately.

#### 6B. Migrate JavaScript by directory

Run formatting-only batches in this order unless baseline evidence supports a
safer equivalent sequence:

1. `runtime/` and `cluster/`;
2. `config/`;
3. `shared/`;
4. `widgets/` and plugin entrypoints;
5. `tests/` and `tools/`.

Before adding a batch to `format:check`, run typecheck, focused tests, and the
file-size gate. If formatting pushes a non-exempt file toward 400 lines, split
by responsibility before accepting the batch.

#### 6C. Migrate CSS and Markdown

Add maintained CSS and Markdown surfaces after reconciling Stylelint and
markdownlint ownership. Avoid rule duplication or formatter/linter oscillation.
Check AGENTS/CLAUDE pointer contracts and all Markdown links after formatting.

**Phase 6 exit conditions:**

- `format` and `format:check` cover every maintained source, test, tool, CSS,
  root-doc, and `documentation/` file.
- No deferred directory disposition remains.
- Formatting and linting do not fight each other.
- Negative fixtures remain owner-tested and cannot hide maintained files.

### Phase 7 — Add deterministic scaling contracts

**Intent:** Catch accidental super-linear AI implementations without restoring
the rejected workstation-sensitive performance system.

**Dependencies:** Phase 6.

#### 7A. Build an operation-count evaluator

Create a focused checker/helper that evaluates deterministic work counts using
a linear envelope such as `work(2n) <= 2 * work(n) + K`. The constant must come
from measured fixed setup work, not a timing baseline. Add clean linear and
failing quadratic evaluator fixtures.

#### 7B. Cover selected real hot paths

Add deterministic contracts for at least:

- `RoutePointsRenderModel.buildModel` with proxied point collections and counted
  formatter/layout/helper operations;
- `HtmlDomPatchUtils.patchInnerHtml` with counted DOM mutation, clone, and
  attribute operations over equivalent `n` and `2n` trees;
- bounded text-fit loops in `TextLayoutPrimitives`, asserting measurement calls
  remain bounded by configured iteration steps rather than input text length.

Tests must also assert result correctness so an implementation cannot reduce
work by skipping behavior.

#### 7C. Integrate the scaling gate

Add a focused `check:scaling` command and include it in `check:core`. Keep it
Node/jsdom-only, offline, deterministic, and fast. Do not add `perf:*` aliases,
reports, production hooks, or timing output.

**Phase 7 exit conditions:**

- Linear real workloads pass repeatedly with identical operation counts.
- Synthetic quadratic work fails.
- Result-correctness assertions prevent shortcut implementations.
- Search confirms retired performance/runtime instrumentation remains absent.

### Phase 8 — Documentation and contributor workflow

**Intent:** Synchronize canonical guidance after implementation without making
source-code changes in this phase.

**Dependencies:** Phases 1–7.

#### 8A. Update quality conventions

Update:

- `documentation/conventions/quality-gates.md` with the final command graph,
  workflow/hook authority, coverage policy, complexity, test typing, formatting,
  and scaling owners;
- `documentation/conventions/testing-infrastructure.md` with per-file coverage,
  test classification, strict test typing, and scaling fixtures;
- `documentation/conventions/smell-prevention.md` with all new blocking rules,
  zero-warning status, boundary marker syntax, and suppression prohibition;
- `documentation/conventions/coding-standards.md` with new-code complexity and
  unsafe sink rules;
- `documentation/core-principles.md` to replace the generic production
  suppression rule with the final fail-closed boundary policy;
- `documentation/guides/documentation-maintenance.md` with the final commands
  and touchpoints.

Update smell playbooks for every new rule. Preserve the executable
rule-to-catalog completeness contract.

#### 8B. Update contributor and AI guidance

Update `README.md` Development, `CONTRIBUTING.md` validation/human-review/
pre-merge sections, and `AGENTS.md` quality checklist and smell rules. Keep
`CLAUDE.md` as the canonical short pointer unless its pointer contract requires
an adjustment.

Document hook installation, branch CI, protected quality paths, coverage/test
classification, formatter ownership, and the fact that scaling checks are
operation-based rather than timing benchmarks.

Check `README.md` line count before and after; split focused contributor detail
into an already reachable development document if it approaches 400 lines.

#### 8C. Update navigation only if needed

If no new canonical documentation file is created, TABLEOFCONTENTS requires no
new entry. If implementation introduces one, link it from
`documentation/TABLEOFCONTENTS.md` and satisfy format/reachability contracts.

**Phase 8 exit conditions:**

- Docs describe the live command graph and exact policy, with no PLAN34-era
  stale exclusions for the bounded superseded decisions.
- README and contributor workflow are synchronized.
- `npm run docs:check` and `npm run check:filesize` pass.

### Phase 9 — Clean validation, owner settings, and completion

**Intent:** Prove the complete system from a clean tool installation and record
the external repository settings that make it enforceable.

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
- Confirm the tag publisher remains tag-only and still reruns `check:all` before
  publishing.

#### 9C. Validate runtime preservation

Because Phase 4 may refactor shipped renderer code, run the documented manual
AvNav checklist: plugin load, representative radial/linear/HTML widgets,
day/night switch, and route/AIS interactions. Record date, environment, and
result. No external browser automation is added to the gate.

#### 9D. Complete the plan

Update Status with final inventories, threshold/complexity/suppression counts,
commands, deviations, owner settings, and manual validation. Move this file to
`exec-plans/completed/PLAN35.md` only when every acceptance item passes.

---

## User-Facing Documentation Impact

`README.md` changes are required because the development workflow, required
quality gates, hooks, CI behavior, coverage policy, formatting scope, and
contributor requirements change.

No end-user widget, layout, theme, installation, AvNav configuration, or runtime
requirement behavior is intended to change. README edits must stay within the
Development/contributor material and must not advertise new instrument
behavior.

The theme fixture and all-widgets layout fixture sync rules are not triggered
unless implementation unexpectedly changes user-visible behavior. If that
happens, stop and amend the plan before changing those fixtures.

---

## Acceptance Criteria

### Delivery and governance

- [ ] `.githooks/pre-push` runs `npm run check:all`; install, doctor, executable,
  and negative contract proofs pass.
- [ ] Read-only branch/pull-request CI runs locked setup and `check:all` with
  immutable actions, concurrency, and timeout.
- [ ] The tag publisher remains tag-only, least-privilege, and dependent on its
  own read-only quality job.
- [ ] Required branch check and owner review protection are owner-confirmed.
- [ ] `check:ci` remains absent and `check:all` remains core plus coverage.

### Smells, suppression, and security

- [ ] Every live smell rule is blocking; the final pattern run has zero
  warnings.
- [ ] Absent numeric sentinels and mapper-prop re-normalization have executable
  clean/failing proofs.
- [ ] Production has zero generic `dyni-lint-disable-*` directives.
- [ ] Boundary annotations are narrow, owned, dated, validated, and
  non-expired.
- [ ] Standard lint/type/format/coverage suppressions remain absent.
- [ ] Unsafe evaluation and unauthorized HTML DOM sinks fail mechanically;
  only the reviewed `HtmlDomPatchUtils` sinks remain.

### Coverage and testing

- [ ] Every shipped production `.js`/`.mjs` file has exactly one live coverage
  classification.
- [ ] Every behavioral shared/widget file is V8-measured with an explicit floor.
- [ ] Contract-owned entries name real exhaustive owner tests.
- [ ] No existing global, critical, measured, or per-file floor was lowered.
- [ ] New unclassified or below-floor file fixtures fail.
- [ ] Every test file is classified; new tests default to strict typing/linting.
- [ ] Strict test `checkJs` and normal undefined/unused checks cover all real
  test modules/helpers, with only explicit split/fixture exceptions.

### Complexity and formatting

- [ ] New functions are limited to complexity 10, 40 statements, nesting 4,
  and 6 parameters.
- [ ] Existing metrics cannot increase; stale/resolved baseline entries fail.
- [ ] No existing function remains above complexity 40, and remediated
  hotspots are below 25.
- [ ] Every maintained JS/MJS, CSS, and Markdown surface is formatter-owned.
- [ ] Formatting does not violate the 400-line or anti-compression rules.

### Deterministic scaling

- [ ] Route-points model, DOM patching, and bounded text-fit operation-count
  contracts pass with correct results.
- [ ] A synthetic quadratic workload fails the scaling evaluator.
- [ ] Scaling checks use no wall-clock threshold, runtime instrumentation,
  browser driver, benchmark artifact, or `perf:*` command.
- [ ] Retired performance owner paths remain forbidden and absent.

### Documentation and final validation

- [ ] Quality, testing, coding, smell, maintenance, README, CONTRIBUTING, and
  AGENTS guidance match the final system.
- [ ] `README.md` remains below 400 lines or is split through reachable focused
  documentation.
- [ ] No user-facing widget/theme/layout/configuration behavior changed.
- [ ] `npm run setup` and every Phase 9 command pass from the supported
  Node 26/npm 12.0.1 environment.
- [ ] `npm run check:all` passes with final test, coverage, policy, and scaling
  evidence recorded.
- [ ] Manual AvNav validation confirms runtime preservation after complexity
  refactors.
- [ ] No unrelated user change was overwritten.

---

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
