# CSS Theming

**Status:** ✅ Implemented | plugin.css

## Overview

dyninstruments uses CSS custom properties for theming, scoped to `.dyniplugin` and `[data-dyni]`. All rendering reads colors and fonts from CSS, enabling automatic day/night adaptation.

## CSS Custom Properties

### Font

| Variable | Purpose | Default |
|---|---|---|
| `--dyni-font` | Font family stack for canvas and HTML | `"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,...` |

Set on `.widget.dyniplugin` and `[data-dyni]`. Read by `Helpers.resolveFontFamily()`.

### Colors (Foreground)

Read by `Helpers.resolveTextColor()` in priority order:

| Variable | Purpose | Fallback |
|---|---|---|
| `--dyni-fg` | Plugin-specific foreground | (not set by default) |
| `--instrument-fg` | AvNav instrument foreground | (set by AvNav theme) |
| `--mainfg` | AvNav main foreground | (set by AvNav theme) |

If none set: falls back to `getComputedStyle(canvas).color` or `"#000"`.

### Border

| Variable | Purpose | Default |
|---|---|---|
| `--dyni-border-day` | Border color in day mode | `rgba(0, 0, 0, 0.30)` |
| `--dyni-border-night` | Border color in night mode | `rgba(252, 11, 11, 0.18)` |

## Day/Night Mode

AvNav adds `.nightMode` class to the page root in night mode. CSS handles border adaptation:

```css
/* Day mode (default) */
.widget.dyniplugin { border: 1px solid var(--dyni-border-day, rgba(0,0,0,0.30)); }

/* Night mode */
.nightMode .widget.dyniplugin { border-color: var(--dyni-border-night, rgba(252,11,11,0.18)); }
```

Canvas colors adapt automatically because `resolveTextColor()` reads live CSS values that AvNav changes on mode switch.

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

Most modules have minimal or empty CSS files. All visual styling is done in canvas. CSS files exist for:

- **plugin.css** — Plugin-wide styles (font, border, head hiding, canvas sizing)
- **ClusterWidget.css** — Empty (kept for symmetry)
- **ThreeValueTextWidget.css** — Empty (reads CSS vars via canvas)
- **WindDialWidget.css** — Empty (reads CSS vars via canvas)
- **CompassGaugeWidget.css** — Empty (reads CSS vars via canvas)

SpeedGaugeWidget, DepthGaugeWidget, TemperatureGaugeWidget, VoltageGaugeWidget have no CSS files.

## File Location

- **plugin.css** — project root

## Related

- [helpers.md](helpers.md) — How resolveTextColor/resolveFontFamily read CSS
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Canvas color palette
