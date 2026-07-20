# Testing Infrastructure

**Status:** ✅ Implemented | Vitest baseline, split projects, helper catalog, and HTML widget test pattern

## Overview

dyninstruments uses Vitest for unit, tool, and integration tests. Coverage runs with native global and critical-area
thresholds, while `test:split` separates Node-only unit/tool tests, VM-based contract tests, and DOM/runtime/widget
tests.

## Key Details

- Coverage environment: Vitest + jsdom via `vitest.config.js`.
- Coverage thresholds: global floors plus area floors for cluster mappers, runtime, radial math core, and dynamic
  cluster update config files.
- Split environments: `unit-node` and `contract` run without jsdom; `unit-dom` uses jsdom and the canvas setup.
- Test locations: `tests/**/*.test.js`.
- Structure: `tests/` mirrors runtime/source modules and feature areas.

## Coverage Inventory Classification

`vitest.config.js` `coverage.include` measures the complete shipped production tree (`plugin.js`, `plugin.mjs`,
`config/**/*.js`, `runtime/**/*.js`, `cluster/**/*.js`, `shared/**/*.js`, `widgets/**/*.js`) — not a curated subset.
Every one of those 228 files (227 `.js` files plus `plugin.mjs`) is classified exactly once in
`tools/quality-policy/coverage-floors.json` as `measured` (the only classification currently in use; `contract-owned`
remains available for a genuinely thin declarative/entry file whose behavior is exhaustively proven by a named contract
test, per `documentation/core-principles.md`).

`npm run check:coverage-inventory` (`tools/quality-policy/check-coverage-inventory.mjs`, run as part of
`test:coverage:check` after `test:coverage` generates `coverage/coverage-summary.json`) enforces:

- every shipped production file has exactly one inventory entry (fails on missing or stale/deleted-file entries);
- policy JSON contains no duplicate raw object keys and uses only a recognized classification; the canonical
  `coverage-floor-baseline.json` must retain its captured SHA-256 digest, so a contributor cannot delete an entry,
  reclassify a captured file, or lower the active floor and baseline together;
- baseline values below 80% lines or 65% branches require `legacyBelowDefault: true` and the exact captured value for
  one of the frozen 12 Phase 0 paths; new paths cannot create or self-approve below-default debt;
- every `measured` entry's live V8 lines/branches percentage is at or above its recorded floor (fails on regression
  below the floor, independent of and in addition to the native Vitest/V8 global and critical-area thresholds already
  enforced by `vitest.config.js`);
- every `contract-owned` entry names an existing, normalized `tests/**/*.test.js` owner and a non-empty reason.

Floor policy: a newly measured behavioral file defaults to an 80% lines / 65% branches floor.
`tools/quality-policy/coverage-floor-baseline.json` is the immutable minimum-floor ratchet. A file that was already
below that floor when its classification was captured keeps its verified achieved percentage as an explicit, allowlisted
`legacyBelowDefault: true` tracked-debt floor (never below the captured baseline) instead of silently passing at a lower
bar. Floors only ratchet up in later phases; they must never be lowered below the currently recorded value.

## Strict Test-Code Boundary

Every file under `tests/**/*.js` is classified exactly once in `tools/quality-policy/test-inventory.json` (475 entries)
as one of:

- `strict` — a real test module or helper, held to the same rigor as production code. New test files default to
  `strict`.
- `harness-fragment` — a non-spec `.harness.js` file naming its existing parent test, reason, and removal path.
- `split-spec-fragment` — an executable `*.partN.test.js` file that still consumes sibling harness globals; it names the
  exact sibling parent plus a reason and migration/removal path.
- `fixture` — an executable negative fixture naming an existing `ownerTest` and a `reason`; deliberately invalid so its
  owner checker test can prove a rule fails a real violation.

