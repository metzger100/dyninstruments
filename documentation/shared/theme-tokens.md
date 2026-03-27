# Theme Tokens

**Status:** ✅ Implemented | `shared/theme/ThemeResolver.js` + `shared/theme/ThemePresets.js` (UI settings integration pending)

## Overview

`ThemeResolver` provides plugin-wide token resolution from CSS custom properties. The API is strictly root-first: `resolveForRoot(rootEl)` reads the widget root directly, resolves preset names with precedence `data-dyni-theme -> --dyni-theme-preset -> default`, prefers explicit CSS token overrides, and caches the merged result per root. `runtime/init.js` discovers `.widget.dyniplugin` roots directly when applying presets.

`ThemePresets` provides named runtime presets by setting a preset selector attribute (`data-dyni-theme`) on widget root containers.

## Key Details

- Component ID: `ThemeResolver`
- Global key: `DyniThemeResolver`
- File: `shared/theme/ThemeResolver.js`
- Factory: `create(def, Helpers)`
- API: `resolveForRoot(rootEl) -> themeTokens`
- Invalidation API: `invalidateRoot(rootEl)`, `invalidateAll()`
- Token metadata API: `TOKEN_DEFS` / `create.TOKEN_DEFS`
- Preset metadata API: reads `ThemePresets.PRESETS` / `ThemePresets.create.PRESETS`
- Preset normalization owner: `ThemePresets.normalizePresetName` / `ThemePresets.create.normalizePresetName`
- Caching: `WeakMap` per root element
- Canvas renderer call pattern: `const rootEl = Helpers.resolveWidgetRoot(canvas) || canvas; resolver.resolveForRoot(rootEl)`
- Invalidation: cache reset when `Helpers.getNightModeState(rootEl)` changes
- Numeric parsing: `parseFloat`, fallback on `NaN`
- Color parsing: `trim`, fallback on empty string
- Default token values are JS-owned in `ThemeResolver`

- Component ID: `ThemePresets`
- Global key: `DyniThemePresets`
- File: `shared/theme/ThemePresets.js`
- API: `presets`, `apply(containerEl, presetName)`, `remove(containerEl)`
- Static metadata: `PRESETS` / `create.PRESETS`
- Behavior: manages `data-dyni-theme` attribute on widget roots

## Token Table

| Token | CSS Variable | Default | Type |
|---|---|---|---|
| `colors.pointer` | `--dyni-pointer` | `#ff2b2b` | string |
| `colors.warning` | `--dyni-warning` | `#e7c66a` | string |
| `colors.alarm` | `--dyni-alarm` | `#ff7a76` | string |
| `colors.laylineStb` | `--dyni-layline-stb` | `#82b683` | string |
| `colors.laylinePort` | `--dyni-layline-port` | `#ff7a76` | string |
| `ticks.majorLen` | `--dyni-radial-tick-major-len` | `12` | number |
| `ticks.majorWidth` | `--dyni-radial-tick-major-width` | `3` | number |
| `ticks.minorLen` | `--dyni-radial-tick-minor-len` | `7` | number |
| `ticks.minorWidth` | `--dyni-radial-tick-minor-width` | `1.5` | number |
| `pointer.widthFactor` | `--dyni-radial-pointer-width` | `1` | number |
| `pointer.lengthFactor` | `--dyni-radial-pointer-length` | `2` | number |
| `ring.arcLineWidth` | `--dyni-radial-arc-linewidth` | `2` | number |
| `ring.widthFactor` | `--dyni-radial-ring-width` | `0.16` | number |
| `labels.insetFactor` | `--dyni-radial-label-inset` | `1.8` | number |
| `labels.fontFactor` | `--dyni-radial-label-font` | `0.14` | number |
| `fullCircle.normal.innerMarginFactor` | `--dyni-radial-fullcircle-normal-inner-margin` | `0.03` | number |
| `fullCircle.normal.minHeightFactor` | `--dyni-radial-fullcircle-normal-min-height` | `0.45` | number |
| `fullCircle.normal.dualGapFactor` | `--dyni-radial-fullcircle-normal-dual-gap` | `0.05` | number |
| `linear.track.widthFactor` | `--dyni-linear-track-width` | `0.16` | number |
| `linear.track.lineWidth` | `--dyni-linear-track-linewidth` | `2` | number |
| `linear.ticks.majorLen` | `--dyni-linear-tick-major-len` | `12` | number |
| `linear.ticks.majorWidth` | `--dyni-linear-tick-major-width` | `3` | number |
| `linear.ticks.minorLen` | `--dyni-linear-tick-minor-len` | `7` | number |
| `linear.ticks.minorWidth` | `--dyni-linear-tick-minor-width` | `1.5` | number |
| `linear.pointer.widthFactor` | `--dyni-linear-pointer-width` | `1` | number |
| `linear.pointer.lengthFactor` | `--dyni-linear-pointer-length` | `2` | number |
| `linear.labels.insetFactor` | `--dyni-linear-label-inset` | `1.8` | number |
| `linear.labels.fontFactor` | `--dyni-linear-label-font` | `0.14` | number |
| `font.weight` | `--dyni-font-weight` | `700` | number |
| `font.labelWeight` | `--dyni-label-weight` | `700` | number |
| `xte.lineWidthFactor` | `--dyni-xte-line-width-factor` | `1.5` | number |
| `xte.boatSizeFactor` | `--dyni-xte-boat-size-factor` | `1` | number |

