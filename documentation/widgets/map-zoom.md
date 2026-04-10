# Map Zoom HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for map/zoom

## Overview

MapZoomTextHtmlWidget renders map zoom state as a committed HTML surface.

- surface: html
- shell: inert pre-commit
- semantic content: committed shadow-root renderer

## Interaction Contract

- dispatch mode: direct click listener dispatches surfacePolicy.actions.map.checkAutoZoom()
- passive mode: no action listener
- wrapper click suppression is applied only in dispatch mode

## Layout Contract

- shellRect drives text fitting and layout mode decisions
- layoutSignature + postPatch maintain bounded relayout behavior

## Vertical Contract

getVerticalShellSizing returns ratio sizing with aspect ratio 2 in vertical mode.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/cluster-widget-system.md
