# Theme Tokens

**Status:** ✅ Implemented | `shared/theme/ThemeModel.js` + `shared/theme/ThemeResolver.js`

## Overview

Theme ownership is split into two direct-module components:

- `ThemeModel` owns token metadata, preset metadata, normalization, and merge-order semantics.
- `ThemeResolver` resolves concrete token values for a widget root via CSS inputs + `ThemeModel` metadata.

Both modules are registered with `apiShape: "module"` and do not use `create(def, Helpers)`.

## Key Details

- `ThemeModel` global key: `DyniThemeModel`
- `ThemeResolver` global key: `DyniThemeResolver`
- `ThemeResolver` API:
  - `configure({ ThemeModel, getNightModeState, getActivePresetName, readCssInputVar })`
  - `resolveForRoot(rootEl) -> themeTokens` (throws unless `rootEl` is committed `.widget.dyniplugin`)
  - `getTokenDefinitions()`
  - `getOutputTokenDefinitions()`
- Resolver caching was removed; there is no `invalidateRoot()` / `invalidateAll()` API.

## Shared Input Variables

Canonical shared inputs for migrated surface/typography tokens:

- `--dyni-fg`
- `--dyni-bg`
- `--dyni-border`
- `--dyni-font`
- `--dyni-font-weight`
- `--dyni-label-weight`

Legacy split border vars are removed from shared theme ownership:

- `--dyni-border-day`
- `--dyni-border-night`

## Materialized Output Variables

Theme output materialization uses:

- `--dyni-theme-surface-fg`
- `--dyni-theme-surface-bg`
- `--dyni-theme-surface-border`
- `--dyni-theme-font-family`
- `--dyni-theme-font-weight`
- `--dyni-theme-font-label-weight`

## Presets and Modes

Supported preset families:

- `default`
- `slim`
- `bold`
- `highcontrast`

Normalization owner:

- `ThemeModel.normalizePresetName(name)`

Special rule:

- `night` is normalized to `default` as a preset name.
- Night behavior is mode-driven, not a standalone preset family.

## Resolution Order

For each token path, resolution order is:

1. explicit root CSS input override (`inputVar`)
2. active preset mode override
3. active preset base override
4. global mode default (`defaultByMode`)
5. global base default (`default`)

## API Usage

```javascript
const themeModel = Helpers.getModule("ThemeModel");
const themeResolver = Helpers.getModule("ThemeResolver");

themeResolver.configure({
  ThemeModel: themeModel,
  getActivePresetName() {
    return state.themePresetName;
  },
  getNightModeState(rootEl) {
    return !!(rootEl && rootEl.closest && rootEl.closest(".nightMode"));
  }
});

const rootEl = committedPluginRootEl;
const tokens = themeResolver.resolveForRoot(rootEl);
```

## Runtime Integration

`runtime/init.js` explicitly ensures `ThemeModel` is loaded and reads `--dyni-theme-preset` once from `document.documentElement`.
`ThemeResolver` does not ingest preset selection from DOM attributes; runtime injects the active preset through `configure({ getActivePresetName })`.
`runtime/init.js` configures `ThemeResolver` with `ThemeModel`, strict root night-mode detection, and runtime-owned active preset selection (`state.themePresetName`).

## Related

- [css-theming.md](css-theming.md)
- [../architecture/runtime-lifecycle.md](../architecture/runtime-lifecycle.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
