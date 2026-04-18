# Active Route HTML Renderer

**Status:** ✅ Implemented | Committed HTML renderer for nav/activeRoute

## Overview

ActiveRouteTextHtmlWidget is a committed HTML renderer routed by ClusterRendererRouter.

- surface: html
- shell: inert pre-commit markup only
- semantic DOM: committed renderer mount/update lifecycle in shadow root
- interaction: runtime surface policy dispatch/passive mode
- formatter fallback outputs are normalized through `PlaceholderNormalize`; missing metric values render as `---`

## State Screens

- Resolver order: `disconnected` (`p.disconnect === true`) -> `noRoute` (`p.wpServer === false`) -> `noRoute` (`p.routeName === ""`) -> `data`
- Non-`data` states render via `StateScreenMarkup` with shared labels (`GPS Lost`, `No Route`)
- Non-`data` states force passive interaction through `StateScreenInteraction`

## Interaction Contract

- dispatch mode attaches direct click listeners on the committed wrapper
- passive mode keeps content non-interactive
- action dispatch uses surfacePolicy.actions.routeEditor.openActiveRoute()
- wrapper-level click suppression prevents blank-space propagation in dispatch mode

## Layout Contract

- shellRect from `.dyni-surface-html-mount` is the authoritative geometry input for fit/layout.
- HtmlSurfaceController owns the committed shadow-root box contract and injects the base fill rules for `:host` and `.dyni-html-root`.
- ActiveRoute markup and CSS can rely on wrapper/tile `width:100%` and `height:100%` resolving against that controller-owned contract.
- no triggerResize-style rerender shim and no resize-observer path for this renderer

## Vertical Contract

- getVerticalShellSizing returns ratio sizing with aspect ratio 2 in vertical mode.
- The committed surface box (`shellRect` / `.dyni-html-root`) owns the authoritative geometry.
- Inner widget wrappers (`.dyni-active-route-html`) must not self-expand beyond the surface box.
- Vertical-mode CSS no longer uses `height: auto`, `aspect-ratio`, or `min-height` overrides on the inner wrapper.

## Text-Fit Contract

- `shared/widget-kits/nav/ActiveRouteLayout.js` owns mode geometry and metric tile spacing, including caption band sizing.
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js` owns text measurement and emits inline style payload:
  - `routeNameStyle`
  - `metrics.<id>.captionStyle`
  - `metrics.<id>.valueStyle`
  - `metrics.<id>.unitStyle`
- `ActiveRouteTextHtmlWidget.renderMetricTile()` applies all metric fit styles, including caption fit on `.dyni-active-route-metric-caption`.
- Missing fit inputs fail closed (`compute()` returns `null`), and renderer output stays valid without extra relayout loops.
- `ActiveRouteTextHtmlWidget` reuses semantic model work via `PreparedPayloadModelCache` across `layoutSignature` and `patchDom`.
- Prepared payload cache invalidation boundaries: payload revision change, props identity change, shell size change, and renderer `detach`/`destroy`.
- Renderer consults `ActiveRouteHtmlFit.compute(...)` whenever `shellRect` exists; `ActiveRouteHtmlFit` performs hostContext-local signature caching to deduplicate identical fit requests.

## Phase 6 Options

- `stableDigits` (default `false`) enables `StableDigits.normalize(...)` for remain/ETA/next-course metric text.
- Metric value spans add `.dyni-tabular` when stable digits are enabled.
- Fit is two-pass in `ActiveRouteHtmlFit`: padded value first, fallback value when the padded metric clips.

## Phase 7 Options

- `hideSeconds` (default `false`) switches the ETA metric from `formatTime` to `formatClock`.
- The resulting `--:--` fallback still normalizes to `---` through `PlaceholderNormalize`.

## Related

- ../architecture/html-renderer-lifecycle.md
- ../architecture/cluster-widget-system.md