`node tools/quality-policy/test-inventory.mjs` (run as part of `typecheck:tests`) enforces completeness (every live file
classified exactly once, no stale entries), rejects directory-wide glob catch-all keys, and validates temporary entries
obey narrow filename/parent rules and carry a reason and removal path. The SHA-256-locked
`tools/quality-policy/test-exception-baseline.json` captures the 229 existing non-strict paths and classifications, so
the exception set may shrink but cannot gain a new path or change classification. Fixtures are restricted to
`tests/tools/lint-fixtures/`, must name `tests/tools/quality-owners.test.js`, and must be referenced by that owner. The
checker also rejects duplicate raw JSON keys and any `@ts-nocheck` directive outside the two temporary fragment classes.
`tests/tools/test-inventory.test.js` exercises every failure branch against a disposable temp workspace.

`tsconfig.tests.json` (repo root) is a separate strict, no-emit `checkJs` project whose `files` list is exactly the
`strict`-classified entries — no temporary fragment or fixture file is typechecked there.
`tests/contract/typecheck-tests-inventory-contract.test.js` proves the two lists stay in lockstep. Temporary fragments
carry `// @ts-nocheck` so they stay exempt even when `require()`-reached from a strict file; `fixture` files are never
reached from a strict file at all. `npm run typecheck` runs both boundaries: `typecheck:source` (production,
`tsconfig.checkjs.json`) followed by `typecheck:tests` (test inventory check plus `tsc -p tsconfig.tests.json`).

`eslint.config.mjs` reads `test-inventory.json` at config-load time and scopes the relaxed
`no-empty`/`no-undef`/`no-unused-vars`/`no-useless-assignment` rule set to exactly the non-strict inventory entries list
— every `strict` test file gets the same real Vitest/Node/browser globals (`testGlobals`) and the same enforcement as
production code.

`tests/tools/quality-owners.test.js` carries the two negative proofs required for the strict test-code boundary: a
misspelled test global (`tests/tools/lint-fixtures/misspelled-test-global.test.js`) fails `no-undef` under the strict
lint boundary, and an incompatible mock (`tests/tools/lint-fixtures/incompatible-mock.js`, missing a required property
against its own JSDoc type) fails the strict `tsc` typecheck.

## Deterministic Scaling Contracts

`tools/quality-policy/operation-count-evaluator.mjs` exports two pure, deterministic checkers used by test contracts to
catch accidental super-linear implementations without timing anything:

