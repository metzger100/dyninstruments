# Dyninstruments Quality System Migration

## Status

Completed repository-wide migration plan, finalized after repository
verification on 2026-07-15.

Archived on 2026-07-16 after the post-migration audit and decision interview.
The migration implementation described here is complete; follow-up remediation
is owned by [PLAN34](../active/PLAN34.md). Where this archived plan conflicts
with PLAN34, the user-approved decisions in PLAN34 are authoritative.

Phase 1 is implemented and locally validated: pull requests/pushes now run the
existing gates in CI, release publication depends on quality jobs, and
contributor-facing docs describe the authority change.

Phase 2 is implemented in parallel with the old gates: `check:standard` now runs
scoped Prettier checks, ESLint flat config, Stylelint, and jscpd before the
project-specific `check:core` checks. Whole-runtime Prettier formatting is
deferred because repo-wide formatting pushed legacy files over the absolute
400-line gate during validation.

Phase 3 is complete for the production JavaScript surface with a strict
no-emit `checkJs` baseline:
`typecheck` runs `tsconfig.checkjs.json` over the shared format helpers
(`PlaceholderNormalize`, `StableDigits`, `DepthDisplayFormatter`,
`UnitAwareFormatter`), `ValueMath`, layout
rect/geometry/sizing/responsive-profile math, linear gauge math plus
linear canvas/drawing/support/label-fit/text-layout helpers, radial
angle/sector/tick/value helpers, the full-circle radial engine, the nav
mode-ratio, text-fit, center-display leg-math, AIS-target, and edit-route
layout-math helpers, the spring-easing smoother, the state-screen
labels/interaction/precedence/canvas-overlay/markup/text-fit helpers, the
regatta-timer phase helper, the full text-layout kit (canvas fitting/layout,
layout engine/composite/primitives/scale/tile, center-display adapter), the
gauge toolkit, the XTE highway/linear layout helpers, and UMD ambient
declarations plus the radial text fitting/layout compat wrappers, the HTML DOM
patch/measure/widget/lifecycle helpers, the prepared-payload model cache, the
shared `CanvasLayerCache` cache backend, selected nav interaction/info-text/fit
helpers, selected vessel render-model/markup/audio/session/fit helpers, the
full-circle/semicircle radial layout modules, the semicircle radial text-layout
helper, selected active-route/route-points sizing/row geometry, plus the radial
draw/frame/toolkit facade modules and radial engines, center-display layout and
render-model helpers, AIS target sizing/fit/render-model/layout geometry and
AIS/edit-route/route-points markup plus alarm chrome helpers and active-route
HTML fit/AIS layout/edit-route render-model/map-zoom HTML fit/route-points HTML fit/DOM effects and regatta-timer HTML fit, plus editable-configuration families, cluster-route/component-registry configuration, and runtime namespace/perf/canvas/DOM/editable-default/formatter/widget-registration/surface-index services. The authoritative inventory contains 214 production JS files plus six declaration files (220 strict files total) across
`types/dyni-globals.d.ts`
plus modular `types/text-kit.d.ts`, `types/misc-kit.d.ts`, and
`types/radial-kit.d.ts`). All shipped runtime/config/shared/widget code is
strict-checked. Test files remain outside this source check because split
harness files intentionally share globals; their behavior remains blocking
through Node, jsdom, VM-contract, coverage, lint, and contract gates. The sole
excluded tool-side JS file is test data, not executable tooling. Host/widget-provided values are intentionally modelled as
`unknown` at boundaries, while required module APIs must be narrowed through
ambient `components.require(...)` overloads rather than left as `unknown`.

Current handoff after the Claude/Codex context switch: Claude's latest run
touched `shared/widget-kits/radial/FullCircleRadialEngine.js`; the handoff audit
recorded below verified that change at the 59-file `checkJs` checkpoint. The
repository has since advanced to 214 checked JS files by adding
`SemicircleRadialTextLayout`, `NavInteractionPolicy`, `AlarmRenderModel`, and
`AlarmMarkup`, then `RoutePointsInfoText`, `RegattaTimerAudio`, and
`RegattaTimerSessionStore`, then `RegattaTimerMarkup` and
`EditRouteLayoutGeometry`, then `RoutePointsRowGeometry` and
`RoutePointsLayoutSizing`, then `AisTargetMarkup`, `RoutePointsMarkup`, and
`ActiveRouteLayout`, then `AlarmHtmlFitChrome`, then `EditRouteMarkup`,
`CenterDisplayRenderModel`, `EditRouteHtmlFitSupport`, `AlarmHtmlFit`, and
`CenterDisplayLayout`, then `AisTargetLayoutSizing`, `AisTargetRenderModel`,
`AisTargetHtmlFit`, `AisTargetLayoutGeometry`, and
`AisTargetLayoutGeometryStyles`, then `ActiveRouteHtmlFit` and
`AisTargetLayout`, then `EditRouteHtmlFit`, `RoutePointsHtmlFit`, and
`RoutePointsDomEffects`, `EditRouteRenderModel`, `MapZoomHtmlFit`, and
`RegattaTimerHtmlFit`, plus the cluster-route initializer, finalizer, and eight
cluster route fragments.
The current configuration batch also covers the component registry assembly and
eight registry fragments.
The current runtime batch also covers `namespace.js` and `PerfSpanHelper.js`.
It now includes `canvas-runtime.js`, `SurfaceSessionController.js`, and
`component-loader.js`.
It now includes `dom-runtime.js`.
It now includes `editable-defaults.js` and `format-runtime.js`.
It now includes `widget-registrar.js`.
It now includes `runtime/surface/index.js`.
It now includes widget-definition assembly plus common, environment, and vessel-voltage editable configuration helpers.
It now includes `AnchorMapper` and `CourseHeadingMapper`.
It now includes `ActiveRouteViewModel` and `RoutePointsViewModel`.
It now includes `SpeedMapper` and `MapMapper`.
It now includes `WindMapper` and `DefaultMapper`.
It now includes `runtime/asset-preloader.js`.
It now includes `runtime/cluster/ClusterShellRenderer.js`.
It now includes `EnvironmentMapper`.
It now includes `runtime/plugin-bootstrap-core.js`.
It now includes `runtime/init.js`.
It now includes `AlarmViewModel`.
It now includes `EditRouteViewModel`.
It now includes `AisTargetViewModel`.
It now includes `ClusterMapperToolkit`.
It now includes `VesselMapper`.
It now includes `NavMapper`.
It now includes `RouteActivationPayloadBuilder`.
It now includes `RouteActivationLatestWins`.
It now includes `RouteActivationController`.
It now includes `TemporaryHostActionBridgeDiscovery`.
It now includes `SurfaceSessionController`.
The `unknown` annotations are acceptable where they mark AvNav/browser/raw-prop
boundaries or generic coercion helpers. They are not acceptable as a substitute
for internal module contracts; those must keep being tightened with ambient
`components.require(...)` overloads and focused source JSDoc as each file enters
the strict scope. A current editable-parameter scan found no real
`type: "UNKNOWN"` config values. The only non-object editable entries are 45
AvNav built-in boolean shorthands plus four documented per-kind caption/unit
hide overrides (`caption_clockRadial`, `unit_clockRadial`,
`caption_regattaTimer`, `unit_regattaTimer`); audits should bucket those as
intentional hide shorthands, not unknown parameter types.

Execution-policy update (2026-07-15): external browser automation is not a
migration deliverable. No local or CI quality command may require Playwright, a
downloaded Chromium binary, or another browser driver. Browser-facing bootstrap,
DOM, and lifecycle behavior remains covered by the required `unit-dom` and
`contract` suites; the rest of the strict `check:all` contract is unchanged.

Phase 4 is complete with an additive Vitest workspace: `unit-node` runs
pure shared helpers, mapper/viewmodel/config tests, and tool tests in Node with
no setup; `contract` runs VM-based registry/bootstrap/layout/loading contracts
in Node with no setup; `unit-dom` runs the remaining jsdom/canvas-backed
runtime/widget/integration tests. Native Vitest/V8 coverage thresholds now cover
the global baseline and the four legacy critical area groups. The legacy
coverage-summary parser has been retired after native positive, clean, and
negative threshold proof. Property-based tests (`fast-check`) now guard critical
math/format invariants in the `unit-node` project
(`tests/shared/property/math-invariants.property.test.js`): clamp bounds, lerp
range/endpoints, `norm360`/`mod` normalization ranges, placeholder normalization
always returning strings, and `buildTickAngles` emitting only finite angles.
Focused mutation testing (`StrykerJS`) is configured via `stryker.conf.json` and
a scoped `vitest.mutation.config.js`, exposed as `npm run test:mutation`, and
targets the critical math/mapper/format modules. It is on-demand/nightly only
(never in the fast local loop); `related` is disabled because tests load UMD
source through a VM loader rather than ES imports, and the scoped mutation config
plus Stryker `ignorePatterns` keep the sandbox off the Vitest workspace.

Phase 5 is implemented for the current repository: AI-instruction sync, docs link/format/reachability,
headers, dependency, naming, UMD, coverage, hook, and semantic smell checkers
have been retired after replacement proof in standard tools or Vitest contract
tests. `AGENTS.md` is canonical, `CLAUDE.md` is a short pointer, and
documentation link/reachability checks now cover that relationship without
byte-for-byte duplication. Remaining generic custom mechanisms are mainly the
file-size/oneliner gate and static smell pattern rules, plus retained
AvNav-specific package/performance helpers.

Declarative schema validation is implemented with Ajv: `schema:check` validates
`plugin.json` and bundled layout JSON through committed schemas and is wired into
`package:check`.

Release/package verification is implemented with `package:check`: it runs
`schema:check` plus focused Node-only release prepare/create/zip-builder tests,
and `check:core` now requires it before the project-specific static gates.

Documentation standardization is implemented with `markdownlint-cli2`: `docs:check`
now runs the maintained Markdown linter before the project-specific
docs-links/format/reachability contract tests. The baseline intentionally
disables style-noisy rules until table, fence, and ordered-list cleanup can be
reviewed separately. The custom `check-docs.mjs` and `check-doc-reachability.mjs`
checkers have been retired: link/anchor/stale-phrase/doc-target and reachability
parity now live in `tests/contract/documentation-links-contract.test.js` and
`tests/contract/documentation-reachability-contract.test.js` (backed by shared
`tests/helpers/markdown-docs.js`). `check-doc-format.mjs` is also retired; its
project-specific shape checks now live in
`tests/contract/documentation-format-contract.test.js`. A separate MkDocs build
remains an optional future documentation presentation layer; the required
repository parity is provided by markdownlint plus the Node-based link, format,
and reachability contracts. No browser automation is part of that decision.

GitHub Actions workflow validation is implemented with pinned upstream actionlint:
`check:standard` now runs `actions:lint`, which downloads `rhysd/actionlint`
v1.7.12, verifies the official SHA-256 digest, and validates
`.github/workflows/*.yml`.

This plan covers the staged migration from repository-owned quality checkers to a
configuration-first, externally maintained toolchain. Runtime delivery remains
plain JavaScript loaded by AvNav with no bundler, no transpiled runtime output,
and no runtime npm dependencies.

The implementation agent may choose equivalent maintained tools when they meet
the parity ledger, validation, CI, and documentation outcomes below. Custom code
may remain only for irreducible AvNav component/UMD registry contracts,
deterministic release packaging, and project-specific performance scenarios.

---

## Goal

Replace generic custom checker mechanisms with standard formatting, linting,
type checking, documentation validation, schema validation, test, CI, hook, and
release quality mechanisms while preserving or strengthening every meaningful
quality guarantee.

Expected outcomes after completion:

- Pull requests and releases cannot bypass quality verification.
- Runtime files remain raw IIFE/UMD browser scripts loaded by AvNav.
- Prettier, ESLint flat config, Stylelint, TypeScript `checkJs`, Vitest/V8
  coverage, markdownlint, Node-based link checking, schemas, jscpd, and pre-commit
  provide the standard quality surface.
- Pure Node, jsdom, component-contract, coverage, mutation, and performance
  checks have distinct command boundaries.
- Meaningful custom rules are converted to tool configuration or Vitest
  contract tests before old checker scripts are deleted.
- `npm run check:all` remains the documented complete local gate.
- Documentation records rule parity, validation evidence, retained custom code,
  deleted obsolete tooling, and remaining risks.

---

## Verified Baseline

The following points were checked against the live repository before editing
source/configuration:

1. The working tree was clean before baseline collection (`git status --short`
   produced no output).
2. Node version is `v26.4.0`; npm version is `12.0.0`.
3. `npm ci` passed. npm warned that deprecated `whatwg-encoding@3.1.1` and
   `glob@10.5.0` are installed, and that `esbuild@0.21.5` postinstall was
   blocked by npm install-script policy.
4. `npm run check:core` passed. It checked 767 pattern files, 12 smell-contract
   rules, 75 Markdown files, 209 JS documentation headers, 687 file-size
   targets, 188 JS headers, 140 components, 423 dependencies, 141 UMD/component
   files, 9 cluster configs, and 141 component files.
5. Documentation reachability passed with 77 discovered docs, 77 reachable docs,
   0 orphans, and 0 broken links.
6. `npm run test:coverage:check` passed: 370 test files, 1,334 tests, 66.78s.
   The current run is a single jsdom-backed Vitest project with global
   `tests/setup/vitest.setup.js`.
7. Global coverage passed: lines 93.59%, statements 93.59%, functions 93.76%,
   branches 76.17%.
8. Area coverage passed: `cluster/mappers/` lines 94.70%, branches 79.27%;
   `runtime/` lines 89.60%, branches 76.36%; radial math core lines 90.20%,
   branches 65.00%; dynamic cluster update files lines 100.00%, branches 87.50%.
9. `npm run perf:check` passed with 45 checks using
   `perf/baselines/core-lab-v1.json`, writing ignored artifacts under
   `artifacts/perf/`.
10. Current checker/sync/hook-oriented custom scripts total 8,459 lines:
    `tools/check*.mjs`, `tools/check-patterns/*.mjs`,
    `tools/components-registry-loader.mjs`, `tools/install-hooks.mjs`, and
    `tools/sync-ai-instructions.mjs`.
11. `tests/tools/*.js` totals 3,561 lines. Checker-focused tests currently
    include 141 tests across check-dependencies, check-file-size,
    check-patterns, and check-smell-contracts suites; additional tool tests cover
    release, perf, and install scripts.
12. Existing GitHub Actions only contains `.github/workflows/publish-release.yml`.
    It publishes tag releases from prebuilt `releases/dyninstruments-*.zip` and
    notes, but does not run quality gates.
13. Existing local hooks are tracked in `.githooks/`: `pre-push` runs
    `npm run check:all`; `install-hooks.mjs` sets `core.hooksPath`.
