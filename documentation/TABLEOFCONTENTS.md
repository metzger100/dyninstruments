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
- **What are the canonical formatter signatures and parameter order from AvNav core?** → [avnav-api/core-formatter-catalog.md](avnav-api/core-formatter-catalog.md)
- **What key/unit contracts are used for core integration (including roll/pitch)?** → [avnav-api/core-key-catalog.md](avnav-api/core-key-catalog.md)
- **How do I prevent AvNav instrument dashboard (`GpsPage`) widget clicks from navigating back to map?** → [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)

## Architecture

- **Where is the root architecture map for AI sessions?** → [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **How are modules loaded at runtime (UMD)?** → [architecture/component-system.md](architecture/component-system.md)
- **How does the dependency system work?** → [architecture/component-system.md](architecture/component-system.md#dependency-graph)
- **How does ClusterWidget route to renderers?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- **How does translateFunction mapper to graphic/numeric?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md#runtime-flow)
- **Where are plugin↔core contract tuples and roll/pitch contract rules?** → [architecture/plugin-core-contracts.md](architecture/plugin-core-contracts.md)
- **What is the Helpers object?** → [shared/helpers.md](shared/helpers.md)

## Conventions

- **What coding patterns/naming conventions should I follow?** → [conventions/coding-standards.md](conventions/coding-standards.md)
- **How are code smells prevented and enforced?** → [conventions/smell-prevention.md](conventions/smell-prevention.md)
- **What is the standard canvas layer caching convention (scope, keys, invalidation)?** → [conventions/canvas-layer-caching.md](conventions/canvas-layer-caching.md)
- **How do I reuse offscreen canvas background layer caching across widgets?** → [shared/canvas-layer-cache.md](shared/canvas-layer-cache.md)
- **How do I run naming registration checks?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md#quality-and-regression-commands)
- **How should I format documentation files?** → [conventions/documentation-format.md](conventions/documentation-format.md)
- **Which files are the best examples to copy from?** → [conventions/coding-standards.md#reference-implementations](conventions/coding-standards.md#reference-implementations)
- **Which shared engine should I use for my widget type?** → [conventions/coding-standards.md#widget-archetypes](conventions/coding-standards.md#widget-archetypes)
- **What shared utilities exist?** → [conventions/coding-standards.md#shared-utilities](conventions/coding-standards.md#shared-utilities)
- **What are the non-negotiable project rules?** → [core-principles.md](core-principles.md)

## Creating New Widgets (Guides)

- **How do I create a new semicircle gauge?** → [guides/add-new-gauge.md](guides/add-new-gauge.md)
- **How do I create a new linear gauge?** → [guides/add-new-linear-gauge.md](guides/add-new-linear-gauge.md)
- **How do I create a new full-circle dial?** → [guides/add-new-full-circle-dial.md](guides/add-new-full-circle-dial.md)
- **How do I create a new text-based renderer with TextLayoutEngine?** → [guides/add-new-text-renderer.md](guides/add-new-text-renderer.md)
- **When should I create a new text renderer vs extending an existing one?** → [guides/add-new-text-renderer.md](guides/add-new-text-renderer.md#b4-decision-guide-new-renderer-vs-extension)
- **How do I add a new cluster widget?** → [guides/add-new-cluster.md](guides/add-new-cluster.md)
- **How do I add a new kind to an existing cluster?** → [guides/add-new-cluster.md](guides/add-new-cluster.md#adding-a-new-kind)
- **How do I decide between a dedicated cluster renderer vs extending an existing one?** → [guides/add-new-cluster.md](guides/add-new-cluster.md#renderer-decision-rule)
- **How do I add a new kind to an existing dial?** → [guides/add-new-full-circle-dial.md](guides/add-new-full-circle-dial.md#adding-a-new-kind-to-an-existing-dial)
- **How do I run regression tests and coverage checks?** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md#quality-and-regression-commands)

## Gauge Widgets (Semicircle)

- **Visual style: proportions, colors, pointer config** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md)
- **Layout modes (flat/normal/high)** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md#layout-modes)
- **Sector logic (warning/alarm placement)** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md#sector-logic)
- **Shared gauge APIs (RadialToolkit + split core modules)** → [radial/gauge-shared-api.md](radial/gauge-shared-api.md)
- **How does the shared full-circle dial engine work?** → [radial/full-circle-dial-engine.md](radial/full-circle-dial-engine.md)
- **What are the full-circle dial proportions (R, ring, label inset)?** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#proportions-function-of-r)
- **How are full-circle pointers configured (lubber vs value pointer)?** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#pointer-variants)
- **How are full-circle ticks and labels rendered?** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#tick-rendering)
- **How do full-circle layout modes (flat/normal/high) work?** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#layout-modes)
- **How does the shared text layout engine work?** → [shared/text-layout-engine.md](shared/text-layout-engine.md)

## Linear Gauges

- **Visual style and layout rules for linear instruments** → [linear/linear-gauge-style-guide.md](linear/linear-gauge-style-guide.md)
- **Which linear profile should I use (range/high-end, range/low-end, centered180, fixed360)?** → [linear/linear-gauge-style-guide.md](linear/linear-gauge-style-guide.md#supported-profiles)
- **What editable parameter key pattern should new linear gauges follow?** → [linear/linear-gauge-style-guide.md](linear/linear-gauge-style-guide.md#editable-parameter-key-pattern)
- **Shared linear renderer APIs and axis modes** → [linear/linear-shared-api.md](linear/linear-shared-api.md)
- **What are the `createRenderer(spec)` templates for range, wind-angle, and compass linear wrappers?** → [linear/linear-shared-api.md](linear/linear-shared-api.md#profile-templates)
- **How do I add a new linear gauge wrapper?** → [guides/add-new-linear-gauge.md](guides/add-new-linear-gauge.md)
- **What profile playbook should I follow for new linear gauge kinds?** → [guides/add-new-linear-gauge.md](guides/add-new-linear-gauge.md#step-0-choose-profile)

## Module Reference (Renderers)

- **How does the numeric text renderer work (caption/value/unit)?** → [widgets/three-elements.md](widgets/three-elements.md)
- **What layout modes does ThreeValueTextWidget support?** → [widgets/three-elements.md](widgets/three-elements.md#layout-modes)
- **What props does ThreeValueTextWidget accept?** → [widgets/three-elements.md](widgets/three-elements.md#props)
- **How do stacked nav positions render (boat/wp)?** → [widgets/position-coordinates.md](widgets/position-coordinates.md)
- **Which kinds use PositionCoordinateWidget?** → [widgets/position-coordinates.md](widgets/position-coordinates.md#key-details)
- **How does the wind dial work (angle+speed dual display)?** → [widgets/wind-dial.md](widgets/wind-dial.md)
- **What draw functions does WindRadialWidget use?** → [widgets/wind-dial.md](widgets/wind-dial.md#dial-drawing-via-radialtoolkitdraw)
- **What props does WindRadialWidget accept?** → [widgets/wind-dial.md](widgets/wind-dial.md#props)
- **How does the rotating compass card work?** → [widgets/compass-gauge.md](widgets/compass-gauge.md)
- **How does compass rotation with upright labels work?** → [widgets/compass-gauge.md](widgets/compass-gauge.md#compass-dial-drawing-via-radialtoolkitdraw)
- **What props does CompassRadialWidget accept?** → [widgets/compass-gauge.md](widgets/compass-gauge.md#props)
- **How does the XTE highway widget work?** → [widgets/xte-display.md](widgets/xte-display.md)
- **What layout modes does XteDisplayWidget use?** → [widgets/xte-display.md](widgets/xte-display.md#layout-modes)
- **What XTE scale does XteDisplayWidget use?** → [widgets/xte-display.md](widgets/xte-display.md)
- **How do the semicircle gauges work (Speed/Depth/Temp/Voltage)?** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md)
- **What differs between the 4 gauges (sectors, formatting, defaults)?** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md#gauge-specific-responsibilities)
- **What shared renderer do the semicircle gauges use?** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md#shared-render-flow)
- **How do shipped linear gauges (speed/depth/temp/voltage) work?** → [linear/linear-gauge-style-guide.md](linear/linear-gauge-style-guide.md)

## Styling & Theming

- **CSS variables, day/night mode** → [shared/css-theming.md](shared/css-theming.md)
- **Font stack (--dyni-font)** → [shared/css-theming.md](shared/css-theming.md)
- **Plugin-wide theme token resolver** → [shared/theme-tokens.md](shared/theme-tokens.md)
- **Shared text layout/cache facade for text widgets** → [shared/text-layout-engine.md](shared/text-layout-engine.md)
- **Theme presets (default/slim/bold/night/highcontrast)** → [shared/theme-tokens.md](shared/theme-tokens.md#preset-definitions)
- **Runtime preset application flow** → [shared/theme-tokens.md](shared/theme-tokens.md#runtime-integration)
- **How do I select a preset from AvNav user.css?** → [shared/theme-tokens.md](shared/theme-tokens.md#runtime-integration)
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

**"How do I add warning/alarm sectors to a gauge?"** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md#sector-logic),
**"How do I make a gauge respond to aspect ratio?"** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md#layout-modes)
**"How does the pointer/needle work?"** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md#pointer-configuration),
**"What are the full-circle dial proportions?"** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#proportions-function-of-r)
**"How are full-circle pointers configured?"** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#pointer-variants),
**"How does full-circle tick rendering work?"** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#tick-rendering)
**"How do full-circle layout modes work?"** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md#layout-modes),
**"Where are shared theme tokens resolved?"** → [shared/theme-tokens.md](shared/theme-tokens.md)
**"How do I switch a theme preset at runtime?"** → [shared/theme-tokens.md](shared/theme-tokens.md#runtime-integration)
**"Can user.css choose the active preset?"** → [shared/theme-tokens.md](shared/theme-tokens.md#runtime-integration)
**"How does day/night theming work?"** → [shared/css-theming.md](shared/css-theming.md), [shared/helpers.md](shared/helpers.md)
**"How does HiDPI canvas scaling work?"** → [shared/helpers.md](shared/helpers.md#setupcanvas)
**"How do I hide the native AvNav widget header?"** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md#wantshidenativehead)
**"How do I add a SignalK KEY selector to the editor?"** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md#key-details)
**"What is the correct roll/pitch formatter tuple and why?"** → [architecture/plugin-core-contracts.md](architecture/plugin-core-contracts.md), [avnav-api/core-formatter-catalog.md](avnav-api/core-formatter-catalog.md), [avnav-api/core-key-catalog.md](avnav-api/core-key-catalog.md)
**"How do I build interactive buttons/timers/toggles on AvNav instrument dashboard (`GpsPage`)?"** → [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)
