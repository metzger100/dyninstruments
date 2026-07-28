# Add New Text Renderer

**Status:** ✅ Reference | Canvas text renderer workflow on TextLayoutEngine +
`componentContext.theme.tokens.resolveForRoot(rootEl)`

## Overview

Use this guide when adding a canvas text renderer (not native HTML kind).

Core rules:

- renderer remains canvas-based
- mapper stays declarative
- theme uses the component-context token resolver
- formatter dispatch goes through `componentContext.format.applyFormatter`

## Key Details

- New module path: `widgets/text/<RendererName>/<RendererName>.js`; UMD component exposing
  `create(def, componentContext)`; rendering happens inside `renderCanvas(canvas, props)`.
- Theme resolution pattern: `rootEl = componentContext.dom.requirePluginRoot(canvas)`, then
  `tokens = componentContext.theme.tokens.resolveForRoot(rootEl)`; consume `tokens.surface.fg`, `tokens.font.family`,
  `tokens.font.weight`, `tokens.font.labelWeight`.
- Registration fragment depends on domain: `config/components/registry-widgets-nav.js` for nav/route renderers,
  `config/components/registry-widgets-vessel.js` for vessel/text renderers.
- Mapper stays declarative: it only chooses the renderer id, does numeric normalization, and passes through the
  formatter key; presentation/layout logic must stay in the renderer module.
- Tests belong under `tests/widgets/text/`; add shared layout/fit tests when new shared helpers are introduced, and
  cover explicit falsy default behavior.
- Verification checklist covers `flat`/`normal`/`high` mode transitions, day/night theme token resolution from the
  committed plugin root, formatter output/fallback behavior, and disconnect/placeholder behavior.

## Steps

1. Create renderer module

- add widget module under widgets/text/<RendererName>/<RendererName>.js
- register UMD component with id and `create(def, componentContext)`
- keep rendering in renderCanvas(canvas, props)

1. Use shared engines

- use TextLayoutEngine for mode/layout routing
- use shared math/layout helpers from shared/widget-kits where applicable
- avoid widget-local clones of shared logic

1. Resolve theme correctly

- rootEl = componentContext.dom.requirePluginRoot(canvas)
- const tokens = componentContext.theme.tokens.resolveForRoot(rootEl)
- consume tokens.surface.fg, tokens.font.family, tokens.font.weight, tokens.font.labelWeight as needed

1. Keep mapper declarative

- mapper chooses renderer id and normalized payload fields
- mapper does numeric normalization and formatter key pass-through only
- presentation/layout behavior stays in renderer module

1. Register component and route usage

- add component entry in the appropriate fragment: `config/components/registry-widgets-nav.js` for nav/route renderers
  or `config/components/registry-widgets-vessel.js` for vessel/text renderers
- wire dependencies in registry
- update relevant mapper branch to emit renderer id and payload

1. Add tests

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
