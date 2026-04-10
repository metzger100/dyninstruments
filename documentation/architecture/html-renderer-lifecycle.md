# HTML Renderer Lifecycle

**Status:** ✅ Implemented | Commit-driven shadow-root lifecycle for surface html kinds

## Overview

dyninstruments HTML kinds are commit-driven. Pre-commit shell output is inert; semantic rendering begins only after host commit inside HtmlSurfaceController.

## Authoritative Contract

ClusterRendererRouter.renderHtml(...):

- returns inert shell markup only
- includes a stable mount host (.dyni-surface-html-mount)
- contains only stable route/surface metadata and shell sizing state

HtmlSurfaceController.createSurfaceController(...) owns committed lifecycle:

- attach(payload)
- update(payload)
- detach(reason)
- destroy()

Committed renderer instances implement:

- mount(mountEl, payload)
- update(payload)
- postPatch(payload)
- detach(reason)
- destroy()
- optional layoutSignature(payload)

## shellRect Contract

shellRect remains authoritative for committed HTML layout and fit.

- measured from .dyni-surface-html-mount
- provided to committed renderers in payload.shellRect
- used for geometry-driven fit/layout

There is no triggerResize() contract.

## Layout and Relayout

- layoutSignature(payload) indicates layout-relevant input changes
- update(payload) patches DOM in place
- postPatch(payload) may request one bounded internal relayout pass
- unbounded rerender loops are not part of the contract

## Interaction Ownership

dyninstruments HTML surfaces do not rely on AvNav UserHtml event translation.

- no namedHandlers() contract
- no onclick="handlerName" wiring contract
- no global catchAll dependency for dyninstruments HTML surfaces

Committed renderers attach and remove direct DOM listeners under dispatch/passive runtime policy.

## Styling Ownership

- committed HTML styles are shadow-local
- runtime preloads and injects per-renderer shadow CSS bundles
- required outer context (pageId, orientation, interaction mode) is mirrored into shadow-visible attributes/classes

## Related

- cluster-widget-system.md
- runtime-lifecycle.md
- vertical-container-contract.md
- canvas-dom-surface-adapter.md
