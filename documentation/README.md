# dyninstruments — Modern Instrument Widgets for AvNav

**Status:** ✅ Functional | modular runtime/config and split gauge core in place

## Stack

- **Runtime:** Browser ES6+ JavaScript, Canvas 2D
- **Module System:** UMD, runtime-loaded via `<script>`
- **Host App:** AvNav
- **API:** `avnav.api.registerWidget()` — [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **Styling:** CSS scoped to `.dyniplugin` / `[data-dyni]`

## Architecture

```text
plugin.js (entry point)
├── validates AvNav globals and computes base URL
├── bootstraps internal scripts in fixed order
└── starts core.runInit()

core/
├── namespace.js          — namespace container
├── helpers.js            — Helpers factory
├── editable-defaults.js  — defaults from editableParameters
├── module-loader.js      — module JS/CSS loader + dep resolution
├── register-instrument.js— widget definition merge + register
└── init.js               — load modules -> register instruments

config/
├── modules.js            — module registry (`config.modules`)
├── instruments.js        — instrument list (`config.instruments`)
├── shared/               — kind maps + shared editables/helpers
└── clusters/             — per-cluster widget definitions

modules/
├── Cores/                — split shared gauge utilities + semicircle renderer
├── ThreeElements/        — numeric renderer
├── ClusterHost/          — dispatch + renderer orchestration
├── WindDial/
├── CompassGauge/
├── SpeedGauge/
├── DepthGauge/
├── TemperatureGauge/
└── VoltageGauge/
```

## Cluster Widgets (10 total)

| Widget Name | Cluster |
|---|---|
| `dyninstruments_CourseHeading` | `courseHeading` |
| `dyninstruments_Speed` | `speed` |
| `dyninstruments_Position` | `position` |
| `dyninstruments_Distance` | `distance` |
| `dyninstruments_Environment` | `environment` |
| `dyninstruments_Wind` | `wind` |
| `dyninstruments_LargeTime` | `time` |
| `dyninstruments_Nav` | `nav` |
| `dyninstruments_Anchor` | `anchor` |
| `dyninstruments_Vessel` | `vessel` |

## Documentation Map

**AvNav API:** [plugin-lifecycle.md](avnav-api/plugin-lifecycle.md), [editable-parameters.md](avnav-api/editable-parameters.md), [formatters.md](avnav-api/formatters.md)

**Architecture:** [module-system.md](architecture/module-system.md), [cluster-system.md](architecture/cluster-system.md)

**Gauges:** [gauge-style-guide.md](gauges/gauge-style-guide.md), [gauge-shared-api.md](gauges/gauge-shared-api.md)

**Shared:** [helpers.md](shared/helpers.md), [css-theming.md](shared/css-theming.md)

**Modules:** [three-elements.md](modules/three-elements.md), [wind-dial.md](modules/wind-dial.md), [compass-gauge.md](modules/compass-gauge.md), [semicircle-gauges.md](modules/semicircle-gauges.md)

**Guides:** [add-new-gauge.md](guides/add-new-gauge.md), [add-new-cluster.md](guides/add-new-cluster.md), [documentation-maintenance.md](guides/documentation-maintenance.md)

## Documentation Validation

Run the checker after documentation or architecture changes:

```bash
node tools/check-docs.mjs
```

The checker validates markdown links/anchors, JS `Documentation:` header targets, and stale high-risk phrases.

## Standards

- Keep docs aligned with code changes
- Keep module registration guidance tied to `config/modules.js`
- Keep ClusterHost extension guidance tied to runtime registries (`DispatchRegistry.js`, `RendererRegistry.js`)
- Keep JS file headers pointing to correct docs
