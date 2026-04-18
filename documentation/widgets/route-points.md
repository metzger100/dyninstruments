# Route Points HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for nav/routePoints with parity bridge dispatch

## Overview

RoutePointsTextHtmlWidget is the committed HTML renderer for nav route points.

- surface: html
- committed DOM owner: mount/update/postPatch/detach/destroy
- interaction callbacks: surfacePolicy.actions.routePoints.activate({ index, pointSnapshot })
- host parity bridge: TemporaryHostActionBridge runtime boundary

## State Screens

- Resolver order: `disconnected` (`p.disconnect === true`) -> `noRoute` (`domain.route` missing) -> `data`
- Non-`data` states render through `StateScreenMarkup` and suppress row/list content
- Non-`data` states force passive interaction (no row activation dispatch)

## Placeholder Contract

- Per-field formatter fallback values are normalized through `PlaceholderNormalize`; missing per-field text renders as `---`.
- Missing-leg compound placeholders remain an explicit carve-out and keep the route-segment form (`"--°/--nm"` and equivalent unit combinations).

## Interaction Contract

- dispatch mode attaches row click listeners directly in committed DOM
- passive mode keeps rows non-interactive
- dispatch mode installs wrapper click suppression to stop blank-space propagation

## Vertical Sizing Contract

RoutePoints is the only width-derived natural-height widget.

- getVerticalShellSizing returns natural height string in vertical mode
- runtime materializes natural height on shell via CSS height
- exact width-derived height may be finalized at first commit before surface attach
- viewport cap remains widget-owned (60vh policy)

## widgetContainer.vertical Behavior

In .widgetContainer.vertical, runtime requests widget-owned sizing and materializes shell height on the inert shell.

- width remains host-owned
- RoutePoints height remains widget-owned and width-derived
- final width-derived natural height may be corrected on first committed host pass

## Layout Contract

- shellRect from mount host remains authoritative
- layoutSignature excludes non-authoritative vertical shell height churn
- postPatch may trigger one bounded relayout pass (for example scrollbar-gutter correction)

## Phase 6 Options

- `coordinatesTabular` (default `true`) is threaded into `RoutePointsMarkup`.
- When `showLatLon === true` and `coordinatesTabular !== false`, route-point info spans use `.dyni-tabular`.
- Segment compound placeholders (for example `--kt/--nm`) are intentionally preserved.

## Related

- ../architecture/vertical-container-contract.md
- ../architecture/html-renderer-lifecycle.md
- ../architecture/runtime-lifecycle.md
