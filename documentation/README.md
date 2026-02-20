# dyninstruments — Modern Instrument Widgets for AvNav

**Status:** ✅ Functional | modular runtime/config and split gauge core in place

## Stack

- **Runtime:** Browser ES6+ JavaScript, Canvas 2D
- **Module System:** UMD, runtime-loaded via `<script>`
- **Host App:** AvNav
- **API:** `avnav.api.registerWidget()` — [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **Styling:** CSS scoped to `.dyniplugin` / `[data-dyni]`
- **Dev Test Tooling:** Node.js + Vitest (`package.json`, `vitest.config.js`)

## Architecture

- Root architecture map (AI session orientation): [../ARCHITECTURE.md](../ARCHITECTURE.md)

```text
plugin.js (entry point)
├── validates AvNav globals and computes base URL
├── bootstraps internal scripts in fixed order
└── starts runtime.runInit()

runtime/
├── namespace.js          — namespace container
├── helpers.js            — Helpers factory
├── editable-defaults.js  — defaults from editableParameters
├── component-loader.js   — component JS/CSS loader + dependency resolution
├── widget-registrar.js   — widget definition merge + register
└── init.js               — load components -> register widgets

config/
├── components.js         — component registry (`config.components`)
├── widget-definitions.js — widget definition list (`config.widgetDefinitions`)
├── shared/               — kind defaults + shared editables/helpers
└── clusters/             — per-cluster widget definitions

cluster/
├── ClusterWidget.js       — cluster orchestrator
├── rendering/             — renderer router
└── mappers/               — per-cluster mapper components

shared/
└── widget-kits/gauge/     — reusable gauge math/layout/draw engine

widgets/
├── text/ThreeValueTextWidget/
├── text/PositionCoordinateWidget/
└── gauges/
   ├── WindDialWidget/
   ├── CompassGaugeWidget/
   ├── SpeedGaugeWidget/
   ├── DepthGaugeWidget/
   ├── TemperatureGaugeWidget/
   └── VoltageGaugeWidget/
```

## Cluster Widgets (7 total)

| Widget Name | Cluster |
|---|---|
| `dyninstruments_CourseHeading` | `courseHeading` |
| `dyninstruments_Speed` | `speed` |
| `dyninstruments_Environment` | `environment` |
| `dyninstruments_Wind` | `wind` |
| `dyninstruments_Nav` | `nav` |
| `dyninstruments_Anchor` | `anchor` |
| `dyninstruments_Vessel` | `vessel` |

## Documentation Map

**Core:** [core-principles.md](core-principles.md)

**AvNav API:** [plugin-lifecycle.md](avnav-api/plugin-lifecycle.md), [editable-parameters.md](avnav-api/editable-parameters.md), [formatters.md](avnav-api/formatters.md), [interactive-widgets.md](avnav-api/interactive-widgets.md)

**Architecture:** [component-system.md](architecture/component-system.md), [cluster-widget-system.md](architecture/cluster-widget-system.md)

**Gauges:** [gauge-style-guide.md](gauges/gauge-style-guide.md), [gauge-shared-api.md](gauges/gauge-shared-api.md)

**Shared:** [helpers.md](shared/helpers.md), [css-theming.md](shared/css-theming.md)

**Widgets:** [three-elements.md](widgets/three-elements.md), [position-coordinates.md](widgets/position-coordinates.md), [wind-dial.md](widgets/wind-dial.md), [compass-gauge.md](widgets/compass-gauge.md), [semicircle-gauges.md](widgets/semicircle-gauges.md)

**Guides:** [add-new-gauge.md](guides/add-new-gauge.md), [add-new-cluster.md](guides/add-new-cluster.md), [testing-regression.md](guides/testing-regression.md), [documentation-maintenance.md](guides/documentation-maintenance.md)

## Documentation Validation

Run the checker after documentation or architecture changes:

```bash
node tools/check-docs.mjs
```

The checker validates markdown links/anchors, JS `Documentation:` header targets, and stale high-risk phrases.

## Regression Testing

Run from repo root:

```bash
npm test
npm run test:coverage
npm run test:coverage:check
npm run check:naming
npm run check:patterns -- --warn
```

Coverage checks enforce:

- global thresholds from `vitest.config.js`
- stricter core-module rules from `tools/check-coverage.mjs`
- registration naming rules from `tools/check-naming.mjs` (`globalKey`/`id` consistency + cluster widget name pattern)
- pattern drift rules from `tools/check-patterns.mjs` (duplicate helper detection, forbidden globals, empty catches, non-runtime console logging, owner/date annotation format for maintenance markers)

Details: [guides/testing-regression.md](guides/testing-regression.md)

## Standards

- Keep docs aligned with code changes
- Keep component registration guidance tied to `config/components.js`
- Keep ClusterWidget extension guidance tied to runtime registries (`ClusterMapperRegistry.js`, `ClusterRendererRouter.js`)
- Keep JS file headers pointing to correct docs
