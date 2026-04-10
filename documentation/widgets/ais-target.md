# AIS Target HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for map/aisTarget

## Overview

AisTargetTextHtmlWidget renders AIS target summary state on the committed HTML surface path.

- surface: html
- policy source: runtime surfacePolicy
- style scope: shadow-local CSS

## Interaction Contract

- dispatch mode attaches direct listener and dispatches surfacePolicy.actions.ais.showInfo(mmsi)
- passive mode renders non-interactive content
- wrapper click suppression is dispatch-only

## Layout Contract

- shellRect is the canonical committed geometry source
- layoutSignature handles branch-sensitive layout rerun triggers
- postPatch can request one bounded relayout pass

## Vertical Contract

getVerticalShellSizing returns ratio sizing with aspect ratio 7/8 in vertical mode.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/vertical-container-contract.md
