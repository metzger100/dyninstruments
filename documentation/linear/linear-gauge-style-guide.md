# Linear Gauge Style Guide

**Status:** ✅ Phase 1 implemented | `SpeedLinearWidget` (`sogLinear`)

## Overview

Linear gauges follow radial visual semantics with a horizontal scale:

- same warning/alarm color roles
- same pointer color token
- same flat/normal/high responsive mode concept
- same disconnect overlay behavior

Phase 1 ships `SpeedLinearWidget` for `sogLinear`. The shared engine also reserves axis behavior for future wind and compass linear kinds.

## Style and Proportions

- Track is centered in a dedicated scale box.
- Track thickness uses `theme.linear.track.widthFactor`.
- Track stroke uses `theme.linear.track.lineWidth`.
- Tick lengths/widths use `theme.linear.ticks.*`.
- Pointer triangle uses `theme.linear.pointer.*` and `theme.colors.pointer`.
- Tick label spacing/font sizing use `theme.linear.labels.*`.

## Colors

- Warning sector: `theme.colors.warning`
- Alarm sector: `theme.colors.alarm`
- Pointer: `theme.colors.pointer`
- Tick/labels/track stroke: `Helpers.resolveTextColor()`

## Sector Semantics

### SpeedLinearWidget (high-end)

- Warning sector: `speedLinearWarningFrom .. speedLinearAlarmFrom` (or max)
- Alarm sector: `speedLinearAlarmFrom .. max`
- Toggle behavior:
  - `speedLinearWarningEnabled: false` removes warning sector
  - `speedLinearAlarmEnabled: false` removes alarm sector

Future low-end and mirrored sector logic should match existing radial conventions per cluster kind.

## Layout Modes

Mode selection uses the same ratio strategy as semicircle gauges:

- `high`: `ratio < speedLinearRatioThresholdNormal`
- `normal`: between thresholds
- `flat`: `ratio > speedLinearRatioThresholdFlat`

Mode-specific composition:

- `high`: top linear gauge, middle caption, bottom value+unit
- `normal`: top linear gauge, bottom one-line `caption value unit`
- `flat`: left linear gauge, right top caption, right bottom value+unit

Tick labels are collision-filtered in narrow layouts and clamped to the gauge area so they do not overlap text rows.

## Axis Reservation for Future Kinds

- `range`: speed/depth/temperature/voltage
- `centered180`: wind angle kinds with mirrored layline sectors
- `fixed360`: compass with fixed scale and moving indicator

## Related

- [linear-shared-api.md](linear-shared-api.md)
- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
- [../shared/css-theming.md](../shared/css-theming.md)
