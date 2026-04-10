# Add New Text Renderer

**Status:** ✅ Reference | Canvas text renderer workflow on TextLayoutEngine + ThemeResolver

## Overview

Use this guide when adding a canvas text renderer (not native HTML kind).

Core rules:

- renderer remains canvas-based
- mapper stays declarative
- theme uses strict root resolution + ThemeResolver
- formatter dispatch goes through Helpers.applyFormatter

## Steps

1. Create renderer module
- add widget module under widgets/text/<RendererName>/<RendererName>.js
- register UMD component with id and create(def, Helpers)
- keep rendering in renderCanvas(canvas, props)

2. Use shared engines
- use TextLayoutEngine for mode/layout routing
- use shared math/layout helpers from shared/widget-kits where applicable
- avoid widget-local clones of shared logic

3. Resolve theme correctly
- rootEl = Helpers.requirePluginRoot(canvas)
- tokens = ThemeResolver.resolveForRoot(rootEl)
- consume tokens.surface.fg, tokens.font.family, tokens.font.weight, tokens.font.labelWeight as needed

4. Keep mapper declarative
- mapper chooses renderer id and normalized payload fields
- mapper does numeric normalization and formatter key pass-through only
- presentation/layout behavior stays in renderer module

5. Register component and route usage
- add component entry in config/components/registry-widgets.js
- wire dependencies in registry
- update relevant mapper branch to emit renderer id and payload

6. Add tests
- renderer unit tests under tests/widgets/text/
- shared layout/fit tests when new shared helpers are introduced
- ensure explicit falsy default behavior is covered

## Verification Checklist

- mode transitions (flat/normal/high) remain stable
- day/night theme tokens resolve from committed plugin root
- formatter output/fallback behavior is correct
- disconnect/placeholder behavior matches contract

## Related

- ../conventions/coding-standards.md
- ../architecture/cluster-widget-system.md
- ../shared/theme-tokens.md
- ../avnav-api/core-formatter-catalog.md
