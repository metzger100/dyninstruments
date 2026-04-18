# Placeholder Normalize

**Status:** ✅ Implemented | Shared formatter-fallback normalization contract

## Overview

`PlaceholderNormalize` is the shared normalization helper for formatter fallback text.
In Phase 2, adoption is limited to the plan-target modules; other widgets still keep local placeholder handling until their migration phase.

## Key Details

- File: `shared/widget-kits/format/PlaceholderNormalize.js`
- Registry key: `PlaceholderNormalize` (`DyniPlaceholderNormalize`)
- API:
  - `normalize(text, defaultText) -> string`
  - `isPlaceholder(text) -> boolean`
  - exports `PLACEHOLDER_PATTERNS` and `DASH_ONLY_RE`
- Fallback token owner: shared module default `---` (used only when `defaultText` is missing)

## Placeholder Patterns

- Empty string (`""`)
- Whitespace-only text
- Dash-only text (via `DASH_ONLY_RE = /^\\s*-+\\s*$/`)
- `"--:--"` (`formatClock` fallback)
- `"--:--:--"` (`formatTime` fallback)
- `"----/--/--"` (`formatDate` fallback)
- `"NO DATA"` (legacy overlay label)

## Usage Contract

- Render-model/widget code must call `normalize(...)` directly on formatter outputs before writing display text.
- Do not reintroduce widget-local `trim() ? text : default` placeholder branches for known formatter fallbacks.
- RoutePoints missing-leg compound placeholders (for example `"--°/--nm"` and equivalent unit combinations) are an explicit carve-out and remain unchanged.
- Phase 2 adoption scope:
  - `ActiveRouteTextHtmlWidget`
  - `EditRouteRenderModel`
  - `RoutePointsRenderModel` (with missing-leg carve-out preserved)
  - `AisTargetRenderModel`
  - `XteDisplayWidget`
  - `PositionCoordinateWidget`
  - `ThreeValueTextWidget`
  - `CenterDisplayTextWidget`

## Related

- [state-screens.md](state-screens.md)
- [../widgets/route-points.md](../widgets/route-points.md)
- [../conventions/smell-prevention.md](../conventions/smell-prevention.md)
