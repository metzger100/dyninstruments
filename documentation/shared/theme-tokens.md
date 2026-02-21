# Theme Tokens

**Status:** ✅ Implemented | `shared/theme/ThemeResolver.js`

## Overview

`ThemeResolver` provides plugin-wide token resolution from CSS custom properties. It reads from `getComputedStyle(canvas)`, applies per-token defaults, and caches results per canvas.

## Key Details

- Component ID: `ThemeResolver`
- Global key: `DyniThemeResolver`
- File: `shared/theme/ThemeResolver.js`
- Factory: `create(def, Helpers)`
- API: `resolve(canvas) -> themeTokens`
- Caching: `WeakMap` per canvas
- Invalidation: cache reset when root `.nightMode` class state changes
- Numeric parsing: `parseFloat`, fallback on `NaN`
- Color parsing: `trim`, fallback on empty string
- No JS night defaults; night behavior is CSS-driven

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

// Static defaults
resolverMod.DEFAULTS;
resolverMod.create.DEFAULTS;
```

## Preset Overrides (Pending)

- ⏳ Future preset layers may map profile names to CSS variable sets.
- ⏳ Runtime preset switching is not implemented yet.

## Related

- [css-theming.md](css-theming.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
