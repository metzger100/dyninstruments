# Shared Helper Ownership

**Status:** ✅ Reference | Canonical helper ownership after PLAN24 Phase 7

## Overview

Generic value math, canvas text fitting, canvas text layout, and non-radial gauge utilities are shared modules. They are not owned by radial helpers.

Use these modules before adding local helper functions or reaching through radial wrappers.

## Canonical Modules

| Module | File | Owns |
|---|---|---|
| `ValueMath` | `shared/widget-kits/value/ValueMath.js` | finite number conversion (`toFiniteNumber`), presence-safe live-data conversion (`toOptionalFiniteNumber`), clamping, range normalization, mode thresholds, tick-step profiles, shared formatter text extraction, and angle/direction display formatting |
| `CanvasTextFitting` | `shared/widget-kits/text/CanvasTextFitting.js` | canvas font assignment, width caching, text measurement, and fit calculations |
| `CanvasTextLayout` | `shared/widget-kits/text/CanvasTextLayout.js` | generic canvas text drawing helpers built on `CanvasTextFitting` |
| `GaugeToolkit` | `shared/widget-kits/gauge/GaugeToolkit.js` | generic gauge facade: theme tokens, `CanvasTextLayout`, and `ValueMath` |

## Radial Wrappers

The radial modules are compatibility shims for radial engines and radial-specific geometry:

- `RadialValueMath` composes `ValueMath` with optional radial value/angle helpers and radial sector helpers for direct radial callers.
- `RadialTextFitting` delegates to `CanvasTextFitting`.
- `RadialTextLayout` delegates to `CanvasTextLayout`.
- `RadialToolkit` extends `GaugeToolkit` with radial angle, tick, canvas primitive, and radial frame APIs.

Do not add new generic behavior to the radial wrappers. Add generic helpers to the canonical modules above, then let radial wrappers delegate if radial callers still need that API.

## Dependency Rules

- Linear gauges, text renderers, cluster mappers, viewmodels, HTML helpers, and runtime scripts should depend on `ValueMath`, `CanvasTextLayout`, `CanvasTextFitting`, or `GaugeToolkit` directly.
- Only radial engines should depend on `RadialToolkit` for radial draw orchestration.
- Internal Dyni modules should not depend on `RadialValueMath`; that module remains for external compatibility callers.
- At live data and action boundaries where missing must stay missing, use `ValueMath.toOptionalFiniteNumber(raw)` instead of bare `Number(raw)` coercion.
- Keep `ValueMath.toFiniteNumber(raw)` only for intentional coercive config/default normalization where `null -> 0` is explicitly desired and documented.
- Avoid local duplicate helpers such as `clamp`, `toFiniteNumber`, `trimText`, or canvas text fitting loops; use the canonical modules.

## Config/Layout Coercion Audit Rule

- Layout/config clamp helpers must treat `null`, `undefined`, `""`, and whitespace-only strings as **unset** and fall back to the module default.
- Numeric strings (for example `"1.2"` or `"24"`) remain valid config inputs and continue to coerce to numbers.
- Intentional geometric safety coercion (`Number(width) || 0`, `Math.max(1, ...)`) is still valid for internal pixel math after defaults are resolved; this is not a live-data boundary.

## Runtime Bootstrap

Runtime scripts that execute before component loading use the bootstrapped global `window.DyniComponents.DyniValueMath`. Keep `shared/widget-kits/value/ValueMath.js` loaded before those scripts in `config/bootstrap-manifest.js` and test/perf harness bootstrap lists.

## Related

- [coding-standards.md](coding-standards.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