## Font Token Usage

- `font.weight` is used for primary numeric value text in semicircle gauges, WindRadialWidget, CompassRadialWidget, ThreeValueTextWidget, and PositionCoordinateWidget.
- `font.labelWeight` is used for captions/units, tick labels, dial cardinal labels, and disconnect overlay text.

## Pointer Factor Semantics

- `widthFactor` controls full rendered pointer width.
- `lengthFactor` controls rendered pointer length.
- Both factors scale from the same unscaled base pointer size; width no longer derives from length-scaled depth.

Formulas:

```text
pointerLengthPx = max(8, floor(basePointerSize * lengthFactor))
pointerWidthPx = max(8, floor(basePointerSize * widthFactor))
pointerHalfWidthPx = max(4, floor(pointerWidthPx / 2))
```

Base pointer size by renderer:

- Radial gauges and full-circle dials: unscaled `needleDepth` / explicit `depth`
- Linear gauges: unscaled `pointerDepthBase`, unless an explicit pixel `depth` override is supplied

## resolveForRoot(rootEl) Behavior

1. Determine current night-mode root class state (`.nightMode`)
2. If state changed since last call, clear cached tokens
3. Return cached tokens for root when present
4. Resolve preset name from:
   - `data-dyni-theme` when the attribute is present
   - `--dyni-theme-preset` CSS variable on the same root
   - fallback `default`
5. Read explicit CSS token overrides from the root computed style
6. Merge in order: CSS override -> preset value -> built-in default
7. Store in cache and return token object

## API/Interfaces

```javascript
const resolverMod = Helpers.getModule("ThemeResolver");
const resolver = resolverMod.create(def, Helpers);
const themeTokens = resolver.resolveForRoot(rootEl);
resolver.invalidateRoot(rootEl);
resolver.invalidateAll();

// Static defaults + token mapping
resolverMod.DEFAULTS;
resolverMod.create.DEFAULTS;
resolverMod.TOKEN_DEFS;
resolverMod.create.TOKEN_DEFS;
resolverMod.invalidateRoot;
resolverMod.invalidateAll;
```

```javascript
const presetsMod = Helpers.getModule("ThemePresets");
const presetsApi = presetsMod.create(def, Helpers);

presetsApi.presets; // { default, slim, bold, night, highcontrast }
presetsMod.PRESETS;
presetsMod.create.PRESETS;
presetsMod.normalizePresetName("bold");
presetsMod.create.normalizePresetName("bold");
presetsApi.normalizePresetName("bold");
presetsApi.apply(containerEl, "slim");
presetsApi.remove(containerEl);
```

## Preset System

`ThemePresets.apply(containerEl, presetName)`:

1. Normalizes the requested preset name (`trim`, lowercase)
2. Validates against known presets (`default`, `slim`, `bold`, `night`, `highcontrast`)
3. Sets `data-dyni-theme="<preset>"` for non-default presets
4. Removes `data-dyni-theme` for `default`

`ThemePresets.remove(containerEl)` removes `data-dyni-theme`.
`ThemePresets.normalizePresetName(presetName)` is the canonical preset-name normalizer used by both runtime preset selection and `ThemeResolver`.

`default` preset is intentionally empty (`{}`), so applying `default` clears the preset selector attribute and falls back to `ThemeResolver` built-in defaults.

## Preset Definitions

Only values that differ from theme defaults are included.

| Preset | Overrides |
|---|---|
| `default` | none |
| `slim` | `ring.arcLineWidth=1`, `ring.widthFactor=0.12`, `ticks.majorLen=9`, `ticks.majorWidth=2`, `ticks.minorLen=5`, `ticks.minorWidth=1`, `pointer.widthFactor=0.72`, `linear.track.widthFactor=0.12`, `linear.track.lineWidth=1`, `linear.ticks.majorLen=9`, `linear.ticks.majorWidth=2`, `linear.ticks.minorLen=5`, `linear.ticks.minorWidth=1`, `linear.pointer.widthFactor=0.72`, `font.labelWeight=400`, `xte.lineWidthFactor=1` |
| `bold` | `ring.arcLineWidth=2.5`, `ring.widthFactor=0.2`, `ticks.majorLen=16`, `ticks.majorWidth=4`, `ticks.minorLen=9`, `ticks.minorWidth=2`, `pointer.widthFactor=1.54`, `pointer.lengthFactor=2.2`, `linear.track.widthFactor=0.2`, `linear.track.lineWidth=2.5`, `linear.ticks.majorLen=16`, `linear.ticks.majorWidth=4`, `linear.ticks.minorLen=9`, `linear.ticks.minorWidth=2`, `linear.pointer.widthFactor=1.54`, `linear.pointer.lengthFactor=2.2`, `xte.lineWidthFactor=2` |
| `night` | `colors.pointer=#cc2222`, `colors.warning=#8b6914`, `colors.alarm=#992222`, `colors.laylineStb=#3d6b3d`, `colors.laylinePort=#8b3333` |
| `highcontrast` | `colors.pointer=#ff0000`, `colors.warning=#ffcc00`, `colors.alarm=#ff3300`, `ring.arcLineWidth=2`, `ticks.majorWidth=3`, `ticks.minorWidth=2`, `pointer.widthFactor=1.4`, `linear.track.lineWidth=2`, `linear.ticks.majorWidth=3`, `linear.ticks.minorWidth=2`, `linear.pointer.widthFactor=1.4`, `xte.lineWidthFactor=1.3` |

## Runtime Integration

`runtime/init.js` loads `ThemePresets` explicitly and applies the selected preset to discovered `.widget.dyniplugin` roots after widget registration.

- Preset source precedence:
  1. Settings API stub (`readThemePresetFromSettingsApi()`)
  2. `window.DyniPlugin.theme = "<presetName>"`
  3. CSS variable `--dyni-theme-preset` (typically from AvNav `user.css`)
  4. `default`
- Invalid preset names from any source resolve to `default`.
- Runtime delegates preset normalization to `ThemePresets.normalizePresetName` (single owner).
- Discovery pattern: iterate `.widget.dyniplugin` roots directly and apply the preset to those roots. When no widget root is mounted yet, the document-level CSS fallback remains the last resort.

After preset application, runtime explicitly invalidates `ThemeResolver` token cache via `invalidateRoot(rootEl)` so subsequent `resolveForRoot(rootEl)` reads refreshed values.

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

Preset selection from `user.css`:

```css
.widget.dyniplugin {
  --dyni-theme-preset: slim;
}
```

## Future Settings API Integration

- Runtime contains a documented settings stub (`readThemePresetFromSettingsApi()`).
- UI wiring to platform/plugin settings API is pending.
- Planned behavior: read persisted preset value from settings API, then call `runtime.applyThemePresetToRegisteredWidgets()`.

## Related

- [css-theming.md](css-theming.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
