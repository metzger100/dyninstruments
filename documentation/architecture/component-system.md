# Component System

**Status:** ✅ Implemented | Registry fragments + assembled component map + runtime loader with explicit API shapes

## Overview

dyninstruments uses a runtime component loader for UMD modules registered on window.DyniComponents.

Ownership split:

- config/bootstrap-manifest.js owns the bootstrap script list shared by browser runtime and Node tooling
- plugin.js loads the bootstrap manifest first, then loads the manifest-listed scripts in order
- config/components/registry-*.js defines registry fragments
- config/components.js assembles fragments into config.components
- runtime/component-loader.js resolves dependencies and loads JS/CSS
- runtime/asset-preloader.js preloads declared assets and exposes runtime asset lookup
- runtime/cluster/RouteActivationController.js builds activated route payloads on demand
- runtime/init.js requests required components and registers widgets

## Registry Assembly

config.components is assembled from:

- registry-shared-foundation-format.js
- registry-shared-foundation-geometry.js
- registry-shared-foundation-layout.js
- registry-shared-foundation-state.js
- registry-shared-engines.js
- registry-widgets-nav.js
- registry-widgets-vessel.js
- registry-widgets-gauge.js
- registry-cluster.js

Assembly fail-closes when:

- required group is missing
- duplicate component IDs exist

Recent shared-foundation/runtime registrations:

- `PreparedPayloadModelCache` is registered in `registry-shared-foundation-state.js`
- `ActiveRouteTextHtmlWidget` and `MapZoomTextHtmlWidget` include `PreparedPayloadModelCache` in `deps`
- component entries may include optional `assets` arrays with relative paths and explicit asset types

## API Shape Contract

Loader supports exactly two explicit API shapes:

- factory
- module

Validation behavior:

- factory requires create()
- module requires a direct module object API

In the runtime service lane, theme internals stay inside `runtime.theme`; component factories resolve immutable snapshots through `componentContext.theme.tokens.resolveForRoot(rootEl)`.
`componentContext.hostActions` is the same function reference as `runtime.hostActions`, so components can snapshot the current bridge state on demand.

## CSS Loading Contract

Global CSS:

- plugin.css remains global and is linked in document head

Committed HTML CSS:

- renderer-specific shadowCss bundles are preloaded as text
- shadowCss is not globally linked in document head
- HtmlSurfaceController injects only the active renderer bundle into that renderer shadow root

Runtime assets:

- component loader preloads declared assets after JS/CSS load completion
- `runtime.getAsset(key)` returns the preloaded asset value or null for a known-but-failed asset
- `runtime.assetUrl(relativePath)` resolves a plugin-relative asset path to a full URL
- plugin-wide bundled fonts remain in `plugin.css` and are not registered as component assets

## Loader Flow

1. resolve dependencies recursively
2. load CSS when component declares css
3. load JS script once
4. preload declared assets, if any
5. validate API shape
6. cache resolved component promise

## Runtime Init Notes

runtime/init.js:

- computes startup-needed components from widget definitions
- startup deps are runtime-bound, and ClusterWidget.deps is intentionally []
- route roots are loaded lazily by RouteActivationController
- configures `runtime.theme`
- installs `runtime.hostActions` as a function that re-reads the current host action bridge on every call
- registers widgets
- does not preload renderer shadowCss during startup; RouteActivationController owns active-route shadowCss preload

RouteActivationController is introduced in Phase 4, and the Phase 6 cutover is now live:

- `runtime/cluster/RouteActivationController.js` builds activated route payloads on demand
- ClusterWidget now owns the live shell/orchestrator cutover path

## Related

- runtime-lifecycle.md
- cluster-widget-system.md
- ../shared/theme-tokens.md
- asset-system.md
