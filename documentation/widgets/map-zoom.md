# Map Zoom HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for map/zoom

## Overview

MapZoomTextHtmlWidget renders map zoom state as a committed HTML surface.

- surface: html
- shell: inert pre-commit
- semantic content: committed shadow-root renderer

## State Screens

- Resolver order: `disconnected` (`p.disconnect === true`) -> `data`
- `disconnected` renders shared `StateScreenMarkup` label (`GPS Lost`)
- Non-`data` states force passive interaction and remove action hotspot ownership

## Interaction Contract

- dispatch mode: direct click listener dispatches surfacePolicy.actions.map.checkAutoZoom()
- passive mode: no action listener
- wrapper click suppression is applied only in dispatch mode

## Ownership Contract

- `shared/widget-kits/nav/MapZoomMarkup.js` owns disconnected/data markup assembly and state-screen HTML.
- `MapZoomTextHtmlWidget` owns prepared-model reuse, lifecycle, interaction, layout signatures, and post-patch fitting.
- `HtmlDomPatchUtils.patchInnerHtml()` owns root markup replacement; markup and widget modules do not duplicate DOM
  patch logic.

## Layout Contract

- shellRect drives text fitting and layout mode decisions
- layoutSignature + postPatch maintain bounded relayout behavior

## Vertical Contract

- route metadata `shellSizing` returns ratio sizing with aspect ratio 2 in vertical mode.
- The committed surface box (`shellRect` / `.dyni-html-root`) owns the authoritative geometry.
- Inner widget wrappers (`.dyni-map-zoom-html`) must not self-expand beyond the surface box.
- Vertical-mode CSS no longer uses `height: auto`, `aspect-ratio`, or `min-height` overrides on the inner wrapper.

## Text-Fit Contract

- `shared/widget-kits/nav/MapZoomHtmlFit.js` owns text measurement and emits:
  - `captionStyle`
  - `valueStyle`
  - `unitStyle`
  - `requiredStyle`
- `MapZoomTextHtmlWidget` reuses semantic model work via `PreparedPayloadModelCache` across `layoutSignature` and
  `patchDom`.
- Prepared payload cache invalidation boundaries: payload revision change, props identity change, shell size change, and
  renderer `detach`/`destroy`.
- Renderer consults `MapZoomHtmlFit.compute(...)` whenever `shellRect` exists; `MapZoomHtmlFit` performs
  hostContext-local signature caching for identical fit requests.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/cluster-widget-system.md
