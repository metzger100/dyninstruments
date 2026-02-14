# Documentation Table of Contents

**Status:** ✅ Reference | Navigation index for AI-focused docs

**Purpose:** Quick navigation for AI to locate relevant documentation without reading all files.

## AvNav Plugin API (External)

- **How does widget registration work?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **What is the render cycle (translate → render)?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **What props does renderCanvas receive?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#render-cycle-avnav-standard)
- **What editableParameter types exist?** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md)
- **How do conditions on editableParameters work?** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#condition-undocumented-avnav-feature)
- **What formatters are available (formatSpeed, formatDistance...)?** → [avnav-api/formatters.md](avnav-api/formatters.md)

## Architecture

- **How are modules loaded at runtime (UMD)?** → [architecture/module-system.md](architecture/module-system.md)
- **How does the dependency system work?** → [architecture/module-system.md](architecture/module-system.md#dependency-graph)
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
- **Shared gauge APIs (GaugeUtils + split core modules)** → [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)

## Module Reference (Renderers)

- **How does the numeric text renderer work (caption/value/unit)?** → [modules/three-elements.md](modules/three-elements.md)
- **What layout modes does ThreeElements support?** → [modules/three-elements.md](modules/three-elements.md#layout-modes)
- **What props does ThreeElements accept?** → [modules/three-elements.md](modules/three-elements.md#props)
- **How does the wind dial work (angle+speed dual display)?** → [modules/wind-dial.md](modules/wind-dial.md)
- **What draw functions does WindDial use?** → [modules/wind-dial.md](modules/wind-dial.md#dial-drawing-via-gaugeutilsdraw)
- **What props does WindDial accept?** → [modules/wind-dial.md](modules/wind-dial.md#props)
- **How does the rotating compass card work?** → [modules/compass-gauge.md](modules/compass-gauge.md)
- **How does compass rotation with upright labels work?** → [modules/compass-gauge.md](modules/compass-gauge.md#compass-dial-drawing-via-gaugeutilsdraw)
- **What props does CompassGauge accept?** → [modules/compass-gauge.md](modules/compass-gauge.md#props)
- **How do the semicircle gauges work (Speed/Depth/Temp/Voltage)?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md)
- **What differs between the 4 gauges (sectors, formatting, defaults)?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md#gauge-specific-responsibilities)
- **What shared renderer do the semicircle gauges use?** → [modules/semicircle-gauges.md](modules/semicircle-gauges.md#shared-render-flow)

## Styling & Theming

- **CSS variables, day/night mode** → [shared/css-theming.md](shared/css-theming.md)
- **Font stack (--dyni-font)** → [shared/css-theming.md](shared/css-theming.md)
- **Widget border styling** → [shared/css-theming.md](shared/css-theming.md)

## Refactoring Tasks

- **Semicircle shared renderer and GaugeUtils API** → [guides/add-new-gauge.md](guides/add-new-gauge.md), [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md), [modules/semicircle-gauges.md](modules/semicircle-gauges.md)

## Feature-Specific Lookups

**"How do I add warning/alarm sectors to a gauge?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic),
**"How do I make a gauge respond to aspect ratio?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
**"How does the pointer/needle work?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#pointer-configuration)
**"How does day/night theming work?"** → [shared/css-theming.md](shared/css-theming.md), [shared/helpers.md](shared/helpers.md)
**"How does HiDPI canvas scaling work?"** → [shared/helpers.md](shared/helpers.md#setupcanvas)
**"How do I hide the native AvNav widget header?"** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#wantshidenativehead)
**"How do I add a SignalK KEY selector to the editor?"** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#key-type)
