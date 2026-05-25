# ClockRadialWidget Module

**Status:** ✅ Implemented | `widgets/radial/ClockRadialWidget/ClockRadialWidget.js`

## Overview

Analog clock radial widget with a 12-hour face and hour, minute, and second hands. The clock face displays a ring, major ticks at 30° intervals, minor ticks at 6° intervals, and numeral labels "1" through "12". Hour, minute, and second hands are drawn per-frame as dynamic pointers from the dial center without easing.

The widget follows the full-circle dial architecture shared by `CompassRadialWidget` / `WindRadialWidget` using `FullCircleRadialEngine`.

## Module Registration

```javascript
// In config/components/registry-widgets-gauge.js (assembled by config/components.js)
ClockRadialWidget: {
  js: BASE + "widgets/radial/ClockRadialWidget/ClockRadialWidget.js",
  css: undefined,
  globalKey: "DyniClockRadialWidget",
  deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout", "GeometryScale", "PlaceholderNormalize"]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | string/number/Date | — | Raw time value (ISO string, `HH:MM:SS`, timestamp, or Date object) |
| `hideSeconds` | boolean | `false` | Suppress second hand and use `formatClock` formatter |
| `formatter` | string | `"formatTime"` | Formatter name for digital display (`formatTime` or `formatClock`) |
| `formatterParameters` | array | `[]` | Formatter parameters |
| `caption` | string | `"TIME"` | Caption text |
| `unit` | string | `""` | Unit text |
| `clockRadialRatioThresholdNormal` | number | `0.7` | Ratio below → `high` |
| `clockRadialRatioThresholdFlat` | number | `2.0` | Ratio above → `flat` |
| `clockRadialHideTextualMetrics` | boolean | `false` | Suppress all digital text display, show dial only |
| `captionUnitScale` | number | `0.8` | Caption/unit ratio vs value |
| `default` | string | `"---"` | Fallback placeholder text |

## Clock Dial Drawing

| Element | Draw Function | Parameters |
|---|---|---|
| Ring (cached face) | `api.drawFullCircleRing` | full circle |
| Ticks (cached face) | `api.drawFullCircleTicks` | `0..360`, major 30, minor 6 |
| Hour labels (cached face) | `layerCtx.fillText` | labels "1"–"12" at 30° intervals on offscreen cached-layer context |
| Hour hand | `drawHand` with `state.color` | length `rOuter * 0.45`, stroke weight from `GeometryScale.scaleStroke` |
| Minute hand | `drawHand` with `state.color` | length `rOuter * 0.65`, stroke weight from `GeometryScale.scaleStroke` |
| Second hand | `drawHand` with `tokens.colors.pointer` | length `rOuter * 0.80`, stroke weight from `GeometryScale.scaleStroke` |
| Center cap | `ctx.arc` filled circle | radius `rOuter * 0.03`, fill `state.color` |

### Hand Lengths

| Hand | Length (fraction of rOuter) | Color |
|---|---|---|
| Hour | `0.45` | `state.color` (foreground) |
| Minute | `0.65` | `state.color` (foreground) |
| Second | `0.80` | `tokens.colors.pointer` |

## Background Cache Behavior

### Cached Static Assets

- Face layer: ring + ticks + hour numeral labels

### Dynamic Per-Frame Layer

- Hour, minute, second hands
- Center cap dot over hands
- Digital time text in layout modes

### Cache Key Inputs (static-only)

- Pixel buffer dimensions and effective DPR mapping
- Dial/tick geometry and static style inputs
- Label geometry inputs (font px, label radius)
- Resolved typography/style inputs (`family`, `labelWeight`, resolved text color)
- Label-set signature (`1-12|major30|minor6`)

### Invalidation Triggers

- Canvas geometry/buffer size changes
- Dial geometry changes from size/theme style shifts
- Static style/token/typography changes
- Label geometry/style changes

### Non-Triggers

- Time value updates (hands and text only)
- `hideSeconds` toggle
- `disconnect` toggle

## Layout Modes

```
ratio = W / H
ratio < clockRadialRatioThresholdNormal → high
ratio > clockRadialRatioThresholdFlat → flat
otherwise → normal
```

### Digital Time Display

`flat`: left strip with caption (top) + value/unit (bottom), `{ side: "left", align: "left" }`

`normal`: centered 3-row block inside dial (default)

`high`: one inline row in top slot, `{ slot: "top" }`

When `clockRadialHideTextualMetrics` is `true`, all digital text modes are suppressed — only the analog clock face is shown.

## Internal Value Formatting

### Time Parsing

`parseTime(rawValue)` handles:
- ISO 8601 date strings (e.g. `"2026-05-25T14:30:25Z"`)
- Simple time strings (e.g. `"14:30:25"`)
- JavaScript Date objects
- Millisecond timestamps

Returns `{ hours, minutes, seconds }` or `null` for unparseable input.

### Hand Angle Computation

`computeHandAngles(time)`:
- `hourAngle = (time.hours % 12) * 30 + time.minutes * 0.5` (30°/hour + 0.5°/minute)
- `minuteAngle = time.minutes * 6 + time.seconds * 0.1` (6°/minute + 0.1°/second)
- `secondAngle = time.seconds * 6` (6°/second)

All angles in degrees, 0° at 12 o'clock, clockwise positive.

### Formatter Dispatch

`clockDisplay(state, props)`:
- Parses `props.value` via `parseTime()`
- Formats digital display text via `componentContext.format.applyFormatter()` using `props.formatter`
- Normalizes through `PlaceholderNormalize.normalize()`

The formatter name (`formatTime` for HH:MM:SS or `formatClock` for HH:MM) is resolved from `props.formatter` (set by the mapper based on `hideSeconds`).

## Exports

```javascript
return {
  id: "ClockRadialWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## Related

- [../radial/full-circle-dial-engine.md](../radial/full-circle-dial-engine.md)
- [../radial/full-circle-dial-style-guide.md](../radial/full-circle-dial-style-guide.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/placeholder-normalize.md](../shared/placeholder-normalize.md)
- [../shared/hide-seconds.md](../shared/hide-seconds.md)
- [../guides/add-new-full-circle-dial.md](../guides/add-new-full-circle-dial.md)