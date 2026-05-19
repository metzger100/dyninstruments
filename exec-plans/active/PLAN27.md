# PLAN27 — Code Hygiene Sweep: Eliminate Duplicate Helpers, Harden Value Boundaries, Enforce Prevention Rules

## Status

Signed off. Ready to implement. (Verified against codebase 2026-05-19: all duplicate counts, file locations, and behavioral claims confirmed.)

## Goal

After PLAN27 is complete:

1. The pressure widget (and every other kind) shows `"---"` — never `"NaN "` — when the AvNav store supplies an empty string, null, undefined, or any non-numeric sentinel for a live-data value.

2. Every private helper function that duplicates a canonical shared module member is removed and replaced with a direct import from the canonical module. Zero private copies of `toObject`, `toText`, `clampNumber`, `trimString`, `isObject`, `toOptionalFiniteNumber`, `parseFontPx`, `createApproximateMeasureContext`, `resolveMeasureContext`, `resolveSurfacePolicy`, or any other function on the canonical helper list remain in widget, engine, layout, render-model, viewmodel, or mapper code.

3. Every paranoid `|| function(value) { ... }` and `|| valueMath.toFiniteNumber` fallback pattern is removed. Module member access trusts internal contracts without fallback.

4. Redundant normalization chains — where a widget re-normalizes a value the mapper already normalized — are removed. Values are validated once at the boundary and trusted internally.

5. The canonical helper list in `documentation/conventions/shared-helpers.md` is complete, covering every shared utility extracted or consolidated in this plan.

6. Existing check-patterns rules (`premature-legacy-support`, `duplicate-functions`) are widened to catch the specific forms of violations found in this plan. New lint rules and smell contracts block re-introduction of every category of code smell addressed here.

7. `AGENTS.md` and `documentation/conventions/coding-standards.md` explicitly instruct AI agents on the patterns that are forbidden and the canonical alternatives.

8. All existing tests pass. New tests cover the hardened value boundaries.

