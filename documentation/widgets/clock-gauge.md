# ClockRadialWidget Module

**Status:** ✅ Implemented | `widgets/radial/ClockRadialWidget/ClockRadialWidget.js`

## Overview

Full-circle analog clock with 12-hour dial, hour/minute/second hands, and optional digital time readout. The clock face is cached as a static layer (ring, ticks, numeral labels). Hands are drawn per-frame from the dial center without easing. Digital time display uses the shared `FullCircleRadialTextLayout.drawSingleModeText` contract, gated by `clockRadialHideTextualMetrics`.

## Module Registration

```javascript
// In config/components/registry-widgets-gauge.js
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
| `value` | string/number/Date | — | Raw time value from store (ISO string, `HH:MM:SS`, timestamp, or Date) |
| `caption` | string | `""` | Caption text (resolved from mapper, default `"TIME"`) |
| `unit` | string | `""` | Unit text (empty for clock) |
| `formatter` | string | `"formatTime"` | Formatter name (`formatTime` = HH:MM:SS, `formatClock` = HH:MM) |
| `formatterParameters` | array | `[]` | Formatter parameter passthrough |
| `hideSeconds` | boolean | `false` | When true, second hand is hidden and formatter swaps to `formatClock` |
| `clockRadialRatioThresholdNormal` | number | `0.7` | Ratio below -> `high` layout |
| `clockRadialRatioThresholdFlat` | number | `2.0` | Ratio above -> `flat` layout |
| `clockRadialHideTextualMetrics` | boolean | `false` | When true, digital text modes are suppressed entirely |
| `captionUnitScale` | number | `0.8` | Secondary text scale factor relative to value |

All props except `value` and `hideSeconds` are provided by the `VesselMapper` mapper's `rendererProps` block. `value` is the top-level mapper output. `hideSeconds` is read from top-level props (not rendererProps) by the engine fallback, and passed through rendererProps for the widget.

## Clock Dial Drawing

### Static Cached Layer (`"face"`)

Built once per cache-key change in `rebuildLayer`:

| Element | Implementation |
|---|---|
| Ring | `api.drawFullCircleRing(layerCtx)` — full circle |
| Major ticks | `api.drawFullCircleTicks(layerCtx, { startDeg: 0, endDeg: 360, stepMajor: 30 })` — 12 hour marks |
| Minor ticks | Same call with `stepMinor: 6` — 60 five-minute marks |
| Hour labels | `layerCtx.fillText(String(hour), cx + cos(rad) * labelRadius, cy + sin(rad) * labelRadius)` for hours 1–12 at 30° intervals |

Labels use `textAlign: "center"`, `textBaseline: "middle"`, `font` from `state.labelWeight + state.labels.fontPx + "px " + state.family`, `fillStyle: state.color`. Positions computed via `state.angle.degToCanvasRad(hour * 30)`.

Note: `rebuildLayer` receives `layerCtx` (the offscreen cached-layer canvas context), not `state.ctx`. Labels are drawn directly on the cached layer at their radial positions — unlike compass labels, clock numerals do not need sprite caching or upright rotation, since the clock face is static.

### Dynamic Per-Frame Layer (`drawFrame`)

| Element | Implementation |
|---|---|
| Hour hand | Line from center, length `rOuter * 0.45`, width via `GeometryScale.scaleStroke(rOuter, 0.04, weight, 2)`, color `state.color` |
| Minute hand | Line from center, length `rOuter * 0.65`, width via `GeometryScale.scaleStroke(rOuter, 0.025, weight, 1)`, color `state.color` |
| Second hand | Line from center, length `rOuter * 0.80`, width via `GeometryScale.scaleStroke(rOuter, 0.015, weight, 1)`, color `state.theme.colors.pointer` (hidden when `hideSeconds === true`) |
| Center cap | Filled circle at center, radius `max(1, floor(rOuter * 0.03) || 1)`, color `state.color` |

Hands are drawn using `drawHand(state, angleDeg, length, width, style)` which applies `ctx.lineCap = "round"`, converts the angle via `state.angle.degToCanvasRad(angleDeg)`, and draws from center to tip.

Hand angles (0° at 12 o'clock, clockwise):
- `hourAngle = (hours % 12) * 30 + minutes * 0.5`
- `minuteAngle = minutes * 6 + seconds * 0.1`
- `secondAngle = seconds * 6`

## Background Cache Behavior

### Cached Static Assets

- Ring + ticks (major 30°, minor 6°) + hour labels (1–12) combined in a single `"face"` offscreen canvas layer.

### Dynamic Per-Frame Layer

- Cached face layer drawn via `api.drawCachedLayer("face")`
- Three hands (hour, minute, second)
- Center cap circle

### Cache Key Inputs (`buildStaticKey`)

- `labelPx` — `state.labels.fontPx` (typography size)
- `labelRadius` — `state.labels.spriteRadius` (label radial position)
- `tickSig` — `"1-12|major30|minor6"` (constant label/tick signature)

### Invalidation Triggers

- Canvas geometry/buffer size changes
- Dial geometry changes from size/theme style shifts
- Typography/style changes affecting `fontPx`, `spriteRadius`, `labelWeight`, `family`, or resolved color
- (These all flow through `FullCircleRadialEngine`'s internal cache-key building, which includes the widget's `buildStaticKey` output.)

### Non-Triggers

- `value` (time) updates — hands recomputed per frame
- `hideSeconds` toggle — second hand drawn conditionally per frame
- `clockRadialHideTextualMetrics` toggle — text modes gated separately
- `captionUnitScale` changes — affects text layout only

## Layout Modes

```
ratio = W / H
ratio < clockRadialRatioThresholdNormal -> high
ratio > clockRadialRatioThresholdFlat -> flat
otherwise -> normal
```

### Digital Time Display

`flat`: left strip with caption (top) + value (bottom), `{ side: "left", align: "left" }`

`normal`: centered 3-row block inside dial (no options)

`high`: one inline row above dial, `{ slot: "top" }`

All modes delegate to `FullCircleRadialTextLayout.drawSingleModeText(state, mode, display, options)` where `display` has shape `{ caption, value, unit, secScale }`. Digital text is suppressed entirely when `clockRadialHideTextualMetrics` is true (handled by the engine's `hideTextualMetricsProp` gating before `drawMode` callbacks are invoked).

## Internal Value Formatting

| Function | Input | Output |
|---|---|---|
| `parseTime(rawValue)` | ISO string, `HH:MM:SS`, Date, number timestamp | `{ hours, minutes, seconds }` or `null` |
| `computeHandAngles(time)` | `{ hours, minutes, seconds }` | `{ hourAngle, minuteAngle, secondAngle }` in degrees |
| `clockDisplay(state, props)` | state + props | `{ caption, value, unit, secScale, time, hands }` |

`clockDisplay` calls `parseTime(props.value)`, applies `componentContext.format.applyFormatter(rawValue, { formatter, formatterParameters, default })`, normalizes through `PlaceholderNormalize.normalize()`, and computes hand angles if time is valid.

When `time` is `null` (unparseable), `hands` is `null` and only the cached dial face is drawn — no hands appear.

The formatter name resolves to `"formatClock"` (HH:MM) when `hideSeconds === true`, else `"formatTime"` (HH:MM:SS), set by the mapper.

## `hideSeconds` Interaction

Reuses the existing vessel-cluster `hideSeconds` editable parameter:
- `hideSeconds === true`: second hand is not drawn, formatter switches from `formatTime` to `formatClock`
- `hideSeconds === false` (default): second hand is drawn, formatter uses `formatTime`
- See [hide-seconds.md](../shared/hide-seconds.md) for the shared formatter-swap contract.

Note: `hideSeconds` suppresses the second hand visually AND changes the digital time format. These are coordinated but independently implemented (hand gating in `drawFrame`, formatter swap in `VesselMapper`).

## Exports

```javascript
return {
  id: "ClockRadialWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## None Interactions

- `stableDigits` is NOT supported — clock time strings have inherently stable digit counts.
- `SpringEasing` is NOT a dependency — hands teleport to computed positions.
- `ratioDefaults` are NOT specified — the widget trusts the editable-default contract.
- No new semantic theme tokens are introduced — the clock uses existing `state.color` and `state.theme.colors.pointer`.

## Route Wiring

```javascript
// In config/cluster-routes/vessel.js
{
  cluster: "vessel",
  kind: "clockRadial",
  mapperId: "VesselMapper",
  rendererId: "ClockRadialWidget",
  surface: "canvas-dom",
  shellSizing: { kind: "ratio", aspectRatio: 1 }
}
```

## Related

- [../radial/full-circle-dial-engine.md](../radial/full-circle-dial-engine.md)
- [../radial/full-circle-dial-style-guide.md](../radial/full-circle-dial-style-guide.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [compass-gauge.md](compass-gauge.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/hide-seconds.md](../shared/hide-seconds.md)
- [../guides/add-new-full-circle-dial.md](../guides/add-new-full-circle-dial.md)
