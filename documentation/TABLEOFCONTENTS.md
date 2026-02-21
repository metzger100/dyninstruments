# Documentation Table of Contents

**Status:** ✅ Reference | Navigation index for AI-focused docs

**Purpose:** Quick navigation for AI to locate relevant documentation without reading all files.

## Repository Overview

- **Where is the documentation navigation index?** → [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)

## AvNav Plugin API (External)

- **How does widget registration work?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **What is the render cycle (translate → render)?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **What props does renderCanvas receive?** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#render-cycle-avnav-standard)
- **What editableParameter types exist?** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md)
- **How do conditions on editableParameters work?** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#condition-undocumented-avnav-feature)
- **What formatters are available (formatSpeed, formatDistance...)?** → [avnav-api/formatters.md](avnav-api/formatters.md)
- **How do I prevent AvNav instrument dashboard (`GpsPage`) widget clicks from navigating back to map?** → [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)

## Architecture

- **Where is the root architecture map for AI sessions?** → [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **How are modules loaded at runtime (UMD)?** → [architecture/component-system.md](architecture/component-system.md)
- **How does the dependency system work?** → [architecture/component-system.md](architecture/component-system.md#dependency-graph)
- **How does ClusterWidget route to renderers?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- **How does translateFunction mapper to graphic/numeric?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md#runtime-flow)
- **What is the Helpers object?** → [shared/helpers.md](shared/helpers.md)

## Conventions

- **What coding patterns/naming conventions should I follow?** → [conventions/coding-standards.md](conventions/coding-standards.md)
- **How are code smells prevented and enforced?** → [conventions/smell-prevention.md](conventions/smell-prevention.md)
- **How do I run naming registration checks?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md#quality-and-regression-commands)
- **How should I format documentation files?** → [conventions/documentation-format.md](conventions/documentation-format.md)
- **Which files are the best examples to copy from?** → [conventions/coding-standards.md#reference-implementations](conventions/coding-standards.md#reference-implementations)
- **What shared utilities exist?** → [conventions/coding-standards.md#shared-utilities](conventions/coding-standards.md#shared-utilities)
- **What are the non-negotiable project rules?** → [core-principles.md](core-principles.md)

## Creating New Widgets (Guides)

- **How do I create a new semicircle gauge?** → [guides/add-new-gauge.md](guides/add-new-gauge.md)
- **How do I add a new cluster widget?** → [guides/add-new-cluster.md](guides/add-new-cluster.md)
- **How do I add a new kind to an existing cluster?** → [guides/add-new-cluster.md](guides/add-new-cluster.md#adding-a-new-kind)
- **How do I run regression tests and coverage checks?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md#quality-and-regression-commands)

## Gauge Widgets (Semicircle)

- **Visual style: proportions, colors, pointer config** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md)
- **Layout modes (flat/normal/high)** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
- **Sector logic (warning/alarm placement)** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic)
- **Shared gauge APIs (GaugeToolkit + split core modules)** → [gauges/gauge-shared-api.md](gauges/gauge-shared-api.md)

## Module Reference (Renderers)

- **How does the numeric text renderer work (caption/value/unit)?** → [widgets/three-elements.md](widgets/three-elements.md)
- **What layout modes does ThreeValueTextWidget support?** → [widgets/three-elements.md](widgets/three-elements.md#layout-modes)
- **What props does ThreeValueTextWidget accept?** → [widgets/three-elements.md](widgets/three-elements.md#props)
- **How do stacked nav positions render (boat/wp)?** → [widgets/position-coordinates.md](widgets/position-coordinates.md)
- **Which kinds use PositionCoordinateWidget?** → [widgets/position-coordinates.md](widgets/position-coordinates.md#key-details)
- **How does the wind dial work (angle+speed dual display)?** → [widgets/wind-dial.md](widgets/wind-dial.md)
- **What draw functions does WindDialWidget use?** → [widgets/wind-dial.md](widgets/wind-dial.md#dial-drawing-via-gaugetoolkitdraw)
- **What props does WindDialWidget accept?** → [widgets/wind-dial.md](widgets/wind-dial.md#props)
- **How does the rotating compass card work?** → [widgets/compass-gauge.md](widgets/compass-gauge.md)
- **How does compass rotation with upright labels work?** → [widgets/compass-gauge.md](widgets/compass-gauge.md#compass-dial-drawing-via-gaugetoolkitdraw)
- **What props does CompassGaugeWidget accept?** → [widgets/compass-gauge.md](widgets/compass-gauge.md#props)
- **How do the semicircle gauges work (Speed/Depth/Temp/Voltage)?** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md)
- **What differs between the 4 gauges (sectors, formatting, defaults)?** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md#gauge-specific-responsibilities)
- **What shared renderer do the semicircle gauges use?** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md#shared-render-flow)

## Styling & Theming

- **CSS variables, day/night mode** → [shared/css-theming.md](shared/css-theming.md)
- **Font stack (--dyni-font)** → [shared/css-theming.md](shared/css-theming.md)
- **Plugin-wide theme token resolver** → [shared/theme-tokens.md](shared/theme-tokens.md)
- **Theme presets (default/slim/bold/night/highcontrast)** → [shared/theme-tokens.md](shared/theme-tokens.md#preset-definitions)
- **Runtime preset application flow** → [shared/theme-tokens.md](shared/theme-tokens.md#runtime-integration)
- **How to test presets via browser console** → [shared/theme-tokens.md](shared/theme-tokens.md#manual-testing-browser-console)
- **Widget border styling** → [shared/css-theming.md](shared/css-theming.md)

## Documentation Maintenance

- **How do I keep docs aligned after code changes?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- **How do I run documentation validation checks?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md#validation)
- **How do I run smell checks before strict gate?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md#quality-and-regression-commands)
- **How do I keep the codebase clean?** → [guides/garbage-collection.md](guides/garbage-collection.md)
- **What anti-patterns should I watch for?** → [guides/garbage-collection.md#anti-patterns](guides/garbage-collection.md#anti-patterns)
- **What areas of the codebase need improvement?** → [QUALITY.md](QUALITY.md)
- **Where are known issues and tech debt tracked?** → [TECH-DEBT.md](TECH-DEBT.md)
- **Which AI model should I use for a task?** → [QUALITY.md#model-selection-log](QUALITY.md#model-selection-log)

## Feature-Specific Lookups

**"How do I add warning/alarm sectors to a gauge?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#sector-logic),
**"How do I make a gauge respond to aspect ratio?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#layout-modes)
**"How does the pointer/needle work?"** → [gauges/gauge-style-guide.md](gauges/gauge-style-guide.md#pointer-configuration),
**"Where are shared theme tokens resolved?"** → [shared/theme-tokens.md](shared/theme-tokens.md)
**"How do I switch a theme preset at runtime?"** → [shared/theme-tokens.md](shared/theme-tokens.md#runtime-integration)
**"How does day/night theming work?"** → [shared/css-theming.md](shared/css-theming.md), [shared/helpers.md](shared/helpers.md)
**"How does HiDPI canvas scaling work?"** → [shared/helpers.md](shared/helpers.md#setupcanvas)
**"How do I hide the native AvNav widget header?"** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#wantshidenativehead)
**"How do I add a SignalK KEY selector to the editor?"** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#key-details)
**"How do I build interactive buttons/timers/toggles on AvNav instrument dashboard (`GpsPage`)?"** → [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)
