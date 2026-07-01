# dyninstruments v3.6.0

## Highlights
- Reworked the default color palette for better tablet readability in bright daylight: the value pointer is now blue (`#3366cc`), warnings are amber (`#e0a92e`), alarms are red (`#d9534a`), and OK/positive states are green (`#2e9e6b`).
- Color roles now inherit from four semantic anchors (info, warning, alarm, OK). Laylines, AIS states, regatta bars, and the alarm-widget background follow their anchor automatically, so changing an anchor recolors every related role in one step.
- Heavier default gauge geometry: gauge strokes and pointers are thicker out of the box (stroke weight `1.28`, depth pointer `1.15`, side pointer `2.0`) so needles and rings read more clearly at a glance.
- New "Color System" documentation page (`documentation/shared/color-system.md`) describes the role palette, the darkmode and highcontrast presets, and the rules for adding a new color.

## Fixes
- The value pointer on radial and linear gauges now draws above the colored warning/alarm sectors but below the ticks and scale labels, so tick marks and numbers stay readable instead of being covered by the needle.
- Radial and linear gauges now reserve clearance for the pointer at the extreme ends of the scale, so a needle at the minimum or maximum value no longer clips the widget border.

## Notes
- Default gauge sector colors in the widget editor changed with the new palette (warning `#e0a92e`, alarm `#d9534a`). Gauges where you set explicit sector colors are unaffected; gauges left on the defaults will pick up the new colors.
- To keep the previous look, override the theme input vars on `.widget.dyniplugin` — for example set `--dyni-pointer: #ff2b2b`, `--dyni-warning: #e7c66a`, `--dyni-alarm: #FA584A`, and `--dyni-ok: #70F3AF`.
- Regatta widgets still accept the existing camelCase alias vars (`--dyni-regatta-barWarning`), which continue to resolve with a deprecation warning.
