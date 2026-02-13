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

- **Visual style: proportions, colors, pointer config** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md)
- **Layout modes (flat/normal/high)** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
- **Sector logic (warning/alarm placement)** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic)
- **Shared drawing functions (InstrumentComponents)** → [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)

## Module Reference (Renderers)

- **How does the numeric text renderer work (caption/value/unit)?** → [modules/three-elements.md](modules/three-elements.md)
- **What layout modes does ThreeElements support?** → [modules/three-elements.md](modules/three-elements.md#layout-modes)
- **What props does ThreeElements accept?** → [modules/three-elements.md](modules/three-elements.md#props)
- **How does the wind dial work (angle+speed dual display)?** → [modules/wind-dial.md](modules/wind-dial.md)
- **What IC functions does WindDial use?** → [modules/wind-dial.md](modules/wind-dial.md#dial-drawing-via-ic)
- **What props does WindDial accept?** → [modules/wind-dial.md](modules/wind-dial.md#props)
- **How does the rotating compass card work?** → [modules/compass-gauge.md](modules/compass-gauge.md)
- **How does compass rotation with upright labels work?** → [modules/compass-gauge.md](modules/compass-gauge.md#compass-dial-drawing-via-ic)
- **What props does CompassGauge accept?** → [modules/compass-gauge.md](modules/compass-gauge.md#props)
- **How do the semicircle gauges work (Speed/Depth/Temp/Voltage)?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md)
- **What differs between the 4 gauges (sectors, formatting, defaults)?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md#gauge-specific-differences)
- **What props do the semicircle gauges receive?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md#props)
- **What is duplicated across gauges (Phase 1 scope)?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md#duplicated-local-functions)

## Styling & Theming

- **CSS variables, day/night mode** → [shared/css-theming.md](shared/css-theming.md)
- **Font stack (--dyni-font)** → [shared/css-theming.md](shared/css-theming.md)
- **Widget border styling** → [shared/css-theming.md](shared/css-theming.md)

## Refactoring Tasks

- **Phase 1: Refactoring of Gauges and InstrumentComponents (eliminate duplication)** → [guides/add-new-gauge.md](guides/add-new-gauge.md), [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)
- **What functions are duplicated across gauges?** → [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)
- **How should the refactored gauge structure look?** → [guides/add-new-gauge.md](guides/add-new-gauge.md#refactored-gauge-structure)

## Feature-Specific Lookups

**"How do I add warning/alarm sectors to a gauge?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic),
**"How do I make a gauge respond to aspect ratio?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
**"How does the pointer/needle work?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#pointer-configuration)
**"How does day/night theming work?"** → [shared/css-theming.md](shared/css-theming.md), [shared/helpers.md](shared/helpers.md)
**"How does HiDPI canvas scaling work?"** → [shared/helpers.md](shared/helpers.md#setupcanvas)
**"How do I hide the native AvNav widget header?"** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#wantshidenativehead)
**"How do I add a SignalK KEY selector to the editor?"** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#key-type)
