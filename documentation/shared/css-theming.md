# CSS Theming

**Status:** ✅ Implemented | plugin.css + runtime preset layer

## Overview

dyninstruments uses CSS custom properties for theming, scoped to `.dyniplugin` and `[data-dyni]`. All rendering reads colors and fonts from CSS, enabling automatic day/night adaptation.

Theme values are layered:

1. Base defaults from `plugin.css` (`.widget.dyniplugin`, `[data-dyni]`)
2. Optional runtime preset selector from `ThemePresets.apply(containerEl, presetName)` (`data-dyni-theme` on widget container)
3. Optional user overrides from AvNav `user.css` (per-token and preset variable overrides)
4. Day/night class-dependent CSS (`.nightMode ...`)

## CSS Custom Properties

### Font

| Variable | Purpose | Default |
|---|---|---|
| `--dyni-font` | Font family stack for canvas and HTML | `"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,...` |

Set on `.widget.dyniplugin` and `[data-dyni]`. Read by `Helpers.resolveFontFamily()`.
`Helpers` caches resolved font family per canvas, so repeated renders do not call `getComputedStyle()` again while mode stays unchanged.

### Colors (Foreground)

Read by `Helpers.resolveTextColor()` in priority order:

| Variable | Purpose | Fallback |
|---|---|---|
| `--dyni-fg` | Plugin-specific foreground | (not set by default) |
| `--instrument-fg` | AvNav instrument foreground | (set by AvNav theme) |
| `--mainfg` | AvNav main foreground | (set by AvNav theme) |

If none set: falls back to `getComputedStyle(canvas).color` or `"#000"`.
`Helpers.resolveTextColor()` shares a per-canvas typography cache with `resolveFontFamily()`, reducing repeated style reads in steady day or night mode.

### Border

| Variable | Purpose | Default |
|---|---|---|
| `--dyni-border-day` | Border color in day mode | `rgba(0, 0, 0, 0.30)` |
| `--dyni-border-night` | Border color in night mode | `rgba(252, 11, 11, 0.18)` |

### Theme Tokens (ThemeResolver)

Read by `ThemeResolver.resolve(canvas)`:

| Variable | Purpose | Default |
|---|---|---|
| `--dyni-pointer` | Pointer color | `#ff2b2b` |
| `--dyni-warning` | Warning sector color | `#e7c66a` |
| `--dyni-alarm` | Alarm sector color | `#ff7a76` |
| `--dyni-layline-stb` | Starboard layline color | `#82b683` |
| `--dyni-layline-port` | Port layline color | `#ff7a76` |
| `--dyni-tick-major-len` | Major tick length | `9` |
| `--dyni-tick-major-width` | Major tick stroke width | `2` |
| `--dyni-tick-minor-len` | Minor tick length | `5` |
| `--dyni-tick-minor-width` | Minor tick stroke width | `1` |
| `--dyni-pointer-side` | Pointer side factor | `0.25` |
| `--dyni-pointer-length` | Pointer length factor | `2` |
| `--dyni-arc-linewidth` | Arc line width | `1` |
| `--dyni-ring-width` | Ring width factor | `0.12` |
| `--dyni-label-inset` | Label inset factor | `1.8` |
| `--dyni-label-font` | Label font factor | `0.14` |
| `--dyni-fullcircle-normal-inner-margin` | Full-circle normal-mode inner margin factor | `0.03` |
| `--dyni-fullcircle-normal-min-height` | Full-circle normal-mode minimum block height factor | `0.45` |
| `--dyni-fullcircle-normal-dual-gap` | Full-circle normal-mode dual-column gap factor | `0.05` |
| `--dyni-font-weight` | Primary font weight | `700` |
| `--dyni-label-weight` | Label font weight | `700` |
| `--dyni-xte-line-width-factor` | XTE highway stroke thickness multiplier | `1` |

### Preset Layer (ThemePresets)

`ThemePresets` sets a preset selector attribute directly on the widget root container (`.widget` / `.DirectWidget`).

- `apply(containerEl, presetName)`:
  - normalizes `presetName`
  - sets `data-dyni-theme="<preset>"` for non-default presets
  - removes `data-dyni-theme` when preset is `default`
- `remove(containerEl)`:
  - removes `data-dyni-theme` from the container

`plugin.css` contains the actual preset token overrides via plugin-scoped selectors like `.dyniplugin[data-dyni-theme="slim"]`.
This keeps preset values scoped per widget container, CSS-inspectable, and compatible with user overrides.

### User CSS Overrides

Preset selection can be provided from AvNav `user.css` via `--dyni-theme-preset`:

```css
.widget.dyniplugin,
[data-dyni] {
  --dyni-theme-preset: slim;
}
```

Per-token overrides can be applied in `user.css` and naturally override preset values:

```css
.widget.dyniplugin,
[data-dyni] {
  --dyni-pointer: #00aaff;
  --dyni-arc-linewidth: 1.5;
  --dyni-xte-line-width-factor: 1.25;
}
```

## Day/Night Mode

AvNav adds `.nightMode` class to the page root in night mode. CSS handles border and token adaptation:

```css
/* Day mode (default) */
.widget.dyniplugin { border: 1px solid var(--dyni-border-day, rgba(0,0,0,0.30)); }

/* Night mode */
.nightMode .widget.dyniplugin {
  border-color: var(--dyni-border-night, rgba(252,11,11,0.18));
}
```

Night-mode border adaptation is CSS-only. `ThemeResolver` keeps one JS defaults map and reads live CSS each mode after cache invalidation.
`Helpers` typography cache also tracks the current root `.nightMode` state per canvas; when the mode flips, the next `resolveTextColor()` / `resolveFontFamily()` call refreshes cached values from `getComputedStyle()`.

## Head Hiding

When a module sets `wantsHideNativeHead: true`, the registration wrapper adds `data-dyni` attribute to the widget root. CSS then hides AvNav's native header:

```css
[data-dyni] .widgetHead,
[data-dyni] .valueData {
  display: none !important;
}
```

Canvas fills the full widget area:

```css
[data-dyni] canvas.widgetData {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
```

## Module CSS Files

All component-level widget CSS files were removed. Visual styling remains canvas-driven, and shared theme/style rules are provided only via:

- **plugin.css** — Plugin-wide styles (font, border, head hiding, canvas sizing)

## File Location

- **plugin.css** — project root

## Related

- [helpers.md](helpers.md) — How resolveTextColor/resolveFontFamily read CSS
- [theme-tokens.md](theme-tokens.md) — ThemeResolver tokens and cache behavior
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Canvas color palette
