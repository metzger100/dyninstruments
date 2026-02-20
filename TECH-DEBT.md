# Technical Debt

**Status:** ✅ Active | Current known implementation and maintenance risks

## Overview

This file tracks known debt moved out of AGENTS/CLAUDE so those files remain compact routing maps.

## Key Details

- Some legacy files are still close to or above the 300-line target; avoid expanding them and isolate new logic where possible.
- Documentation can drift after refactors if registry and runtime touchpoints are not updated together; run `node tools/check-docs.mjs` for doc integrity checks.

## Future TODOs

- Converge formatter usage on the runtime boundary: migrate remaining direct widget calls to `avnav.api.formatter` over to `Helpers.applyFormatter()`.
- Consolidate duplicated helper `extractNumberText` in `widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js`, `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js`, `widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js`, `widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js`.
- Consolidate duplicated helper `buildHighEndSectors` in `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js`, `widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js`.
- Consolidate duplicated helper `buildLowEndSectors` in `widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js`, `widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js`.
- Consolidate `clamp` helper implementations across `shared/widget-kits/gauge/GaugeValueMath.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`, `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`.
- Consolidate speed-formatting helpers across `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js`, `widgets/gauges/WindDialWidget/WindDialWidget.js`.
- Remove direct host API access from widgets: `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js`, `widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js`, `widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js`, `widgets/gauges/WindDialWidget/WindDialWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`.
- Replace empty catches in `cluster/rendering/ClusterRendererRouter.js`, `runtime/helpers.js`, `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js`, `widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js`, `widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js`, `widgets/gauges/WindDialWidget/WindDialWidget.js`, `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`.

## Related

- [documentation/guides/documentation-maintenance.md](documentation/guides/documentation-maintenance.md)
- [documentation/conventions/coding-standards.md](documentation/conventions/coding-standards.md)
