# Edit Route HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for nav/editRoute

## Overview

EditRouteTextHtmlWidget is a committed HTML renderer for the nav editRoute kind.

- surface: html
- committed DOM owner: createCommittedRenderer lifecycle
- style scope: shadow-local CSS
- policy source: runtime-injected surfacePolicy

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

getVerticalShellSizing returns ratio sizing with aspect ratio 7/8 in vertical mode.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/vertical-container-contract.md
