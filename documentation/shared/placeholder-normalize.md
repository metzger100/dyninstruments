# Placeholder Normalize

**Status:** ✅ Implemented | Shared formatter-fallback normalization contract

## Overview

`PlaceholderNormalize` is the shared normalization helper for formatter fallback text.
By the end of PLAN11, every widget/render-model path uses this helper at the render boundary, with the RoutePoints compound-placeholder carve-out preserved explicitly.

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
- `"  -"` (`formatSpeed` fallback)
- `"    -"` (`formatDistance` fallback)
- `"--:--"` (`formatClock` fallback)
- `"--:--:--"` (`formatTime` fallback)
- `"----/--/--"` (`formatDate` fallback)
- `"NO DATA"` (legacy overlay label)

## Usage Contract

- Render-model/widget code must call `normalize(...)` directly on formatter outputs before writing display text.
- Do not reintroduce widget-local `trim() ? text : default` placeholder branches for known formatter fallbacks.
- RoutePoints missing-leg compound placeholders (for example `"--kt/--nm"` and equivalent unit combinations) are an explicit carve-out and remain unchanged.
- `PlaceholderNormalize.normalize(...)` is the single owner of canonical placeholder replacement across the plugin.

## Related

- [state-screens.md](state-screens.md)
- [../widgets/route-points.md](../widgets/route-points.md)
- [../conventions/smell-prevention.md](../conventions/smell-prevention.md)