- `evaluateLinearScaling({ sizes, measure, fixedOverhead })` asserts `work(2n) <= 2 * work(n) + fixedOverhead` for every
  consecutive doubling in `sizes`. `fixedOverhead` must be a measured constant (one-time setup work independent of `n`,
  e.g. an affine `count(n) = an + b` formula's `b` term) — never a timing-derived slack value.
- `evaluateBoundedByConfiguredSteps({ steps, measure, tolerancePerStep })` asserts a measured count stays within a
  constant multiple of a configured iteration budget, for loops whose cost must depend on a fixed step count rather than
  input size.

Both evaluators fail closed unless every `measure(...)` result is a non-negative finite integer operation count.

`tests/tools/operation-count-evaluator.test.js` proves both functions against clean-linear fixtures and a synthetic
quadratic fixture that fails once growth outpaces any fixed constant, plus invalid-count fixtures for `NaN`, infinity,
negative, and fractional measurements.

Three real hot-path contracts instrument the actual production dependency graph (never a reimplementation) and assert
both the operation-count envelope and result correctness, so an implementation cannot pass by skipping behavior:

- `tests/contract/route-points-render-model-scaling-contract.test.js` proxies the real point collection and counts point
  reads, formatter calls, and `CenterDisplayMath.computeCourseDistance` calls; a nested rescan must fail.
- `tests/shared/html/HtmlDomPatchUtils.scaling-contract.test.js` forces `HtmlDomPatchUtils.patchInnerHtml`'s real
  structural tree-diff path (via `document.implementation.createHTMLDocument(...)`, since jsdom hosts take an
  `innerHTML =` fast-path shortcut), counts attribute plus DOM clone/append/remove/replace operations, and verifies
  every mismatched sibling was replaced with no stale nodes left behind.
- `tests/shared/text/TextLayoutPrimitives.scaling-contract.test.js` counts `ctx.measureText` calls inside
  `fitSingleLineBinary`'s binary-search font-fit loop, proving the count is bounded by the configured `steps` value and
  stays fixed regardless of input text length.

`npm run check:scaling` runs the evaluator's own test plus all three hot-path contracts and is wired into `check:core`
immediately after `check:complexity`. It is Node/jsdom-only, offline, and fast (well under one second); there is no
`perf:*` alias, timing output, or production instrumentation anywhere in the repository.

## Vitest Configuration

`vitest.config.js` baseline:

- `environment: "jsdom"`
- `globals: true`
- `setupFiles: ["tests/setup/vitest.setup.js"]`
- `include: ["tests/**/*.test.js"]`
- `coverage.thresholds`: global and glob-specific coverage floors

`vitest.config.js` `test.projects` split projects:

| Project     | Environment | Scope                                                                                                                                      | Setup                         |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `unit-node` | `node`      | Pure shared math/format/layout, mapper/viewmodel/config, and tool tests                                                                    | none                          |
| `contract`  | `node`      | VM-based component registry, UMD registration/API-shape, dependency graph, plugin bootstrap, bundled layout, and runtime loading contracts | none                          |
| `unit-dom`  | `jsdom`     | Remaining DOM/runtime/widget/integration tests                                                                                             | `tests/setup/vitest.setup.js` |

Commands:

- `npm run test:node` — `unit-node` only, no jsdom/canvas setup
- `npm run test:contract` — AVnav/plugin registry, source-shape, cluster config, and bootstrap contracts
- `npm run test:dom` — `unit-dom` jsdom/canvas-backed tests
- `npm run test:unit` — `unit-node` plus `unit-dom`
- `npm run test:split` — all configured Vitest projects

## Global Setup (`tests/setup/vitest.setup.js`)

jsdom does not implement Canvas 2D APIs, so global setup installs a deterministic `HTMLCanvasElement.getContext("2d")`
mock.

Provided stub methods:

- `measureText`
- `save`
- `restore`
- `scale`
- `translate`
- `clearRect`
- `fillRect`
- `beginPath`
- `fill`
- `stroke`
- `fillText`
- `strokeText`

`measureText` behavior:

- returns width by `text.length * fontPx * 0.52`
- uses font-size parsed from `ctx.font` for deterministic glyph-width estimates.

## Test Helper Catalog

- `tests/helpers/eval-iife.js` — `createScriptContext` and `runIifeScript` for isolated execution of UMD/IIFE scripts in
  controlled VM contexts.
- `tests/helpers/load-umd.js` — `loadFresh` for loading UMD modules with clean require cache and optional dependency
  injection defaults.
- `tests/helpers/component-context-mock.js` — `createComponentContextMock` for building `componentContext` mocks
  (component require, theme tokens, format, canvas, dom, host actions).
- `tests/helpers/mock-canvas.js` — canvas/2D mock factories for widget tests that need deterministic drawing and call
  tracing.
- `tests/helpers/mock-dom.js` — DOM harness utilities (`createElement`, `head.appendChild`, async load callbacks) for
  module-loader/runtime tests.
- `tests/helpers/mapper-route-context.js` — mapper route context factory for route-aware mapper tests.
- `tests/helpers/unit-format-families.js` — unit-format family install helper for formatter/unit-binding tests with
  optional binding overrides.

## Browser API Mocking Policy

- Canvas 2D: globally mocked in `tests/setup/vitest.setup.js`.
- Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`): mock in the individual test file when needed.
- Missing DOM measurement APIs (or other unsupported browser APIs): provide per-test mocks or use existing helper
  harnesses.

## Committed HTML Widget Test Pattern

Standard lifecycle test flow:

1. Load widget module via `loadFresh(...)` with mocked dependencies as needed.
2. Build `componentContext` using `createComponentContextMock(...)`.
3. Create component instance via `module.create(def, componentContext)`.
4. Create host mount element (`document.createElement("div")`).
5. Execute committed renderer lifecycle (`mount`/`update`/`postPatch`/`detach`/`destroy`) and assert DOM, class/state,
   and interaction behavior.

Use the required matrix in `documentation/guides/add-new-html-kind.md` Step 7 for HTML-kind lifecycle/interaction/layout
coverage scope.

## Related

- [coding-standards.md](coding-standards.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
