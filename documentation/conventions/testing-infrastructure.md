# Testing Infrastructure

**Status:** ✅ Implemented | Vitest baseline, split projects, helper catalog, and HTML widget test pattern

## Overview

dyninstruments uses Vitest for unit, tool, and integration tests. Coverage runs
with native global and critical-area thresholds, while `test:split` separates
Node-only unit/tool tests, VM-based contract tests, and DOM/runtime/widget tests.

## Key Details

- Coverage environment: Vitest + jsdom via `vitest.config.js`.
- Coverage thresholds: global floors plus area floors for cluster mappers,
  runtime, radial math core, and dynamic cluster update config files.
- Split environments: `unit-node` and `contract` run without jsdom; `unit-dom`
  uses jsdom and the canvas setup.
- Test locations: `tests/**/*.test.js`.
- Structure: `tests/` mirrors runtime/source modules and feature areas.

## Vitest Configuration

`vitest.config.js` baseline:

- `environment: "jsdom"`
- `globals: true`
- `setupFiles: ["tests/setup/vitest.setup.js"]`
- `include: ["tests/**/*.test.js"]`
- `coverage.thresholds`: global and glob-specific coverage floors

`vitest.config.js` `test.projects` split projects:

| Project | Environment | Scope | Setup |
|---|---|---|---|
| `unit-node` | `node` | Pure shared math/format/layout, mapper/viewmodel/config, and tool tests | none |
| `contract` | `node` | VM-based component registry, UMD registration/API-shape, dependency graph, plugin bootstrap, bundled layout, and runtime loading contracts | none |
| `unit-dom` | `jsdom` | Remaining DOM/runtime/widget/integration tests | `tests/setup/vitest.setup.js` |

Commands:

- `npm run test:node` — `unit-node` only, no jsdom/canvas setup
- `npm run test:contract` — AVnav/plugin registry, source-shape, cluster config, and bootstrap contracts
- `npm run test:dom` — `unit-dom` jsdom/canvas-backed tests
- `npm run test:unit` — `unit-node` plus `unit-dom`
- `npm run test:split` — all configured Vitest projects

## Global Setup (`tests/setup/vitest.setup.js`)

jsdom does not implement Canvas 2D APIs, so global setup installs a deterministic `HTMLCanvasElement.getContext("2d")` mock.

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

- `tests/helpers/eval-iife.js` — `createScriptContext` and `runIifeScript` for isolated execution of UMD/IIFE scripts in controlled VM contexts.
- `tests/helpers/load-umd.js` — `loadFresh` for loading UMD modules with clean require cache and optional dependency injection defaults.
- `tests/helpers/component-context-mock.js` — `createComponentContextMock` for building `componentContext` mocks (component require, theme tokens, format, canvas, dom, perf, host actions).
- `tests/helpers/mock-canvas.js` — canvas/2D mock factories for widget tests that need deterministic drawing and call tracing.
- `tests/helpers/mock-dom.js` — DOM harness utilities (`createElement`, `head.appendChild`, async load callbacks) for module-loader/runtime tests.
- `tests/helpers/mapper-route-context.js` — mapper route context factory for route-aware mapper tests.
- `tests/helpers/unit-format-families.js` — unit-format family install helper for formatter/unit-binding tests with optional binding overrides.

## Browser API Mocking Policy

- Canvas 2D: globally mocked in `tests/setup/vitest.setup.js`.
- Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`): mock in the individual test file when needed.
- Missing DOM measurement APIs (or other unsupported browser APIs): provide per-test mocks or use existing helper harnesses.

## Committed HTML Widget Test Pattern

Standard lifecycle test flow:

1. Load widget module via `loadFresh(...)` with mocked dependencies as needed.
2. Build `componentContext` using `createComponentContextMock(...)`.
3. Create component instance via `module.create(def, componentContext)`.
4. Create host mount element (`document.createElement("div")`).
5. Execute committed renderer lifecycle (`mount`/`update`/`postPatch`/`detach`/`destroy`) and assert DOM, class/state, and interaction behavior.

Use the required matrix in `documentation/guides/add-new-html-kind.md` Step 7 for HTML-kind lifecycle/interaction/layout coverage scope.

## Related

- [coding-standards.md](coding-standards.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