14. Latest release artifact inspected:
    `releases/dyninstruments-3.8.1.zip` contains 292 entries totaling
    1,839,059 bytes, including runtime/config/cluster/shared/widgets/assets/
    layouts and generated `bootstrap-bundle.js`; dev tooling/docs are absent.
15. `config/components.js` merges registry groups in fixed order:
    `sharedFoundation`, `sharedEngines`, `widgets`, `cluster`, and fails on
    missing groups or duplicate IDs.
16. `runtime/component-loader.js` owns dependency cycle detection, script/CSS
    loading, asset preloading, API-shape validation, loaded closure assertions,
    and scoped `componentContext.components.require`.
17. Component loader tests already cover dependency order, cache reuse, unknown
    components, invalid API shape, module-shaped APIs, asset preload helpers,
    create-before-load failure, fresh dependency trees, undeclared dependency
    denial, and dependency cycles.
18. Release scripts currently run `check:core` and coverage as blocking gates;
    `perf:check` is advisory in `release:create`.

---

## Hard Constraints

- Do not add a runtime build step, runtime bundler, or transpiled runtime output.
- Do not convert runtime source to ES modules or TypeScript.
- Do not add npm runtime imports to plugin files shipped to AvNav.
- Do not weaken tests, coverage thresholds, performance checks, or semantic
  contracts to make the migration pass.
- Delete a custom checker only after the parity ledger names its replacement and
  clean/negative proof has been recorded.
- Keep behavior stable for widget output, mappers, component loading order,
  config defaults, editable parameters, themes, host lifecycle, layouts, and
  release artifact runtime contents.
- Keep `npm run check:all`, `check:core`, `check:strict`, `test`,
  `test:watch`, `perf:run`, `perf:check`, `release:prepare`, and
  `release:create` as public commands or compatibility aliases during migration.
- Keep documentation and README updates in the same phase as visible workflow,
  installation, configuration, or contributor behavior changes.

---

## Rule-Parity Ledger

| Old rule/check | Current implementation | Rule class | New enforcement | Positive proof | Clean proof | CI job | Status | Deletion decision |
|---|---|---|---|---|---|---|---|---|
| AI instruction sync | `check-ai-instructions.mjs`, `sync-ai-instructions.mjs` | repository workflow | Canonical `AGENTS.md`, short `CLAUDE.md`, docs/link/reachability checks | `CLAUDE.md` links to `AGENTS.md`; docs now describe AGENTS as canonical and no duplicated sync command remains | `npm run docs:check` and `npm run check:core` pass after deletion | docs/static-js | Retired | Deleted 2026-07-13; current checker/sync/hook-oriented script total is 8,255 lines |
| Documentation links/anchors/stale phrases | `check-docs.mjs` | repository workflow | `tests/contract/documentation-links-contract.test.js` plus shared `tests/helpers/markdown-docs.js` scan the real `documentation/**` + `CLAUDE.md` for broken links, missing anchors, stale phrases, and missing JS `Documentation:` targets | Negative fixtures prove missing-link-file, missing-link-anchor, stale-phrase, and missing-doc-target all fail; positive real-repo scan yields zero findings | `npm run check:doclinks`, `npm run docs:check`, and `npm run check:all` pass after deletion | docs/contract | Retired | Deleted 2026-07-13; link/anchor/stale/doc-target parity now belongs to the contract project and a maintained-tool link checker is deferred as a documented Node-only alternative |
| Documentation format | `check-doc-format.mjs --warn` | language/formatting | `markdownlint-cli2` plus `tests/contract/documentation-format-contract.test.js`; `check:docformat` remains as a compatibility alias to the contract test | Contract test scans maintained docs and proves missing titles, missing `**Status:**`, missing required sections, and the `TABLEOFCONTENTS.md` exception | `npm run check:docformat`, `npm run docs:check`, and `npm run check:all` pass after deletion | docs/contract | Retired | Deleted 2026-07-13; project-specific doc shape now belongs to the contract project instead of a warn-mode custom checker |
| Documentation reachability | `check-doc-reachability.mjs` | repository workflow | `tests/contract/documentation-reachability-contract.test.js` plus shared `tests/helpers/markdown-docs.js` walk links from `AGENTS.md`/`CLAUDE.md` and validate `.md` link targets exist | Negative fixtures prove an orphan doc and a broken `.md` link both fail; positive real-repo scan reports zero orphans and zero broken links | `npm run check:reachability`, `npm run docs:check`, and `npm run check:all` pass after deletion | docs/contract | Retired | Deleted 2026-07-13; reachability parity now belongs to the contract project; MkDocs explicit-navigation modelling remains a deferred documentation-build option |
| File size and one-liners | `check-file-size.mjs` | language/formatting | ESLint size/readability rules, Prettier, and possibly tiny Markdown line-limit helper | Scoped Prettier config proved whole-runtime formatting currently conflicts with this gate | Current file-size check passes | static-js/docs | Retained | Retain the irreducible 400-line/oneliner guard until source splits make whole-runtime formatting safe |
| JS headers/doc targets | `check-headers.mjs` | repository workflow | Focused JSDoc/types, docs links, architecture/package contract tests as needed | `tests/contract/documentation-links-contract.test.js` proves existing `Documentation:` targets pass, missing `Documentation:` targets fail, and universal `Module`/`Depends` headers are not required; dependency reality is covered by component registry contracts | `npm run docs:check`, `npm run check:core`, and `npm run check:all` pass after deletion | static-js/docs | Retired | Deleted 2026-07-13; universal header boilerplate is intentionally retired, doc targets are enforced by `docs:check`, and checker/sync/hook-oriented script total is 7,205 lines |
| Static smell patterns | `check-patterns.mjs` and rule modules | mixed | ESLint, TypeScript, Stylelint, actionlint, jscpd, contract tests, narrow structural checks | ESLint/Stylelint/actionlint/jscpd added; retained AvNav smell rules pass with zero failures/warnings | `check:standard` and current pattern check pass | static-js/contract | Retained | Retain project-specific boundary rules; generic overlaps are covered by standard tools/contracts |
| GitHub Actions workflow syntax | Manual review and GitHub-side failures | repository workflow | Pinned upstream `rhysd/actionlint` v1.7.12 through `npm run actions:lint` and `check:standard` | Official release metadata and SHA-256 digests verified; local command validates both workflow files | `npm run actions:lint` and `npm run check:standard` pass | static-js | Retained | Retain tiny installer/runner; no custom workflow parser added |
| Falsy default preservation contract | `check-smell-contracts.mjs` (`falsy-default-preservation`) | behavioral/domain invariant | Runtime Vitest tests in `tests/runtime/format-runtime.test.js` and `tests/runtime/widget-registrar.part2.test.js`, plus static `default-truthy-fallback` pattern rule | Tests prove `applyFormatter(null, { default: ""/0/false })` and widget registration preserve explicit falsy defaults | `npx vitest run tests/runtime/format-runtime.test.js tests/runtime/widget-registrar.part2.test.js tests/runtime/format-runtime-boundary.test.js` and `npm run check:smells` pass after deletion | unit-dom/static-js | Retired | Deleted 2026-07-13; behavior now belongs to ordinary runtime tests and the static truthy-fallback rule |
| Formatter boundary empty-string contract | `check-smell-contracts.mjs` (`formatter-boundary-empty-string`) | behavioral/domain invariant | Runtime Vitest boundary tests in `tests/runtime/format-runtime-boundary.test.js` | Tests prove empty and whitespace formatter inputs return the configured default while zero and numeric strings still reach formatters | `npm run test:node -- tests/runtime/format-runtime-boundary.test.js` and `npm run check:smells` pass after deletion | unit-node/static-js | Retired | Deleted 2026-07-13; behavior now belongs to ordinary runtime tests instead of semantic checker VM replay |
| Mapper output finite-number contract | `check-smell-contracts.mjs` (`mapper-output-no-nan`) | behavioral/domain invariant | Mapper Vitest unit contract in `tests/cluster/mappers/mapper-output-finiteness.test.js` plus static renderer coercion rule | Test matrix proves representative radial mapper outputs contain no nested non-finite numbers; negative helper assertion proves nested `NaN` is rejected | `npm run test:node -- tests/cluster/mappers/mapper-output-finiteness.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` and `npm run check:smells` pass after deletion | unit-node/static-js | Retired | Deleted 2026-07-13; mapper finiteness now belongs to ordinary mapper unit tests |
| Dynamic store-key clearing contract | `check-smell-contracts.mjs` (`dynamic-storekey-clears-on-empty`) | behavioral/domain invariant | Config-cluster Vitest tests in `tests/config/clusters/environment.test.js` and `tests/config/clusters/vessel.test.js` | Tests prove pressure and voltage update functions remove stale `storeKeys.value` when dynamic KEY input is blank and preserve/update the key when valid | `npm run test:node -- tests/config/clusters/environment.test.js tests/config/clusters/vessel.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` and `npm run check:smells` pass after deletion | unit-node/static-js | Retired | Deleted 2026-07-13; dynamic-key clearing now belongs to ordinary config-cluster tests |
| Theme cache invalidation contract | `check-smell-contracts.mjs` (`theme-cache-invalidation`) | behavioral/domain invariant | Runtime theme Vitest test in `tests/runtime/theme-runtime.part4.test.js` | Test proves identical canonical root state reuses frozen snapshots without recomputing styles, input variable changes invalidate the cache, output vars do not affect snapshot identity, and new resolver instances create fresh snapshots | `npm run test:dom -- tests/runtime/theme-runtime.part4.test.js`, `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js`, and `npm run check:smells` pass after deletion | unit-dom/static-js | Retired | Deleted 2026-07-13; theme cache behavior now belongs to ordinary runtime tests |
| Coordinate formatter heuristic contract | `check-smell-contracts.mjs` (`coordinate-formatter-no-raw-equality-fallback`) | obsolete or low-signal heuristic | Existing `check-patterns` rule `formatter-availability-heuristic` | `tests/tools/check-patterns.part2.test.js` proves `out.trim() === String(raw)` is blocked generically across widget/shared/runtime/config scopes | `npm run test:node -- tests/tools/check-patterns.part2.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` and `npm run check:smells` pass after deletion | static-js | Retired | Deleted 2026-07-13; duplicate position-coordinate-specific smell rule is replaced by the generic maintained pattern rule |
| State-screen precedence contract | `check-smell-contracts.mjs` (`state-screen-precedence-contract`) | behavioral/domain invariant | Contract Vitest test in `tests/contract/state-screen-precedence-contract.test.js` | Test scans repository `pickFirst(...)` call sites and includes negative fixtures for indirect candidates, missing `data`, canonical-order drift, and invalid AIS hidden-first shape | `npm run test:contract -- tests/contract/state-screen-precedence-contract.test.js` and `npm run check:smells` pass after deletion | contract/static-js | Retired | Deleted 2026-07-13; state-screen call-site order now belongs to the contract test suite |
| Dash-literal placeholder contract | `check-smell-contracts.mjs` (`dash-literal-contract`) | behavioral/domain invariant | Contract Vitest test in `tests/contract/placeholder-literal-contract.test.js` | Test scans repository source and includes negative fixtures for `"NO DATA"` and dash-only placeholders outside the documented owners plus a positive owner exemption | `npm run test:contract -- tests/contract/placeholder-literal-contract.test.js` and `npm run check:smells` pass after deletion | contract/static-js | Retired | Deleted 2026-07-13; placeholder literal ownership now belongs to the contract test suite |
| Canonical helper completeness contract | `check-smell-contracts.mjs` (`canonical-helper-completeness`) | behavioral/domain invariant | Contract Vitest test in `tests/contract/canonical-helper-api-contract.test.js` | Test loads the canonical helper UMD modules through component-context mocks, checks documented API functions, and proves the local missing-function assertion rejects absent exports | `npm run test:contract -- tests/contract/canonical-helper-api-contract.test.js` and `npm run check:smells` pass after deletion | contract/static-js | Retired | Deleted 2026-07-13; helper API completeness now belongs to the contract test suite |
| Placeholder normalization contract | `check-smell-contracts.mjs` (`placeholder-contract`) | behavioral/domain invariant | Contract Vitest test in `tests/contract/placeholder-normalization-contract.test.js` plus existing `tests/shared/format/PlaceholderNormalize.test.js` behavior checks | Contract test scans repository `applyFormatter(...)` call sites, rejects missing nearby normalization, accepts render-boundary normalization, and proves sentinel strings must normalize to default text | `npm run test:contract -- tests/contract/placeholder-normalization-contract.test.js` and `npm run check:smells` pass after deletion | contract/static-js | Retired | Deleted 2026-07-13; placeholder normalization now belongs to the contract test suite and sentinel behavior tests instead of source-string matching in the checker |
| Semantic smell contracts | `check-smell-contracts.mjs` (`smell-catalog-coverage`, `text-layout-hotspot-budget`) | behavioral/domain invariant | Contract Vitest tests in `tests/contract/smell-catalog-coverage-contract.test.js` and `tests/contract/hotspot-budget-contract.test.js`, with `check:smells` reduced to `check-patterns` | Tests prove live `check-patterns` rules must appear in the smell catalog and hotspot files fail when missing or over their local budgets | `npm run test:contract -- tests/contract/smell-catalog-coverage-contract.test.js tests/contract/hotspot-budget-contract.test.js`, `npm run check:smells`, and `npm run check:all` pass after deletion | contract/static-js | Retired | Deleted 2026-07-13; semantic smell invariants now belong to the contract project and the custom smell-contract checker is fully removed |
| Component dependencies | `check-dependencies.mjs` | architecture/dependency | Component registry contract suite | `tests/contract/component-registry-contract.test.js` proves dependency existence, allowed layer direction, acyclic graph, forbidden runtime-service deps, and retired owner-module path absence; `component-registry-contract-negative.test.js` proves malformed deps, invalid dep items, missing deps, unknown source/target layers, invalid layer direction, dependency cycles, forbidden component IDs, and forbidden component deps fail the replacement checks | `npm run test:contract` and `npm run check:core` pass after deletion | contract | Retired | Deleted 2026-07-13; dependency and retired owner-path parity now belong to the contract project and checker/sync/hook-oriented script total is 7,399 lines |
| Component naming | `check-naming.mjs` | irreducible AvNav static contract | Component registry/UMD contract suite plus ESLint naming where generic | `tests/contract/component-registry-contract.test.js` proves component ID/globalKey relation, unique global keys, unique JS paths, existing JS paths, registered-or-bootstrap-only source files, registered-script UMD global assignments, and cluster widget names matching config filenames; `component-registry-contract-negative.test.js` proves malformed names, unregistered files, mismatched globals, and mismatched returned IDs fail the replacement checks | `npm run test:contract` and `npm run check:core` pass after deletion | contract | Retired | Deleted 2026-07-13; naming parity now belongs to the contract project and checker/sync/hook-oriented script total is 7,705 lines |
| UMD wrapper/API shape | `check-umd.mjs` | irreducible AvNav static contract | Component load/registration Vitest contract | Existing contract project covers bootstrap/module/component-loader API shape; registry contract now proves every scanned `cluster/`, `shared/`, and `widgets/` source has the standard UMD wrapper, `DyniComponents` registration, and `create` export except documented bootstrap-only catalogs; negative fixtures prove missing wrappers, missing registrations, and missing create exports fail the replacement checks | `npm run test:contract` and `npm run check:core` pass after deletion | contract/browser | Retired | Deleted 2026-07-13; UMD wrapper/export parity now belongs to the contract project and checker/sync/hook-oriented script total is 7,705 lines |
| Coverage area thresholds | `check-coverage.mjs` | declarative schema/package | Vitest/V8 native global and glob thresholds | Native glob thresholds added for the four legacy area groups; a temporary config with `RadialValueMath.js` lines raised to 100% failed through Vitest's native threshold path | `npm run test:coverage:check` passes with only Vitest coverage thresholds after deletion | unit-and-coverage | Retired | Deleted 2026-07-13; current checker/sync/hook-oriented script total is 8,143 lines |
| Plugin/layout JSON shape | Manual review and layout tests | declarative schema/package | Ajv schemas in `schemas/plugin.schema.json` and `schemas/layout.schema.json` via `package:check` | `schema:check` rejects non-matching widget names and page keys; current schema explicitly models `CombinedWidget` grouping | `npm run schema:check` passes for `plugin.json`, `dyni-motorboat`, and `dyni-sailboat` | static-js/package | Implemented | Retain schemas; path existence is also covered by layout/release package tests |
| Local hook setup | `install-hooks.mjs`, `check-hooks.mjs`, `.githooks/` | repository workflow | `.pre-commit-config.yaml` local system hooks after CI is authoritative | `tests/tools/pre-commit-config.test.js` proves the local config runs `format:check`, `lint`, `actions:lint`, and `docs:check`, and excludes `check:all`/`perf:check` | `npm run test:node -- tests/tools/pre-commit-config.test.js`, `npm run check:core`, and `npm run check:all` pass after deletion | static-js | Retired | Deleted 2026-07-13; CI remains authoritative, local hooks are optional fast feedback, and checker/sync/hook-oriented script total is 7,133 lines |
| Release packaging | `release-*.mjs` | irreducible AvNav static contract | Retained/refactored package builder plus schema/contract tests in `package:check` | Release manifest test proves plugin layout refs are included and tests, tools, docs, exec plans, schemas, CI files, type declarations, package files, and dev-only quality configs are excluded | `npm run package:check` passes with schema validation and 3 release/package test files | package | Implemented | Retain compact custom release builder; package and bootstrap contracts stay in Node/jsdom/VM suites with no external browser dependency |
| Performance gate | `perf-*.mjs`, `tools/perf/*` | behavioral/domain invariant | Retain/refactor project-specific harness; isolate CI job | Controlled Node/jsdom lab reproduces the committed baseline without threshold or baseline changes | `npm run perf:check` passes all 45 checks | performance | Implemented | Retain project-specific scenarios and baselines |

