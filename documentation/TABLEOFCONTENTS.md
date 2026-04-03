# Documentation Table of Contents

**Status:** ✅ Reference | Navigation index for AI-focused docs

**Purpose:** Quick routing to canonical docs without reading the full tree.

## Repository Overview

- **Where is the documentation navigation index?** → [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)

## AvNav Plugin API (External)

- **Widget lifecycle, translate/render flow, host props, hide-native-header contract** → [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- **Editable parameters (types, defaults, conditions, key selectors)** → [avnav-api/editable-parameters.md](avnav-api/editable-parameters.md)
- **Formatter APIs and core formatter catalog** → [avnav-api/formatters.md](avnav-api/formatters.md), [avnav-api/core-formatter-catalog.md](avnav-api/core-formatter-catalog.md)
- **Core key/unit tuples (including roll/pitch)** → [avnav-api/core-key-catalog.md](avnav-api/core-key-catalog.md)
- **Interactive widgets and `GpsPage` click ownership** → [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)

## Architecture

- **Root architecture orientation** → [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Runtime bootstrap/init/render lifecycle** → [architecture/runtime-lifecycle.md](architecture/runtime-lifecycle.md)
- **Component loading and dependency graph (UMD)** → [architecture/component-system.md](architecture/component-system.md)
- **Cluster routing, mapper flow, viewmodel ownership, strict kind catalog, surface router** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- **HTML renderer lifecycle (two-phase render, corrective rerender, committed host facts)** → [architecture/html-renderer-lifecycle.md](architecture/html-renderer-lifecycle.md)
- **Vertical container contract (`.widgetContainer.vertical`, intrinsic sizing workflow)** → [architecture/vertical-container-contract.md](architecture/vertical-container-contract.md)
- **Host deferred commit state and scheduling** → [architecture/host-commit-controller.md](architecture/host-commit-controller.md)
- **Surface session switching (`attach`/`update`/`detach`/`destroy`)** → [architecture/surface-session-controller.md](architecture/surface-session-controller.md)
- **`canvas-dom` adapter integration contract** → [architecture/canvas-dom-surface-adapter.md](architecture/canvas-dom-surface-adapter.md)
- **Plugin↔core tuple contracts** → [architecture/plugin-core-contracts.md](architecture/plugin-core-contracts.md)
- **Helpers contract (`setupCanvas`, theme/night lookups, formatter dispatch)** → [shared/helpers.md](shared/helpers.md)

## Conventions

- **Coding standards (UMD template, mapper boundaries, archetypes, shared utilities)** → [conventions/coding-standards.md](conventions/coding-standards.md)
- **Smell catalog, enforcement matrix, suppression syntax** → [conventions/smell-prevention.md](conventions/smell-prevention.md)
- **Smell remediation playbooks** → [conventions/smell-fix-playbooks.md](conventions/smell-fix-playbooks.md)
- **Canvas layer caching conventions and shared cache facade** → [conventions/canvas-layer-caching.md](conventions/canvas-layer-caching.md), [shared/canvas-layer-cache.md](shared/canvas-layer-cache.md)
- **Responsive compaction contract** → [shared/responsive-scale-profile.md](shared/responsive-scale-profile.md)
- **Documentation format rules** → [conventions/documentation-format.md](conventions/documentation-format.md)
- **Core non-negotiable rules** → [core-principles.md](core-principles.md)

## Creating New Widgets (Guides)

- **New semicircle gauge workflow** → [guides/add-new-gauge.md](guides/add-new-gauge.md)
- **New linear gauge workflow and profile selection** → [guides/add-new-linear-gauge.md](guides/add-new-linear-gauge.md)
- **New full-circle dial workflow (including adding a kind)** → [guides/add-new-full-circle-dial.md](guides/add-new-full-circle-dial.md)
- **Text renderer workflow and extension decision guide** → [guides/add-new-text-renderer.md](guides/add-new-text-renderer.md)
- **Native HTML kind workflow, visual contract, and required test matrix** → [guides/add-new-html-kind.md](guides/add-new-html-kind.md)
- **Cluster workflow, adding kinds, and renderer decision rule** → [guides/add-new-cluster.md](guides/add-new-cluster.md)

## Module Reference (Renderers)

- **Three-value text renderer (layout modes, props)** → [widgets/three-elements.md](widgets/three-elements.md)
- **Active-route HTML renderer (visual contract, layout/fit constants)** → [widgets/active-route.md](widgets/active-route.md)
- **Edit-route HTML renderer (summary parity, layout modes, interaction gating)** → [widgets/edit-route.md](widgets/edit-route.md)
- **Route-points HTML renderer (layout modes, fit contract, interaction gating)** → [widgets/route-points.md](widgets/route-points.md)
- **Map-zoom HTML renderer and click/hotspot ownership** → [widgets/map-zoom.md](widgets/map-zoom.md)
- **Center display renderer (center position + row composition)** → [widgets/center-display.md](widgets/center-display.md)
- **Position coordinate renderer and supported kinds** → [widgets/position-coordinates.md](widgets/position-coordinates.md)
- **Wind dial renderer (draw flow, props)** → [widgets/wind-dial.md](widgets/wind-dial.md)
- **Compass radial renderer (rotation model, props)** → [widgets/compass-gauge.md](widgets/compass-gauge.md)
- **XTE display renderer (scale + layout modes)** → [widgets/xte-display.md](widgets/xte-display.md)
- **Semicircle gauges (shared flow + gauge-specific defaults/sectors)** → [widgets/semicircle-gauges.md](widgets/semicircle-gauges.md)

## Gauges & Dials Style Guides

- **Semicircle gauge proportions, layout modes, pointer config, sector logic** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md)
- **Shared semicircle toolkit contracts** → [radial/gauge-shared-api.md](radial/gauge-shared-api.md)
- **Full-circle dial engine architecture** → [radial/full-circle-dial-engine.md](radial/full-circle-dial-engine.md)
- **Full-circle proportions + pointer variants** → [radial/full-circle-dial-style-guide.md#proportions-function-of-r](radial/full-circle-dial-style-guide.md#proportions-function-of-r), [radial/full-circle-dial-style-guide.md#pointer-variants](radial/full-circle-dial-style-guide.md#pointer-variants)
- **Full-circle tick rendering + layout modes** → [radial/full-circle-dial-style-guide.md#tick-rendering](radial/full-circle-dial-style-guide.md#tick-rendering), [radial/full-circle-dial-style-guide.md#layout-modes](radial/full-circle-dial-style-guide.md#layout-modes)
- **Linear gauge style guide (profiles, key patterns, shipped gauge behavior)** → [linear/linear-gauge-style-guide.md](linear/linear-gauge-style-guide.md)
- **Linear shared API and profile templates** → [linear/linear-shared-api.md](linear/linear-shared-api.md)
- **Shared text layout engine contract** → [shared/text-layout-engine.md](shared/text-layout-engine.md)

## Styling & Theming

- **CSS theming contract (vars, day/night, font stack, borders)** → [shared/css-theming.md](shared/css-theming.md)
- **Theme token resolver (preset system, runtime integration, testing hooks)** → [shared/theme-tokens.md](shared/theme-tokens.md)
- **HTML widget visual style contract** → [shared/html-widget-visual-style-guide.md](shared/html-widget-visual-style-guide.md)

## Documentation Maintenance

- **Docs sync workflow, validation, and quality/regression commands** → [guides/documentation-maintenance.md](guides/documentation-maintenance.md)
- **How do I write an effective execution plan?** → [guides/exec-plan-authoring.md](guides/exec-plan-authoring.md)
- **Performance gate baseline contract** → [guides/performance-gate.md](guides/performance-gate.md)
- **Garbage collection workflow and anti-patterns** → [guides/garbage-collection.md](guides/garbage-collection.md)
- **Quality tracking and model selection log** → [QUALITY.md](QUALITY.md)
- **Known issues and tech debt tracker** → [TECH-DEBT.md](TECH-DEBT.md)

## Feature-Specific Lookups

- **Gauge warning/alarm sectors, aspect-ratio behavior, pointer config** → [radial/gauge-style-guide.md](radial/gauge-style-guide.md)
- **Full-circle proportions, pointers, ticks, layout modes** → [radial/full-circle-dial-style-guide.md](radial/full-circle-dial-style-guide.md)
- **Committed DOM reads and corrective rerender timing for HTML kinds** → [architecture/html-renderer-lifecycle.md](architecture/html-renderer-lifecycle.md)
- **Intrinsic height workflow in `.widgetContainer.vertical`** → [architecture/vertical-container-contract.md](architecture/vertical-container-contract.md)
- **How does the RoutePoints HTML renderer work?** → [widgets/route-points.md](widgets/route-points.md)
- **What is the RoutePoints layout and fit contract?** → [widgets/route-points.md](widgets/route-points.md)
- **How does the EditRoute HTML renderer work?** → [widgets/edit-route.md](widgets/edit-route.md)
- **How does the `.widgetContainer.vertical` height work for routePoints?** → [widgets/route-points.md#widgetcontainervertical-behavior](widgets/route-points.md#widgetcontainervertical-behavior)
- **How does RoutePoints row click interaction work (page-aware dispatch)?** → [widgets/route-points.md#interaction-contract](widgets/route-points.md#interaction-contract)
- **HTML widget classes/states contract and required HTML-kind tests** → [shared/html-widget-visual-style-guide.md](shared/html-widget-visual-style-guide.md), [guides/add-new-html-kind.md#step-7-required-html-kind-test-matrix](guides/add-new-html-kind.md#step-7-required-html-kind-test-matrix)
- **Theme preset resolution, runtime switching, and day/night ownership** → [shared/theme-tokens.md](shared/theme-tokens.md), [shared/css-theming.md](shared/css-theming.md)
- **HiDPI canvas scaling** → [shared/helpers.md#setupcanvas](shared/helpers.md#setupcanvas)
- **SignalK key selector contract in editor forms** → [avnav-api/editable-parameters.md#key-details](avnav-api/editable-parameters.md#key-details)
- **Roll/pitch formatter tuple contract** → [architecture/plugin-core-contracts.md](architecture/plugin-core-contracts.md), [avnav-api/core-formatter-catalog.md](avnav-api/core-formatter-catalog.md), [avnav-api/core-key-catalog.md](avnav-api/core-key-catalog.md)
- **Interactive dashboard button/toggle behavior on `GpsPage`** → [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)