---

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/conventions/shared-helpers.md`
5. `documentation/conventions/smell-fix-playbooks.md`
6. `AGENTS.md`

These define the project's coding conventions, header requirements, canonical module ownership, and quality gates. Follow them exactly.

---

## Root-Cause Analysis

### A. NaN display leak — two-layer boundary failure

**Symptom:** The pressure widget displays `"NaN "` instead of `"---"` when no barometric pressure data is available.

**Root cause chain:**

1. The AvNav store delivers an empty string `""` when a SignalK path has no current value.
2. `EnvironmentMapper` passes `p.value` (the empty string) through `toolkit.out()` without normalization — this is correct per the "mappers are declarative pass-through" contract.
3. `runtime/format-runtime.js` `applyFormatter` receives `""` and checks two guards:
   - `raw == null` → false (empty string is not null).
   - `Number.isNaN(raw)` → false (empty string is not NaN).
   - Both guards pass. The empty string reaches the AvNav formatter.
4. `avnav.api.formatter.formatPressure("", "hpa")` → internally computes `"" / 100`, which is `NaN`. Returns the string `"NaN "`.
5. `PlaceholderNormalize.normalize("NaN ", defaultText)` → `"NaN "` does not match any pattern in the placeholder set (`"---"`, dash-only, `"NO DATA"`, date sentinels). The string passes through.
6. The widget displays `"NaN "`.

**Fix layers (defense in depth, decided during scoping):**

- **Layer A — `applyFormatter` boundary hardening.** Add an empty-string guard: `typeof raw === "string" && raw.trim() === ""` → return `props.default || "---"`. This stops the primary leak at the formatting boundary. This guard is valid for all formatter call sites because an empty string from the store always means "no data" — it is never a valid sensor reading. Formatter kinds that display non-numeric text (route names, waypoint names, status strings) do not flow through `applyFormatter`; they use direct string rendering.

- **Layer B — `PlaceholderNormalize` sentinel hardening.** Add `"NaN"`, `"NaN "`, `"undefined"`, `"null"`, `"Infinity"`, `"-Infinity"` to the `isPlaceholder` pattern recognizer. This catches leaks from any current or future formatter that produces stringified JavaScript type sentinels.

### B. Massive private helper duplication — 120+ instances across 8 function families

PLAN24 Phase 7 extracted `ValueMath`, `CanvasTextFitting`, `CanvasTextLayout`, and `GaugeToolkit` as canonical modules and removed duplicates of `toFiniteNumber`, `clamp`, `clampPositive`, `ensureObject`, and `trimText`. However, the following function families were not addressed:

| Helper | Copies | In files |
|---|---|---|
| `toObject` | 15 | EditRouteMarkup, RoutePointsMarkup, EditRouteRenderModel, AisTargetHtmlFit, NavInteractionPolicy, AisTargetRenderModel, RoutePointsRenderModel, AisTargetMarkup, AlarmMarkup, AlarmRenderModel, AlarmHtmlFitChrome, AlarmHtmlFit, theme/resolver, AisTargetTextHtmlWidget, AlarmTextHtmlWidget |
| `clampNumber` | 12 | TextTileLayout (2-arg variant), XteHighwayLayout, ResponsiveScaleProfile, SemicircleRadialLayout, FullCircleRadialTextLayout, FullCircleRadialLayout, CenterDisplayLayout, ActiveRouteLayout, EditRouteLayoutMath, AisTargetLayoutMath, RoutePointsLayoutSizing, LinearGaugeLayout |
| `toText` | 11 | UnitAwareFormatter, StableDigits, EditRouteMarkup, RoutePointsMarkup, EditRouteHtmlFitSupport, AisTargetHtmlFit, RoutePointsRenderModel (variant), AisTargetMarkup, RoutePointsHtmlFit, AlarmHtmlFit, unit-editable-utils |
| `resolveMeasureContext` | 7 | MapZoomHtmlFit, EditRouteHtmlFitSupport, AisTargetHtmlFit, ActiveRouteHtmlFit, RoutePointsHtmlFit, AlarmHtmlFit, StateScreenTextFit |
| `toOptionalFiniteNumber` (private definitions) | 5 | DepthDisplayFormatter, AlarmRenderModel (htmlUtils variant), RoutePointsViewModel, AisTargetViewModel, EditRouteViewModel |
| `resolveSurfacePolicy` | 5 | HtmlWidgetUtils (canonical), RoutePointsTextHtmlWidget, EditRouteTextHtmlWidget, AisTargetTextHtmlWidget, AlarmTextHtmlWidget |
| `parseFontPx` | 5 | EditRouteHtmlFitSupport, AisTargetHtmlFit, ActiveRouteHtmlFit, AlarmHtmlFit, StateScreenTextFit |
| `createApproximateMeasureContext` | 5 | EditRouteHtmlFitSupport, AisTargetHtmlFit, ActiveRouteHtmlFit, AlarmHtmlFit, StateScreenTextFit |
| `resolveDefaultText` | 4 | (across layout/render modules) |
| `trimString` | 3 | CenterDisplayRenderModel, RoutePointsViewModel, ActiveRouteViewModel |
| `resolveTextFillScale` | 4 | SemicircleRadialLayout, FullCircleRadialTextLayout, FullCircleRadialLayout, LinearGaugeEngine |
| `isObject` | 3 | RoutePointsViewModel, AisTargetViewModel, EditRouteViewModel |
| `toFontStyle` | 3 | (across HTML fit modules) |
| `splitStack` / `splitRow` | 3 each | ActiveRouteLayout (3-arg, closure-bound `makeRect`), EditRouteLayoutMath and AisTargetLayoutMath (4-arg). Different pixel-distribution algorithms, but differences are ≤1px and not user-visible. Mergeable into canonical 4-arg version in `LayoutRectMath`. |
| `scaleTextCeiling` / `clampTextFillScale` | 3 each | (across layout modules) |
| `resolveOpacity` | 3 identical + 1 different-function | TextTileLayout, TextLayoutComposite, CenterDisplayTextWidget (identical); CanvasTextLayout has different signature `(textOptions, key)` — not a duplicate, renamed to `resolveTextOptionOpacity` |
| `measurePx` | 2 true duplicates + 1 different-function | AisTargetHtmlFit, RoutePointsHtmlFit (drifted duplicates — AisTarget is superset with optional `cfg.maxPx`); EditRouteHtmlFitSupport (different: 1-arg, returns plain number) |
| `measureStyle` | 2 true duplicates + 1 different-function | AisTargetHtmlFit, RoutePointsHtmlFit (identical wrappers around `measurePx`); EditRouteHtmlFitSupport (different) |
| `ensurePayload` | 3 | Same-name different-function — SurfaceSessionController (1-arg), HtmlSurfaceController and CanvasDomSurfaceAdapter (2-arg). Runtime surface controllers with module-specific error messages. Not duplicates. |
| `buildTokenSpecs` | 3 | Same-name different-function — config/shared files referencing module-specific unit-range constants; speed version adds extra `label` field. Not duplicates. |
| `buildTextOptions` | 3 | SemicircleRadialTextLayout, FullCircleRadialTextLayout, LinearGaugeTextLayout (true duplicates — identical bodies) |
| `buildResizeSignatureParts` | 3 | Same-name different-function — EditRouteRenderModel, AisTargetRenderModel, RoutePointsRenderModel each build domain-specific signature fields. Not duplicates. |
| `setFont` | 3 (drifted) | CanvasTextFitting (canonical — but has wrong default weight 400, should be 700), StateScreenCanvasOverlay, StateScreenTextFit |
| `resolveFitCache` | 3 (drifted) | MapZoomHtmlFit, ActiveRouteHtmlFit, AlarmHtmlFit — identical pattern (get-or-create cache at `hostContext[FIT_CACHE_KEY]`), each with a different module-local cache key. Parameterizable into `resolveFitCache(hostContext, cacheKey)`. |
| `resolveIntegerWidth` | 2 true duplicates + 1 different-signature | SemicircleRadialEngine, LinearGaugeEngine (3-arg, identical bodies); StableDigits (2-arg, no rangeMax). Extend StableDigits with optional `rangeMax` 3rd parameter. |
| `createFitCache` | 2 (drifted) | TextLayoutEngine (parameterized `createFitCache(modeList)`), SemicircleRadialTextLayout (hardcoded `{flat, high, normal}`). SemicircleRadial callers use TextLayoutEngine's default mode list — replace with `TextLayoutEngine.createFitCache()`. |
| 17 more functions at 2 copies each (true duplicates) | 34 total | `toSafeInteger`, `toStyleText`, `toStyle`, `hasText`, `setCanvasFont`, `appendUnit`, `resolveOwnerDocument`, `resolveMetricValueFamily`, `resolveLabelEdgePolicy`, `resolveCompactGeometryScale`, `scaleValueUnitFit`, `textLength`, `lerp`, `resolveFamily`, `makeFitCacheKey`, `writeFitCache`, `measureTextWidth` |
| `keyToText` | 2 | CanvasLayerCache, LinearGaugeMath (identical bodies) |
| `joinStyles` | 2 | AisTargetMarkup, AlarmMarkup (drifted: array-push vs string-concat, `value == null` vs `typeof value !== "string"` — identical result for string inputs) |
| `readFitCache` | 2 | SemicircleRadialTextLayout (2-arg: `entry, key`), TextLayoutEngine (3-arg: `cache, mode, key` — superset). Same migration pattern as `writeFitCache`. |
| `buildValueTickAngles` | 2 | RadialValueMath (canonical), SemicircleRadialEngine (drifted: extra `startDeg`/`endDeg` finite guard, cosmetic variable renames, calls `valueToArcAngle` instead of `valueToAngle` — output identical) |
| `valueToAngle` (flat-arg wrapper) | 3 | RadialSectorMath, RadialValueMath, SemicircleRadialEngine — identical 6-line wrappers converting `(rawValue, minV, maxV, arc, doClamp)` to the options-object form expected by `RadialAngleMath.valueToAngle(value, opts)`. All three already depend on `RadialAngleMath`. |
| 10 same-name but different-function collisions | 25 defs | `resolveShellRect` (2, DOM measurement vs payload extraction), `resolveInteractionState` (2, AisTarget vs Alarm domain logic), `resolveLayout` (2, chrome geometry vs htmlFit delegation), `formatMetric` (3, callFormatter+normalize vs unitFormatter.formatWithToken), `resolveDisplayMode` (2, same pattern but context-specific default thresholds — not worth merging), `measurePx` (2 true dupes + 1 different in EditRoute), `measureStyle` (2 true dupes + 1 different in EditRoute), `buildResizeSignatureParts` (3, domain-specific signature fields per render model), `measureTextWidth` (2 true dupes + 1 different in CenterDisplayTextWidget), `fitSingleTextPx` (2, StateScreenTextFit returns 0 for empty text, CanvasTextFitting returns ceilingPx — different semantics) |

**Why PLAN24 missed these:** PLAN24 focused on the value-math and canvas-text families (`toFiniteNumber`, `clamp`, `ensureObject`, `trimText`). The HTML-measurement cluster (`parseFontPx`, `createApproximateMeasureContext`, `resolveMeasureContext`), the object/text coercion family (`toObject`, `toText`, `clampNumber`), and the layout/render-model families were outside its scope.

**Why existing `duplicate-functions` rule misses these:** The rule uses token-based body comparison with a minimum token threshold. Most of these helpers are 1–4 line functions that fall below the threshold. Different-named functions with identical bodies (`trimString` vs `trimText`) are also missed because the rule compares function bodies only between same-named functions.

### C. Paranoid module-member fallbacks — 19 sites

Two patterns of dead defensive code:

**Pattern 1 — `|| function(value) { ... }` inline fallback (10 sites):**
```js
const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber || function (value) {
  if (value == null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};
```
Found in: DefaultRadialWidget, TemperatureLinearWidget, DefaultLinearWidget, VoltageLinearWidget, SpeedLinearWidget, DepthLinearWidget, WindLinearWidget, CompassLinearWidget, MapZoomTextHtmlWidget, RadialFrameRenderer (`tick.isBeyondEnd || function`).

The fallback function is never reached. `ValueMath` always exports `toOptionalFiniteNumber`. The inline implementation is dead code that inflates each widget by 6 lines. The RadialFrameRenderer variant (`tick.isBeyondEnd || function`) follows the same pattern on a different object.

**Pattern 2 — `|| valueMath.toFiniteNumber` cross-member fallback (9 sites):**
```js
toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber || valueMath.toFiniteNumber;
```
Found in: CenterDisplayMath, EditRouteLayoutMath, AisTargetRenderModel, RoutePointsRenderModel, TemporaryHostActionBridge, ActiveRouteViewModel, ClusterMapperToolkit, PositionCoordinateWidget, WindRadialWidget.

`valueMath.toOptionalFiniteNumber` is always present. The `|| valueMath.toFiniteNumber` fallback is unreachable and semantically wrong (`toFiniteNumber` and `toOptionalFiniteNumber` have different null behavior).

**Why existing `premature-legacy-support` rule misses these:** The rule pattern-matches variable/function names containing `/legacy|compat|deprecated|fallback/i` and `typeof X !== 'undefined' ? X :` ternaries. Neither the `|| function` pattern nor the `|| X.memberB` pattern is detected because neither uses those names or that ternary form.

### D. Redundant normalization chains — triple-touch values in gauge widgets

All gauge widgets that display warning/alarm sectors follow this chain:

1. **Mapper layer:** `toolkit.unitNumber("warningFrom", token)` calls `ValueMath.toFiniteNumber` → returns `number`. When the feature is disabled, the mapper returns `undefined` directly. Net type: `number | undefined`.
2. **Widget layer:** `toOptionalFiniteNumber(p.warningFrom)` re-normalizes the already-normalized value.
3. **Widget layer:** `Number.isFinite(warningFrom)` checks the value that is already guaranteed to be `number | undefined`.

Step 2 is redundant — the mapper already guarantees `number | undefined`. Step 3 is semantically imprecise — it checks "finiteness" when it means "presence" (the value is already finite or undefined; `warningFrom !== undefined` would be the correct intent).

Found in: TemperatureLinearWidget, SpeedLinearWidget, DepthLinearWidget, VoltageLinearWidget, TemperatureRadialWidget, SpeedRadialWidget, DepthRadialWidget, VoltageRadialWidget.

### E. Defensive `props && props.X` on guaranteed objects — 15+ sites

Inside functions that receive a guaranteed-object `props` parameter (already guarded at the function entry with `const p = props || {}`), code still uses defensive access:
```js
const warningFrom = toOptionalFiniteNumber(props && props.tempLinearWarningFrom);
```
The `props &&` guard is unreachable. Found in TemperatureLinearWidget, DepthLinearWidget, CompassLinearWidget, TemperatureRadialWidget, SpeedRadialWidget, DepthRadialWidget, and others.

### F. Redundant `String()` + `.trim()` on mapper-guaranteed strings — 10+ sites

Captions and units from the mapper are always strings (they come from editable parameter defaults). Widget code wraps them in `String(p.caption).trim()`. Both `String()` and `.trim()` are redundant.

Found in: SemicircleRadialEngine, LinearGaugeEngine, CompassRadialWidget, WindRadialWidget, WindLinearWidget.

### G. Drifted function clones — same name, diverged behavior

Several duplicated functions have evolved independently, creating behavioral inconsistencies:

- **`trimString`** — CenterDisplayRenderModel: `value == null ? "" : String(value).trim()` (handles all types, matches `ValueMath.trimText`). ActiveRouteViewModel + RoutePointsViewModel: `typeof value === "string" ? value.trim() : ""` (only accepts strings, returns `""` for numbers).
- **`toSafeInteger`** — RoutePointsDomEffects: uses `Number(value)`. RoutePointsRenderModel: uses `toFiniteNumber(value)`.
- **`hasText`** — MapZoomHtmlFit: `value != null && String(value).trim().length > 0` (coerces all types). AisTargetViewModel: `typeof value === "string" && value.trim() !== ""` (rejects non-strings).
- **`appendUnit`** — UnitAwareFormatter: uses `toText()` helper. CenterDisplayRenderModel: uses inline check with different logic (skips unit when text equals defaultText).

These are a direct consequence of AI-agent sessions creating local copies without checking the existing canonical implementation; each copy then evolves independently during subsequent changes.

### H. Inconsistent sentinel for "absent optional numeric" — NaN vs undefined

`toOptionalFiniteNumber` returns `undefined` for absent values. But several widgets override this with `NaN`:
```js
const warningFrom = warningEnabled
  ? toOptionalFiniteNumber(p.voltageLinearWarningFrom)
  : NaN;  // should be undefined
```
Both `Number.isFinite(undefined)` and `Number.isFinite(NaN)` are false, so the behavior is identical in practice. But the sentinel inconsistency is a maintenance hazard — future code that checks `warningFrom !== undefined` would behave differently than code that checks `Number.isFinite(warningFrom)`.

Found in: VoltageLinearWidget, VoltageRadialWidget, RadialSectorMath, DepthLinearWidget.

### I. Mutable `let` deferred initialization — 16 files

```js
let toFiniteNumber;  // undefined at module scope
function create(def, componentContext) {
  toFiniteNumber = componentContext.components.require("ValueMath").toFiniteNumber;
```
Any function called before `create()` would use `undefined`. This pattern is fragile and makes the dependency invisible. Found in 16 files across shared kits, viewmodels, and mappers.

This plan does NOT refactor the `let`-deferred pattern itself — it is the standard component lifecycle pattern established before PLAN24 and used universally. However, the lint rules added in this plan ensure that these `let` variables never carry redundant fallback assignments (the `|| valueMath.toFiniteNumber` pattern addressed in section C).

### J. Magic number `0.56` — approximate character width ratio

The constant `0.56` (approximate character-width-to-font-size ratio for sans-serif text) appears in 8 files as a bare literal inside `createApproximateMeasureContext` duplicates and HTML fit modules. Extracting the duplicated `createApproximateMeasureContext` function into a shared module also extracts the magic number.

---

## Phase 0 — Preflight Verification

### Steps

1. Read all files listed in **Mandatory Preflight**.
2. Run `npm run check:all` and `npx vitest run` to verify a clean baseline.
3. Confirm no active uncommitted changes.

### Exit condition

All checks pass. Baseline is green.

---

## Phase 1 — Fix NaN Display Leak (applyFormatter + PlaceholderNormalize)

### Purpose

Stop `"NaN "` from reaching any widget display. This is the user-visible bug and the highest-priority fix.

### A. Harden `applyFormatter` empty-string boundary

**File:** `runtime/format-runtime.js`

In the `applyFormatter` function, after the existing `raw == null` check and before the `Number.isNaN(raw)` check, add an empty-string guard:

```js
if (typeof raw === "string" && raw.trim() === "") {
  return p.default || "---";
}
```

This must come after the `raw == null` check (which already catches null/undefined) and handles the empty-string case that currently leaks through to AvNav formatters.

### B. Harden `PlaceholderNormalize` sentinel set

**File:** `shared/widget-kits/format/PlaceholderNormalize.js`

In the `isPlaceholder` function's pattern matching, add recognition of JavaScript type-sentinel strings. Add the following patterns to the detection logic:

- `"NaN"` and `"NaN "` (with trailing space, which AvNav formatters sometimes append)
- `"undefined"`
- `"null"`
- `"Infinity"` and `"-Infinity"`

The match should be case-sensitive and trimmed: `const trimmed = String(text).trim(); if (trimmed === "NaN" || trimmed === "undefined" || trimmed === "null" || trimmed === "Infinity" || trimmed === "-Infinity") return true;`

### C. Tests

**New test file:** `tests/runtime/format-runtime-boundary.test.js`

Test `applyFormatter` with:
- `raw = ""` → returns default text
- `raw = "  "` → returns default text (whitespace-only)
- `raw = null` → returns default text (existing behavior, regression guard)
- `raw = undefined` → returns default text (existing behavior, regression guard)
- `raw = NaN` → returns default text (existing behavior, regression guard)
- `raw = 0` → passes through to formatter (zero is a valid reading)
- `raw = "42.5"` → passes through to formatter (numeric string is valid)

**Extend existing:** `tests/shared/format/PlaceholderNormalize.test.js`

Test `normalize` with:
- `"NaN"` → returns default text
- `"NaN "` → returns default text
- `"undefined"` → returns default text
- `"null"` → returns default text
- `"Infinity"` → returns default text
- `"-Infinity"` → returns default text
- `"---"` → returns default text (existing behavior, regression guard)

### D. Smell contract extension

**File:** `tools/check-smell-contracts.mjs`

Add new rule `formatter-boundary-empty-string`:
- Load `runtime/format-runtime.js` in a sandbox.
- Call `applyFormatter("", { formatter: "formatDecimal", formatterParameters: [3, 1, true], default: "---" })`.
- Assert result is `"---"`.
- Call `applyFormatter("  ", ...)` — assert result is `"---"`.

Extend existing rule `placeholder-contract`:
- After the existing `applyFormatter`/`normalize` pairing check, add a structural assertion on `PlaceholderNormalize.js`:
- Assert the file source contains pattern matches for `"NaN"`, `"undefined"`, `"null"`, `"Infinity"`.

### Exit condition

`formatPressure("")` no longer leaks `"NaN "` to any display. All formatter call sites produce `"---"` for empty-string store values. PlaceholderNormalize catches all JS sentinel strings as a safety net.

---

## Phase 2 — Extract New Canonical Helpers and Extend ValueMath

### Purpose

Establish canonical homes for the helper families not covered by PLAN24. After this phase, every duplicated helper has exactly one canonical source.

### A. Extend `ValueMath` with generic utilities

**File:** `shared/widget-kits/value/ValueMath.js`

Add the following exports (these are new canonical implementations — not copies of any one duplicate, but the correct semantic version):

| New export | Signature | Semantics |
|---|---|---|
| `toObject` | `toObject(value)` | `value && typeof value === "object" ? value : {}` |
| `toText` | `toText(value)` | `value == null ? "" : String(value)` |
| `clampNumber` | `clampNumber(value, min, max, defaultValue)` | Guard `value == null` and empty string first, then `Number(value)`, then `Number.isFinite`, then clamp. Order: null-check → coerce → finite-check → clamp. |
| `isObject` | `isObject(value)` | `!!value && typeof value === "object"` |
| `toSafeInteger` | `toSafeInteger(value, defaultValue)` | `toFiniteNumber(value)` then `Math.round`, fallback to `defaultValue` |
| `hasText` | `hasText(value)` | `value != null && String(value).trim().length > 0` |
| `keyToText` | `keyToText(value)` | `typeof value === "string" ? value : JSON.stringify(value)` |
| `appendUnit` | `appendUnit(valueText, displayUnit, defaultText)` | `const text = toText(valueText) \|\| toText(defaultText); const unit = displayUnit == null ? "" : String(displayUnit); return unit ? text + unit : text;` Uses UnitAwareFormatter's version (more general). |

Notes:
- `toObject` and `toText` are one-liners. They are worth canonicalizing because they are the most duplicated functions in the codebase (15 and 11 copies respectively).
- `clampNumber` replaces 12 copies. The canonical version checks null/empty-string before `Number()` coercion (fixing the confusing evaluation-order issue in the current duplicates where `Number(value)` runs before the null check).
- `trimString` is NOT added — `ValueMath.trimText` already covers this. The 3 `trimString` copies are replaced with `trimText`.
- `hasText` resolves the drift between MapZoomHtmlFit's version (coerces all types) and AisTargetViewModel's version (strings only). The canonical version coerces, matching the broader contract.
- `keyToText` is a 2-line serialization helper (string passthrough or `JSON.stringify`). Duplicated identically in CanvasLayerCache and LinearGaugeMath. Canonicalized alongside `toText`/`hasText`/`textLength` as a string utility.

### B. New module: `shared/widget-kits/html/HtmlMeasureUtils.js`

**Component ID:** `HtmlMeasureUtils`

Extract the HTML text-measurement utility cluster into a single shared module. This eliminates the 5× `parseFontPx`, 5× `createApproximateMeasureContext`, and 7× `resolveMeasureContext` duplicates, and unifies the drifted `measurePx`/`measureStyle` pair from AisTargetHtmlFit and RoutePointsHtmlFit.

| Export | Signature | Semantics |
|---|---|---|
| `parseFontPx` | `parseFontPx(fontString)` | Extract px value from CSS font string. Returns `Number`. |
| `createApproximateMeasureContext` | `createApproximateMeasureContext()` | Returns a mock canvas measure context with `font` and `measureText` using the `APPROX_CHAR_WIDTH_RATIO` constant (0.56). |
| `resolveMeasureContext` | `resolveMeasureContext(hostContext, targetEl)` | Returns the host measure context or falls back to `createApproximateMeasureContext()`. |
| `measurePx` | `measurePx(args, htmlUtils, tileLayout)` | Measure fitted text px for an HTML tile. Uses AisTargetHtmlFit's version (superset: supports optional `cfg.maxPx` override in addition to `cfg.maxPxRatio`). RoutePointsHtmlFit callers never pass `maxPx`, so behavior is identical. Returns `{px, text, width}` or `null`/`0`. |
| `measureStyle` | `measureStyle(args, htmlUtils, tileLayout)` | Wrapper: `toStyle((measurePx(args, htmlUtils, tileLayout) || {}).px, htmlUtils)`. |
| `toStyle` | `toStyle(px, htmlUtils)` | Convert px value to CSS style string via `htmlUtils.toFiniteNumber(px)`. Returns empty string if not > 0. |
| `resolveOwnerDocument` | `resolveOwnerDocument(targetEl)` | Returns `targetEl.ownerDocument` or falls back to `document` if available. Uses ActiveRouteHtmlFit's version (simpler signature); StateScreenTextFit callers destructure their `args` before calling. |
| `APPROX_CHAR_WIDTH_RATIO` | constant `0.56` | Named constant replacing all bare `0.56` literals in measurement contexts. |

The `ActiveRouteHtmlFit` variant of `resolveMeasureContext` has a slightly different signature (`hostContext, ownerDocument`). This variant is accommodated by the canonical function accepting an optional second argument and resolving the target element from it when needed.

**Registration:** `config/components/registry-shared-foundation-geometry.js`, with dependency on `ValueMath`.

**Depends header:** `Depends: ValueMath`

### C. Extend `HtmlWidgetUtils` canonical exports

`HtmlWidgetUtils` already exports `resolveSurfacePolicy`. The 4 widget-level copies in RoutePointsTextHtmlWidget, EditRouteTextHtmlWidget, AisTargetTextHtmlWidget, and AlarmTextHtmlWidget are removed and replaced with `htmlUtils.resolveSurfacePolicy(props)`.

Additionally, add the following new exports to `HtmlWidgetUtils`:

| New export | Signature | Semantics |
|---|---|---|
| `toStyleText` | `toStyleText(colorKey, value)` | `const color = toText(value).trim(); return color ? (colorKey + ":" + color + ";") : "";` |
| `resolveMetricValueFamily` | `resolveMetricValueFamily(model, tokens, baseFamily)` | Resolve font family for metric values, preferring mono when `stableDigitsEnabled`. Uses ActiveRouteHtmlFit's version (superset with `baseFamily` param). |
| `resolveLabelEdgePolicy` | `resolveLabelEdgePolicy(cfg)` | `cfg && cfg.labelEdgePolicy === "sliding" ? "sliding" : "inset"` |
| `joinStyles` | `joinStyles(...args)` | Concatenate CSS style string fragments, skipping null/non-string args. Uses AlarmMarkup's version (string-concat, `typeof value !== "string"` guard — stricter, avoids accidental coercion of numbers). Replaces 2 drifted copies in AisTargetMarkup and AlarmMarkup. |

### D. Layout helper consolidation

The following layout helpers appear in 3+ layout modules with identical bodies:

- `resolveTextFillScale` — 4 copies: SemicircleRadialLayout, FullCircleRadialLayout, LinearGaugeEngine (accept any positive finite), and FullCircleRadialTextLayout (clamps to `[0.1, 10]`). Canonical version uses the clamped approach — `clampNumber(source && source.textFillScale, 0.1, 10, 1)` — because values outside `[0.1, 10]` produce nonsensical layouts in all contexts. All 4 copies are migrated.
- `clampTextFillScale` — 3 copies in TextLayoutComposite (already present), SemicircleRadialTextLayout, LinearGaugeTextLayout
- `scaleTextCeiling` — 3 copies in TextLayoutComposite (already present), SemicircleRadialTextLayout, LinearGaugeTextLayout

`TextLayoutComposite` already defines `clampTextFillScale` and `scaleTextCeiling` — it is the natural canonical home.

**Decision: use `TextLayoutComposite` as canonical home.** Keep `clampTextFillScale` and `scaleTextCeiling` where they already live in TextLayoutComposite, export them from the module API, and migrate the SemicircleRadialTextLayout and LinearGaugeTextLayout copies. Add `resolveTextFillScale` as a new export on TextLayoutComposite (which already owns the other two scale functions) and migrate all 4 copies.

Additionally, add to `TextLayoutComposite`:

- `resolveCompactGeometryScale(textFillScale)` — 2 identical copies in SemicircleRadialLayout and FullCircleRadialLayout. One-liner: `Math.max(0.5, 1 - Math.max(0, textFillScale - 1))`.
- `scaleValueUnitFit(state, valueText, unitText, fit, boxHeight)` — 2 drifted copies in SemicircleRadialTextLayout and LinearGaugeTextLayout. Canonical version returns base `{vPx, uPx, gap}` (Semicircle's version). LinearGauge caller adds `.total` after calling the canonical function.
- `scaleInlineFit(state, captionText, valueText, unitText, fit, boxHeight)` — 2 drifted copies in SemicircleRadialTextLayout and LinearGaugeTextLayout. Same drift pattern as `scaleValueUnitFit`: Semicircle (5-arg) returns `{cPx, vPx, uPx, g1, g2, total: fit.total}` passing through original total. LinearGauge (6-arg, extra `valueText`) recomputes `.total` via `measureInlineTotal`. Canonical version returns base `{cPx, vPx, uPx, g1, g2}`. LinearGauge caller adds `.total` after.

**Add `splitRow` and `splitStack` to `LayoutRectMath`** — the module that owns `makeRect`. Three private copies each across ActiveRouteLayout (3-arg, closure-bound `makeRect`), EditRouteLayoutMath and AisTargetLayoutMath (4-arg, different pixel-distribution algorithms). The ≤1px distribution differences are not user-visible. Canonical 4-arg version combines AisTarget's simplicity with EditRoute's `Math.floor` guards and minimum width of 1:

| New export | Signature | Semantics |
|---|---|---|
| `splitRow` | `splitRow(rect, gap, count, makeRect)` | Split `rect` into `count` equal-width columns with `gap` spacing. Last column absorbs pixel remainder. Returns array of rects. |
| `splitStack` | `splitStack(rect, gap, count, makeRect)` | Split `rect` into `count` equal-height rows with `gap` spacing. Last row absorbs pixel remainder. Returns array of rects. |

ActiveRouteLayout callers change from `splitRow(rect, gap, cols)` to `rectApi.splitRow(rect, gap, cols, rectApi.makeRect)`.

**Extend `StableDigits` with range-aware `resolveIntegerWidth`** — add optional 3rd parameter `rangeMax`. SemicircleRadialEngine and LinearGaugeEngine have identical 3-arg versions; StableDigits has the 2-arg base. Canonical version: when `rangeMax` is provided, compute `rangeDigits = Math.max(1, String(Math.floor(Math.abs(Number(rangeMax) || 0))).length)` and include it in the `Math.max`. StableDigits callers pass 2 args (unchanged behavior). Engine callers pass 3 args.

**Export `createFitCache` from `TextLayoutEngine`** — SemicircleRadialTextLayout's `createFitCache()` (hardcoded `{flat: null, high: null, normal: null}`) is a special case of TextLayoutEngine's parameterized `createFitCache(modeList)` with default modes. Export the existing function; SemicircleRadialTextLayout replaces its private copy with `textLayoutEngine.createFitCache()`.

**Export `readFitCache` from `TextLayoutEngine`** — SemicircleRadialTextLayout has a 2-arg `readFitCache(entry, key)` where the caller pre-extracts `cache[mode]`. TextLayoutEngine has a 3-arg `readFitCache(cache, mode, key)` that does the extraction internally. The 3-arg version subsumes. Export TextLayoutEngine's version; SemicircleRadialTextLayout callers change from `readFitCache(cache[mode], key)` to `textLayoutEngine.readFitCache(cache, mode, key)`.

**Add `resolveFitCache` to `HtmlMeasureUtils`** — 3 drifted copies (MapZoomHtmlFit, ActiveRouteHtmlFit, AlarmHtmlFit) that all do get-or-create on `hostContext[FIT_CACHE_KEY]` with different keys. Parameterize as `resolveFitCache(hostContext, cacheKey)`. Each caller passes its module-specific cache key string.

**Adopt `buildValueTickAngles` drift fix in `RadialValueMath`** — SemicircleRadialEngine has a drifted copy that adds an extra `startDeg`/`endDeg` finite guard (early return if arc angles are non-finite). This guard is a safety improvement. Adopt it into RadialValueMath's canonical version. SemicircleRadialEngine's private copy is then removed in Phase 3.

**Add `valueToAngleFlat` to `RadialAngleMath`** — 3 identical 6-line wrappers (RadialSectorMath, RadialValueMath, SemicircleRadialEngine) convert a flat `(rawValue, minV, maxV, arc, doClamp)` call into the options-object form `valueToAngle(rawValue, { min, max, startDeg, endDeg, clamp })`. Add as a new export on `RadialAngleMath`:

```js
function valueToAngleFlat(rawValue, minV, maxV, arc, doClamp) {
  return valueToAngle(rawValue, {
    min: Number(minV),
    max: Number(maxV),
    startDeg: Number(arc.startDeg),
    endDeg: Number(arc.endDeg),
    clamp: doClamp !== false
  });
}
```

All three modules already depend on `RadialAngleMath`. Private `valueToAngle` wrappers are removed in Phase 3.

### E. Render-model helper consolidation

The following helpers appear in 3 modules with identical (or unifiably drifted) bodies:

- `buildTextOptions` — 3 identical copies: SemicircleRadialTextLayout, FullCircleRadialTextLayout, LinearGaugeTextLayout. Extracts `{captionOpacity, unitOpacity}` from `state.theme.opacity`.
- `toFontStyle` — 3 drifted copies: MapZoomHtmlFit, AlarmHtmlFit, StateScreenTextFit. All convert `px` to `"font-size:Npx;"`. Canonical version uses AlarmHtmlFit's form: `n > 0 ? ("font-size:" + Math.max(1, Math.floor(n)) + "px;") : ""`.

Add both as exports from `HtmlWidgetUtils`.

**Not consolidated (same-name different-function):** `buildResizeSignatureParts` (domain-specific signature fields per render model), `ensurePayload` (runtime surface controllers with module-specific error messages and different arg counts), `buildTokenSpecs` (config files referencing module-specific constants). These are reclassified as same-name collisions and renamed in Phase 3.

Additionally, `resolveDefaultText(props)` has 2 identical copies (EditRouteRenderModel, AisTargetRenderModel) that check `hasOwnProperty("default")` and return `String(props.default)` or `undefined`. Add this as a canonical export on `HtmlWidgetUtils`.

**Name collision note:** `PlaceholderNormalize.resolveDefaultText(defaultText)` and `DepthDisplayFormatter.resolveDefaultText(props, placeholderNormalize)` share the name but are semantically different functions (string coercion vs props-with-dependency-injection). These are NOT duplicates and remain in place. Only the EditRoute/AisTarget pair is a true duplicate.

### F. Tests

**Extend existing:** `tests/shared/value/ValueMath.test.js`

Add tests for each new export:
- `toObject(null)` → `{}`; `toObject({a:1})` → `{a:1}`; `toObject("string")` → `{}`
- `toText(null)` → `""`; `toText(42)` → `"42"`; `toText("hello")` → `"hello"`
- `clampNumber(null, 0, 100, 50)` → `50`; `clampNumber("", 0, 100, 50)` → `50`; `clampNumber(75, 0, 100, 50)` → `75`; `clampNumber(150, 0, 100, 50)` → `100`
- `isObject({})` → `true`; `isObject(null)` → `false`; `isObject([])` → `true`
- `toSafeInteger(2.7, 0)` → `3`; `toSafeInteger(null, 0)` → `0`
- `hasText("")` → `false`; `hasText("hi")` → `true`; `hasText(null)` → `false`; `hasText(42)` → `true`
- `keyToText("abc")` → `"abc"`; `keyToText(42)` → `"42"`; `keyToText({a:1})` → `'{"a":1}'`; `keyToText(null)` → `"null"`

**New test file:** `tests/shared/html/HtmlMeasureUtils.test.js`

Test `parseFontPx`, `createApproximateMeasureContext`, `resolveMeasureContext`, `measurePx` (with and without `cfg.maxPx` override, empty rect, missing text), `measureStyle`, `resolveFitCache` (with valid hostContext and cacheKey, with null/non-object hostContext → returns null, re-call returns same cache object).

**Extend existing:** `tests/shared/layout/LayoutRectMath.test.js` (or create if absent)

Test `splitRow` and `splitStack`:
- `splitRow(rect, 4, 3, makeRect)` → 3 rects with gap, last absorbs remainder, all widths ≥ 1
- `splitStack(rect, 4, 2, makeRect)` → 2 rects with gap, last absorbs remainder, all heights ≥ 1
- `splitRow(rect, 0, 1, makeRect)` → single rect equal to input

**Extend existing:** `tests/shared/format/StableDigits.test.js`

Test `resolveIntegerWidth` extended signature:
- `resolveIntegerWidth("42", 3)` → `3` (2-arg still works, `minWidth` wins)
- `resolveIntegerWidth("42", 1, 9999)` → `4` (rangeMax drives digits: `"9999"` = 4 digits)
- `resolveIntegerWidth("42", 1, 5)` → `2` (textValue digits = 2, rangeMax digits = 1, textValue wins)

**Extend existing:** `tests/shared/radial/RadialAngleMath.test.js` (or create if absent)

Test `valueToAngleFlat`:
- `valueToAngleFlat(50, 0, 100, { startDeg: 0, endDeg: 180 }, true)` → `90` (midpoint maps to midpoint)
- `valueToAngleFlat(0, 0, 100, { startDeg: 0, endDeg: 180 }, true)` → `0` (min value → start angle)
- `valueToAngleFlat(150, 0, 100, { startDeg: 0, endDeg: 180 }, true)` → `180` (clamped to max)
- `valueToAngleFlat(150, 0, 100, { startDeg: 0, endDeg: 180 }, false)` → extrapolates beyond 180 (unclamped)

### Exit condition

All new canonical exports exist, are tested, and are registered as components. No code uses them yet — that happens in Phase 3.

---

## Phase 3 — Remove All Duplicate Private Helpers

### Purpose

Replace every private helper duplicate with an import from the canonical module established in Phase 2. This is the largest phase by file count.

### Migration strategy

For each file containing a duplicate:

1. Add the canonical module to the `Depends:` header if not already listed.
2. Add a `componentContext.components.require("ModuleName")` call in `create()` (or use the already-required reference).
3. Replace the private function call sites with the canonical import.
4. Delete the private function definition.

### Migration inventory

#### `toObject` (15 files → `ValueMath.toObject`)

| File | Current | Action |
|---|---|---|
| `shared/widget-kits/nav/EditRouteMarkup.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/RoutePointsMarkup.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/EditRouteRenderModel.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/AisTargetHtmlFit.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/NavInteractionPolicy.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/AisTargetRenderModel.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/RoutePointsRenderModel.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/nav/AisTargetMarkup.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/vessel/AlarmMarkup.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/vessel/AlarmRenderModel.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/vessel/AlarmHtmlFitChrome.js` | private `toObject` | Replace with `valueMath.toObject` |
| `shared/widget-kits/vessel/AlarmHtmlFit.js` | private `toObject` | Replace with `valueMath.toObject` |
| `runtime/theme/resolver.js` | private `toObject` | Replace with `valueMath.toObject` (runtime bootstrap path — use `DyniComponents.DyniValueMath.toObject`). Note: resolver's version returns `null` for non-objects, canonical returns `{}`; the only call site does `toObject(options) || {}` so net behavior is identical. Remove the now-redundant `|| {}`. |
| `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js` | private `toObject` | Replace with `valueMath.toObject` |
| `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js` | private `toObject` | Replace with `valueMath.toObject` |

#### `clampNumber` (12 files → `ValueMath.clampNumber`)

| File | Variant | Action |
|---|---|---|
| `shared/widget-kits/text/TextTileLayout.js` | 2-arg (no min/max) | Replace with `ValueMath.clampNumber(value, -Infinity, Infinity, defaultValue)` or add a 2-arg `toNumber(value, defaultValue)` alias |
| `shared/widget-kits/xte/XteHighwayLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/layout/ResponsiveScaleProfile.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/radial/SemicircleRadialLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/radial/FullCircleRadialTextLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/radial/FullCircleRadialLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/nav/CenterDisplayLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/nav/ActiveRouteLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/nav/EditRouteLayoutMath.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/nav/AisTargetLayoutMath.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/nav/RoutePointsLayoutSizing.js` | 4-arg | Replace with `ValueMath.clampNumber` |
| `shared/widget-kits/linear/LinearGaugeLayout.js` | 4-arg | Replace with `ValueMath.clampNumber` |

For TextTileLayout's 2-arg variant: use `valueMath.toFiniteNumber(value) ?? defaultValue` at call sites. Do NOT add a `toNumber(value, defaultValue)` convenience export — ValueMath already has a private `toNumber(value)` function (returns NaN for non-finite) used by `normalizeRange` and `formatGaugeDisplay`; adding a same-named public export with different semantics would shadow it.

#### `toText` (11 files → `ValueMath.toText`)

Migrate all 10 identical copies. The RoutePointsRenderModel variant `toText(value, htmlUtils)` is a thin wrapper that just calls `htmlUtils.trimText(value)` — inline all 7 call sites to use `htmlUtils.trimText(value)` directly and delete the wrapper function.

#### `resolveMeasureContext`, `parseFontPx`, `createApproximateMeasureContext` → `HtmlMeasureUtils`

Migrate all copies across: EditRouteHtmlFitSupport, AisTargetHtmlFit, ActiveRouteHtmlFit, RoutePointsHtmlFit, AlarmHtmlFit, StateScreenTextFit, MapZoomHtmlFit.

**Renamed duplicate:** `RoutePointsHtmlFit.js` defines `createMeasureContext()` (not `createApproximateMeasureContext`) with an identical body (uses the 0.56 ratio). Delete this function and replace call sites with `htmlMeasureUtils.createApproximateMeasureContext()`. Add `createMeasureContext` to the `duplicate-functions` body-match list (Phase 6C) to catch future reintroductions under this alternate name.

#### `measurePx`, `measureStyle` (AisTarget + RoutePoints → `HtmlMeasureUtils`; EditRoute renamed)

AisTargetHtmlFit and RoutePointsHtmlFit have drifted copies of the same function (identical structure, AisTarget's version is the superset with optional `cfg.maxPx` support). Unify into `HtmlMeasureUtils.measurePx` using AisTarget's version. Same for `measureStyle`.

| File | Action |
|---|---|
| `shared/widget-kits/nav/AisTargetHtmlFit.js` | Remove private `measurePx` and `measureStyle`. Use `htmlMeasureUtils.measurePx` / `htmlMeasureUtils.measureStyle`. |
| `shared/widget-kits/nav/RoutePointsHtmlFit.js` | Remove private `measurePx` and `measureStyle`. Use `htmlMeasureUtils.measurePx` / `htmlMeasureUtils.measureStyle`. |
| `shared/widget-kits/nav/EditRouteHtmlFitSupport.js` | Rename `measurePx` → `measureEditRoutePx`, `measureStyle` → `measureEditRouteStyle`. These are genuinely different functions (1-arg, returns plain number, delegates to local `measureLineFit`). |
#### `resolveSurfacePolicy` (4 widget files → `HtmlWidgetUtils.resolveSurfacePolicy`)

Migrate: RoutePointsTextHtmlWidget, EditRouteTextHtmlWidget, AisTargetTextHtmlWidget, AlarmTextHtmlWidget.

#### `toOptionalFiniteNumber` (5 private definitions → `ValueMath.toOptionalFiniteNumber`)

| File | Action |
|---|---|
| `shared/widget-kits/format/DepthDisplayFormatter.js` | Add `Depends: ValueMath`. Change `create()` to `create(def, componentContext)` to receive the component context. Add `const valueMath = componentContext.components.require("ValueMath");`. Replace private `toOptionalFiniteNumber` with `valueMath.toOptionalFiniteNumber`. Add `deps: ["ValueMath"]` to the registry entry in `config/components/registry-shared-foundation-format.js`. |
| `shared/widget-kits/vessel/AlarmRenderModel.js` | Replace private def (delegates to `htmlUtils.toFiniteNumber` — switch to `valueMath.toOptionalFiniteNumber`). |
| `cluster/viewmodels/RoutePointsViewModel.js` | Already depends on `ValueMath`. Remove private def, use `valueMath.toOptionalFiniteNumber`. |
| `cluster/viewmodels/AisTargetViewModel.js` | Already depends on `ValueMath`. Remove private def. |
| `cluster/viewmodels/EditRouteViewModel.js` | Already depends on `ValueMath`. Remove private def. |

#### `trimString` (3 files → `ValueMath.trimText`)

Note the behavioral difference: `ActiveRouteViewModel` and `RoutePointsViewModel` use `typeof value === "string" ? value.trim() : ""` which rejects non-strings. The canonical `trimText` uses `value == null ? "" : String(value).trim()` which coerces. Since the callers pass string-typed route names from the store, the coercion is safe and the behavioral difference is invisible at these call sites. Replace all three with `valueMath.trimText`.

#### `isObject` (3 files → `ValueMath.isObject`)

Migrate: RoutePointsViewModel, AisTargetViewModel, EditRouteViewModel.

#### Layout helpers → `TextLayoutComposite` exports

Migrate `resolveTextFillScale` from SemicircleRadialLayout, FullCircleRadialLayout, LinearGaugeEngine, and FullCircleRadialTextLayout (all 4 copies — the canonical version uses FullCircleRadialTextLayout's clamped approach: `clampNumber(source && source.textFillScale, 0.1, 10, 1)`). Migrate `clampTextFillScale` and `scaleTextCeiling` from SemicircleRadialTextLayout and LinearGaugeTextLayout (TextLayoutComposite already has the canonical copies — export them, don't re-add).

Migrate `resolveOpacity(value)` from TextTileLayout and CenterDisplayTextWidget to `TextLayoutComposite` (already has the canonical copy). Rename `CanvasTextLayout.resolveOpacity(textOptions, key)` → `resolveTextOptionOpacity` — different function, different signature, rename prevents `canonical-helper-redefinition` false positive and grep confusion.

#### `splitRow` / `splitStack` (3 each → `LayoutRectMath`)

| File | Action |
|---|---|
| `shared/widget-kits/nav/ActiveRouteLayout.js` | Already depends on `LayoutRectMath`. Remove private `splitRow` and `splitStack`. Change call sites from `splitRow(rect, gap, cols)` to `rectApi.splitRow(rect, gap, cols, rectApi.makeRect)` (and same for `splitStack`). |
| `shared/widget-kits/nav/EditRouteLayoutMath.js` | Remove private `splitRow` and `splitStack`. Callers in `EditRouteLayout.js` (which already depends on `LayoutRectMath`) change from `mathApi.splitRow(rect, gap, count, makeRect)` to `rectApi.splitRow(rect, gap, count, rectApi.makeRect)`. |
| `shared/widget-kits/nav/AisTargetLayoutMath.js` | Remove private `splitRow` and `splitStack`. Callers in `AisTargetLayoutSizing.js` (which already depends on `LayoutRectMath`) change from `layoutMath.splitRow(rect, gap, count, makeRect)` to `rectApi.splitRow(rect, gap, count, rectApi.makeRect)`. |

#### `resolveFitCache` (3 → `HtmlMeasureUtils.resolveFitCache`)

| File | Action |
|---|---|
| `shared/widget-kits/nav/MapZoomHtmlFit.js` | Remove private `resolveFitCache`. Replace with `htmlMeasureUtils.resolveFitCache(hostContext, FIT_CACHE_KEY)`. Keep the module-local `FIT_CACHE_KEY` constant. |
| `shared/widget-kits/nav/ActiveRouteHtmlFit.js` | Same — `htmlMeasureUtils.resolveFitCache(hostContext, FIT_CACHE_KEY)`. |
| `shared/widget-kits/vessel/AlarmHtmlFit.js` | Same — `htmlMeasureUtils.resolveFitCache(hostContext, FIT_CACHE_KEY)`. |

#### `resolveIntegerWidth` (2 engine copies → `StableDigits.resolveIntegerWidth`)

| File | Action |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Remove private `resolveIntegerWidth`. Use `stableDigits.resolveIntegerWidth(textValue, minWidth, rangeMax)`. Add `StableDigits` to `Depends:`. |
| `shared/widget-kits/linear/LinearGaugeEngine.js` | Same — `stableDigits.resolveIntegerWidth(textValue, minWidth, axisMax)`. |

#### `createFitCache` (1 copy → `TextLayoutEngine.createFitCache`)

| File | Action |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialTextLayout.js` | Remove private `createFitCache`. Use `textLayoutEngine.createFitCache()` (no args — uses default mode list `["high", "normal", "flat"]`). |

#### `readFitCache` (1 copy → `TextLayoutEngine.readFitCache`)

| File | Action |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialTextLayout.js` | Remove private `readFitCache(entry, key)`. Replace call sites: change `readFitCache(cache[mode], key)` to `textLayoutEngine.readFitCache(cache, mode, key)`. Already depends on TextLayoutEngine from `createFitCache`/`writeFitCache` migration. |

#### `keyToText` (2 copies → `ValueMath.keyToText`)

| File | Action |
|---|---|
| `shared/widget-kits/canvas/CanvasLayerCache.js` | Remove private `keyToText`. Add `ValueMath` to `Depends:`. Use `valueMath.keyToText(key)`. |
| `shared/widget-kits/linear/LinearGaugeMath.js` | Remove private `keyToText`. Already depends on `ValueMath`. Use `valueMath.keyToText(value)`. |

#### `joinStyles` (2 copies → `HtmlWidgetUtils.joinStyles`)

| File | Action |
|---|---|
| `shared/widget-kits/nav/AisTargetMarkup.js` | Remove private `joinStyles`. Already depends on `HtmlWidgetUtils`. Use `htmlUtils.joinStyles(...)`. |
| `shared/widget-kits/vessel/AlarmMarkup.js` | Remove private `joinStyles`. Already depends on `HtmlWidgetUtils`. Use `htmlUtils.joinStyles(...)`. |

#### `buildValueTickAngles` (1 copy → `RadialValueMath.buildValueTickAngles`)

| File | Action |
|---|---|
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Remove private `buildValueTickAngles`. Already depends on `RadialValueMath`. Use `radialValueMath.buildValueTickAngles(minV, maxV, majorStep, minorStep, arc)`. |

#### `valueToAngle` flat-arg wrapper (3 copies → `RadialAngleMath.valueToAngleFlat`)

| File | Action |
|---|---|
| `shared/widget-kits/radial/RadialSectorMath.js` | Remove private `valueToAngle`. Already depends on `RadialAngleMath`. Replace call sites with `angle.valueToAngleFlat(rawValue, minV, maxV, arc, doClamp)`. |
| `shared/widget-kits/radial/RadialValueMath.js` | Remove private `valueToAngle`. Already depends on `RadialAngleMath`. Replace call sites (including inside `buildValueTickAngles`) with `angle.valueToAngleFlat(...)`. |
| `shared/widget-kits/radial/SemicircleRadialEngine.js` | Remove private `valueToArcAngle` (local alias for the same wrapper). Already depends on `RadialAngleMath`. Replace call sites with `angle.valueToAngleFlat(...)`. |

#### Render-model helpers → `HtmlWidgetUtils` exports

Migrate `buildTextOptions` from SemicircleRadialTextLayout, FullCircleRadialTextLayout, and LinearGaugeTextLayout. Migrate `toFontStyle` from MapZoomHtmlFit, AlarmHtmlFit, and StateScreenTextFit (use AlarmHtmlFit's version as canonical; StateScreenTextFit callers switch from closure-bound `toFiniteNumber` to `htmlUtils.toFiniteNumber`).

#### `resolveDefaultText` (2 true duplicates → `HtmlWidgetUtils.resolveDefaultText`)

| File | Action |
|---|---|
| `shared/widget-kits/nav/EditRouteRenderModel.js` | Replace private `resolveDefaultText(props)` with `htmlUtils.resolveDefaultText(props)` |
| `shared/widget-kits/nav/AisTargetRenderModel.js` | Replace private `resolveDefaultText(props)` with `htmlUtils.resolveDefaultText(props)` |

Leave `PlaceholderNormalize.resolveDefaultText` and `DepthDisplayFormatter.resolveDefaultText` in place — different functions, analyzed and confirmed non-duplicate (see Phase 2E note).

#### `setFont` (3 copies, drifted → `CanvasTextFitting.setFont` canonical, drift-fixed)

**Drift fix first:** In `CanvasTextFitting.js`, change the default weight fallback from `400` to `700`:
```js
const fontWeight = Number.isFinite(Number(weight)) ? Math.floor(Number(weight)) : 700;
```
This aligns the canonical version with the project convention (all fonts default to bold 700).

| File | Action |
|---|---|
| `shared/widget-kits/state/StateScreenCanvasOverlay.js` | Remove private `setFont`. Require `CanvasTextFitting`. Use `fitting.setFont(ctx, px, weight, family)`. |
| `shared/widget-kits/state/StateScreenTextFit.js` | Remove private `setFont`. Require `CanvasTextFitting`. Use `fitting.setFont(ctx, px, weight, family)`. Callers gain font-state caching for free. |

#### 2-copy helpers (true duplicates) — canonical home assignments

Where both copies have drifted, choose the more general implementation as canonical. (`toSafeInteger` and `hasText` are already handled via Phase 2A ValueMath exports.)

| Function | Copy A | Copy B | Canonical home | Drift notes |
|---|---|---|---|---|
| `toStyle` | EditRouteHtmlFitSupport | AisTargetHtmlFit | `HtmlMeasureUtils` (used by `measureStyle` there) | Identical bodies. |
| `toStyleText` | AlarmHtmlFitChrome | AlarmHtmlFit | `HtmlWidgetUtils` (HTML rendering utility) | Functionally identical — Chrome version inlines `value == null ? "" : String(value).trim()`, AlarmHtmlFit uses `toText(value).trim()`. Use the `toText` version (canonical `ValueMath.toText`). |
| `setCanvasFont` | LinearGaugeTextLayout | LinearGaugeLabelFit | Replace with `CanvasTextFitting.setFont` (already canonical, same semantic but adds caching). Both callers gain font-state caching for free. |
| `appendUnit` | UnitAwareFormatter | CenterDisplayRenderModel | `ValueMath` (string utility alongside `toText`/`hasText`) | Drifted: UnitAwareFormatter falls back to `defaultText` via `toText(valueText) \|\| toText(defaultText)`; CenterDisplay skips unit when `text === defaultText`. Use UnitAwareFormatter's version (more general). CenterDisplay's "skip unit when default" logic moves to the caller. |
| `resolveOwnerDocument` | ActiveRouteHtmlFit | StateScreenTextFit | `HtmlMeasureUtils` (DOM measurement concern) | Different signatures: ActiveRoute takes `(targetEl)`, StateScreen takes `(args)` config bag. Canonical version takes `(targetEl)` (simpler); StateScreen call site destructures its `args` before calling. |
| `resolveMetricValueFamily` | EditRouteHtmlFitSupport | ActiveRouteHtmlFit | `HtmlWidgetUtils` (font family resolution for render models) | ActiveRoute has extra `baseFamily` param. Use ActiveRoute's version (superset); EditRoute callers pass `undefined` for `baseFamily` — falls through to `font.family`, identical behavior. |
| `resolveLabelEdgePolicy` | LinearGaugeEngineSupport | LinearGaugeLabelFit | `HtmlWidgetUtils` | Identical bodies (param name `cfg` vs `state` is cosmetic). |
| `resolveCompactGeometryScale` | SemicircleRadialLayout | FullCircleRadialLayout | `TextLayoutComposite` (alongside `resolveTextFillScale`) | Identical one-liner: `Math.max(0.5, 1 - Math.max(0, textFillScale - 1))`. |
| `scaleValueUnitFit` | SemicircleRadialTextLayout | LinearGaugeTextLayout | `TextLayoutComposite` (same family as `clampTextFillScale`) | Drifted: Semicircle returns `{vPx, uPx, gap}`. LinearGauge returns `{vPx, uPx, gap, total}` adding a `measureFitTotal` computation. Canonical version returns the base `{vPx, uPx, gap}` (Semicircle's version). LinearGauge caller adds `.total` after calling the canonical function. |
| `scaleInlineFit` | SemicircleRadialTextLayout | LinearGaugeTextLayout | `TextLayoutComposite` | Same drift pattern as `scaleValueUnitFit`: Semicircle (5-arg) returns `{cPx, vPx, uPx, g1, g2, total: fit.total}` passing through original total. LinearGauge (6-arg, extra `valueText`) recomputes `.total` via `measureInlineTotal`. Canonical version returns base `{cPx, vPx, uPx, g1, g2}`. LinearGauge caller adds `.total` after. |
| `toPx` | AisTargetLayoutGeometry | EditRouteLayout | `HtmlWidgetUtils` (CSS utility) | Drifted: AisTarget uses `Number(value) \|\| 0`, EditRoute uses `mathApi.clampNumber(value, 0, MAX_SAFE_INTEGER, 0)`. Canonical version uses `ValueMath.clampNumber` for consistency. Returns `String(n) + "px"`. |

Additional 2-copy duplicates discovered in full-repo scan:

| Function | Copy A (canonical) | Copy B (migrate) | Canonical home |
|---|---|---|---|
| `textLength` | ActiveRouteHtmlFit | MapZoomTextHtmlWidget | `ValueMath` (string utility alongside `hasText`, `trimText`) |
| `lerp` | XteHighwayPrimitives | ResponsiveScaleProfile | `ValueMath` (pure math) |
| `resolveFamily` | CanvasTextLayout | TextLayoutPrimitives (already depends on CanvasTextLayout) | `CanvasTextLayout` (lower-level module; reverse would create circular dep) |
| `makeFitCacheKey` | TextLayoutEngine | SemicircleRadialTextLayout | `TextLayoutEngine` (fit-cache owner) |
| `writeFitCache` | TextLayoutEngine (drifted: extra typeof guard) | SemicircleRadialTextLayout | `TextLayoutEngine` (keep the guarded version) |
| `measureTextWidth` | CanvasTextFitting | StateScreenTextFit | `CanvasTextFitting` (StateScreenTextFit already migrates `setFont` there) |
| `keyToText` | CanvasLayerCache | LinearGaugeMath | `ValueMath` (string utility alongside `toText`, `hasText`) |
| `joinStyles` | AisTargetMarkup (array-push, `value == null`) | AlarmMarkup (string-concat, `typeof !== "string"`) | `HtmlWidgetUtils` (CSS utility). Use AlarmMarkup's stricter `typeof` guard. |
| `readFitCache` | TextLayoutEngine (3-arg: `cache, mode, key` — superset) | SemicircleRadialTextLayout (2-arg: `entry, key`) | `TextLayoutEngine` (fit-cache owner, alongside `writeFitCache` and `createFitCache`) |
| `buildValueTickAngles` | RadialValueMath (canonical, drift-fixed with `startDeg`/`endDeg` guard from Semicircle) | SemicircleRadialEngine | `RadialValueMath` (radial geometry owner) |

#### Rename same-name collisions (not duplicates)

These function pairs share a name but have different semantics. Rename for grep clarity and to prevent future AI agents from incorrectly "deduplicating" them:

| Current name | File | Rename to |
|---|---|---|
| `resolveShellRect` | `PreparedPayloadModelCache.js` | `extractPayloadShellRect` |
| `resolveInteractionState` | `AisTargetRenderModel.js` | `resolveAisInteractionState` |
| `resolveInteractionState` | `AlarmRenderModel.js` | `resolveAlarmInteractionState` |
| `resolveLayout` | `AlarmTextHtmlWidget.js` | `resolveAlarmLayout` |
| `formatMetric` | `EditRouteRenderModel.js` | `formatRouteMetric` |
| `formatMetric` (×2) | `ActiveRouteHtmlFit.js` | `formatActiveRouteMetric` |
| `measurePx` | `EditRouteHtmlFitSupport.js` | `measureEditRoutePx` |
| `measureStyle` | `EditRouteHtmlFitSupport.js` | `measureEditRouteStyle` |
| `resolveOpacity` | `CanvasTextLayout.js` | `resolveTextOptionOpacity` |
| `measureTextWidth` | `CenterDisplayTextWidget.js` | `measureCachedTextWidth` |
| `fitSingleTextPx` | `StateScreenTextFit.js` | `fitStateScreenTextPx` (different empty-text behavior: returns `0` for empty vs CanvasTextFitting returns `ceilingPx`) |
| `buildResizeSignatureParts` | `EditRouteRenderModel.js` | `buildEditRouteSignatureParts` |
| `buildResizeSignatureParts` | `AisTargetRenderModel.js` | `buildAisTargetSignatureParts` |
| `buildResizeSignatureParts` | `RoutePointsRenderModel.js` | `buildRoutePointsSignatureParts` |

Leave `resolveDisplayMode` (ActiveRouteHtmlFit, MapZoomTextHtmlWidget) as-is — same structural pattern with context-specific default thresholds, not worth merging but not confusing.

### Exit condition

`grep -rn "function toObject\|function toText\|function clampNumber\|function trimString\|function isObject\|function parseFontPx\|function createApproximateMeasureContext\|function resolveMeasureContext\|function keyToText\|function joinStyles\|function readFitCache\|function buildValueTickAngles" --include="*.js" | grep -v node_modules | grep -v test | grep -v tools/ | grep -v ValueMath | grep -v HtmlMeasureUtils | grep -v HtmlWidgetUtils | grep -v TextLayoutComposite | grep -v TextLayoutEngine | grep -v CanvasTextFitting | grep -v RadialValueMath` returns zero results.

All tests pass.

---

## Phase 4 — Remove Paranoid Fallback Patterns

### Purpose

Eliminate all 19 dead-code fallback patterns. Module member access trusts internal contracts.

### A. Remove `|| function(value) { ... }` fallbacks (9 widgets)

In each of these files, replace:
```js
const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber || function (value) {
  // ... 5-6 lines of dead code ...
};
```
with:
```js
const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
```

Files: DefaultRadialWidget, TemperatureLinearWidget, DefaultLinearWidget, VoltageLinearWidget, SpeedLinearWidget, DepthLinearWidget, WindLinearWidget, CompassLinearWidget, MapZoomTextHtmlWidget.

### B. Remove `|| valueMath.toFiniteNumber` fallbacks (9 sites)

In each of these files, replace:
```js
toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber || valueMath.toFiniteNumber;
```
with:
```js
toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
```

Files: CenterDisplayMath, EditRouteLayoutMath, AisTargetRenderModel, RoutePointsRenderModel, TemporaryHostActionBridge, ActiveRouteViewModel, ClusterMapperToolkit, PositionCoordinateWidget, WindRadialWidget.

### C. Remove `RadialFrameRenderer` fallback

In `shared/widget-kits/radial/RadialFrameRenderer.js`:
```js
const isBeyondEnd = tick.isBeyondEnd || function (curr, end, dir, includeEnd) { ... };
```
Replace with:
```js
const isBeyondEnd = tick.isBeyondEnd;
```

### Exit condition

`grep -rn "|| function\b" --include="*.js" | grep -v node_modules | grep -v test | grep -v tools/ | grep -v "define === " | grep -v "runtime/namespace.js"` returns zero results (excluding UMD boilerplate and the legitimate `runtime.getAvnavApi` polyfill in `runtime/namespace.js`, which sets a runtime method if the host hasn't — this is an external API boundary, not an internal module-member fallback).

`grep -rn "|| valueMath\.\||| toolkit\.\||| tick\." --include="*.js" | grep -v node_modules | grep -v test | grep -v tools/ | grep -v "define === "` returns zero results.

All tests pass.

---

## Phase 5 — Remove Redundant Normalization and Defensive Patterns

### Purpose

Remove redundant normalization chains, defensive property access on guaranteed objects, and redundant type coercion on known-type values.

### A. Remove widget-level re-normalization of mapper-normalized values

In each gauge widget's `buildSectors` function, replace:
```js
const warningFrom = toOptionalFiniteNumber(p.warningFrom);
```
with:
```js
const warningFrom = p.warningFrom;
```

The mapper already normalized via `toolkit.num()`. The value is `number | undefined`. No further conversion needed.

Files: TemperatureLinearWidget, SpeedLinearWidget, DepthLinearWidget, VoltageLinearWidget, TemperatureRadialWidget, SpeedRadialWidget, DepthRadialWidget, VoltageRadialWidget, DefaultRadialWidget, DefaultLinearWidget.

**DefaultRadialWidget and DefaultLinearWidget note:** These widgets wrap the re-normalization in a `resolveThreshold(value)` function that is just `return toOptionalFiniteNumber(value)`. After removing the re-normalization, `resolveThreshold` becomes an identity function. Delete `resolveThreshold` entirely and use the mapper prop directly: `const alarmLowAt = p.defaultRadialAlarmLowAt;`.

**Important:** Only remove re-normalization for props that come from the mapper's `rendererProps` (which pass through `toolkit.num`). Props that come from the AvNav store directly (like `p.value`, `p.heading`, `p.angle`) still need normalization at the widget level because they cross an external boundary.

**Prop classification — safe-to-remove vs do-not-remove:**

| Prop category | Examples | Mapper normalization | Widget re-normalization |
|---|---|---|---|
| **rendererProps numerics** | `*WarningFrom`, `*AlarmFrom`, `*MinValue`, `*MaxValue`, `*TickMajor`, `*TickMinor`, `*RatioThreshold*`, `captionUnitScale` | `toolkit.num()` → `toOptionalFiniteNumber` or `toolkit.unitNumber()` → `toFiniteNumber`, conditional `undefined` for disabled features | **REMOVE** — mapper guarantees `number \| undefined` |
| **rendererProps booleans** | `*Enabled`, `*ShowEndLabels`, `stableDigits`, `easing`, `*HideTextualMetrics` | `!!p.X` | **REMOVE** (if present) — mapper guarantees `boolean` |
| **rendererProps colors** | `*WarningColor`, `*AlarmColor` | Pass-through from editable defaults (always `string`) | **REMOVE** (if present) |
| **Store-direct values** | `p.value`, `p.depth`, `p.temp`, `p.heading`, `p.angle`, `p.speed`, `p.windAngle`, `p.windSpeed` | `value: p.X` — raw AvNav store pass-through, NO normalization | **KEEP** — these are the primary boundary guard |
| **Editable strings** | `p.caption`, `p.unit`, `p.default` | `cap()` / `unit()` from editable defaults (always `string`) | **REMOVE** `String().trim()` wrapping (Phase 5C) |
| **Formatter config** | `p.formatter`, `p.formatterParameters` | Pass-through (always `string` / `Array`) | **REMOVE** (if present) |

### B. Remove defensive `props && props.X` on guaranteed objects

In each widget function where `const p = props || {}` is the entry guard, replace:
```js
toOptionalFiniteNumber(props && props.tempLinearWarningFrom)
```
with:
```js
p.tempLinearWarningFrom
```
(or just `props.tempLinearWarningFrom` after the guard).

Files: TemperatureLinearWidget, DepthLinearWidget, CompassLinearWidget, TemperatureRadialWidget, SpeedRadialWidget, DepthRadialWidget.

### C. Remove redundant `String()` + `.trim()` on mapper-guaranteed strings

In engine and widget code, replace:
```js
const caption = String(p.caption).trim();
```
with:
```js
const caption = p.caption;
```

Captions and units are always trimmed strings from editable parameter defaults. The mapper's `cap()` and `unit()` functions return string values. Remove **all** `String(p.X).trim()` wrapping in these files, not just `caption` — this includes `angleUnit`, `speedUnit`, `angleCaption`, `speedCaption`, and `unit` props.

Files: SemicircleRadialEngine, LinearGaugeEngine, CompassRadialWidget, WindRadialWidget, WindLinearWidget.

**Preserve `String(hasOwn.call(cfg, "captionText") ? cfg.captionText : "").trim()`** in TextLayoutEngine and similar engine boundary code where `cfg` comes from the widget renderer and may carry arbitrary values.

### D. Standardize sentinel: `NaN` → `undefined` for disabled optional numerics

In voltage widgets, replace:
```js
const warningFrom = warningEnabled
  ? toOptionalFiniteNumber(p.voltageLinearWarningFrom)
  : NaN;
```
with:
```js
const warningFrom = warningEnabled
  ? p.voltageLinearWarningFrom   // already number | undefined from mapper
  : undefined;
```

In RadialSectorMath and DepthLinearWidget, replace `NaN` fallback with `undefined`:
```js
const alarmTo = Number.isFinite(alarmFrom) ? valueMath.clamp(alarmFrom, minV, maxV) : undefined;
```

All consumer sites already use `Number.isFinite(x)` for presence checks, which is false for both `NaN` and `undefined`. This change is behavior-preserving but makes the sentinel consistent.

Files: VoltageLinearWidget, VoltageRadialWidget, RadialSectorMath, DepthLinearWidget.

### Exit condition

No widget-level `toOptionalFiniteNumber` calls on mapper-normalized `rendererProps`. No `props && props.X` after a `const p = props || {}` guard. No `String(p.caption).trim()` on known-string props. No `NaN` sentinels for disabled optionals.

All tests pass.

---

## Phase 6 — Widen and Add Lint Rules

### Purpose

Close the gap between what the coding standards describe and what the lint rules enforce. After this phase, every category of code smell addressed in Phases 1–5 is detectable at pre-push time.

### A. Extend `premature-legacy-support` pattern detection

**File:** `tools/check-patterns/rules-failfast.mjs`, function `runPrematureLegacySupportRule`

Add two new pattern detectors:

1. **`X.member || function` pattern:**
   ```
   /(\w+)\.(\w+)\s*\|\|\s*function\s*\(/g
   ```
   Match `valueMath.toOptionalFiniteNumber || function(`, `tick.isBeyondEnd || function(`, etc. Exclude UMD boilerplate lines (lines containing `define === "function"`) and `runtime/namespace.js` (legitimate external-API polyfill on `runtime.getAvnavApi`).

2. **`X.memberA || X.memberB` pattern:**
   ```
   /(\w+)\.(\w+)\s*\|\|\s*\1\.(\w+)/g
   ```
   Match `valueMath.toOptionalFiniteNumber || valueMath.toFiniteNumber`, etc.

Severity: `block`.

### B. New rule: `canonical-helper-redefinition`

**File:** `tools/check-patterns/rules-failfast.mjs`

New rule that maintains a static list of canonical helper names and their owning modules. Any `function <canonicalName>(` definition in a file that is not the owning module triggers a block-level violation.

Canonical helper list (maintained as a const in the rule file):

```js
const CANONICAL_HELPERS = {
  // ValueMath
  toObject: "ValueMath",
  toText: "ValueMath",
  clampNumber: "ValueMath",
  isObject: "ValueMath",
  toSafeInteger: "ValueMath",
  hasText: "ValueMath",
  toFiniteNumber: "ValueMath",
  toOptionalFiniteNumber: "ValueMath",
  isFiniteNumber: "ValueMath",
  trimText: "ValueMath",
  textLength: "ValueMath",
  lerp: "ValueMath",
  appendUnit: "ValueMath",
  keyToText: "ValueMath",
  // HtmlMeasureUtils
  parseFontPx: "HtmlMeasureUtils",
  createApproximateMeasureContext: "HtmlMeasureUtils",
  resolveMeasureContext: "HtmlMeasureUtils",
  measurePx: "HtmlMeasureUtils",
  measureStyle: "HtmlMeasureUtils",
  toStyle: "HtmlMeasureUtils",
  resolveOwnerDocument: "HtmlMeasureUtils",
  resolveFitCache: "HtmlMeasureUtils",
  // HtmlWidgetUtils
  resolveSurfacePolicy: "HtmlWidgetUtils",
  escapeHtml: "HtmlWidgetUtils",
  toFontStyle: "HtmlWidgetUtils",
  buildTextOptions: "HtmlWidgetUtils",
  toStyleText: "HtmlWidgetUtils",
  resolveMetricValueFamily: "HtmlWidgetUtils",
  resolveLabelEdgePolicy: "HtmlWidgetUtils",
  toPx: "HtmlWidgetUtils",
  joinStyles: "HtmlWidgetUtils",
  // NOTE: resolveDefaultText is NOT listed here despite being a canonical HtmlWidgetUtils export.
  // PlaceholderNormalize and DepthDisplayFormatter have same-named but semantically different
  // functions that would produce false positives. The Phase 3 migration removes the true
  // duplicates; the body-based duplicate-functions rule guards against future re-introduction.
  // TextLayoutComposite
  resolveTextFillScale: "TextLayoutComposite",
  clampTextFillScale: "TextLayoutComposite",
  scaleTextCeiling: "TextLayoutComposite",
  resolveOpacity: "TextLayoutComposite",
  resolveCompactGeometryScale: "TextLayoutComposite",
  scaleValueUnitFit: "TextLayoutComposite",
  scaleInlineFit: "TextLayoutComposite",
  // CanvasTextLayout
  resolveFamily: "CanvasTextLayout",
  // TextLayoutEngine
  makeFitCacheKey: "TextLayoutEngine",
  writeFitCache: "TextLayoutEngine",
  readFitCache: "TextLayoutEngine",
  createFitCache: "TextLayoutEngine",
  // CanvasTextFitting
  setFont: "CanvasTextFitting",
  setCanvasFont: "CanvasTextFitting", // alias — callers should use setFont instead
  measureTextWidth: "CanvasTextFitting",
  fitSingleTextPx: "CanvasTextFitting",
  // LayoutRectMath
  splitRow: "LayoutRectMath",
  splitStack: "LayoutRectMath",
  // RadialValueMath
  buildValueTickAngles: "RadialValueMath",
  // RadialAngleMath
  valueToAngleFlat: "RadialAngleMath",
  // StableDigits — resolveIntegerWidth NOT listed: StableDigits is the canonical owner
  // but SemicircleRadialEngine and LinearGaugeEngine legitimately had same-named functions
  // with different signatures (3-arg vs 2-arg) before the merge. The extended signature
  // subsumes both. The body-based duplicate-functions rule guards against future drift.
};
```

Detection pattern:
```
/^\s*function\s+(toObject|toText|clampNumber|...)\s*\(/
```

Exclude the owning module file for each helper. Severity: `block`.

Register in `tools/check-patterns/rules.mjs` rule array.

### C. Extend `duplicate-functions` for small helpers

**File:** `tools/check-patterns/rules-duplicate.mjs` (or wherever `duplicate-functions` is implemented)

Lower the token threshold for exact-body matches to catch 1–4 line functions. Alternatively, add a separate `duplicate-small-helpers` rule that specifically detects function bodies matching the patterns `value && typeof value === "object" ? value : {}` (toObject), `value == null ? "" : String(value)` (toText), etc.

The `canonical-helper-redefinition` rule from step B catches name-based matches. This step catches body-based matches where the function has been renamed (e.g., `trimString` instead of `trimText`).

Severity: `warn` (to avoid false positives on legitimately different functions with similar bodies).

### D. New smell contract: `formatter-boundary-empty-string`

**File:** `tools/check-smell-contracts.mjs`

New rule that loads `runtime/format-runtime.js` in a sandbox and asserts:
- `applyFormatter("", { formatter: "formatDecimal", formatterParameters: [3, 1, true], default: "---" })` returns `"---"`.
- `applyFormatter("  ", { ... })` returns `"---"`.

### E. Extend smell contract: `placeholder-contract` sentinel coverage

**File:** `tools/check-smell-contracts.mjs`

In `runPlaceholderContractRule`, add a structural assertion:
- Read `PlaceholderNormalize.js` source.
- Assert it contains string matches for `"NaN"`, `"undefined"`, `"null"`, `"Infinity"`.
- This prevents future removal of the sentinel patterns.

### F. New smell contract: `canonical-helper-completeness`

**File:** `tools/check-smell-contracts.mjs`

New rule that loads `ValueMath.js` in a sandbox and asserts that all expected canonical exports exist: `toObject`, `toText`, `clampNumber`, `isObject`, `toSafeInteger`, `hasText`, `keyToText`, `textLength`, `lerp`, `appendUnit`, `toFiniteNumber`, `toOptionalFiniteNumber`, `isFiniteNumber`, `trimText`, `clamp`, `clampPositive`, `ensureObject`.

Also loads `HtmlMeasureUtils.js` and asserts: `parseFontPx`, `createApproximateMeasureContext`, `resolveMeasureContext`, `measurePx`, `measureStyle`, `toStyle`, `resolveOwnerDocument`, `resolveFitCache`.

Also loads `HtmlWidgetUtils.js` and asserts (new exports only, existing exports already covered): `resolveDefaultText`, `toFontStyle`, `buildTextOptions`, `toStyleText`, `resolveMetricValueFamily`, `resolveLabelEdgePolicy`, `toPx`, `joinStyles`.

Also loads `TextLayoutComposite.js` and asserts: `resolveTextFillScale`, `clampTextFillScale`, `scaleTextCeiling`, `resolveOpacity`, `resolveCompactGeometryScale`, `scaleValueUnitFit`, `scaleInlineFit`.

Also loads `TextLayoutEngine.js` and asserts: `makeFitCacheKey`, `writeFitCache`, `readFitCache`, `createFitCache`.

Also loads `CanvasTextFitting.js` and asserts: `setFont`, `measureTextWidth`, `fitSingleTextPx`.

Also loads `CanvasTextLayout.js` and asserts: `resolveFamily`.

Also loads `LayoutRectMath.js` and asserts: `makeRect`, `splitRow`, `splitStack`.

Also loads `RadialValueMath.js` and asserts: `buildValueTickAngles` (the drift-fixed version with `startDeg`/`endDeg` guard).

Also loads `RadialAngleMath.js` and asserts: `valueToAngle`, `valueToAngleFlat`.

Also loads `StableDigits.js` and asserts: `resolveIntegerWidth` accepts 3 arguments (the extended signature).

### G. Verify all new rules catch violations

Before committing the rule changes, temporarily revert one fix from Phase 3 (e.g., add back a private `toObject` in one file) and run `npm run check:patterns` to confirm the new `canonical-helper-redefinition` rule fires. Then remove the temporary revert.

### Exit condition

`npm run check:all` passes with the new rules active. Temporarily introducing a private `toObject` or a `|| function` fallback in any widget file causes a `block`-level failure.

---

## Phase 7 — Update Documentation

### A. Update `documentation/conventions/shared-helpers.md`

Extend the canonical modules table:

| Module | File | Owns |
|---|---|---|
| `ValueMath` | `shared/widget-kits/value/ValueMath.js` | (existing) + `toObject`, `toText`, `clampNumber`, `isObject`, `toSafeInteger`, `hasText`, `keyToText`, `textLength`, `lerp`, `appendUnit` |
| `HtmlMeasureUtils` | `shared/widget-kits/html/HtmlMeasureUtils.js` | `parseFontPx`, `createApproximateMeasureContext`, `resolveMeasureContext`, `measurePx`, `measureStyle`, `toStyle`, `resolveOwnerDocument`, `resolveFitCache`, `APPROX_CHAR_WIDTH_RATIO` |
| `HtmlWidgetUtils` | (existing) | (existing) + `resolveDefaultText`, `toFontStyle`, `buildTextOptions`, `toStyleText`, `resolveMetricValueFamily`, `resolveLabelEdgePolicy`, `toPx`, `joinStyles` |
| `TextLayoutComposite` | `shared/widget-kits/text/TextLayoutComposite.js` | (existing) + exported `resolveTextFillScale`, `clampTextFillScale`, `scaleTextCeiling`, `resolveOpacity`, `resolveCompactGeometryScale`, `scaleValueUnitFit`, `scaleInlineFit` |
| `TextLayoutEngine` | (existing) | (existing) + exported `makeFitCacheKey`, `writeFitCache`, `readFitCache`, `createFitCache` |
| `CanvasTextFitting` | (existing) | (existing, `setFont` drift-fixed: default weight 400→700) + exported `measureTextWidth`, `fitSingleTextPx` |
| `CanvasTextLayout` | (existing) | (existing) + exported `resolveFamily` |
| `LayoutRectMath` | (existing) | (existing) + `splitRow`, `splitStack` |
| `RadialValueMath` | (existing) | (existing, `buildValueTickAngles` drift-fixed with `startDeg`/`endDeg` guard) |
| `RadialAngleMath` | (existing) | (existing) + `valueToAngleFlat` |
| `StableDigits` | (existing) | (existing, `resolveIntegerWidth` extended with optional `rangeMax` 3rd param) |
| `GaugeToolkit` | (existing) | (unchanged) |

Add a new section: **Complete Canonical Helper List** — a flat table of every function name, its owning module, and a one-line description. This serves as the lookup reference for AI agents and the data source for the `canonical-helper-redefinition` lint rule.

Add to the **Dependency Rules** section:
- At the formatter boundary (`applyFormatter`), empty strings are treated as "no data" and return the default placeholder.
- `PlaceholderNormalize` catches JS type sentinels (`NaN`, `undefined`, `null`, `Infinity`) as a safety net.
- Use `undefined` (not `NaN`) as the sentinel for absent optional numeric values.
- Never create `|| function` or `|| X.memberB` fallbacks for internal module members.

### B. Update `documentation/conventions/smell-prevention.md`

Add new rows to the smell catalog table:

| Smell | Example | Prevention | Rule | Severity |
|---|---|---|---|---|
| Canonical helper redefinition | `function toObject(v) { return v && typeof v === "object" ? v : {}; }` in widget code | Use the canonical module export | `check-patterns` (`canonical-helper-redefinition`) | block |
| Paranoid module-member fallback (`\|\| function`) | `valueMath.toOptionalFiniteNumber \|\| function(v) { ... }` | Trust internal module contracts; remove fallback | `check-patterns` (`premature-legacy-support`) | block |
| Paranoid cross-member fallback (`\|\| X.memberB`) | `valueMath.toOptionalFiniteNumber \|\| valueMath.toFiniteNumber` | Trust internal module contracts | `check-patterns` (`premature-legacy-support`) | block |
| Formatter boundary NaN leak | `applyFormatter("")` reaches AvNav formatter, returns `"NaN "` | `applyFormatter` guards empty strings; `PlaceholderNormalize` catches sentinel strings | `check-smell-contracts` (`formatter-boundary-empty-string`, `placeholder-contract`) | block |
| Inconsistent absent-numeric sentinel | `warningEnabled ? num(x) : NaN` instead of `undefined` | Use `undefined` for absent optional numerics | documentation + code review | warn |
| Widget re-normalization of mapper props | `toOptionalFiniteNumber(p.warningFrom)` when mapper already normalizes | Trust mapper boundary contracts for `rendererProps` | documentation + code review | warn |

### C. Update `documentation/conventions/smell-fix-playbooks.md`

Add playbooks:

**Canonical helper redefinition:**
1. Identify the canonical module from `shared-helpers.md`.
2. Add the module to `Depends:` header.
3. Require the module in `create()`.
4. Replace private function with canonical import.
5. Delete the private function definition.
6. Run `npm run check:patterns` to verify the violation is gone.

**Paranoid module-member fallback:**
1. Remove the `|| function(...)` or `|| X.memberB` part.
2. Keep only the direct member access: `X.member`.
3. Run tests to confirm the member is always present.

### D. Update `AGENTS.md`

Add a new section: **Code Hygiene Rules for AI Agents**

```markdown
## Code Hygiene Rules for AI Agents

### Before creating any helper function

1. Read `documentation/conventions/shared-helpers.md` to check if a canonical version exists.
2. Search the codebase for the function name: `grep -rn "function <name>" --include="*.js"`.
3. If a canonical version exists, require and use it. Never create a local copy.
4. If no canonical version exists but the function is generic (not widget-specific), propose adding it to the appropriate canonical module.

### Forbidden patterns

- **Never** create `X.member || function(value) { ... }` fallback code. Module exports are guaranteed by internal contracts.
- **Never** create `X.memberA || X.memberB` cross-member fallbacks.
- **Never** re-normalize a value that was already normalized by the mapper. Props in `rendererProps` are mapper-guaranteed.
- **Never** use `NaN` as a sentinel for "absent value". Use `undefined`.
- **Never** wrap mapper-guaranteed string props in `String()` or `.trim()`.
- **Never** use `props && props.X` after a `const p = props || {}` boundary guard.

### Value boundary rules

- `applyFormatter` handles null, undefined, NaN, and empty strings. Do not add additional guards around its output.
- `PlaceholderNormalize.normalize()` must always be paired with `applyFormatter` output (enforced by `placeholder-contract` smell contract).
- Use `ValueMath.toOptionalFiniteNumber(raw)` for live sensor data from the AvNav store.
- Use `ValueMath.toFiniteNumber(raw)` only for config/default coercion where `null → 0` is explicitly desired.
```

### E. Update `Depends:` headers in all changed files

Every file modified in Phases 1–5 must have its `Depends:` header updated to reflect the actual component dependencies after migration.

### Exit condition

All documentation is internally consistent. The canonical helper list in `shared-helpers.md` matches the `CANONICAL_HELPERS` constant in the lint rule. `AGENTS.md` explicitly forbids every pattern addressed in this plan.

---

## Phase 8 — Validation Gate

### Required targeted tests

Run the touched-area suites:

```bash
npx vitest run tests/runtime/format-runtime-boundary.test.js
npx vitest run tests/shared/value/ValueMath.test.js
npx vitest run tests/shared/format/PlaceholderNormalize.test.js
npx vitest run tests/shared/format/StableDigits.test.js
npx vitest run tests/shared/html/HtmlMeasureUtils.test.js
npx vitest run tests/shared/layout/LayoutRectMath.test.js
npx vitest run tests/shared/radial/RadialAngleMath.test.js
```

### Required full test suite

Run the **full test suite** to verify no regressions from the 60+ file migration:

```bash
npx vitest run
```

### Required project-wide checks

Run:

```bash
npm run check:all
```

All checks must pass, including the new rules added in Phase 6.

### Required manual checks

1. **Pressure NaN check** — In an AvNav environment, navigate to a page showing a pressure widget when no barometric sensor data is available. Confirm the widget displays `"---"`, not `"NaN "`.

2. **All gauge widgets with no data** — Confirm `"---"` placeholder for: depth, temperature, voltage, speed, wind angle, wind speed, compass heading, and position coordinates when no sensor data is available.

3. **Gauge widgets with valid data** — Confirm normal display for all widget types when sensor data is present. Values, captions, units, warning/alarm sectors, and state screens must render identically to pre-PLAN27 behavior.

4. **Lint rule regression check** — Temporarily add a private `function toObject(v) { return v && typeof v === "object" ? v : {}; }` to any widget file. Run `npm run check:patterns`. Confirm `canonical-helper-redefinition` fires at `block` severity. Remove the temporary addition.

5. **Paranoid fallback regression check** — Temporarily add `const fn = valueMath.toOptionalFiniteNumber || function(v) { return v; };` to any widget file. Run `npm run check:patterns`. Confirm `premature-legacy-support` fires at `block` severity. Remove.

### Exit condition

All automated tests pass. All project-wide checks pass. Manual verification confirms no visual regressions and correct placeholder behavior. Lint rules successfully block re-introduction of every addressed smell category.

---

## Deduplication Summary

### Before PLAN27

| Category | Count |
|---|---|
| Duplicated private helpers (toObject, clampNumber, toText, etc.) | ~130+ instances across 65+ files |
| Same-name different-function collisions | 10 function names (25 defs) |
| Paranoid fallback dead code | 19 sites |
| Redundant normalization chains | all 8 gauge widget families |
| Defensive access on guaranteed objects | 15+ sites |
| Redundant type coercion on known types | 10+ sites |
| Drifted function clones | 8+ confirmed |
| NaN/empty-string display leak | all formatter-using text widgets |
| Lint rules catching violations | 0 |

### After PLAN27

| Category | Count |
|---|---|
| Duplicated private helpers | 0 |
| Same-name different-function collisions | 0 (renamed for clarity) |
| Paranoid fallback dead code | 0 |
| Redundant normalization chains | 0 |
| Defensive access on guaranteed objects | 0 |
| Redundant type coercion on known types | 0 |
| Drifted function clones | 0 |
| NaN/empty-string display leak | 0 |
| Lint rules catching violations | 3 new rules + 3 extended rules |

### New and extended enforcement rules

| Rule | Type | Catches | Severity |
|---|---|---|---|
| `canonical-helper-redefinition` (new) | check-patterns | Private function defs matching canonical helper names | block |
| `premature-legacy-support` (extended) | check-patterns | `X.member \|\| function` and `X.memberA \|\| X.memberB` patterns | block |
| `duplicate-functions` (extended) | check-patterns | Small-helper body matches below previous threshold | warn |
| `formatter-boundary-empty-string` (new) | smell-contract | `applyFormatter("")` not returning default | block |
| `placeholder-contract` (extended) | smell-contract | PlaceholderNormalize missing NaN/undefined/null/Infinity patterns | block |
| `canonical-helper-completeness` (new) | smell-contract | ValueMath or HtmlMeasureUtils missing expected exports | block |