---

## Implementation Order

### Phase 1 - Authoritative CI Around Existing Gates

Intent: make pull requests and releases visible and enforceable before replacing
any checker.

Deliverables:

- Add `.github/workflows/quality.yml` with separate quality and performance jobs
  initially running the existing gates unchanged:
  `npm ci`, `npm run check:core`, `npm run test:coverage:check`, and isolated
  `npm run perf:check`.
- Upload coverage/performance artifacts on failure.
- Add concurrency cancellation, least-privilege permissions, explicit timeouts,
  and a pinned Node major version.
- Update `publish-release.yml` so release publication depends on successful
  quality verification.
- Keep `.githooks/` unchanged during CI introduction; later hook retirement is
  tracked in the parity ledger.

Exit conditions:

- No old checker removed.
- Existing local gates still pass.
- README/CONTRIBUTING/quality docs mention CI authority where contributor-facing.

### Phase 2 - Standard Formatting/Linting In Parallel

Intent: introduce Prettier, ESLint flat config, Stylelint, and jscpd alongside
current checks.

Deliverables:

- Add used config files and scripts: `format`, `format:check`, `lint`,
  `actions:lint`, `duplication:check`.
- Keep runtime source type as `script`; explicitly forbid runtime `import` and
  `export`.
- Scope runtime, Node tools/config, and DOM test code separately.
- Keep old custom pattern/file-size/naming/header/dependency gates active.
- Record overlap and gaps in the ledger.

Exit conditions:

- New checks pass together with old checks.
- Prettier is scoped to package/workflow/quality config files until runtime
  source can be split or otherwise formatted without violating the 400-line
  gate.
- `no-unused-vars` is deferred because existing split test harness files share
  globals across parts; project-specific dead-code checks stay blocking.
- jscpd threshold `0.25` records the current 2-clone tooling baseline.
- Any formatting-only changes are isolated and mechanically reviewable.

### Phase 3 - Strict TypeScript `checkJs`

Intent: add strict semantic analysis without changing runtime delivery.

Deliverables:

- Add TypeScript configs and narrow ambient declarations under `types/`.
- Start with strict projects for shared value/math/format helpers and expand
  through runtime, mappers, registry, widgets, tests, and retained tools.
- Add `typecheck` and wire it to CI/check scripts.
- Record temporary exclusions with removal criteria.

Exit conditions:

- No emitted files.
- No broad `any` globals.
- No runtime ESM or npm imports.
- The authoritative scope is the 214-production-JS/220-total-file
  `tsconfig.checkjs.json` set. It covers
  shared format/value helpers, layout/geometry/responsive math, canvas/text/
  radial/linear kits, selected HTML/navigation/vessel helpers, editable and
  registry configuration, selected mappers/viewmodels, and runtime namespace,
  performance, canvas, DOM, formatter, registration, bootstrap manifest, unit-format catalog, anchor/environment/map cluster configuration, theme model, surface policy/session, asset-preload,
  component-loader, theme, cluster-shell, surface, host-commit, and temporary-bridge services. Test source remains outside `checkJs` because the split test harness deliberately shares globals; its behavior is still blocking through the split test, contract, coverage, lint, smell, and file-size gates. `noEmit` remains enabled.

### Phase 4 - Split Test Environments and Coverage

Intent: separate Node, jsdom, contract, and benchmark concerns.

Deliverables:

- Replace global jsdom setup with purpose-specific Vitest projects.
- Move canvas setup into DOM-specific setup.
- Express existing global and critical-area coverage floors using native Vitest
  thresholds.
- Keep browser-facing bootstrap and lifecycle coverage in jsdom integration and
  VM contract tests; add property/mutation scopes.

Exit conditions:

- Node-only tests run without jsdom/canvas setup.
- Coverage thresholds are at least as strict as the baseline.
- The completed scope adds `test:node`, `test:dom`, `test:contract`,
  `test:unit`, `test:split`, native Vitest global/glob coverage thresholds,
  property tests, and the on-demand `test:mutation` command. No quality command
  requires an external browser binary.

### Phase 5 - Replace Custom Checkers Rule By Rule

Intent: retire old scripts only after parity proof.

Deliverables:

- Convert semantic smell contracts into Vitest tests.
- Consolidate registry/dependency/naming/UMD checks into compact contract tests.
- Replace generic static smells with maintained rules/configuration where
  possible.
- Keep only small custom helpers for AvNav registry/package/perf contracts.

Exit conditions:

- Ledger has positive proof, clean proof, CI job, and deletion decision for each
  retired checker.

### Phase 6 - Documentation, Hooks, Release, and Final Gate

Intent: finish the contributor surface and release/package verification.

Deliverables:

- Canonicalize `AGENTS.md`, shorten `CLAUDE.md`, update README,
  CONTRIBUTING, TABLEOFCONTENTS, quality-gates, smell-prevention, and relevant
  docs.
- Add the documented Markdown/link contracts, schemas, pre-commit, package CI, and
  release-package contract tests.
- The completed scope adds `package:check` with Ajv schemas and focused
  release prepare/create/zip-builder tests, plus markdownlint-cli2 inside
  `docs:check`; `setup`, `check:fast`, `check:ci`, and `test:mutation` are now
  public commands backed by existing gates/configuration. Markdownlint and the
  Node-based link/format/reachability contracts provide the required
  documentation checks; a separate MkDocs presentation build remains optional.
  Browser automation is deliberately excluded from the local and CI development
  environment.
- Preserve deterministic AvNav packaging and avoid publishing a release.

Exit conditions:

- Final commands in the migration prompt pass or are explicitly recorded as
  environment-dependent.
- Final report includes outcome, toolchain, test architecture, coverage, retired
  and retained custom tooling, CI/release, docs, validation evidence, risks, and
  quantitative comparison.

---

## Acceptance Criteria

- [x] Runtime delivery remains raw UMD/plain script with no bundler or runtime
  npm dependency.
- [x] CI quality gates are authoritative before checker deletion begins.
- [x] Standard tools enforce generic formatting, linting, type, docs, coverage,
  duplication, hook, schema, and DOM/contract integration guarantees.
- [x] `check:all` and CI require no Playwright/browser binary; browser-facing
  bootstrap and lifecycle behavior remains covered by `test:dom` and
  `test:contract`.
- [x] Behavioral and AvNav-specific guarantees live in Vitest contract tests or
  compact retained helpers.
- [x] Coverage thresholds are no weaker than the baseline.
- [x] Performance scenarios and baselines remain meaningful and isolated.
- [x] Release artifacts exclude development tooling and are verified from source.
- [x] `AGENTS.md` is canonical; `CLAUDE.md` is not a duplicate rule catalog.
- [x] Public command surface is smaller and documented.
- [x] `npm run check:all` and the new CI-equivalent gate pass before completion.

---

## Validation Log

