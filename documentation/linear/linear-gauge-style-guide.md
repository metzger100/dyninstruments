# Linear Gauge Style Guide

**Status:** ✅ Implemented | Speed/Depth/Temperature/Voltage linear wrappers shipped, profile contracts documented for range/centered180/fixed360 kinds

## Overview

Linear gauges are horizontal scale instruments implemented as thin wrappers over `LinearGaugeEngine`.

Use this guide to keep visual behavior and editable parameter contracts consistent when adding new `*Linear` kinds.

## Key Details

- Track, ticks, pointer, labels, and text rows are rendered by shared linear kits.
- Layout uses the same responsive modes as radial gauges: `high`, `normal`, `flat`.
- `normal` mode uses boosted tick labels and a taller inline text band for readability.
- A linear wrapper should provide only profile-specific formatting, ticks, axis choice, and sectors.
- Shared theme tokens come from `theme.linear.*` and `theme.colors.*`.

## Supported Profiles

| Profile | Typical kinds | `axisMode` | Domain source | Formatter baseline | Sector model |
|---|---|---|---|---|---|
| Speed linear | `sogLinear`, `stwLinear` | `range` | Editable `min/max` | `formatSpeed` | High-end warning/alarm |
| Depth linear | `depthLinear` | `range` | Editable `min/max` | `formatDecimal` | Low-end warning/alarm |
| Temperature linear | `tempLinear` | `range` | Editable `min/max` | `formatTemperature` | Optional high-end warning/alarm |
| Voltage linear | `voltageLinear` | `range` | Editable `min/max` | `formatDecimal` | Low-end warning/alarm |
| Wind angle linear | `angleTrueLinear`, `angleApparentLinear` | `centered180` | Fixed `-180..180` | Angle formatter contract | Mirrored layline sectors (optional) |
| Compass linear | `hdtLinear`, `hdmLinear`, `cogLinear` | `fixed360` | Fixed `0..360` | `formatDirection360` | Usually none |

## Style and Proportions

- Track stays centered in a dedicated scale box.
- Tick lengths/widths use `theme.linear.ticks.*`.
- Pointer triangle uses `theme.linear.pointer.*` and `theme.colors.pointer`.
- Tick labels use `theme.linear.labels.insetFactor` and `theme.linear.labels.fontFactor`.
- Caption/value rows use `captionUnitScale` in `high` and `flat`.

## Colors

- Warning sector: `theme.colors.warning`
- Alarm sector: `theme.colors.alarm`
- Pointer: `theme.colors.pointer`
- Track stroke/ticks/labels: `Helpers.resolveTextColor()`

## Sector Semantics

- High-end sectors: warning `warningFrom..alarmFrom`, alarm `alarmFrom..max`.
- Low-end sectors: alarm `min..alarmFrom`, warning `alarmFrom..warningFrom`.
- Mirrored sectors (`centered180`): layline bands on both sides of `0` (for example `[-max,-min]` and `[min,max]`).
- No sectors: return `[]` from `buildSectors`.

## Editable Parameter Key Pattern

Use gauge-prefixed keys to avoid cross-kind collisions.

- Ratio thresholds: `{gauge}LinearRatioThresholdNormal`, `{gauge}LinearRatioThresholdFlat`
- Ticks: `{gauge}LinearTickMajor`, `{gauge}LinearTickMinor`, `{gauge}LinearShowEndLabels`
- Range-only domain: `{gauge}LinearMinValue`, `{gauge}LinearMaxValue`
- High-end sectors: `{gauge}LinearWarningEnabled`, `{gauge}LinearAlarmEnabled`, `{gauge}LinearWarningFrom`, `{gauge}LinearAlarmFrom`
- Low-end sectors: `{gauge}LinearWarningEnabled`, `{gauge}LinearAlarmEnabled`, `{gauge}LinearWarningFrom`, `{gauge}LinearAlarmFrom`
- Mirrored sectors: `{gauge}LinearLayEnabled`, `{gauge}LinearLayMin`, `{gauge}LinearLayMax`

## Layout Modes

Mode selection stays ratio-based per gauge kind.

- `high`: top gauge + lower caption/value block
- `normal`: top gauge + one inline caption/value/unit row below scale box
- `flat`: left gauge + right caption/value stack

## Extension Readiness Checklist

- Define kind defaults (`caption_*`, `unit_*`) before mapper wiring.
- Keep mapper output declarative; numeric normalization stays at mapper boundary.
- Use `LinearGaugeEngine` axis profile matching the kind semantics.
- Add widget and mapper tests for new renderer contracts.
- Update linear docs and run `npm run check:all`.

## Related

- [../guides/add-new-linear-gauge.md](../guides/add-new-linear-gauge.md)
- [linear-shared-api.md](linear-shared-api.md)
- [../guides/add-new-cluster.md](../guides/add-new-cluster.md)
- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
