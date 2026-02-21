# Theme Tokens

**Status:** ✅ Implemented | `shared/theme/ThemeResolver.js` + `shared/theme/ThemePresets.js` (UI settings integration pending)

## Overview

`ThemeResolver` provides plugin-wide token resolution from CSS custom properties. It reads from `getComputedStyle(canvas)`, applies per-token defaults, and caches results per canvas.

`ThemePresets` provides named runtime presets that apply token overrides as inline CSS custom properties on widget root containers.

## Key Details

- Component ID: `ThemeResolver`
- Global key: `DyniThemeResolver`
- File: `shared/theme/ThemeResolver.js`
- Factory: `create(def, Helpers)`
- API: `resolve(canvas) -> themeTokens`
- Token metadata API: `TOKEN_DEFS` / `create.TOKEN_DEFS`
- Caching: `WeakMap` per canvas
- Invalidation: cache reset when root `.nightMode` class state changes
- Numeric parsing: `parseFloat`, fallback on `NaN`
- Color parsing: `trim`, fallback on empty string
- No JS night defaults; night behavior is CSS-driven

- Component ID: `ThemePresets`
- Global key: `DyniThemePresets`
- File: `shared/theme/ThemePresets.js`
- API: `presets`, `apply(containerEl, presetName)`, `remove(containerEl)`
- Mapping source: reuses `ThemeResolver.TOKEN_DEFS` (`path -> cssVar`)

## Token Table

| Token | CSS Variable | Default | Type |
|---|---|---|---|
| `colors.pointer` | `--dyni-pointer` | `#ff2b2b` | string |
| `colors.warning` | `--dyni-warning` | `#e7c66a` | string |
| `colors.alarm` | `--dyni-alarm` | `#ff7a76` | string |
| `colors.laylineStb` | `--dyni-layline-stb` | `#82b683` | string |
| `colors.laylinePort` | `--dyni-layline-port` | `#ff7a76` | string |
| `ticks.majorLen` | `--dyni-tick-major-len` | `9` | number |
| `ticks.majorWidth` | `--dyni-tick-major-width` | `2` | number |
| `ticks.minorLen` | `--dyni-tick-minor-len` | `5` | number |
| `ticks.minorWidth` | `--dyni-tick-minor-width` | `1` | number |
| `pointer.sideFactor` | `--dyni-pointer-side` | `0.25` | number |
| `pointer.lengthFactor` | `--dyni-pointer-length` | `2` | number |
| `ring.arcLineWidth` | `--dyni-arc-linewidth` | `1` | number |
| `ring.widthFactor` | `--dyni-ring-width` | `0.12` | number |
| `labels.insetFactor` | `--dyni-label-inset` | `1.8` | number |
| `labels.fontFactor` | `--dyni-label-font` | `0.14` | number |
| `font.weight` | `--dyni-font-weight` | `700` | number |
| `font.labelWeight` | `--dyni-label-weight` | `700` | number |

## Font Token Usage

- `font.weight` is used for primary numeric value text in semicircle gauges, WindDialWidget, CompassGaugeWidget, ThreeValueTextWidget, and PositionCoordinateWidget.
- `font.labelWeight` is used for captions/units, tick labels, dial cardinal labels, and disconnect overlay text.

## resolve(canvas) Behavior

1. Determine current night-mode root class state (`.nightMode`)
2. If state changed since last call, clear canvas cache
3. Return cached tokens for canvas when present
4. Otherwise read CSS variables via `getComputedStyle(canvas)`
5. Parse and normalize all tokens
6. Store in cache and return token object

## API/Interfaces

```javascript
const resolverMod = Helpers.getModule("ThemeResolver");
const resolver = resolverMod.create(def, Helpers);
const themeTokens = resolver.resolve(canvas);

// Static defaults + token mapping
resolverMod.DEFAULTS;
resolverMod.create.DEFAULTS;
resolverMod.TOKEN_DEFS;
resolverMod.create.TOKEN_DEFS;
```

```javascript
const presetsMod = Helpers.getModule("ThemePresets");
const presetsApi = presetsMod.create(def, Helpers);

presetsApi.presets; // { default, slim, bold, night, highcontrast }
presetsApi.apply(containerEl, "slim");
presetsApi.remove(containerEl);
```

## Preset System

`ThemePresets.apply(containerEl, presetName)`:

1. Removes all known theme CSS variables from the target container
2. Applies only preset override variables for the selected preset

`ThemePresets.remove(containerEl)` removes every known theme token variable listed in `ThemeResolver.TOKEN_DEFS`.

`default` preset is intentionally empty (`{}`), so applying `default` resets container-level token overrides.

## Preset Definitions

Only values that differ from theme defaults are included.

| Preset | Overrides |
|---|---|
| `default` | none |
| `slim` | `ring.arcLineWidth=0.5`, `ring.widthFactor=0.09`, `ticks.majorWidth=1.5`, `ticks.minorWidth=0.75`, `pointer.sideFactor=0.18`, `font.labelWeight=400` |
| `bold` | `ring.arcLineWidth=2`, `ring.widthFactor=0.16`, `ticks.majorLen=12`, `ticks.majorWidth=3`, `ticks.minorLen=7`, `ticks.minorWidth=1.5`, `pointer.sideFactor=0.35`, `pointer.lengthFactor=2.2` |
| `night` | `colors.pointer=#cc2222`, `colors.warning=#8b6914`, `colors.alarm=#992222`, `colors.laylineStb=#3d6b3d`, `colors.laylinePort=#8b3333` |
| `highcontrast` | `colors.pointer=#ff0000`, `colors.warning=#ffcc00`, `colors.alarm=#ff3300`, `ring.arcLineWidth=2`, `ticks.majorWidth=3`, `ticks.minorWidth=2`, `pointer.sideFactor=0.35` |

## Runtime Integration

`runtime/init.js` loads `ThemePresets` explicitly and applies the selected preset to discovered plugin widget containers after widget registration.

- Current runtime override source: `window.DyniPlugin.theme = "<presetName>"`
- Default preset when unset: `"default"`
- Discovery pattern: iterate `canvas.widgetData`, resolve root via `canvas.closest(".widget, .DirectWidget") || canvas.parentElement`, apply only for plugin roots (`.dyniplugin` or `[data-dyni]`)

`runtime/widget-registrar.js` also reapplies the active preset when a widget root is first discovered during `renderCanvas`.

## Manual Testing (Browser Console)

```javascript
window.DyniPlugin.theme = "bold";
window.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets();
```

To reset:

```javascript
window.DyniPlugin.theme = "default";
window.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets();
```

## Future Settings API Integration

- Runtime contains a documented settings stub (`readThemePresetFromSettingsApi()`).
- UI wiring to platform/plugin settings API is pending.
- Planned behavior: read persisted preset value from settings API, then call `runtime.applyThemePresetToRegisteredWidgets()`.

## Related

- [css-theming.md](css-theming.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