| Date | Command | Exit | Evidence |
|---|---:|---:|---|
| 2026-07-13 | `npm ci` | 0 | Installed 143 packages; install-script warning for `esbuild@0.21.5` |
| 2026-07-13 | `npm run check:core` | 0 | Static/docs/smell/dependency/UMD/naming gates passed |
| 2026-07-13 | `npm run test:coverage:check` | 0 | 370 files, 1,334 tests, 66.78s, coverage thresholds passed |
| 2026-07-13 | `npm run perf:check` | 0 | 45 checks, 0 violations |
| 2026-07-13 | `npm run check:all` | 0 | Post-Phase-1 full gate passed: 370 files, 1,334 tests, 68.11s coverage run, 45 perf checks |
| 2026-07-13 | `npm install --save-dev --save-exact prettier eslint @eslint/js globals @eslint-community/eslint-plugin-eslint-comments stylelint stylelint-config-standard jscpd` | 0 | Added 170 packages; npm audit reports 10 vulnerabilities; `esbuild@0.21.5` install script remains blocked by policy |
| 2026-07-13 | `npm run check:standard` | 0 | Scoped Prettier, ESLint, Stylelint, and jscpd passed; jscpd reports 2 baseline clones, 0.22% duplicated lines under threshold 0.25 |
| 2026-07-13 | `npm run check:core` | 0 | Post-Phase-2 static gate passed with `check:standard` included before legacy gates |
| 2026-07-13 | `npm run check:all` | 0 | Post-Phase-2 full gate passed: 370 files, 1,334 tests, 69.54s coverage run, coverage thresholds passed, 45 perf checks |
| 2026-07-13 | `npm install --save-dev --save-exact typescript` | 0 | Added TypeScript dev tooling; npm audit still reports 10 vulnerabilities; `esbuild@0.21.5` install script remains blocked by policy |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed for `PlaceholderNormalize` and UMD ambient declarations |
| 2026-07-13 | `npm run check:core` | 0 | Post-Phase-3-start static gate passed with `typecheck` wired after `check:standard` |
| 2026-07-13 | `npm run check:all` | 0 | Post-Phase-3-start full gate passed: 370 files, 1,334 tests, 70.37s coverage run, coverage thresholds passed, 45 perf checks |
| 2026-07-13 | `npm run test:node` | 0 | Vitest workspace `node-tools`: 19 files, 164 tests, no jsdom setup |
| 2026-07-13 | `npm run test:split` | 0 | Vitest workspace split: 370 files, 1,334 tests, Node tools + jsdom DOM project passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-Phase-4-start full gate passed: 370 files, 1,334 tests, 70.16s coverage run, coverage thresholds passed, 45 perf checks |
| 2026-07-13 | `npm run docs:check` | 0 | Passed after AGENTS/CLAUDE canonicalization; 75 Markdown docs, 209 JS files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Passed after deleting `check-ai-instructions.mjs` and `sync-ai-instructions.mjs`; jscpd baseline analyzed 247 files, 0.22% duplicated lines |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `ValueMath` to `tsconfig.checkjs.json` |
| 2026-07-13 | `npm run test -- tests/shared/value/ValueMath.test.js tests/shared/format/PlaceholderNormalize.test.js` | 0 | Focused shared-helper regression tests passed: 2 files, 13 tests |
| 2026-07-13 | `npm run check:all` | 0 | Current checkpoint full gate passed: 370 files, 1,334 tests, 69.45s coverage run, coverage thresholds passed, 45 perf checks |
| 2026-07-13 | `npm install --save-dev --save-exact ajv-cli` | 0 | Added Ajv CLI dev tooling after sandboxed network retry; npm audit now reports 12 vulnerabilities; `esbuild@0.21.5` install script remains blocked by policy |
| 2026-07-13 | `npm run schema:check` | 0 | Ajv validated `plugin.json`, `layouts/dyni-motorboat.json`, and `layouts/dyni-sailboat.json` |
| 2026-07-13 | `npm run check:core` | 0 | Passed with `schema:check` wired after `typecheck`; pattern scan covered 777 files |
| 2026-07-13 | `npm run check:all` | 0 | Post-schema full gate passed: 370 files, 1,334 tests, 68.01s coverage run, coverage thresholds passed, 45 perf checks |
| 2026-07-13 | `npm run package:check` | 0 | Ajv schema validation plus release prepare/create/zip-builder package tests passed: 3 files, 8 tests |
| 2026-07-13 | `npm run check:core` | 0 | Passed with `package:check` wired after `typecheck`; package stage ran schemas plus 3 release/package test files |
| 2026-07-13 | `npm run check:all` | 0 | Post-package-contract full gate passed: 370 files, 1,334 tests, 67.32s coverage run, coverage thresholds passed, 45 perf checks |
| 2026-07-13 | `npm run test:coverage` | 0 | Native Vitest global and four critical-area glob thresholds passed: 370 files, 1,334 tests, 66.17s |
| 2026-07-13 | `node tools/check-coverage.mjs` | 0 | Legacy area-threshold backstop passed against the same generated coverage summary |
| 2026-07-13 | `npm run docs:check` | 0 | Docs/link/format/reachability checks passed after coverage-threshold documentation sync |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after native coverage-threshold config and docs updates |
| 2026-07-13 | `npm run check:all` | 0 | Post-native-coverage full gate passed: 370 files, 1,334 tests, 67.46s coverage run, native and legacy coverage checks passed, 45 perf checks |
| 2026-07-13 | `npx vitest run tests/shared/radial/RadialValueMath.test.js --config /tmp/vitest.coverage-negative.config.cjs --coverage` | 1 | Negative proof: raised native `RadialValueMath.js` lines threshold to 100%; Vitest failed with lines 93.75% below threshold |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after deleting `tools/check-coverage.mjs` and simplifying `test:coverage:check` |
| 2026-07-13 | `npm run test:coverage:check` | 0 | Vitest-only coverage gate passed after checker deletion: 370 files, 1,334 tests, 69.23s |
| 2026-07-13 | `npm run check:all` | 0 | Post-coverage-checker deletion full gate passed: 370 files, 1,334 tests, 68.90s coverage run, 45 perf checks |
| 2026-07-13 | `npm install --save-dev --save-exact markdownlint-cli2` | 0 | Added maintained Markdown linter after sandboxed DNS retry; npm audit still reports 12 vulnerabilities; `esbuild@0.21.5` install script remains blocked |
| 2026-07-13 | `npm run docs:lint` | 0 | markdownlint-cli2 passed on 81 root/project docs with baseline-noisy style rules disabled |
| 2026-07-13 | `npm run docs:check` | 0 | markdownlint plus retained docs/link/format/reachability checks passed |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with `docs:check` wired into `check:core` |
| 2026-07-13 | `npm run check:all` | 0 | Post-markdownlint full gate passed: 370 files, 1,334 tests, 70.07s coverage run, 45 perf checks |
| 2026-07-13 | `npm run actions:lint` | 0 | Downloaded pinned `rhysd/actionlint` v1.7.12 Linux AMD64 archive, verified SHA-256, and validated `.github/workflows/*.yml` |
| 2026-07-13 | `npm run check:standard` | 0 | Passed with actionlint wired between ESLint/Stylelint and jscpd; jscpd reports the known 2-clone baseline, 0.22% duplicated lines |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after actionlint command-surface documentation updates: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with pinned actionlint included through `check:standard`; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-actionlint full gate passed: 370 files, 1,334 tests, 67.95s coverage run, native thresholds passed, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `RadialAngleMath`, `RadialSectorMath`, and `RadialValueMath` plus narrow component-context/radial ambient types |
| 2026-07-13 | `npm run test -- tests/shared/radial/RadialAngleMath.test.js tests/shared/radial/RadialValueMath.test.js tests/shared/radial/RadialTickMath.test.js` | 0 | Focused radial helper regressions passed: 3 files, 19 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after TypeScript scope documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded radial `checkJs` scope; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-radial-checkJs full gate passed: 370 files, 1,334 tests, 67.97s coverage run, global lines 93.62%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `LinearGaugeMath` plus narrow linear range/tick ambient types |
| 2026-07-13 | `npm run test -- tests/shared/linear/LinearGaugeMath.test.js` | 0 | Focused linear math regression passed: 1 file, 4 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after linear `checkJs` scope documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded linear `checkJs` scope; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-linear-checkJs full gate passed: 370 files, 1,334 tests, 67.91s coverage run, global lines 93.64%, linear lines 94.92%, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `StableDigits` plus narrow placeholder/stable-digits ambient types |
| 2026-07-13 | `npm run test -- tests/shared/format/StableDigits.test.js` | 0 | Focused stable-digits formatter regression passed: 1 file, 7 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after stable-digits `checkJs` scope documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 1 | Caught temporary `duplicate-functions` smell between a `StableDigits` typed `toText` initializer and canonical `ValueMath.toText`; fixed by using a typed `String` initializer until `create()` installs the canonical helper |
| 2026-07-13 | `npm run check:smells` | 0 | Pattern and smell-contract gates passed after removing the duplicate `toText` body |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded `StableDigits` `checkJs` scope; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-stable-digits-checkJs full gate passed: 370 files, 1,334 tests, 68.64s coverage run, global lines 93.64%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `LayoutRectMath` plus narrow rectangle/makeRect ambient types |
| 2026-07-13 | `npm run test -- tests/shared/layout/LayoutRectMath.test.js` | 0 | Focused layout rect regression passed: 1 file, 3 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after layout rect `checkJs` scope documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded `LayoutRectMath` `checkJs` scope; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-layout-rect-checkJs full gate passed: 370 files, 1,334 tests, 69.82s coverage run, global lines 93.64%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `GeometryScale` plus narrow scale API ambient types |
| 2026-07-13 | `npm run test -- tests/shared/layout/GeometryScale.test.js` | 0 | Focused geometry scale regression passed: 1 file, 4 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after geometry scale `checkJs` scope documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded `GeometryScale` `checkJs` scope; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-geometry-scale-checkJs full gate passed: 370 files, 1,334 tests, 67.22s coverage run, global lines 93.64%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `ResponsiveScaleProfile` plus narrow responsive-profile ambient types |
| 2026-07-13 | `npm run test -- tests/shared/layout/ResponsiveScaleProfile.test.js` | 0 | Focused responsive profile regression passed: 1 file, 8 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after responsive profile `checkJs` scope documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded `ResponsiveScaleProfile` `checkJs` scope; package tests, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-responsive-profile-checkJs full gate passed: 370 files, 1,334 tests, 67.19s coverage run, global lines 93.64%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node` | 0 | Vitest `unit-node` project passed in Node with no setup: 66 files, 380 tests |
| 2026-07-13 | `npm run test:contract` | 0 | Vitest `contract` project passed in Node with no setup: 10 files, 50 tests |
| 2026-07-13 | `npm run test:dom` | 0 | Vitest `unit-dom` project passed in jsdom with canvas setup: 294 files, 904 tests |
| 2026-07-13 | `npm run test:split` | 0 | Vitest workspace split passed across `unit-node`, `contract`, and `unit-dom`: 370 files, 1,334 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after workspace taxonomy documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with `test:contract` wired into `check:core`; package tests, contract project, smell checks, docs, size, headers, deps, UMD, and naming all passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-workspace-taxonomy full gate passed: 370 files, 1,334 tests, 61.95s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract` | 0 | Registry contract suite expanded: `contract` project passed with 11 files, 54 tests, including ID/globalKey/path uniqueness, dependency graph, layer direction, and runtime-owned service exclusion |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after registry contract documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded registry contract proof; 778 pattern files, 688 file-size targets, 140 components, 423 dependencies, 141 UMD/component files, and 141 naming component files passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-registry-contract full gate passed: 371 files, 1,338 tests, 61.30s coverage run, global lines 93.64%, global branches 80.94%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract` | 0 | Registry contract suite expanded: `contract` project passed with 11 files, 56 tests, including UMD wrapper, `DyniComponents` registration target, returned ID, and `create` export parity |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after UMD/create-export contract documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 1 | Caught temporary dense regex literal in `tests/contract/component-registry-contract.test.js`; fixed by splitting the `create` export matcher into a multi-line `RegExp` |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after regex cleanup: 688 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after UMD/create-export contract proof; 778 pattern files, 688 file-size targets, 140 components, 423 dependencies, 141 UMD/component files, and 141 naming component files passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-UMD-contract full gate passed: 371 files, 1,340 tests, 60.92s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract` | 0 | Registry contract suite expanded: `contract` project passed with 11 files, 59 tests, including broad component-source UMD/create-export scan, registered-or-bootstrap-only source check, and exact cluster widget-name parity |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after broad source contract expansion: 688 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after broad UMD/naming contract documentation sync: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with broad UMD/naming contract proof; 778 pattern files, 688 file-size targets, 140 components, 423 dependencies, 141 UMD/component files, and 141 naming component files passed |
| 2026-07-13 | `npm run check:all` | 0 | Post-broad-UMD/naming-contract full gate passed: 371 files, 1,343 tests, 61.09s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract` | 0 | Negative fixture proof added and helper split completed: `contract` project passed with 12 files, 65 tests |
| 2026-07-13 | `npm run format:check` | 0 | Prettier scoped formatting passed after removing `check:umd` and `check:naming` scripts from `package.json` |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after retiring `tools/check-umd.mjs` and `tools/check-naming.mjs`: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after helper split and negative fixtures: 690 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after deleting `tools/check-umd.mjs` and `tools/check-naming.mjs`; `check:core` now ends with headers and dependency checks after contract tests cover UMD/naming parity |
| 2026-07-13 | `npm run check:all` | 0 | Post-UMD/naming-checker-deletion full gate passed: 372 files, 1,349 tests, 60.55s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract` | 0 | Dependency negative fixture proof added before deletion: `contract` project passed with 12 files, 69 tests |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after dependency helper expansion: 690 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run format:check` | 0 | Prettier scoped formatting passed after removing `check:deps` and deleting `tools/check-dependencies.mjs` |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after dependency-checker retirement: markdownlint 81 files, 77 reachable docs |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after deleting dependency checker and its tool test: 689 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after deleting `tools/check-dependencies.mjs`; `check:core` now ends with `node tools/check-headers.mjs`, while dependency direction and retired owner-path parity live in `test:contract` |
| 2026-07-13 | `npm run check:all` | 0 | Post-dependency-checker-deletion full gate passed: 371 files, 1,351 tests, 60.98s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/tools/check-docs.test.js` | 0 | Documentation target replacement proof passed: 1 file, 3 tests covering valid `Documentation:` targets, missing targets, and no universal module-header requirement |
| 2026-07-13 | `npm run format:check` | 0 | Prettier scoped formatting passed after removing `check:headers` and deleting `tools/check-headers.mjs` |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after universal header rule retirement: markdownlint 81 files, 209 JS files scanned for optional `Documentation:` targets, 77 reachable docs |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after docs checker API test addition and header checker deletion: 690 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after deleting `tools/check-headers.mjs`; `check:core` now ends with `npm run check:filesize`, while optional JS doc target validation lives in `docs:check` |
| 2026-07-13 | `npm run check:all` | 0 | Post-header-checker-deletion full gate passed: 372 files, 1,354 tests, 61.75s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/tools/pre-commit-config.test.js` | 0 | Pre-commit replacement proof passed: 1 file, 1 test covering optional fast local hooks and excluding full/performance gates |
| 2026-07-13 | `npm run format:check` | 0 | Prettier scoped formatting passed with `.pre-commit-config.yaml` included in the formatted config surface |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after retiring `.githooks/` docs: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after adding the pre-commit config test: 691 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after deleting `.githooks/`, `tools/install-hooks.mjs`, and `tools/check-hooks.mjs`; pattern scan covered 781 files |
| 2026-07-13 | `npm run check:all` | 0 | Post-hook-retirement full gate passed: 373 files, 1,355 tests, 62.61s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/tools/package-scripts.test.js` | 0 | Command-surface proof passed: 1 file, 3 tests covering `setup`, bounded `check:fast`, and `check:ci` aliasing the complete gate |
| 2026-07-13 | `npm run check:fast` | 0 | Fast local gate passed: `check:standard`, `typecheck`, and `unit-node` project with 68 files and 385 tests |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after command-surface documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:ci` | 0 | CI-equivalent alias passed through `check:all`: 374 files, 1,358 tests, 62.07s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:package -- tests/tools/release-zip-builder.test.js` | 0 | Release manifest exclusion proof passed: 3 files, 8 tests, including dev-only quality config and type declaration exclusions |
| 2026-07-13 | `npm run package:check` | 0 | Package gate passed after release manifest exclusion hardening: plugin/layout schemas valid and 3 release/package test files passed |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after release package documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after release package test hardening: 692 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed after release package exclusion proof; `package:check` validated schemas and 3 release/package test files |
| 2026-07-13 | `npm run check:all` | 0 | Post-release-package-hardening full gate passed: 374 files, 1,358 tests, 61.43s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/runtime/format-runtime-boundary.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Checker-side proof passed after retiring `formatter-boundary-empty-string`: unit-node ran the two checker files, 12 tests; `tests/runtime/format-runtime-boundary.test.js` is owned by unit-dom and was run separately |
| 2026-07-13 | `npx vitest run tests/runtime/format-runtime-boundary.test.js` | 0 | Runtime formatter boundary proof passed in unit-dom: 1 file, 3 tests covering empty/whitespace defaults and valid zero/numeric-string formatter pass-through |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after semantic-rule retirement: pattern check covered 782 files with 0 failures/warnings; smell contracts now report 11 checked rules and 0 failures |
| 2026-07-13 | `npm run check:all` | 1 | Core and coverage passed after `formatter-boundary-empty-string` retirement: 374 files, 1,357 tests, global lines 93.64%, global branches 80.95%; final `perf:check` failed one metric, `map_zoom_html wait_p95=2.154` above threshold 1.946 |
| 2026-07-13 | `npm run perf:check` | 1 | Standalone rerun reproduced the same single perf violation: `map_zoom_html wait_p95=2.315` above threshold 1.946; no baseline or threshold was weakened |
| 2026-07-13 | `npx vitest run tests/runtime/format-runtime.test.js tests/runtime/widget-registrar.part2.test.js tests/runtime/format-runtime-boundary.test.js` | 0 | Runtime formatter/registrar proof passed after retiring `falsy-default-preservation`: 3 files, 7 tests |
| 2026-07-13 | `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Checker test proof passed after retiring `falsy-default-preservation`: 2 files, 11 tests; semantic checker now has 10 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after second semantic-rule retirement: pattern check covered 782 files with 0 failures/warnings; smell contracts now report 10 checked rules and 0 failures |
| 2026-07-13 | `npm run perf:check` | 0 | Standalone perf rerun passed after the earlier wall-clock violation: 45 checks, 0 violations |
| 2026-07-13 | `npm run check:all` | 0 | Post-semantic-rule-retirement full gate passed: 374 files, 1,356 tests, 60.57s coverage run, global lines 93.64%, global branches 80.95%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/cluster/mappers/mapper-output-finiteness.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Mapper finiteness replacement proof passed: 3 files, 17 tests; semantic checker tool tests now cover 9 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `mapper-output-no-nan`: pattern check covered 783 files with 0 failures/warnings; smell contracts now report 9 checked rules and 0 failures |
| 2026-07-13 | `npm run check:all` | 0 | Post-mapper-finiteness-rule-retirement full gate passed: 375 files, 1,362 tests, 60.96s coverage run, global lines 93.64%, global branches 80.96%, mapper lines 94.70%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/config/clusters/environment.test.js tests/config/clusters/vessel.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Dynamic store-key clearing replacement proof passed: 4 files, 24 tests; semantic checker tool tests now cover 8 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `dynamic-storekey-clears-on-empty`: pattern check covered 783 files with 0 failures/warnings; smell contracts now report 8 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after dynamic store-key documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-dynamic-storekey-rule-retirement full gate passed: 375 files, 1,361 tests, 60.32s coverage run, global lines 93.64%, global branches 80.96%, mapper lines 94.70%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:dom -- tests/runtime/theme-runtime.part4.test.js` | 0 | Theme cache invalidation replacement proof passed: 1 file, 6 tests |
| 2026-07-13 | `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Checker test proof passed after retiring `theme-cache-invalidation`: 2 files, 8 tests; semantic checker tool tests now cover 7 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `theme-cache-invalidation`: pattern check covered 783 files with 0 failures/warnings; smell contracts now report 7 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after theme cache documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-theme-cache-rule-retirement full gate passed: 375 files, 1,361 tests, 60.28s coverage run, global lines 93.64%, global branches 80.97%, mapper lines 94.70%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:node -- tests/tools/check-patterns.part2.test.js tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Coordinate formatter heuristic replacement proof passed: 3 files, 19 tests; semantic checker tool tests now cover 6 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `coordinate-formatter-no-raw-equality-fallback`: pattern check covered 783 files with 0 failures/warnings; smell contracts now report 6 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after coordinate formatter rule documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-coordinate-formatter-rule-retirement full gate passed: 375 files, 1,360 tests, 67.77s coverage run, global lines 93.64%, global branches 80.96%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract -- tests/contract/state-screen-precedence-contract.test.js` | 0 | State-screen precedence replacement proof passed: 1 file, 5 tests; scans repository call sites and rejects indirect candidates, missing `data`, order drift, and invalid AIS hidden-first shape |
| 2026-07-13 | `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Smell-contract tool tests passed after state-screen rule deletion: 2 files, 6 tests; checker tests now cover 5 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `state-screen-precedence-contract`: pattern check covered 784 files with 0 failures/warnings; smell contracts now report 5 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after state-screen precedence documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-state-screen-rule-retirement full gate passed: 376 files, 1,364 tests, 58.02s coverage run, global lines 93.64%, global branches 80.96%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract -- tests/contract/placeholder-literal-contract.test.js tests/contract/state-screen-precedence-contract.test.js` | 0 | Placeholder literal and state-screen contract proofs passed together: 2 files, 9 tests |
| 2026-07-13 | `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Smell-contract tool tests passed after dash-literal rule deletion: 2 files, 5 tests; checker tests now cover 4 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `dash-literal-contract`: pattern check covered 785 files with 0 failures/warnings; smell contracts now report 4 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after dash-literal documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-dash-literal-rule-retirement full gate passed: 377 files, 1,367 tests, 57.75s coverage run, global lines 93.64%, global branches 80.96%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract -- tests/contract/canonical-helper-api-contract.test.js` | 0 | Canonical helper API replacement proof passed: 1 file, 2 tests; loads documented helper UMD APIs and proves missing-function detection |
| 2026-07-13 | `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Smell-contract tool tests passed after canonical-helper rule deletion: 2 files, 5 tests; checker tests now cover 3 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `canonical-helper-completeness`: pattern check covered 786 files with 0 failures/warnings; smell contracts now report 3 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after canonical-helper documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-canonical-helper-rule-retirement full gate passed: 378 files, 1,369 tests, 58.16s coverage run, global lines 93.64%, global branches 81.30%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract -- tests/contract/placeholder-normalization-contract.test.js` | 0 | Placeholder normalization replacement proof passed: 1 file, 5 tests; scans repository `applyFormatter(...)` call sites and rejects missing normalization while proving sentinel strings normalize to default text |
| 2026-07-13 | `npm run test:node -- tests/tools/check-smell-contracts.test.js tests/tools/check-smell-contracts.catalog.test.js` | 0 | Smell-contract tool tests passed after placeholder rule deletion: 2 files, 3 tests; checker tests now cover 2 live rules |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after retiring `placeholder-contract`: pattern check covered 787 files with 0 failures/warnings; smell contracts now report 2 checked rules and 0 failures |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after placeholder normalization documentation sync: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run check:all` | 0 | Post-placeholder-rule-retirement full gate passed: 379 files, 1,372 tests, 57.60s coverage run, global lines 93.64%, global branches 81.30%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run test:contract -- tests/contract/smell-catalog-coverage-contract.test.js tests/contract/hotspot-budget-contract.test.js` | 0 | Final smell-contract replacement proof passed: 2 files, 6 tests; catalog coverage and hotspot budgets now live in the contract project |
| 2026-07-13 | `npm run check:smells` | 0 | Smell gate passed after deleting `check-smell-contracts.mjs`: `check:smells` now delegates to `check:patterns`; pattern check covered 787 files with 0 failures/warnings |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after deleting smell-contract checker docs references: markdownlint 80 files, 75 Markdown link/doc-target files, 77 reachable docs |
| 2026-07-13 | `npm run test:node -- tests/tools/package-scripts.test.js` | 0 | Package script contract passed after simplifying `check:smells`: 1 file, 3 tests |
| 2026-07-13 | `npm run check:all` | 0 | Post-smell-contract-checker-deletion full gate passed: 379 files, 1,375 tests, 57.71s coverage run, global lines 93.64%, global branches 81.30%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run check:docformat` | 0 | Documentation format replacement proof passed: 1 file, 5 tests; scans maintained docs and rejects missing title/status/required sections while preserving the TOC exception |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after deleting `check-doc-format.mjs`: markdownlint 80 files, 75 Markdown link/doc-target files, doc-format contract 5 tests, 77 reachable docs |
| 2026-07-13 | `npm run test:node -- tests/tools/package-scripts.test.js` | 0 | Package script contract passed after rewiring `check:docformat`: 1 file, 3 tests |
| 2026-07-13 | `npm run check:all` | 0 | Post-doc-format-checker-deletion full gate passed: 380 files, 1,380 tests, 57.34s coverage run, global lines 93.64%, global branches 81.30%, mapper lines 94.70%, runtime lines 89.05%, linear lines 94.92%, radial lines 91.75%, 45 perf checks |
| 2026-07-13 | `npm run check:doclinks && npm run check:reachability` | 0 | Documentation links/reachability replacement proof passed: 2 files, 12 tests; negative fixtures prove missing-link-file, missing-link-anchor, stale-phrase, missing-doc-target, orphan docs, and broken `.md` links all fail, and the positive real-repo scan yields zero findings |
| 2026-07-13 | `npm run docs:check` | 0 | Docs gate passed after deleting `check-docs.mjs` and `check-doc-reachability.mjs`: markdownlint, doc-links contract (8 tests), doc-format contract (5 tests), and reachability contract (4 tests) all passed |
| 2026-07-13 | `npm run check:filesize` | 1 | Caught two `collapsed-literal` findings in the new `tests/helpers/markdown-docs.js` scan constants; fixed by expanding both array/Set literals to multiline form |
| 2026-07-13 | `npm run check:filesize` | 0 | File-size/oneliner gate passed after literal cleanup: 700 checked files, 0 violations, 0 oneliner findings |
| 2026-07-13 | `npm run check:all` | 0 | Post-docs-checker-retirement full gate passed: 381 files, 1,389 tests, coverage run global lines 93.64%, global branches 81.29%, 45 perf checks; remaining `tools/` checker/helper total is 5,279 lines (`check-file-size.mjs`, `check-patterns.mjs`, `check-patterns/*.mjs`, `components-registry-loader.mjs`) |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `RadialTickMath` plus narrow tick-option/sweep-info ambient types and a `mod` member on `DyniRadialAngleMathApi` |
| 2026-07-13 | `npm run test:node -- tests/shared/radial/RadialTickMath.test.js` | 0 | Focused radial tick regression passed: 1 file, 3 tests |
| 2026-07-13 | `npm run check:core` | 0 | Static gate passed with expanded `RadialTickMath` `checkJs` scope; format/lint/typecheck/package/contract/smell/docs/filesize all passed |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `DepthDisplayFormatter` plus narrow unit-formatter/depth-display ambient types modelling host-provided props as `unknown` at the boundary |
| 2026-07-13 | `npm run test:node -- tests/shared/format/DepthDisplayFormatter.test.js` | 0 | Focused depth formatter regression passed: 1 file, 3 tests |
| 2026-07-13 | `npm run check:all` | 0 | Full gate passed after docs-checker retirement plus `RadialTickMath`/`DepthDisplayFormatter` `checkJs` expansion: 381 files, 1,389 tests, global lines 93.65%, global branches 81.30%, 45 perf checks |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `NavModeRatio`, `TextFitMath`, `UnitAwareFormatter`, `LayoutSizingHelpers`, and `SpringEasing`, plus a `format` service on `DyniComponentContext`, `resolveFiniteNumber`/`appendUnit` on `DyniValueMathApi`, and narrow nav/text-fit/sizing/spring/formatter ambient types |
| 2026-07-13 | `npx vitest run tests/shared/anim/SpringEasing.test.js` | 0 | Focused spring-easing regression passed: 1 file, 8 tests; `TextFitMath` optional-number guard refactor is behavior-preserving |
| 2026-07-13 | `npm install --save-dev --save-exact fast-check` | 0 | Added `fast-check@4.9.0` dev-only; `esbuild@0.21.5` install script still blocked by policy; not referenced by any release-zip runtime file |
| 2026-07-13 | `npm run test:node -- tests/shared/property/math-invariants.property.test.js` | 0 | Property-based invariants passed: 1 file, 6 tests (clamp bounds, lerp range/endpoints, norm360/mod ranges, placeholder-to-string, finite tick angles) |
| 2026-07-13 | `npm run package:check` | 0 | Release/package exclusion still holds after adding `fast-check`: schemas valid, 3 release/package test files, 8 tests |
| 2026-07-13 | `npm install --save-dev --save-exact @stryker-mutator/core @stryker-mutator/vitest-runner` | 0 | Added StrykerJS 9.6.1 core + vitest runner dev-only; `esbuild@0.21.5` install script still blocked |
| 2026-07-13 | `npx stryker run --mutate shared/widget-kits/value/ValueMath.js` | 0 | Mutation harness validated end-to-end after setting `vitest.related=false`, a scoped `vitest.mutation.config.js`, and Stryker `ignorePatterns` for the Vitest workspace: 390 mutants, ValueMath score 73.33% (286 killed, 66 survived, 38 no-coverage), 0 errors, 0 timeouts. Full/critical-set run is on-demand/nightly |
| 2026-07-13 | `npm run check:patterns` | 1 | Caught a heap OOM: failed early Stryker runs left sandbox source copies under `artifacts/stryker-tmp/`, and `check-patterns` `SKIP_DIRS` did not exclude `artifacts/`, so it scanned 21,331 files. Fixed by removing the stale sandboxes and adding `artifacts` to `SKIP_DIRS` (generated output must never be scanned) |
| 2026-07-13 | `npm run check:patterns` | 0 | Pattern gate back to normal after the fix: 790 checked files, 0 failures; pattern tool tests still pass (2 files, 22 tests) |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `CenterDisplayMath` (18 files) plus narrow lat/lon, course/distance, and center-display ambient types |
| 2026-07-13 | `npx vitest run tests/shared/nav/CenterDisplayMath.test.js` | 0 | Focused center-display leg-math regression passed: 1 file, 3 tests |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding `AisTargetLayoutMath` and `EditRouteLayoutMath` (20 files) plus AIS identity-band ambient types; module helpers typed via `DyniValueMathApi` indexed access |
| 2026-07-13 | `npm run typecheck` | 0 | Strict no-emit `checkJs` passed after adding the dependency-free `RegattaTimerPhase`, `StateScreenInteraction`, `StateScreenLabels`, and `StateScreenPrecedence` helpers (24 files) plus their narrow ambient APIs |
| 2026-07-14 | `npm run typecheck` + `npm run check:all` | 0 | Parallel typing wave: two subagents typed the `text/` kit (8 files) and the `gauge`+`xte`+`state`-overlay/markup/text-fit batch (7 files), each self-verified with `tsc` and wrote modular ambient types to `types/text-kit.d.ts` and `types/misc-kit.d.ts`; integrated centrally to 39 `checkJs` files, global typecheck 0 errors, full gate green (382 files, 1,395 tests, global lines 93.65%, branches 81.38%, 45 perf checks). A third `vessel/` batch was reverted after its agent hit the session limit mid-run |
| 2026-07-14 | `npm run typecheck` + `npm run check:core` | 0 | Typed the radial `RadialTextFitting`/`RadialTextLayout` compat wrappers (41 files) once their underlying `CanvasTextFitting`/`CanvasTextLayout` APIs were typed; wrappers return the canvas API type via `Object.assign`, require overloads added; static gate green |
| 2026-07-14 | `npm run typecheck` | 0 | Typed `HtmlWidgetLifecycle` and `PreparedPayloadModelCache` (43 files); mount/signature and payload-cache ambient types added; three behavior-preserving guard refactors in the cache (typeof narrowing on shell dims/revision, and a throw-first buildModel guard so the closure sees a non-null function) |
| 2026-07-14 | `npm run check:all` | 1 | Static gate, all 382 test files / 1,395 tests, and V8 coverage thresholds passed; only `perf:check` failed on the wall-clock `map_zoom_html wait_p95` metric (2.06–2.23 vs threshold 1.946, baseline 1.081). Environmental, not a regression: this session's changes are JSDoc-only (cannot affect runtime timing), the perf op-count aggregates (`long_task_count_50ms`, top-5 `self_time_share`) still pass, and this is the same load-sensitive wall-clock metric that flaked earlier (line ~513). Machine load was elevated (1-day uptime + sustained gate/mutation runs); it still failed at load 1.39. Per §16, wall-clock thresholds are unreliable on loaded/shared runners and must NOT be loosened — the controlled-runner/nightly perf job is the authoritative wall-clock gate. No baseline or threshold was changed |
| 2026-07-14 | `npm run typecheck` | 0 | Continued from Claude's last run by promoting `types/pending/radial-kit.d.ts` to `types/radial-kit.d.ts`, adding `FullCircleRadialEngine.js` to `tsconfig.checkjs.json` (44 checked JS files at that checkpoint), and verifying the latest full-circle engine annotations against real radial/layout/cache ambient contracts. Audit result: `unknown` is intentional for host/widget payload boundaries, but required component APIs must be narrowed by `components.require(...)` overloads rather than left as `unknown` |
| 2026-07-14 | `npm run check:filesize`, `npm run test:contract -- tests/contract/component-registry-contract.test.js tests/contract/canonical-helper-api-contract.test.js`, `npm run docs:check`, `npm run check:patterns` | 0 | Recovered the hard line-limit gate after the typing wave: extracted HTML DOM root patching into `HtmlDomPatchUtils`, registered it before `HtmlWidgetUtils`, kept `HtmlWidgetUtils.patchInnerHtml` as a delegating public API, and removed non-public helper JSDoc bulk from radial text-layout files not yet in `checkJs`. File-size gate passed over 702 files with zero violations/oneliner findings; component registry/canonical helper contracts, docs, typecheck, and pattern gate all passed |
| 2026-07-14 | `npm run typecheck` + `npm run format:check` | 0 | Tightened the full-circle radial engine ambient contract after the `unknown` audit: `DyniFullCircleRendererSpec`, `DyniFullCircleEngineState`, and `DyniFullCircleRendererApi` now describe the internal renderer callback contract, while raw canvas/props/theme/config values remain `unknown` at the boundary. TypeScript exposed `DyniRadialToolkitApi.text` as an overly loose upstream member, so the radial toolkit now refines it to `DyniRadialTextApi` |
| 2026-07-14 | `npm run check:core` | 0 | Full static/core gate passed after the full-circle renderer spec tightening: scoped Prettier, ESLint, Stylelint, actionlint, jscpd, strict `checkJs`, schema/package tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run test:coverage:check` | 0 | Native Vitest/V8 coverage gate passed: 382 files, 1,395 tests, 61.31s; global coverage 93.65% statements/lines, 93.76% functions, 81.38% branches |
| 2026-07-14 | `npm run perf:check` | 1 | Current blocker: wall-clock perf gate failed 17 of 45 checks across `active_route_html`, `center_display_text`, `gpspage_all_widgets`, `map_zoom_html`, `speed_radial`, `wind_radial`, and `xte_text`. No baseline or threshold was weakened; this keeps `check:all` incomplete until the performance environment or scenarios are addressed under the performance-gate policy |
| 2026-07-14 | `npm run perf:check` | 0 | Strict perf gate rerun passed without baseline/threshold changes: 45 checks, 0 violations. The previous failure is recorded as transient load sensitivity, not a deterministic regression |
| 2026-07-14 | `npm run check:all` | 0 | Full local gate restored after the type/spec cleanup: core gate passed, coverage passed with 382 files / 1,395 tests in 58.26s and global coverage 93.65% lines/statements, 93.76% functions, 81.38% branches, then `perf:check` passed with 45 checks |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/radial/CanvasLayerCache.test.js` | 0 | Expanded strict no-emit `checkJs` to `shared/widget-kits/canvas/CanvasLayerCache.js` (45 checked JS files). Added narrow ambient layer/draw-size aliases used by the cache JSDoc; focused cache behavior tests passed with 5 tests |
| 2026-07-14 | `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `CanvasLayerCache` checkJs expansion and quality-gate documentation sync: markdownlint/doc contracts passed, then scoped formatting, linting, actionlint, jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and file-size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/radial/FullCircleRadialLayout.test.js tests/shared/radial/SemicircleRadialLayout.test.js` | 0 | Expanded strict no-emit `checkJs` to `FullCircleRadialLayout` and `SemicircleRadialLayout` (47 checked JS files). Existing radial layout JSDoc matched the ambient layout contracts; focused layout behavior tests passed with 15 tests |
| 2026-07-14 | `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the radial layout checkJs expansion and docs count sync: markdownlint/doc contracts passed, then scoped formatting, linting, actionlint, jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/radial/RadialCanvasPrimitives.test.js tests/shared/radial/FullCircleRadialEngine.test.js tests/shared/radial/SemicircleRadialEngine.test.js` | 0 | Expanded strict no-emit `checkJs` to `RadialCanvasPrimitives`, `RadialFrameRenderer`, and `RadialToolkit` (50 checked JS files). Tightened `GaugeToolkit.text` to `DyniCanvasTextLayoutApi` and made the existing `measureValueUnitFit` trailing `textOptions` parameter optional in source JSDoc/types so radial callers can use the documented shorter shape; focused radial primitive/engine tests passed with 15 tests |
| 2026-07-14 | `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the radial draw/frame/toolkit checkJs expansion and docs count sync: markdownlint/doc contracts passed, then scoped formatting, linting, actionlint, jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/radial/SemicircleRadialEngine*.test.js` | 0 | Expanded strict no-emit `checkJs` to `SemicircleRadialEngine` (51 checked JS files). Added the narrow semicircle renderer spec/memo/display contracts, kept the engine under the hard 400-line file limit at 391 lines, and verified the full split semicircle engine DOM suite with 12 files / 12 tests |
| 2026-07-14 | `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `SemicircleRadialEngine` checkJs expansion and docs count sync: markdownlint/doc contracts passed, then scoped formatting, linting, actionlint, jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run check:all` | 0 | Full local gate passed with the 51-file strict `checkJs` scope: core gate passed, coverage passed with 382 files / 1,395 tests and global coverage 93.65% lines/statements, 93.76% functions, 81.38% branches, then `perf:check` passed with 45 checks / 0 violations |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/linear/LinearCanvasPrimitives.test.js tests/shared/linear/LinearGaugeEngine*.test.js` | 0 | Expanded strict no-emit `checkJs` to `LinearCanvasPrimitives`, `LinearGaugeEngineDrawing`, and `LinearGaugeEngineSupport` (54 checked JS files). Added narrow linear canvas/drawing/static-key ambient contracts and verified the focused primitive plus split linear engine DOM suite with 25 files / 30 tests |
| 2026-07-14 | `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the linear canvas/drawing/support checkJs expansion and docs count sync: markdownlint/doc contracts passed, then scoped formatting, linting, actionlint, jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/linear/LinearGaugeLabelFit.test.js tests/shared/linear/LinearGaugeTextLayout.test.js tests/shared/linear/LinearGaugeTextLayout.part2.test.js` + `npm run test:dom -- tests/shared/radial/FullCircleRadialEngine*.test.js` | 0 | Verified the current 56-file strict `checkJs` scope after `LinearGaugeLabelFit` and `LinearGaugeTextLayout` were added; focused linear label/text-layout tests passed with 3 files / 11 tests and the split full-circle radial engine suite passed with 5 files / 10 tests. The `unknown` audit remains unchanged: host/widget payloads stay `unknown` at boundaries, while required component APIs are narrowed through ambient require overloads |
| 2026-07-14 | `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after syncing the strict `checkJs` count to 56 and recording the linear label/text-layout handoff. `check:core` initially stopped on Prettier formatting for `types/misc-kit.d.ts`; `npx prettier --write types/misc-kit.d.ts` fixed the declaration formatting, and the rerun passed format/lint/actionlint/jscpd/typecheck/package/contract/smell/docs/filesize gates |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/html/HtmlWidgetUtils.test.js tests/shared/html/HtmlMeasureUtils.test.js` + `npm run check:filesize -- shared/widget-kits/html/HtmlDomPatchUtils.js` | 0 | Expanded strict no-emit `checkJs` to `HtmlDomPatchUtils` (57 checked JS files). Added the narrow public DOM patch utility API, explicit DOM node/element JSDoc narrowing, and verified adjacent HTML helper behavior with 2 files / 14 DOM tests plus the file-size/oneliner gate |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/html/HtmlMeasureUtils.test.js tests/shared/html/HtmlWidgetUtils.test.js` + `npm run check:filesize -- shared/widget-kits/html/HtmlMeasureUtils.js` | 0 | Expanded strict no-emit `checkJs` to `HtmlMeasureUtils` (58 checked JS files). Promoted the narrow HTML measurement/fit-cache ambient API, added the required `HtmlWidgetUtils.toFiniteNumber` member, and verified the direct plus adjacent HTML helper DOM tests with 2 files / 14 tests |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/html/HtmlWidgetUtils.test.js tests/shared/html/HtmlMeasureUtils.test.js` + `npm run check:filesize -- shared/widget-kits/html/HtmlWidgetUtils.js` | 0 | Expanded strict no-emit `checkJs` to `HtmlWidgetUtils` (59 checked JS files). Promoted the full shared HTML widget helper ambient surface, including host-commit, ratio-mode, surface-policy, mirrored-context, and interaction helpers; focused adjacent HTML helper tests passed with 2 files / 14 tests |
| 2026-07-14 | `npm run typecheck` + editable-parameter type search | 0 | Handoff audit after Claude's latest `FullCircleRadialEngine.js` changes: strict `checkJs` still passes at 59 files; real config editables contain no unsupported `type: "..."` values. The many TypeScript/JSDoc `unknown` annotations are intentional at AvNav/browser/raw-prop boundaries, while required internal component APIs continue to be narrowed through ambient `components.require(...)` overloads |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/radial/SemicircleRadialTextLayout*.test.js` | 0 | Expanded strict no-emit `checkJs` to `SemicircleRadialTextLayout` (60 checked JS files). Added compact JSDoc for injected text-layout/cache helper handles and helper parameters; focused split DOM text-layout tests passed with 5 files / 5 tests |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/cluster/rendering/RoutePointsRenderModel.test.js tests/shared/nav/EditRouteRenderModel.test.js` | 0 | Expanded strict no-emit `checkJs` to `NavInteractionPolicy` (61 checked JS files). Added the narrow dispatch-policy ambient API and `ValueMath.toObject` surface; focused DOM consumer tests passed with 2 files / 8 tests |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/vessel/AlarmRenderModel.test.js` | 0 | Expanded strict no-emit `checkJs` to `AlarmRenderModel` (62 checked JS files). Added the narrow alarm render-model ambient API plus source JSDoc for the model boundary, text lookup, interaction policy, and injected `ValueMath` helpers; focused DOM model tests passed with 1 file / 7 tests |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/vessel/AlarmMarkup.test.js` | 0 | Expanded strict no-emit `checkJs` to `AlarmMarkup` (63 checked JS files). Added the narrow alarm markup ambient API plus compact source JSDoc for HTML assembly helpers, model/fit args, and injected `HtmlWidgetUtils`/`ValueMath.toObject`; focused DOM markup tests passed with 1 file / 5 tests |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:filesize -- shared/widget-kits/vessel/AlarmMarkup.js` + `npm run check:core` | 0 | Documentation and core gates passed after the `AlarmMarkup` checkJs expansion and docs count sync: Prettier scope, markdownlint/doc contracts, file-size/oneliner scan, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and full file-size scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/cluster/rendering/RoutePointsRenderModel*.test.js tests/shared/nav/RoutePointsHtmlFit*.test.js` | 0 | Expanded strict no-emit `checkJs` to `RoutePointsInfoText` (64 checked JS files). Added the route-points info-text args/result/API ambient contract plus source JSDoc around lat/lon, course/distance, stable-digits, and formatter boundaries; focused route-points DOM suites passed with 15 files / 25 tests |
| 2026-07-14 | `npm run check:core` | 0 | Full static/core gate passed after the `RoutePointsInfoText` checkJs expansion and docs count sync: scoped Prettier, ESLint, Stylelint, actionlint, jscpd, strict `checkJs`, schema/package tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/vessel/RegattaTimerAudio.test.js` | 0 | Expanded strict no-emit `checkJs` to `RegattaTimerAudio` (65 checked JS files). Added the narrow Web Audio constructor shim plus regatta audio engine/API ambient contracts and source JSDoc around context creation, tone playback, and teardown boundaries; focused DOM audio tests passed with 1 file / 6 tests |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:filesize -- shared/widget-kits/vessel/RegattaTimerAudio.js` + `npm run check:core` | 0 | Documentation and core gates passed after the `RegattaTimerAudio` checkJs expansion and docs count sync: Prettier scope, markdownlint/doc contracts, focused file-size/oneliner scan, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and full file-size scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/cluster/rendering/RegattaTimerTextHtmlWidget.test.js tests/cluster/rendering/RegattaTimerTextHtmlWidget.part2.test.js` + `npm run check:filesize -- shared/widget-kits/vessel/RegattaTimerSessionStore.js` | 0 | Expanded strict no-emit `checkJs` to `RegattaTimerSessionStore` (66 checked JS files). Added the narrow regatta session-store API and host snapshot ambient contract plus source JSDoc around route identity, host persistence, registry persistence, and generic snapshot boundaries; focused regatta widget DOM tests passed with 2 files / 18 tests and the file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `RegattaTimerSessionStore` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/vessel/RegattaTimerMarkup.test.js` + `npm run check:filesize -- shared/widget-kits/vessel/RegattaTimerMarkup.js` | 0 | Expanded strict no-emit `checkJs` to `RegattaTimerMarkup` (67 checked JS files). Added the narrow regatta markup options/model/fit/config/API ambient contract plus source JSDoc around mode, color phase, interaction state, progress-bar percentage, and HTML assembly boundaries; focused markup DOM tests passed with 1 file / 6 tests and the file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `RegattaTimerMarkup` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + `npm run test:dom -- tests/shared/nav/EditRouteLayoutGeometry.test.js tests/shared/nav/EditRouteLayout.test.js tests/shared/nav/EditRouteRenderModel.test.js tests/shared/nav/EditRouteRenderModel.part2.test.js tests/shared/nav/EditRouteRenderModel.part3.test.js` + `npm run check:filesize -- shared/widget-kits/nav/EditRouteLayoutGeometry.js` | 0 | Expanded strict no-emit `checkJs` to `EditRouteLayoutGeometry` (68 checked JS files). Added the narrow edit-route geometry API plus name-rect, inline-value, metric-tile, and high-row argument/result contracts; focused edit-route layout/render-model DOM tests passed with 5 files / 29 tests and the file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `EditRouteLayoutGeometry` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | editable-parameter VM audit + `npm run docs:check` + focused `npm run check:filesize` | 0 | Loaded all cluster definitions and counted 663 typed editable specs, 45 AvNav built-in boolean shorthand entries, 4 documented per-kind caption/unit hide overrides, and 0 unknown `type` values. Corrected full-circle docs to say compact geometry is layout-owned as `state.layout.compactGeometryScale`; markdownlint/doc contracts and file-size/oneliner scan passed |
| 2026-07-14 | `npm run typecheck` + focused route-points DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `RoutePointsRowGeometry` (69 checked JS files). Added row-policy, row-cell, and layout-sizing ambient contracts plus compact source JSDoc; direct row-geometry/layout tests passed with 3 files / 23 tests, route-points render-model tests passed with 11 files / 13 tests, and the file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run typecheck` + focused route-points layout/fit/render-model DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `RoutePointsLayoutSizing` (70 checked JS files). Added the full route-points sizing helper API, marker/header argument contracts, and compact source JSDoc; route-points layout/fit tests passed with 7 files / 35 tests, render-model tests passed with 11 files / 13 tests, and the file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run typecheck` + focused AIS markup/widget DOM tests + focused `npm run check:filesize` + `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Expanded strict no-emit `checkJs` to `AisTargetMarkup` (71 checked JS files). Added the narrow AIS target markup model/fit/metric/API ambient contracts plus compact source JSDoc; direct markup and widget renderer tests passed with 13 files / 17 tests, docs/format checks passed, and the full static/core gate passed |
| 2026-07-14 | `npm run typecheck` + focused route-points markup/widget DOM tests + focused `npm run check:filesize` + `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Expanded strict no-emit `checkJs` to `RoutePointsMarkup` (72 checked JS files). Added the narrow route-points markup model/fit/geometry/API ambient contracts, removed redundant prepared-payload object coercion from markup assembly, verified direct markup plus widget renderer tests with 10 files / 18 tests, and passed the full static/core gate |
| 2026-07-14 | `npm run typecheck` + focused active-route layout/fit/widget DOM tests + focused `npm run check:filesize` + `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Expanded strict no-emit `checkJs` to `ActiveRouteLayout` (73 checked JS files). Added active-route layout mode/insets/result/API ambient contracts, localized layout helper dependencies inside `create(...)`, verified direct layout, HTML fit, and widget renderer tests with 3 files / 27 tests, and passed the full static/core gate |
| 2026-07-14 | `npm run typecheck` + focused alarm fit/widget DOM tests | 0 | Expanded strict no-emit `checkJs` to `AlarmHtmlFitChrome` (74 checked JS files). Added alarm chrome box/content/layout/signature API contracts plus the AIS visual chrome contract it consumes; focused AlarmHtmlFit and AlarmTextHtmlWidget tests passed with 11 files / 23 tests |
| 2026-07-14 | editable-parameter VM audit + `npm run docs:check` + focused `npm run check:filesize` + `npm run typecheck` + `npm run check:core` | 0 | Handoff correction after the Claude/Codex switch: verified `FullCircleRadialEngine.js` was Claude's last 59-file checkpoint and the repo now stands at 74 strict `checkJs` files. Editable audit found 663 typed specs, 45 AvNav built-in boolean shorthands, 4 documented per-kind caption/unit hide overrides, and 0 unknown `type` values; updated docs to prevent treating those hide overrides as unknown parameter types. Static/core gate passed |
| 2026-07-14 | `npm run typecheck` + focused edit-route DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `EditRouteMarkup` (75 checked JS files). Added the narrow edit-route markup metric/model/fit/API ambient contract plus source JSDoc around HTML assembly and state-screen render arguments; direct markup and widget renderer tests passed with 5 files / 19 tests, and the focused file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run typecheck` + focused center-display widget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `CenterDisplayRenderModel` (76 checked JS files). Added the narrow center-display display-state, measurement-hint, and render-model API ambient contracts plus source JSDoc for formatter and helper injection boundaries; center-display widget tests passed with 12 files / 17 tests, and the focused file-size/oneliner gate stayed clean |
| 2026-07-14 | `npm run typecheck` + focused edit-route fit/widget DOM tests | 0 | Expanded strict no-emit `checkJs` to `EditRouteHtmlFitSupport` (77 checked JS files). Added the narrow edit-route metric-model, measured-line, value-selection, and helper API ambient contracts plus source JSDoc around the fit-support boundary; edit-route fit and widget renderer tests passed with 8 files / 19 tests |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `EditRouteHtmlFitSupport` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + focused alarm fit/widget DOM tests | 0 | Expanded strict no-emit `checkJs` to `AlarmHtmlFit` (78 checked JS files). Added the narrow alarm fit model, mode-fit, theme resolver, compute-result, and helper API ambient contracts plus source JSDoc around the text-fit/cache boundary; alarm fit and widget renderer tests passed with 11 files / 23 tests |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `AlarmHtmlFit` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | `npm run typecheck` + focused center-display layout/widget DOM tests | 0 | Expanded strict no-emit `checkJs` to `CenterDisplayLayout` (79 checked JS files). Added the narrow center-display inset, panel, vertical-rect, layout-args/result, and layout API ambient contracts plus source JSDoc around the responsive layout boundary; direct layout and widget tests passed with 13 files / 26 tests |
| 2026-07-14 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `CenterDisplayLayout` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict `checkJs`, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and 702-file size/oneliner scan all passed |
| 2026-07-14 | editable-parameter VM audit + `npm run typecheck` + focused `FullCircleRadialEngine` DOM tests | 0 | Rechecked the user-reported unknown parameter-type concern after the Claude/Codex switch. Loaded all cluster definitions and counted 663 typed editable specs, 45 AvNav built-in boolean shorthands, 4 documented caption/unit hide overrides, and 0 unknown `type` values. Strict `checkJs` passed at 79 files, and the split full-circle radial engine DOM suite passed with 5 files / 10 tests |
| 2026-07-15 | `npm run typecheck` + focused AIS/alarm DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `AisTargetLayoutSizing` (80 checked JS files). Added the narrow AIS sizing mode, shell profile, inset, accent chrome, metric visibility, and full public API ambient contracts plus source JSDoc around coercion boundaries; AIS layout/fit/render-model and alarm-fit consumer tests passed with 4 files / 17 tests, and the focused file-size/oneliner gate stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `AisTargetLayoutSizing` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 702-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + complete focused AIS DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `AisTargetRenderModel` (81 checked JS files). Added narrow layout, shell-size, formatter/state/interaction, metric-value, build-model, and render-model API ambient contracts plus source JSDoc around raw-prop normalization and formatter boundaries; all AIS layout/fit/markup/render-model/widget suites passed with 29 files / 61 tests, and the focused file-size/oneliner gate stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `AisTargetRenderModel` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 702-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + complete focused AIS DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `AisTargetHtmlFit` (82 checked JS files). Added narrow AIS computed-layout, theme typography, metric-box, metric-fit, fit-args, and API ambient contracts plus source JSDoc around raw theme/DOM measurement boundaries; all AIS layout/fit/markup/render-model/widget suites passed with 29 files / 61 tests, and the focused file-size/oneliner gate stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `AisTargetHtmlFit` checkJs expansion and docs count sync: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 702-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + complete AIS/alarm DOM suite + focused `npm run check:filesize` | 0 | Split the 428-line `AisTargetLayoutGeometry` into 221-line metric-rectangle construction and 231-line `AisTargetLayoutGeometryStyles` CSS-grid serialization components. Registered the explicit dependency, updated AIS/alarm harnesses, and expanded strict no-emit `checkJs` to the rectangle builder (83 checked JS files); 31 focused DOM files / 71 tests and the 703-file size/oneliner scan passed |
| 2026-07-15 | `npm run typecheck` + complete AIS/alarm DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `AisTargetLayoutGeometryStyles` (84 checked JS files). Added the narrow geometry-layout/style serializer contract and source JSDoc around CSS-grid serialization; all AIS/alarm DOM suites remained green with 31 files / 71 tests, and the 703-file size/oneliner scan passed |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the AIS geometry split and 84-file strict checkJs expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused active-route DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `ActiveRouteHtmlFit` (85 checked JS files). Added narrow active-route display/model/metric/fit/cache/theme/API contracts plus source JSDoc at host and measurement boundaries; direct fit, layout, and widget renderer suites passed with 3 files / 27 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `ActiveRouteHtmlFit` strict checkJs expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + complete focused AIS/alarm DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `AisTargetLayout` (86 checked JS files). Added the complete AIS computed-layout/identity-layout/API contract and source JSDoc around dependency and branch boundaries; all AIS/alarm DOM suites passed with 40 files / 84 tests. The two alarm chrome-parity harnesses now load the required `AisTargetLayoutGeometryStyles` dependency introduced by the earlier geometry split; the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `AisTargetLayout` strict checkJs expansion and alarm harness dependency correction: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused edit-route DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `EditRouteHtmlFit` (87 checked JS files). Added narrow edit-route model/layout/metric/fit/theme/API contracts and source JSDoc around host, geometry, and measurement boundaries; fit, layout, markup, render-model, and widget suites passed with 14 files / 58 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `EditRouteHtmlFit` strict checkJs expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused route-points DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `RoutePointsHtmlFit` (88 checked JS files). Added narrow route-points model/layout/row/text-fit/theme/API contracts and source JSDoc around host, layout, and measurement boundaries; fit, layout, row-geometry, markup, render-model, DOM effects, and widget suites passed with 29 files / 78 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `RoutePointsHtmlFit` strict checkJs expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused route-points DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `RoutePointsDomEffects` (89 checked JS files). Added narrow host-effect state, delayed reveal, DOM-element, committed-effect, and API contracts plus source JSDoc at browser boundaries; direct DOM effects and route-points renderer suites passed with 22 files / 43 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `RoutePointsDomEffects` strict checkJs expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused edit-route DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `EditRouteRenderModel` (90 checked JS files). Added narrow edit-route shell/model/metric/interaction API contracts and source JSDoc around raw props, formatting, layout, and state-screen boundaries; fit, layout, markup, render-model, and widget suites passed with 14 files / 58 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the `EditRouteRenderModel` strict checkJs expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused map-zoom DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `MapZoomHtmlFit` (91 checked JS files). Added narrow map-zoom model, fit, cache, and theme contracts plus source JSDoc around host measurement boundaries; direct fit and renderer suites passed with 13 files / 25 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused regatta-timer DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `RegattaTimerHtmlFit` (92 checked JS files). Added narrow regatta fit model, host cache, theme, and API contracts plus source JSDoc at host measurement boundaries; direct fit and renderer suites passed with 3 files / 31 tests, and the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the MapZoom/Regatta strict checkJs batch expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to the cluster-route initializer/finalizer and eight route fragments (102 checked JS files). Added one narrow `DyniPlugin` cluster-route namespace contract for the browser global; route metadata behavior stayed unchanged and the focused 10-file size/oneliner scan passed |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the 10-file cluster-route strict checkJs batch expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/components.js` plus eight component registry fragments (111 checked JS files). Extended the shared browser plugin contract with component-registry shapes and added the assembly map annotation; component declarations stayed unchanged and the focused nine-file size/oneliner scan passed |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the nine-file component-registry strict checkJs batch expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused runtime contract/DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/namespace.js` and `runtime/PerfSpanHelper.js` (113 checked JS files). Added narrow mutable runtime namespace and perf-hook contracts plus source JSDoc at the external hook boundary; namespace contract plus perf DOM suites passed with 3 files / 8 tests, and the focused size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the runtime namespace/perf strict checkJs batch expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused canvas DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/canvas-runtime.js` (114 checked JS files). Added a narrow runtime canvas service contract and explicit 2D-context fail-fast narrowing; the canvas runtime DOM suite passed with 1 file / 1 test, and the focused size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused DOM runtime test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/dom-runtime.js` (115 checked JS files). Added narrow composed-tree node, target, and DOM service contracts plus source JSDoc at browser traversal boundaries; the DOM runtime suite passed with 1 file / 3 tests, and the focused size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` | 0 | Documentation and core gates passed after the runtime canvas/DOM strict checkJs batch expansion: scoped Prettier, markdownlint/doc contracts, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused editable/formatter DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/editable-defaults.js` and `runtime/format-runtime.js` (117 checked JS files). Added narrow editable-spec, runtime service, formatter option, and AvNav formatter contracts plus source JSDoc around raw config/formatter boundaries; editable-default and formatter suites passed with 3 files / 7 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused widget-registrar DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/widget-registrar.js` (118 checked JS files). Added narrow widget definition/spec, lifecycle/update, registration, and host API contracts plus source JSDoc around configuration, lifecycle, and AvNav registration boundaries; all split registrar suites passed with 5 files / 7 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` + `git diff --check` | 0 | Documentation, core, and whitespace gates passed after the runtime editable-default/formatter/widget-registrar strict checkJs expansion: scoped Prettier, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, the 703-file size/oneliner scan, and diff whitespace validation all passed |
| 2026-07-15 | `npm run typecheck` + focused surface runtime DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/surface/index.js` (119 checked JS files). Added narrow surface factory, policy route-state, controller option, and runtime API contracts plus source JSDoc at the surface-selection boundary; index and session-controller suites passed with 4 files / 14 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused editable configuration tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to widget-definition assembly plus `environment-editables`, `common-editables`, `editable-param-utils`, and `vessel-voltage-editables` (124 checked JS files). Added narrow editable builder, per-kind text descriptor, option, condition, and final widget-definition contracts plus source JSDoc at config assembly boundaries; focused Node/contract suites passed with 5 files / 18 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run format:check` + `npm run docs:check` + `npm run check:core` + `git diff --check` | 0 | Documentation, core, and whitespace gates passed after the editable-configuration strict checkJs batch: scoped Prettier, lint/actionlint/jscpd, strict checkJs, package/schema tests, 21 contract files / 108 tests, pattern gate, docs, the 703-file size/oneliner scan, and diff whitespace validation all passed |
| 2026-07-15 | `npm run typecheck` + focused mapper Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `AnchorMapper` and `CourseHeadingMapper` (126 checked JS files). Added narrow mapper-prop, route-context, and toolkit contracts plus source JSDoc at mapper input/output boundaries; direct mapper and mapper-output-finiteness suites passed with 3 files / 14 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused viewmodel Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `ActiveRouteViewModel` and `RoutePointsViewModel` (128 checked JS files). Added narrow viewmodel toolkit, mapper-prop, and ValueMath normalization contracts plus source JSDoc around raw route payloads and component injection; direct viewmodel suites passed with 2 files / 12 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused mapper Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `SpeedMapper` and `MapMapper` (130 checked JS files). Added unit-aware mapper-toolkit and optional AIS viewmodel contracts plus source JSDoc around mapper input/output boundaries; direct mapper and mapper-output-finiteness suites passed with 3 files / 22 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused mapper Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `WindMapper` and `DefaultMapper` (132 checked JS files). Added angle-formatter mapper-toolkit and raw formatter configuration contracts plus source JSDoc around mapper input/output boundaries; direct mapper and mapper-output-finiteness suites passed with 3 files / 17 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused asset-preloader DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/asset-preloader.js` (133 checked JS files). Added narrow asset declaration, preloader/cache, and fetch response contracts plus source JSDoc at the browser-asset boundary; the direct asset-preloader DOM suite passed with 1 file / 2 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused cluster-shell DOM suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/cluster/ClusterShellRenderer.js` (134 checked JS files). Added narrow route-frame, shell-renderer, host-commit, and global ValueMath component contracts plus source JSDoc around raw-prop/route-metadata boundaries; direct shell and downstream Regatta renderer suites passed with 2 files / 14 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused mapper Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `EnvironmentMapper` (135 checked JS files). Reused the established unit-aware mapper-toolkit contract and added source JSDoc at mapper input/output boundaries; direct mapper and mapper-output-finiteness suites passed with 2 files / 14 tests, and the focused 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm uninstall --save-dev --package-lock-only --ignore-scripts @playwright/test @vitest/browser` + `npm run check:all` | 1 | Removed unused browser-only dev dependencies and made the local/CI policy explicit: strict DOM integration and VM contract coverage remain required, but no gate may require Playwright, Chromium, or a browser driver. Core, package, docs, static, and coverage gates passed with 382 files / 1,395 tests and 93.80% global lines; the unchanged performance gate failed under current load (`gpspage_all_widgets max_long_task_ms=133.101` over 120 ms). No baseline or threshold changed |
| 2026-07-15 | `npm run perf:check` retry | 1 | Unchanged performance gate remained load-sensitive: `active_route_html wait_p95`, `gpspage_all_widgets long_task_count_50ms` and `max_long_task_ms`, and `map_zoom_html wait_p95` exceeded existing limits. This is an unresolved controlled-environment validation requirement, not a reason to weaken the gate |
| 2026-07-15 | `npm run typecheck` + bootstrap contract suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/plugin-bootstrap-core.js` (136 checked JS files). Added a narrow bootstrap namespace/options/loader contract, retained `unknown` at host/browser boundaries, and verified legacy/module bootstrap ordering and fallback behavior with 2 files / 16 contract tests; the 703-file size/oneliner scan stayed clean |
| 2026-07-15 | `npm run typecheck` + focused init contract suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/init.js` (137 checked JS files). Added narrow startup generation, host-action bridge, theme, component-loader, and AvNav registration contracts; its 7 lifecycle/registration tests and the size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused AlarmViewModel Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `cluster/viewmodels/AlarmViewModel.js` (138 checked JS files). Added narrow raw-alarm, active-alarm, output, and viewmodel contracts plus source JSDoc at the host-data boundary; its 6 focused unit tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused EditRouteViewModel Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `cluster/viewmodels/EditRouteViewModel.js` (139 checked JS files). Added narrow route-source, route-summary, props, and viewmodel contracts plus source JSDoc at the host-route boundary; its 10 focused unit tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused AisTargetViewModel Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `cluster/viewmodels/AisTargetViewModel.js` (140 checked JS files). Added narrow AIS target, color-state, props, and output contracts plus source JSDoc at the host-data boundary; its 9 focused unit tests and the 703-file size/oneliner gate passed. Numeric malformed AIS names now fail closed to MMSI instead of attempting string methods |
| 2026-07-15 | `npm run typecheck` + focused ClusterMapperToolkit Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `cluster/mappers/ClusterMapperToolkit.js` (141 checked JS files). Added narrow unit-format catalog, mapper-toolkit, and angle-normalization contracts plus source JSDoc at global configuration and mapper-prop boundaries; its 6 focused unit tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused VesselMapper Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `cluster/mappers/VesselMapper.js` (142 checked JS files). Added narrow mapper input and route-context contracts at the declaration boundary; direct mapper and mapper-output-finiteness suites passed with 4 files / 28 tests, and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused NavMapper Node suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `cluster/mappers/NavMapper.js` (143 checked JS files). Added narrow active-route, route-points, and edit-route viewmodel contracts while retaining the existing runtime-required-viewmodel checks; direct mapper and mapper-output-finiteness suites passed with 9 files / 28 tests, and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the mapper-toolkit, vessel, and nav strict `checkJs` batch: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + full RouteActivationController DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/cluster/RouteActivationPayloadBuilder.js` (144 checked JS files). Added narrow route/cache/toolkit/payload/loader/theme contracts, a typed preloaded `DyniValueMath` component boundary, and runtime namespace ownership; all 7 route-activation DOM test files / 10 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the RouteActivationPayloadBuilder strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + full RouteActivationController DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/cluster/RouteActivationLatestWins.js` (145 checked JS files). Added narrow latest-wins route metadata, pending-entry, promise resolver, dependency, and cancellation contracts; all 7 route-activation DOM test files / 10 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + full RouteActivationController DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/cluster/RouteActivationController.js` (146 checked JS files). Added narrow runtime service, route cache, toolkit, payload, latest-wins, activation snapshot, and renderer contracts while retaining all fail-fast availability checks; all 7 route-activation DOM test files / 10 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the full route-activation strict `checkJs` batch: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused TemporaryHostActionBridge DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/TemporaryHostActionBridgeDiscovery.js` (147 checked JS files). Added narrow host DOM, React-fiber, dispatch-handler, synthetic-event, and bridge-error contracts while keeping private host objects `unknown` until locally narrowed; 3 bridge DOM test files / 20 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the TemporaryHostActionBridgeDiscovery strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused SurfaceSessionController DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/SurfaceSessionController.js` (148 checked JS files). Added narrow surface, payload, controller lifecycle, session state, and perf span contracts while retaining fail-fast payload/service validation; 3 surface-session DOM test files / 13 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the SurfaceSessionController strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused component-loader contract tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/component-loader.js` (149 checked JS files). Added narrow registry, asset, module-API, loader, and component-context contracts while preserving dependency-cycle, cache, and fail-fast behavior; 2 contract test files / 12 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the component-loader strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused theme-runtime DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/theme-runtime.js` (150 checked JS files). Added narrow theme-model, resolver, fetch, root-style, and runtime contracts while retaining configure-before-use and shadow-CSS cache behavior; 4 DOM test files / 36 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused ClusterSurfacePolicy DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/surface/ClusterSurfacePolicy.js` (151 checked JS files). Added narrow host-action, capability, cache, route-state, policy, and shell-measurement contracts while preserving fail-closed action dispatch and non-enumerable prop materialization; its 8 focused DOM tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the ClusterSurfacePolicy strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused bootstrap manifest/component contract suites + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/bootstrap-manifest.js` (152 checked JS files). Added the authoritative bootstrap manifest config contract and typed the global configuration boundary; 3 contract test files / 21 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the bootstrap-manifest strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused unit-format-family DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `shared/unit-format-families.js` (153 checked JS files). Added narrow UMD global, selector-list, family, binding, and catalog contracts while retaining the immutable catalog export; its 2 focused DOM tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the unit-format-catalog strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run perf:check` | 0 | Reproduced the deterministic performance gate in the current controlled Node/jsdom lab. All 45 baseline comparison checks passed with the committed `core-lab-v1` baseline; no performance threshold or baseline changed |
| 2026-07-15 | `npm run check:all` + `git diff --check` | 0 | Clean full end-to-end quality checkpoint passed after correcting the unit-format catalog's original lazy namespace/config initialization: core gates, native coverage, deterministic perf (45 checks), and whitespace validation all passed. The earlier in-flight suite failures were from the pre-fix process; a fresh full process passed |
| 2026-07-15 | `npm run typecheck` + focused static-cluster Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/anchor.js` (154 checked JS files). Added narrow shared editable-builder/catalog and cluster-registration contracts while preserving the Anchor editable declaration; its focused static-cluster test and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the Anchor cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused environment-cluster Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/environment.js` (155 checked JS files). Added narrow generated-editable, default-depth-key, cluster-registration, and mutable update-payload contracts while preserving live selected-key behavior; its 10 focused Node tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the Environment cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused map-cluster Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/map.js` (156 checked JS files). Added narrow editable-builder/catalog, cluster-registration, and center-display visibility update contracts while preserving Map declaration behavior; its 2 focused Node tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the Map cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused theme-runtime DOM suite + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `runtime/theme/model.js` (157 checked JS files). Added narrow token/preset/catalog, nested-path, and theme-model factory contracts while retaining optional token metadata and dynamic mode paths; 4 DOM test files / 36 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the theme-model strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused static-cluster Node test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/course-heading.js` (158 checked JS files). Added narrow kind-map/editable-helper and cluster-registration contracts while preserving the CourseHeading declaration; its focused static-cluster test and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the CourseHeading cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused static-cluster Node tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/wind.js` (159 checked JS files). Added narrow shared editable-builder, kind-map, unit-format catalog, and cluster-registration contracts while preserving the Wind declaration; 2 focused static-cluster test files / 3 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the Wind cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused static-cluster Node tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/speed.js` (160 checked JS files). Added concrete per-unit range/token/field contracts plus shared editable-builder, unit-format catalog, and cluster-registration boundaries while preserving generated Speed parameters; 2 focused static-cluster test files / 3 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the Speed cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused default/static-cluster Node tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `config/clusters/default.js` (161 checked JS files). Added narrow shared editable-builder, kind-map, cluster-registration, and mutable update-payload contracts while preserving Default editable and selected-store-key behavior; 2 focused Node test files / 3 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the Default cluster strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused SpeedRadialWidget DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js` (162 checked JS files). Added the widget factory boundary, promoted the existing `ValueMath` display/tick API and radial warning/alarm theme color contracts, and normalized the formatter boundary to the engine's string display contract; its 3 focused DOM tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the SpeedRadialWidget strict `checkJs` expansion. An initial core pass correctly rejected a duplicated placeholder literal introduced during typing; replacing it with the canonical normalizer default restored all scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan |
| 2026-07-15 | `npm run typecheck` + focused DepthRadialWidget DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/DepthRadialWidget/DepthRadialWidget.js` (163 checked JS files). Added the widget factory boundary and normalized the intentionally broad depth-formatter fallback at the semicircle engine boundary; its 2 focused DOM tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the DepthRadialWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused TemperatureRadialWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js` (164 checked JS files). Added the widget factory boundary, the existing temperature tick-profile contract, and render-boundary fallback normalization; 2 focused DOM test files / 4 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the TemperatureRadialWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused VoltageRadialWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js` (165 checked JS files). Added the widget factory boundary, the existing voltage tick-profile contract, and render-boundary fallback normalization; 3 focused DOM test files / 4 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the VoltageRadialWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused SpeedLinearWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js` (166 checked JS files). Added the shared LinearGaugeEngine renderer-spec/API contract, linear warning/alarm theme colors, the widget factory boundary, and a narrow mapper-normalized sector-prop contract; 2 focused DOM test files / 4 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the SpeedLinearWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused DepthLinearWidget DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/DepthLinearWidget/DepthLinearWidget.js` (167 checked JS files). Added the widget factory boundary, typed depth formatter normalization, low-end sector options, and mapper-normalized threshold contracts; its 4 focused DOM tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the DepthLinearWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused TemperatureLinearWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js` (168 checked JS files). Added the widget factory boundary, temperature tick-profile usage, typed optional sector thresholds, and formatter fallback normalization; 3 focused DOM test files / 5 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the TemperatureLinearWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused VoltageLinearWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js` (169 checked JS files). Added the widget factory boundary, typed enable/disable and optional threshold props, and formatter fallback normalization while preserving low-end sector behavior; 3 focused DOM test files / 4 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the VoltageLinearWidget strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + focused WindLinearWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/WindLinearWidget/WindLinearWidget.js` (170 checked JS files). Added rich dual-metric display, draw-mode, layline theme, and layout-box contracts while preserving wind angle/speed formatting and layline behavior; 3 focused DOM test files / 5 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused DefaultLinearWidget and WindLinearWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js` (171 checked JS files). Added the mapper-normalized default threshold/color contract and retained the shared formatter/sector behavior; the combined focused wrapper suite passed with 4 files / 8 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused CompassLinearWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/linear/CompassLinearWidget/CompassLinearWidget.js` (172 checked JS files). Added linear frame-hook, custom-axis, tick-builder, marker-motion, and compass display contracts; 2 focused DOM test files / 4 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused DefaultRadialWidget DOM test + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js` (173 checked JS files). Added the mapper-normalized threshold/color and semicircle sector API contracts, plus canonical display normalization; its 3 focused DOM tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused ClockRadialWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/ClockRadialWidget/ClockRadialWidget.js` (174 checked JS files). Added typed clock-time/hand-angle parsing and full-circle cache/frame callback contracts; 2 focused DOM test files / 21 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused CompassRadialWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/CompassRadialWidget/CompassRadialWidget.js` (175 checked JS files). Added cached label-sprite, display, canvas-boundary, and motion contracts while preserving compass rotation and marker behavior; 3 focused DOM test files / 8 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused WindRadialWidget DOM tests + focused `npm run check:filesize` | 0 | Expanded strict no-emit `checkJs` to `widgets/radial/WindRadialWidget/WindRadialWidget.js` (176 checked JS files). Added wind display/metric, layline theme, formatter, and motion contracts while preserving full-circle sectors and text modes; 4 focused DOM test files / 8 tests and the 703-file size/oneliner gate passed |
| 2026-07-15 | `npm run typecheck` + focused depth formatter/widget DOM tests + `npm run check:patterns` | 0 | Promoted the shared `DepthDisplayFormatter.createCanvasFormatDisplay` boundary and removed the duplicate normalization functions from `DepthLinearWidget` and `DepthRadialWidget`; strict typecheck, 2 widget files / 6 focused tests, and the smell-pattern scan passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the seven-widget strict `checkJs` batch and depth formatter consolidation: scoped formatting, ESLint/Stylelint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core and whitespace gates passed after the theme-runtime strict `checkJs` expansion: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run check:core` + `git diff --check` | 0 | Core gate and whitespace validation passed after the three-viewmodel strict `checkJs` batch: scoped formatting, lint/actionlint/jscpd, strict typecheck, package checks, 21 contract files / 108 tests, smell checks, documentation checks, and the 703-file size/oneliner scan all passed |
| 2026-07-15 | `npm run typecheck` + strict inventory audit | 0 | Completed the production-source strict `checkJs` expansion at 214 JavaScript files plus six declaration files (220 total), with no duplicate `tsconfig.checkjs.json` entries. Test harness sources remain covered by their split Node/jsdom/VM-contract and lint gates. |
| 2026-07-15 | Focused affected suites + `npm run check:filesize` | 0 | Full-circle radial text, linear engine/layout, HTML utilities, and RoutePoints suites passed: 61 files / 130 tests; the 704-file size/oneliner gate passed with zero violations and zero findings. |
| 2026-07-15 | `npm run check:core` | 0 | Final core gate passed: scoped formatting, ESLint/Stylelint/actionlint/jscpd, strict typecheck, Ajv/package contracts, 21 contract files / 108 tests, all smell rules, docs contracts, and the 704-file size/oneliner scan. |
| 2026-07-15 | `npm run test:coverage:check` | 0 | Native V8 coverage passed with 382 test files / 1,396 tests; global lines 94.03%, branches 81.36%, functions 93.24%, with critical-area thresholds unchanged and passing. |
| 2026-07-15 | `npm run perf:check` | 0 | Controlled Node/jsdom performance gate passed all 45 checks against `core-lab-v1`; no baseline or threshold changed. |
| 2026-07-15 | `npm run check:all` | 0 | Final aggregate gate passed core, native coverage, and deterministic performance together. No Playwright, Chromium download, browser driver, or external browser automation is required. |

## Related

- [AGENTS.md](../../AGENTS.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [documentation/TABLEOFCONTENTS.md](../../documentation/TABLEOFCONTENTS.md)
- [documentation/conventions/coding-standards.md](../../documentation/conventions/coding-standards.md)
- [documentation/conventions/smell-prevention.md](../../documentation/conventions/smell-prevention.md)
- [documentation/conventions/quality-gates.md](../../documentation/conventions/quality-gates.md)
