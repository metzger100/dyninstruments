# Documentation Table of Contents

**Purpose:** Quick navigation for AI to locate relevant documentation without reading all files.

## AvNav Plugin API (External)

- **How does widget registration work?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **What is the render cycle (translate → render)?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **What props does renderCanvas receive?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#props-in-rendercanvas)
- **What editableParameter types exist?** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md)
- **How do conditions on editableParameters work?** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#conditions)
- **What formatters are available (formatSpeed, formatDistance...)?** → [avnav-api/formatters.md](avnav-api/formatters.md)

## Architecture

- **How are modules loaded at runtime (UMD)?** → [architecture/module-system.md](architecture/module-system.md)
- **How does the dependency system work?** → [architecture/module-system.md](architecture/module-system.md#dependencies)
- **How does ClusterHost route to renderers?** → [architecture/cluster-system.md](architecture/cluster-system.md)
- **How does translateFunction dispatch to graphic/numeric?** → [architecture/cluster-system.md](architecture/cluster-system.md#translate-dispatch)
- **What is the Helpers object?** → [shared/helpers.md](shared/helpers.md)

## Creating New Widgets (Guides)

- **How do I create a new semicircle gauge?** → [guides/add-new-gauge.md](guides/add-new-gauge.md)
- **How do I add a new cluster widget?** → [guides/add-new-cluster.md](guides/add-new-cluster.md)
- **How do I add a new kind to an existing cluster?** → [guides/add-new-cluster.md](guides/add-new-cluster.md#adding-a-new-kind)

## Gauge Widgets (Semicircle)

- **SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge details** → [gauges/semicircle-gauges.md](gauges/semicircle-gauges.md)
- **Visual style: proportions, colors, pointer config** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md)
- **Layout modes (flat/normal/high)** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
- **Sector logic (warning/alarm placement)** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic)
- **Shared drawing functions (GaugeUtils)** → [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)

## Dial Widgets (Full Circle)

- **WindDial (wind angle/speed graphic)** → [gauges/dial-gauges.md](gauges/dial-gauges.md)
- **CompassGauge (heading graphic)** → [gauges/dial-gauges.md](gauges/dial-gauges.md)
- **InstrumentComponents drawing primitives** → [shared/dial-primitives.md](shared/dial-primitives.md)

## Numeric Display

- **ThreeElements (Caption/Value/Unit renderer)** → [widgets/numeric-display.md](widgets/numeric-display.md)
- **How does the 3-row / 2-row / flat layout work?** → [widgets/numeric-display.md](widgets/numeric-display.md)

## Cluster Configuration

- **All clusters, storeKeys, kinds, editableParameters** → [widgets/cluster-definitions.md](widgets/cluster-definitions.md)
- **KIND maps (COURSE_KIND, SPEED_KIND, ENV_KIND...)** → [widgets/cluster-definitions.md](widgets/cluster-definitions.md#kind-maps)

## Styling & Theming

- **CSS variables, day/night mode** → [shared/css-theming.md](shared/css-theming.md)
- **Font stack (--dyni-font)** → [shared/css-theming.md](shared/css-theming.md)
- **Widget border styling** → [shared/css-theming.md](shared/css-theming.md)

## Refactoring Tasks

- **Phase 1: Extract GaugeUtils (eliminate duplication)** → [guides/add-new-gauge.md](guides/add-new-gauge.md), [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)
- **What functions are duplicated across gauges?** → [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)
- **How should the refactored gauge structure look?** → [guides/add-new-gauge.md](guides/add-new-gauge.md#refactored-gauge-structure)

## Feature-Specific Lookups

**"How do I add warning/alarm sectors to a gauge?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic), [gauges/semicircle-gauges.md](gauges/semicircle-gauges.md)
**"How do I make a gauge respond to aspect ratio?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
**"How does the pointer/needle work?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#pointer-configuration)
**"How does day/night theming work?"** → [shared/css-theming.md](shared/css-theming.md), [shared/helpers.md](shared/helpers.md)
**"How does HiDPI canvas scaling work?"** → [shared/helpers.md](shared/helpers.md#setupcanvas)
**"What SignalK paths are used?"** → [widgets/cluster-definitions.md](widgets/cluster-definitions.md)
**"How do I hide the native AvNav widget header?"** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#wantshidenativehead)
**"How do I add a SignalK KEY selector to the editor?"** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#key-type)
