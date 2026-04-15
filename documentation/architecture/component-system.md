# Component System

**Status:** ✅ Implemented | Registry fragments + assembled component map + runtime loader with explicit API shapes

## Overview

dyninstruments uses a runtime component loader for UMD modules registered on window.DyniComponents.

Ownership split:

- plugin.js bootstraps internal scripts in fixed order
- config/components/registry-*.js defines registry fragments
- config/components.js assembles fragments into config.components
- runtime/component-loader.js resolves dependencies and loads JS/CSS
- runtime/init.js requests required components and registers widgets

## Registry Assembly

config.components is assembled from:

- registry-shared-foundation.js
- registry-shared-engines.js
- registry-widgets.js
- registry-cluster.js

Assembly fail-closes when:

- required group is missing
- duplicate component IDs exist

Recent shared-foundation/runtime registrations:

- `PreparedPayloadModelCache` is registered in `registry-shared-foundation.js`
- `ActiveRouteTextHtmlWidget` and `MapZoomTextHtmlWidget` include `PreparedPayloadModelCache` in `deps`

## API Shape Contract

Loader supports exactly two explicit API shapes:

- factory
- module

Validation behavior:

- factory requires create()
- module requires a direct module object API

In this plan, only ThemeModel and ThemeResolver use module shape.

## CSS Loading Contract

Global CSS:

- plugin.css remains global and is linked in document head

Committed HTML CSS:

- renderer-specific shadowCss bundles are preloaded as text
- shadowCss is not globally linked in document head
- HtmlSurfaceController injects only the active renderer bundle into that renderer shadow root

## Loader Flow

1. resolve dependencies recursively
2. load CSS when component declares css
3. load JS script once
4. validate API shape
5. cache resolved component promise

## Runtime Init Notes

runtime/init.js:

- computes needed components from widget definitions
- appends ThemeModel and ThemeResolver
- preloads declared shadowCss URLs
- configures runtime._theme
- registers widgets

## Related

- runtime-lifecycle.md
- cluster-widget-system.md
- ../shared/theme-tokens.md
