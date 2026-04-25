# Default Instruments Cluster

**Status:** ✅ Implemented | `config/clusters/default.js`

## Overview

`dyni_Default_Instruments` is the self-configurable default cluster for arbitrary store values.
It routes through the existing cluster system and offers three kinds:

- `text`
- `linearGauge`
- `radialGauge`

The cluster is intended for values that are not already covered by the domain-specific clusters.
It keeps the mapper thin and pushes visual behavior into the existing renderers:

- `text` -> `ThreeValueTextWidget`
- `linearGauge` -> `DefaultLinearWidget`
- `radialGauge` -> `DefaultRadialWidget`

## Value Contract

The cluster exposes one dynamic key selector:

- `value` is a `KEY` editable
- the update function trims the selected path into `storeKeys.value`
- empty input removes `storeKeys.value`

Example store paths:

- `nav.gps.speed`
- `env.water.temperature`
- `electrical.battery.house`

## Formatter Contract

Formatter selection stays user-controlled.

- the mapper passes through user-selected `formatter`
- the mapper passes through array-valued `formatterParameters`
- no fallback formatter metadata is synthesized for empty input

Text kinds render any normal formatter output.
Gauge kinds expect a numeric raw value or a formatter output that still contains a parseable numeric substring.

## Editable Summary

Shared defaults:

- `captionUnitScale = 0.8`
- `stableDigits = false`

Text defaults:

- `kind.default = "text"`
- caption/unit editables come from `makePerKindTextParams(DEFAULT_KIND)`
- `ratioThresholdNormal = 1.0`
- `ratioThresholdFlat = 3.0`

Gauge defaults:

- `min = 0`
- `max = 100`
- `major tick = 10`
- `minor tick = 2`
- `showEndLabels = false`
- `easing = true`

Sector defaults:

- all four sectors start disabled
- low alarm threshold: `10`
- low warning threshold: `25`
- high warning threshold: `75`
- high alarm threshold: `90`
- warning color: `#e7c66a`
- alarm color: `#ff7a76`

## Sector Model

Both gauge kinds expose the same four-sector model:

- low alarm
- low warning
- high warning
- high alarm

Each sector has:

- an enable toggle
- a threshold value
- an editable color

Threshold sanity is user responsibility.
The cluster does not auto-sort awkward threshold orderings or apply extra validation beyond the existing engine behavior.

## Notes

- `caption` and `unit` are intentionally hidden as built-in AvNav editables
- per-kind caption/unit editables stay visible through the shared kind map
- `formatter`, `formatterParameters`, and `className` remain enabled
- the cluster uses `canvas-dom` routes only

## Related

- [../guides/add-new-cluster.md](../guides/add-new-cluster.md)
- [../widgets/three-elements.md](../widgets/three-elements.md)
- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
