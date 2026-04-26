# Edit Route HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for nav/editRoute

## Overview

EditRouteTextHtmlWidget is a committed HTML renderer for the nav editRoute kind.

- surface: html
- committed DOM owner: createCommittedRenderer lifecycle
- style scope: shadow-local CSS
- policy source: runtime-injected surfacePolicy
- formatter fallback outputs are normalized through `PlaceholderNormalize`; missing metric values render as `---`
- Mapper payloads split formatter tokens from display labels: `formatUnits.dst` / `formatUnits.rte` carry the distance tokens while `units.dst` / `units.rte` stay display-only.

## State Screens

- Resolver order: `disconnected` (`p.disconnect === true`) -> `noRoute` (`domain.hasRoute !== true`) -> `data`
- Non-`data` states render through shared `StateScreenMarkup`
- Non-`data` states are always passive via `StateScreenInteraction`

## Interaction Contract

- dispatch mode attaches direct click listeners
- passive mode has no action listener ownership
- actions dispatch through surfacePolicy.actions.routeEditor.openEditRoute()
- wrapper-level click suppression is active only in dispatch mode

## Layout Contract

- shellRect is the authoritative geometry input
- layoutSignature controls layout-sensitive update passes
- postPatch may request one bounded relayout pass

## Vertical Contract

- getVerticalShellSizing returns ratio sizing with aspect ratio 7/8 in vertical mode.
- The committed surface box (`shellRect` / `.dyni-html-root`) owns the authoritative geometry.
- Inner widget wrappers (`.dyni-edit-route-html`) must not self-expand beyond the surface box.
- Vertical-mode CSS no longer uses `height: auto`, `aspect-ratio`, or `min-height` overrides on the inner wrapper.

## Phase 6 Options

- `stableDigits` (default `false`) enables `StableDigits.normalize(...)` in `EditRouteRenderModel`.
- Metric value text spans add `.dyni-tabular` when `stableDigitsEnabled` is true.
- Values keep full and compact variants through existing layout logic; placeholders remain `---`.

## Phase 7 Options

- `hideSeconds` (default `false`) switches the ETA metric from `formatTime` to `formatClock`.
- The `--:--` fallback still normalizes to `---` through `PlaceholderNormalize`.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/vertical-container-contract.md
