# Hide Seconds

**Status:** ✅ Implemented | Shared formatter-swap contract for time displays

## Overview

`hideSeconds` is a per-widget option that swaps `formatTime` for `formatClock` at the mapper or render-model boundary.
It is defined per cluster in the relevant `config/clusters/*.js` file and does not use a post-processor.

## Contract

- `hideSeconds: false` keeps the existing `HH:MM:SS` path.
- `hideSeconds: true` switches to `HH:MM` by selecting `formatClock`.
- The swap is used only where the widget already renders time text directly.
- `formatDateTime` is not used by this plugin, so no compound post-processing path exists.
- Known formatter fallback text still normalizes through `PlaceholderNormalize`.

## Supported Paths

- `NavMapper` eta and rteEta kinds
- `VesselMapper` clock kind
- `ActiveRouteTextHtmlWidget` ETA metric
- `EditRouteRenderModel` ETA metric
- `PositionCoordinateWidget` `dateTime` and `timeStatus` variants on the lon-axis formatter

## Related

- [active-route.md](../widgets/active-route.md)
- [edit-route.md](../widgets/edit-route.md)
- [position-coordinates.md](../widgets/position-coordinates.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
