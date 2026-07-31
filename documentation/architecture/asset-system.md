# Asset System

**Status:** Current.

## Overview

dyninstruments can declare runtime assets on component registry entries. The component loader preloads those assets on
demand and exposes them through `runtime.getAsset(key)`.

This system is for widget-specific assets only. Plugin-wide fonts still live in `plugin.css` and are shipped from
`assets/fonts/`. Release builds also include `bootstrap-bundle.js`, a concatenation of all bootstrap manifest scripts,
which the shared bootstrap core (`runtime/plugin-bootstrap-core.js`) loads as a single request when available from
either `plugin.js` (legacy) or `plugin.mjs` (module) startup.

## Key Details

- Registry entries declare assets via an `assets` array; each entry has `key`, `path` (relative to the plugin root, no
  `BASE` prefix), and `type` (one of `svg`, `image`, `audio`, `json`, `font`).
- `runtime.createAssetPreloader(baseUrl)` builds the preloader consumed by `runtime/component-loader.js`.
- `runtime.getAsset(key)` is the only lookup API: it throws for an unknown key, returns `null` for a known key that
  failed to preload, and otherwise returns the preloaded value.
- Preload result by type: `svg` -> raw string via `fetch(...).text()`; `image` -> `HTMLImageElement` (after `onload`);
  `audio` -> `ArrayBuffer` via `fetch(...).arrayBuffer()`; `json` -> parsed object via `fetch(...).json()`; `font` ->
  `FontFace` (from a fetched `ArrayBuffer`) added to `document.fonts`.
- Duplicate asset keys, unsupported types, and malformed declarations all throw during preload.
- Preloading runs after JS/CSS load completion and before component API validation in the component loader.
- Route-specific assets load during route activation, not startup, and stay cached for the plugin session.
- Plugin-wide Roboto/Roboto Mono fonts stay declared via `@font-face` in `plugin.css`, resolve from `assets/fonts/`, and
  are never routed through the component registry or `runtime.getAsset()`.
- Release builds concatenate bootstrap manifest scripts into `bootstrap-bundle.js`, loaded as one request by
  `runtime/plugin-bootstrap-core.js`.

## Registry Schema

Component registry entries may include an optional `assets` array:

```js
SomeComponent: {
  js: BASE + "path/to/component.js",
  css: undefined,
  globalKey: "DyniSomeComponent",
  deps: ["OtherComponent"],
  assets: [
    { key: "compass-icon", path: "assets/icons/compass.svg", type: "svg" },
    { key: "alarm-tone", path: "assets/sounds/alarm.mp3", type: "audio" }
  ]
}
```

Field contract:

- `key` is the global lookup key used by `runtime.getAsset(key)`
- `path` is relative to the plugin root and must not include the `BASE` prefix
- `type` must be one of `svg`, `image`, `audio`, `json`, or `font`

The asset path stays relative in the registry so both browser runtime and Node-based tooling can resolve it consistently
at consumption time.

## Preload Contract

`runtime.createAssetPreloader(baseUrl)` returns the asset preloader used by `runtime/component-loader.js`.

Preload behavior by type:

- `svg` uses `fetch(...).text()` and stores the raw SVG string
- `image` creates an `Image`, waits for `onload`, and stores the `HTMLImageElement`
- `audio` uses `fetch(...).arrayBuffer()` and stores the `ArrayBuffer`
- `json` uses `fetch(...).json()` and stores the parsed object
- `font` uses `fetch(...).arrayBuffer()`, creates a `FontFace`, adds it to `document.fonts`, and stores the `FontFace`

Error contract:

- Unknown asset key: `runtime.getAsset(key)` throws
- Known asset that failed to preload: `runtime.getAsset(key)` returns `null`
- Duplicate asset keys throw during preload
- Unsupported asset types or malformed declarations throw during preload

The component loader preloads declared assets after JS/CSS load completion and before component API validation.

Route-specific assets are component-owned: they are loaded during route activation, not startup, and the loaded results
stay cached for the plugin session.

## Plugin-Wide Fonts

The bundled Roboto and Roboto Mono fonts are a plugin-wide concern, not a component asset concern.

- They remain declared in `plugin.css` via `@font-face`
- They resolve from `assets/fonts/`
- They are not loaded through the component registry or `runtime.getAsset()`

See [shared/bundled-fonts.md](../shared/bundled-fonts.md) for the bundled-fonts contract.

## Related

- [component-system.md](component-system.md)
- [../shared/bundled-fonts.md](../shared/bundled-fonts.md)
- [../shared/helpers.md](../shared/helpers.md)
