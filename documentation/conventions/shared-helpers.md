# Shared Helper Ownership

**Status:** ✅ Reference | Canonical helper ownership after PLAN27 Phase 7

## Overview

Generic value math, HTML measurement, canvas text, and layout helper families are canonical shared modules. They are not
owned by widget-local helpers.

Use these modules before adding local helper functions.

## Canonical Modules

| Module                | File                                             | Owns                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ValueMath`           | `shared/widget-kits/value/ValueMath.js`          | canonical value/text/math helpers, including `toObject`, `toText`, `clampNumber`, `isObject`, `toSafeInteger`, `hasText`, `keyToText`, `textLength`, `lerp`, `appendUnit`, `toFiniteNumber`, `toOptionalFiniteNumber`, `isFiniteNumber`, `trimText`, `clamp`, `clampPositive`, `ensureObject` |
| `HtmlMeasureUtils`    | `shared/widget-kits/html/HtmlMeasureUtils.js`    | `parseFontPx`, `createApproximateMeasureContext`, `resolveMeasureContext`, `measurePx`, `measureStyle`, `toStyle`, `resolveOwnerDocument`, `resolveFitCache`, `APPROX_CHAR_WIDTH_RATIO`                                                                                                       |
| `HtmlDomPatchUtils`   | `shared/widget-kits/html/HtmlDomPatchUtils.js`   | DOM-root patching for HTML widget markup (`patchInnerHtml`)                                                                                                                                                                                                                                   |
| `HtmlWidgetUtils`     | `shared/widget-kits/html/HtmlWidgetUtils.js`     | `resolveSurfacePolicy`, `escapeHtml`, `resolveDefaultText`, `toFontStyle`, `buildTextOptions`, `toStyleText`, `resolveMetricValueFamily`, `resolveLabelEdgePolicy`, `toPx`, `joinStyles`                                                                                                      |
| `TextLayoutComposite` | `shared/widget-kits/text/TextLayoutComposite.js` | `resolveTextFillScale`, `clampTextFillScale`, `scaleTextCeiling`, `resolveOpacity`, `resolveCompactGeometryScale`, `scaleValueUnitFit`, `scaleInlineFit`                                                                                                                                      |
| `TextLayoutEngine`    | `shared/widget-kits/text/TextLayoutEngine.js`    | fit-cache ownership helpers `makeFitCacheKey`, `writeFitCache`, `readFitCache`, `createFitCache`                                                                                                                                                                                              |
| `CanvasTextFitting`   | `shared/widget-kits/text/CanvasTextFitting.js`   | canonical canvas font and fit helpers (`setFont`, `measureTextWidth`, `fitSingleTextPx`); default font-weight fallback is `700`                                                                                                                                                               |
| `CanvasTextLayout`    | `shared/widget-kits/text/CanvasTextLayout.js`    | canvas text drawing helpers and `resolveFamily`                                                                                                                                                                                                                                               |
| `LayoutRectMath`      | `shared/widget-kits/layout/LayoutRectMath.js`    | rect primitives `makeRect`, plus `splitRow` and `splitStack`                                                                                                                                                                                                                                  |
| `RadialValueMath`     | `shared/widget-kits/radial/RadialValueMath.js`   | radial value/sector helpers, including drift-fixed `buildValueTickAngles`                                                                                                                                                                                                                     |
| `RadialAngleMath`     | `shared/widget-kits/radial/RadialAngleMath.js`   | canonical angle conversion helpers, including `valueToAngleFlat`                                                                                                                                                                                                                              |
| `StableDigits`        | `shared/widget-kits/format/StableDigits.js`      | stable numeric-display helpers, including `resolveIntegerWidth(textValue, minWidth, rangeMax)`                                                                                                                                                                                                |
| `GaugeToolkit`        | `shared/widget-kits/gauge/GaugeToolkit.js`       | generic gauge facade: theme tokens, `CanvasTextLayout`, and `ValueMath`                                                                                                                                                                                                                       |

## Complete Canonical Helper List

This table is the reference for the `check-patterns` rule `canonical-helper-redefinition`.

| Helper                            | Owner Module          | Description                            |
| --------------------------------- | --------------------- | -------------------------------------- |
| `toObject`                        | `ValueMath`           | object-or-empty helper                 |
| `toText`                          | `ValueMath`           | null-safe text conversion              |
| `clampNumber`                     | `ValueMath`           | coercion + bounded clamp with default  |
| `isObject`                        | `ValueMath`           | object detection helper                |
| `toSafeInteger`                   | `ValueMath`           | finite-number rounding helper          |
| `hasText`                         | `ValueMath`           | non-empty trimmed text check           |
| `toFiniteNumber`                  | `ValueMath`           | coercive finite-number conversion      |
| `toOptionalFiniteNumber`          | `ValueMath`           | presence-preserving numeric conversion |
| `isFiniteNumber`                  | `ValueMath`           | numeric finiteness check               |
| `trimText`                        | `ValueMath`           | canonical trim/coerce helper           |
| `textLength`                      | `ValueMath`           | text-length helper                     |
| `lerp`                            | `ValueMath`           | linear interpolation                   |
| `appendUnit`                      | `ValueMath`           | value/unit concatenation helper        |
| `keyToText`                       | `ValueMath`           | cache-key string conversion            |
| `parseFontPx`                     | `HtmlMeasureUtils`    | parse pixel size from font shorthand   |
| `createApproximateMeasureContext` | `HtmlMeasureUtils`    | fallback measure context for HTML fit  |
| `resolveMeasureContext`           | `HtmlMeasureUtils`    | choose host/fallback measure context   |
| `measurePx`                       | `HtmlMeasureUtils`    | HTML fit pixel measurement             |
| `measureStyle`                    | `HtmlMeasureUtils`    | measurement-to-style wrapper           |
| `toStyle`                         | `HtmlMeasureUtils`    | numeric px to CSS style helper         |
| `resolveOwnerDocument`            | `HtmlMeasureUtils`    | document resolution for measure flows  |
| `resolveFitCache`                 | `HtmlMeasureUtils`    | host fit-cache resolver                |
| `resolveSurfacePolicy`            | `HtmlWidgetUtils`     | HTML surface policy selection          |
| `escapeHtml`                      | `HtmlWidgetUtils`     | HTML escaping helper                   |
| `toFontStyle`                     | `HtmlWidgetUtils`     | CSS font-size style helper             |
| `buildTextOptions`                | `HtmlWidgetUtils`     | text option normalization helper       |
| `resolveDefaultText`              | `HtmlWidgetUtils`     | default placeholder/text resolver      |
| `toStyleText`                     | `HtmlWidgetUtils`     | style fragment assembly helper         |
| `resolveMetricValueFamily`        | `HtmlWidgetUtils`     | metric font-family resolution          |
| `resolveLabelEdgePolicy`          | `HtmlWidgetUtils`     | label-edge policy normalization        |
| `toPx`                            | `HtmlWidgetUtils`     | CSS px-string helper                   |
| `joinStyles`                      | `HtmlWidgetUtils`     | style-fragment concatenation           |
| `resolveTextFillScale`            | `TextLayoutComposite` | normalized text fill scale             |
| `clampTextFillScale`              | `TextLayoutComposite` | text fill scale clamp                  |
| `scaleTextCeiling`                | `TextLayoutComposite` | text ceiling scaling helper            |
| `resolveOpacity`                  | `TextLayoutComposite` | canonical opacity resolver             |
| `resolveCompactGeometryScale`     | `TextLayoutComposite` | compact geometry scale helper          |
| `scaleValueUnitFit`               | `TextLayoutComposite` | value/unit fit scaling helper          |
| `scaleInlineFit`                  | `TextLayoutComposite` | inline caption/value/unit fit scaling  |
| `resolveFamily`                   | `CanvasTextLayout`    | font family resolver                   |
| `makeFitCacheKey`                 | `TextLayoutEngine`    | fit-cache key construction             |
| `writeFitCache`                   | `TextLayoutEngine`    | fit-cache writer                       |
| `readFitCache`                    | `TextLayoutEngine`    | fit-cache reader                       |
| `createFitCache`                  | `TextLayoutEngine`    | fit-cache initializer                  |
| `setFont`                         | `CanvasTextFitting`   | canonical canvas font setter           |
| `setCanvasFont`                   | `CanvasTextFitting`   | alias for canonical font setter        |
| `measureTextWidth`                | `CanvasTextFitting`   | cached text width measurement          |
| `fitSingleTextPx`                 | `CanvasTextFitting`   | single-line fit-size resolver          |
| `splitRow`                        | `LayoutRectMath`      | split rect into columns                |
| `splitStack`                      | `LayoutRectMath`      | split rect into rows                   |
| `buildValueTickAngles`            | `RadialValueMath`     | radial tick-angle construction         |
| `valueToAngleFlat`                | `RadialAngleMath`     | flat-arg angle conversion wrapper      |

## Radial Wrappers

The radial modules are compatibility shims for radial engines and radial-specific geometry:

- `RadialValueMath` composes `ValueMath` with optional radial value/angle helpers and radial sector helpers for direct
  radial callers.
- `RadialTextFitting` delegates to `CanvasTextFitting`.
- `RadialTextLayout` delegates to `CanvasTextLayout`.
- `RadialToolkit` extends `GaugeToolkit` with radial angle, tick, canvas primitive, and radial frame APIs.

Do not add new generic behavior to radial wrappers.

## Dependency Rules

- Linear gauges, text renderers, cluster mappers, viewmodels, HTML helpers, and runtime scripts should depend on
  canonical shared modules directly.
- Cluster mappers use `ClusterMapperToolkit.positiveUnitNumber(...)` when a unit-aware numeric config must be positive
  and required downstream.
- At the formatter boundary (`applyFormatter`), empty strings are treated as `no data` and must return the default
  placeholder.
- `PlaceholderNormalize` catches JS sentinel strings (`NaN`, `undefined`, `null`, `Infinity`, `-Infinity`) as a safety
  net.
- Use `undefined` (not `NaN`) as the sentinel for absent optional numeric values.
- Never create `X.member || function (...) { ... }` or `X.memberA || X.memberB` internal fallback paths.
- At live data and action boundaries where missing must stay missing, use `ValueMath.toOptionalFiniteNumber(raw)`
  instead of bare `Number(raw)` coercion.
- Keep `ValueMath.toFiniteNumber(raw)` only for intentional coercive config/default normalization where `null -> 0` is
  explicitly desired and documented.
- Avoid local duplicate helpers such as `clamp`, `toFiniteNumber`, `trimText`, or canvas text fitting loops; use
  canonical modules.

## Config/Layout Coercion Audit Rule

- Layout/config clamp helpers must treat `null`, `undefined`, `""`, and whitespace-only strings as unset and fall back
  to the module default.
- Numeric strings (for example `"1.2"` or `"24"`) remain valid config inputs and continue to coerce to numbers.
- Intentional geometric safety coercion (`Number(width) || 0`, `Math.max(1, ...)`) is still valid for internal pixel
  math after defaults are resolved; this is not a live-data boundary.

## Runtime Bootstrap

Runtime scripts that execute before component loading use the bootstrapped global `window.DyniComponents.DyniValueMath`.
Keep `shared/widget-kits/value/ValueMath.js` loaded before those scripts in `config/bootstrap-manifest.js` and test/perf
harness bootstrap lists.

## Related

- [coding-standards.md](coding-standards.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
