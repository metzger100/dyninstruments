# PLAN13 — StableDigits Rollout, EditRoute Layout Fix, TimeStatus Centering

## Status

Execution plan for four post-PLAN11/PLAN12 regressions and gaps.
Each phase is scoped for one Codex session. Phases 1–3 are independent. Phase 4 depends on Phase 2. Phase 5 depends on Phase 3.

---

## Issues Summary

| # | Title | Affected files | Root cause |
|---|-------|---------------|------------|
| 1 | Many widget kinds lack the "Stable digits" option | `config/clusters/*.js` | PLAN11 only added `stableDigits` conditions for radial/linear/xte/activeRoute/editRoute/centerDisplay kinds; all ThreeValueTextWidget text kinds, Zoom, AisTarget, RoutePoints, dateTime, and timeStatus were omitted |
| 2 | activeRoute stableDigits: values pad but font stays proportional | `ActiveRouteHtmlFit.js` | Fit measurement uses `tokens.font.family` (proportional) instead of `tokens.font.familyMono`; fit cache signature omits `stableDigitsEnabled` so toggling doesn't invalidate |
| 3 | editRoute layout broken: values clip into labels; stableDigits has no visible effect | `EditRouteTextHtmlWidget.css`, `EditRouteLayout.js`, `EditRouteLayoutGeometry.js`, `EditRouteHtmlFit.js` | CSS grid uses `auto` for label row while JS fit computes font-size against a fixed pixel rect; the two sizing models disagree, causing overflow. Compared to ActiveRoute (which works), EditRoute's metric tile has no `align-content: stretch` and its fit pipeline doesn't coordinate caption/value heights the way `TextTileLayout.measureMetricTile` does |
| 4 | timeStatus indicator not horizontally centered | `PositionCoordinateWidget.js` | `coordinatesTabular` defaults to `true` for ALL PositionCoordinateWidget variants (line 169: `p.coordinatesTabular !== false`), forcing `coordinateAlign = "right"`. For timeStatus the emoji indicator and for dateTime the date/time values should be center-aligned since they aren't coordinates |

---

## Verified Baseline

1. `ThreeValueTextWidget.js` already has full stableDigits support: imports `StableDigits` module (line 17), reads `props.stableDigits === true` (line 36), switches to `tokens.font.familyMono` (line 37–38), pads values via `stableDigits.normalize(...)` (line 68–70). **No implementation changes needed for any ThreeValueTextWidget kind — only config conditions.**
2. `PositionCoordinateWidget.js` line 169: `const coordinatesTabular = p.coordinatesTabular !== false;` — defaults true for all variants. Line 170–171: family is mono when coordinatesTabular is true. Line 176: `coordinateAlign = coordinatesTabular ? "right" : "center"`. Line 278 and 296: `align: coordinateAlign` is passed to `fitTwoRowsWithHeader` and `drawTwoRowsWithHeader`.
3. `TextLayoutComposite.js` `drawTwoRowsWithHeader` line 314–318: uses a single `align` for both rows. Both the status emoji (top) and time (bottom) are drawn at the same x-coordinate with the same alignment.
4. `ActiveRouteHtmlFit.js` line 184–186: `family = tokens.font.family` — always proportional, never switches to `familyMono`. Line 256: reads `model.stableDigitsEnabled` only for fallback logic. `buildFitSignature` (lines 134–163) does not include `stableDigitsEnabled`.
5. `EditRouteHtmlFit.js` line 202–208: `resolveMetricValueFamily(model, tokens)` correctly returns `font.familyMono` when `stableDigitsEnabled`. Line 292: `valueFamily` is used for metric value measurement. The mono font IS used for fit measurement in EditRoute.
6. `EditRouteTextHtmlWidget.css` line 115–121: `.dyni-edit-route-metric { display: grid; grid-template-rows: auto minmax(0, 1fr); row-gap: 0.08em; }`. The `auto` row (label) takes its content height; the `1fr` row (value) gets the remainder.
7. `ActiveRouteTextHtmlWidget.css` line 107–114: `.dyni-active-route-metric { display: grid; grid-template-rows: auto minmax(0, 1fr); row-gap: 0.08em; align-content: stretch; }` — same structure but has `align-content: stretch`.
8. `ActiveRouteTextHtmlWidget.js` `renderMetricTile` (line 208–224): adds `dyni-tabular` class to value span when `tabular` param is true.
9. `EditRouteMarkup.js` line 60–63: adds `dyni-tabular` class to `valueTextClasses` when `model.stableDigitsEnabled === true`.
10. `EditRouteLayoutGeometry.js` `createMetricTile` line 140–141: computes `labelHeight = Math.floor(spacing.captionHeightPx)` and `valueHeight = tileRect.h - labelHeight`. These fixed pixel heights are used by the fit code but the CSS grid uses `auto` + `1fr`, creating the sizing mismatch.
11. `plugin.css` line 57–60: `.dyni-tabular { font-variant-numeric: tabular-nums; font-family: var(--dyni-theme-font-family-mono), var(--dyni-theme-font-family); }` — specificity (0,1,0).
12. `ThemeModel.js` line 46: `font.familyMono` token maps input `--dyni-font-mono` → output `--dyni-theme-font-family-mono`. Line 20: default is `"Roboto Mono", ui-monospace, ...`.
13. `runtime/theme-runtime.js` line 189: `rootEl.style.setProperty(outputVar, String(resolvedValue))` applies output CSS vars to the widget root element.
14. `ClusterKindCatalog.js`: ThreeValueTextWidget kinds — `cog`, `hdt`, `hdm`, `brg` (course-heading); `sog`, `stw` (speed); `depth`, `temp`, `pressure` (environment); `angleTrue`, `angleApparent`, `angleTrueDirection`, `speedTrue`, `speedApparent` (wind); `eta`, `rteEta`, `dst`, `rteDistance`, `vmg` (nav); `distance`, `watch`, `bearing` (anchor); `voltage`, `clock`, `pitch`, `roll` (vessel).
15. Config clusters with existing `stableDigits` editable: `course-heading.js` (conditions: hdtRadial, hdmRadial, hdtLinear, hdmLinear), `speed.js` (sogLinear, stwLinear, sogRadial, stwRadial), `environment.js` (depthLinear, depthRadial, tempLinear, tempRadial), `wind.js` (angleTrueRadial, angleApparentRadial, angleTrueLinear, angleApparentLinear), `vessel.js` (voltageLinear, voltageRadial), `nav.js` (xteDisplay, activeRoute, editRoute), `map.js` (centerDisplay).
16. `anchor.js` has no `stableDigits` editable at all; it needs one added.
17. `vessel.js` `stableDigits` condition is `[{ kind: "voltageLinear" }, { kind: "voltageRadial" }]` — missing `voltage`, `clock`, `pitch`, `roll`, `dateTime`, `timeStatus`.
18. `MapZoomTextHtmlWidget.js`, `AisTargetTextHtmlWidget.js`, `RoutePointsTextHtmlWidget.js` — none import `StableDigits`, none add `dyni-tabular` class, none read `props.stableDigits`.
19. `MapZoomHtmlFit.js` — no mono font handling. `AisTargetRenderModel.js` — no stableDigits logic. `RoutePointsRenderModel.js` — no stableDigits logic.
20. `vessel.js` `hideSeconds` already covers `clock`, `dateTime`, `timeStatus`. `coordinatesTabular` is NOT in `vessel.js` editableParameters — so `dateTime`/`timeStatus` users cannot toggle it; it silently defaults to `true`.
21. `ActiveRouteLayout.js` `computeMetricTileSpacing` is used by `ActiveRouteHtmlFit` for coordinated caption/value sizing. This function lives in `TextTileLayout.js` (not in `ActiveRouteLayout.js`).
22. `EditRouteLayout.js` `createMetricTile` delegates to `EditRouteLayoutGeometry.createMetricTile` which uses `profileApi.computeIntrinsicTileSpacing` — a different API from `TextTileLayout.measureMetricTile`. The geometric split is fixed by `METRIC_TILE_CAPTION_RATIO = 0.34`.
23. `runtime/editable-defaults.js` `defaultsFromEditableParams` (line 12–30): iterates `Object.keys(editableParams)` and maps `out[k] = spec.default`. No `key` aliasing, no per-kind default override. The prop name delivered to the widget is always the editable parameter key name.

---

## Hard Constraints

- **No new shared modules.** All changes use existing files and patterns.
- **ThreeValueTextWidget implementation is unchanged.** It already supports stableDigits; only config conditions are added.
- **No changes to `config/shared/common-editables.js`.** Per-widget editables stay in cluster config files (PLAN11 convention).
- **`PlaceholderNormalize` patterns are unchanged.** RoutePoints exemption remains.
- **No file exceeds 400 non-empty lines.**
- **Every modified file retains its Module/Documentation/Depends header.**
- **`npm run check:all` must pass at the end of each phase.**

---

## Phase 1 — Add stableDigits config conditions for all ThreeValueTextWidget kinds

### Intent

Enable the "Stable digits" toggle in the user-facing widget editor for every ThreeValueTextWidget kind that currently lacks it. No implementation changes — ThreeValueTextWidget already supports stableDigits.

### Mandatory preflight

Read these files before any code changes:
- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/avnav-api/editable-parameters.md`

### Task

#### 1. `config/clusters/course-heading.js`

Add `{ kind: "cog" }`, `{ kind: "hdt" }`, `{ kind: "hdm" }`, `{ kind: "brg" }` to the existing `stableDigits.condition` array. The existing conditions (`hdtRadial`, `hdmRadial`, `hdtLinear`, `hdmLinear`) remain.

#### 2. `config/clusters/speed.js`

Add `{ kind: "sog" }`, `{ kind: "stw" }` to `stableDigits.condition`. Existing conditions remain.

#### 3. `config/clusters/environment.js`

Add `{ kind: "depth" }`, `{ kind: "temp" }`, `{ kind: "pressure" }` to `stableDigits.condition`. Existing conditions remain.

#### 4. `config/clusters/wind.js`

Add `{ kind: "angleTrue" }`, `{ kind: "angleApparent" }`, `{ kind: "angleTrueDirection" }`, `{ kind: "speedTrue" }`, `{ kind: "speedApparent" }` to `stableDigits.condition`. Existing conditions remain.

#### 5. `config/clusters/nav.js`

Add `{ kind: "eta" }`, `{ kind: "rteEta" }`, `{ kind: "dst" }`, `{ kind: "rteDistance" }`, `{ kind: "vmg" }` to `stableDigits.condition`. Existing conditions (`xteDisplay`, `activeRoute`, `editRoute`) remain.

#### 6. `config/clusters/vessel.js`

Add `{ kind: "voltage" }`, `{ kind: "clock" }`, `{ kind: "pitch" }`, `{ kind: "roll" }` to `stableDigits.condition`. Existing conditions (`voltageLinear`, `voltageRadial`) remain. **Do NOT add `dateTime` or `timeStatus` here yet** — they need implementation changes first (Phase 4).

#### 7. `config/clusters/anchor.js`

Add a new `stableDigits` editable parameter:
```js
stableDigits: {
  type: "BOOLEAN",
  default: false,
  name: "Stable digits",
  condition: [
    { kind: "distance" },
    { kind: "watch" },
    { kind: "bearing" }
  ]
}
```
Place it after `captionUnitScale` (or similar shared parameter), following the pattern used in other clusters.

### Verification

- For each cluster file, confirm the `stableDigits.condition` array lists ALL ThreeValueTextWidget kinds for that cluster (cross-reference `ClusterKindCatalog.js`).
- `npm run check:all` passes.
- Existing stableDigits tests in `tests/config/clusters/` are updated to expect the new conditions.

---

## Phase 2 — Fix activeRoute stableDigits (mono font in fit + cache invalidation)

### Intent

Make the "Stable digits" toggle on the activeRoute widget visually switch value text to monospace font and correctly recompute text fit.

### Mandatory preflight

Read these files before any code changes:
- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/widgets/active-route.md`
- `documentation/shared/stable-digits.md`

### Context for Codex

`ActiveRouteHtmlFit.js` measures value text width using `tokens.font.family` (proportional font) at line 186. When stableDigits is enabled, the CSS class `dyni-tabular` switches the rendered font to `font.familyMono` (monospace). This mismatch means:
1. The font-size is computed for proportional metrics but rendered in mono → potential overflow.
2. The fit cache signature (`buildFitSignature`) does not include `stableDigitsEnabled`, so toggling the option doesn't invalidate the cached fit result — the old font-size persists.

`EditRouteHtmlFit.js` (lines 202–208) already solves both problems with `resolveMetricValueFamily()` and by including the model in the signature. Use the same pattern.

### Task

#### 1. `ActiveRouteHtmlFit.js` — Use mono font for measurement when stableDigits is active

Add a `resolveValueFamily` helper (same pattern as `EditRouteHtmlFit.resolveMetricValueFamily`):

```js
function resolveValueFamily(model, tokens) {
  var font = tokens && tokens.font ? tokens.font : {};
  if (model && model.stableDigitsEnabled === true) {
    return font.familyMono || font.family || "";
  }
  return font.family || "";
}
```

In the `compute` function, after line 186 (`const family = tokens.font.family`), add:
```js
const valueFamily = resolveValueFamily(model, tokens);
```

In the `measureMetricTile` call (around line 241–253), change the `family` parameter from `family` to `valueFamily` so value text is measured with the correct font. Caption text should continue using `family` (proportional).

Similarly, in the fallback measurement (around line 269–283), use `valueFamily`.

#### 2. `ActiveRouteHtmlFit.js` — Include `stableDigitsEnabled` in fit cache signature

In `buildFitSignature` (lines 134–163), add `model.stableDigitsEnabled ? 1 : 0` to the JSON array (e.g. after `model.disconnect ? 1 : 0`). This ensures the cache invalidates when the toggle changes.

#### 3. Update the `Depends` header

Add `ThemeResolver` dependency awareness comment if not already present (it is — verify).

### Verification

- With stableDigits enabled on an activeRoute widget: value text renders in Roboto Mono, values are zero-padded, font-size is appropriate for the mono glyph width.
- Toggling stableDigits on/off causes immediate visual change (cache invalidation works).
- `npm run check:all` passes.
- Existing tests in `tests/shared/nav/ActiveRouteHtmlFit.test.js` pass. Add a test case that verifies `valueFamily` differs from `family` when `stableDigitsEnabled: true`.

---

## Phase 3 — Fix editRoute layout (value clipping into labels) + verify stableDigits

### Intent

Fix the visual regression where editRoute value text clips into labels in normal mode, and verify that stableDigits works correctly once the layout is fixed.

### Mandatory preflight

Read these files before any code changes:
- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/widgets/edit-route.md`

### Context for Codex

The root cause is a mismatch between the CSS grid layout and the JS fit model.

**CSS side:** `.dyni-edit-route-metric` uses `grid-template-rows: auto minmax(0, 1fr)`. The label row (`auto`) takes its content size based on the font-size set by the JS fit. The value row (`1fr`) gets the remainder. If the label's rendered height exceeds what the JS assumed, the value row shrinks, but its font-size (already computed) is too large for the reduced space → visual overflow/clipping.

**JS side:** `EditRouteLayoutGeometry.createMetricTile` (line 140–141) computes `labelHeight` as a fixed fraction (`METRIC_TILE_CAPTION_RATIO = 0.34`) of the tile rect. The value's `valueHeight = tileRect.h - labelHeight`. The fit code then computes font-sizes to fill these rects. But the CSS grid doesn't enforce this exact split.

**ActiveRoute comparison:** ActiveRoute works because it uses `TextTileLayout.measureMetricTile` which coordinates caption and value sizing together, and its CSS has `align-content: stretch`. The fundamental approach is the same (`auto` + `1fr`), but the coordinated sizing prevents the mismatch.

### Task

#### A. CSS fix: Explicit grid row fractions for metric tiles

**`EditRouteTextHtmlWidget.css`** — Replace the `auto minmax(0, 1fr)` with explicit fractions that match the JS model's `METRIC_TILE_CAPTION_RATIO = 0.34`:

```css
.dyni-html-root .dyni-edit-route-metric {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 0.34fr) minmax(0, 0.66fr);
  row-gap: 0.08em;
  align-content: stretch;
}
```

This ensures the CSS grid distributes space in the same proportion as the JS layout model. Add `align-content: stretch` (matching ActiveRoute's pattern).

For flat mode, the existing `row-gap: 0` override remains:
```css
.dyni-html-root .dyni-edit-route-mode-flat .dyni-edit-route-metric {
  row-gap: 0;
}
```

#### B. CSS fix: Overflow protection on metric value

Add `overflow: hidden` on the value container as a safety net:

```css
.dyni-html-root .dyni-edit-route-metric-value {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.14em;
  line-height: 1;
  overflow: hidden;   /* Prevent visual clipping into adjacent rows */
}
```

#### C. CSS fix: Overflow protection on metric label

```css
.dyni-html-root .dyni-edit-route-metric-label {
  font-weight: var(--dyni-theme-font-label-weight, 700);
  opacity: 0.8;
  overflow: hidden;
}
```

#### D. Verify stableDigits now works

With the layout fixed, stableDigits should work because:
- `EditRouteRenderModel.js` already pads values via `StableDigits.normalize()`
- `EditRouteMarkup.js` already adds `dyni-tabular` class
- `EditRouteHtmlFit.js` already uses mono font for measurement

If stableDigits still doesn't visually switch to mono font after the layout fix, investigate the CSS specificity chain. The `dyni-tabular` rule (specificity 0,1,0) must not be overridden by a more specific rule that sets `font-family`. Check if any rule like `.dyni-html-root .dyni-edit-route-metric-value-text` sets `font-family` — if so, the `dyni-tabular` class needs the same specificity prefix.

### Edge cases

- High mode: `.dyni-edit-route-metric-row` uses `grid-template-columns: minmax(0, 0.36fr) minmax(0, 0.64fr)` (horizontal label|value split). This is unaffected by the vertical split fix. Verify no regression in high mode.
- Flat mode: `row-gap: 0` override still applies. Verify no regression in flat mode.
- When stableDigits is off, values should render in proportional font as before.

### Verification

- editRoute in normal mode: values do NOT clip into labels below.
- editRoute in high mode: label and value are on the same row, no regression.
- editRoute in flat mode: compact layout, no regression.
- With stableDigits enabled: values render in Roboto Mono, zero-padded.
- With stableDigits disabled: values render in Roboto (proportional).
- ActiveRoute layout is unaffected.
- `npm run check:all` passes.

---

## Phase 4 — Fix timeStatus centering + add stableDigits to PositionCoordinateWidget (dateTime, timeStatus)

### Intent

Fix the timeStatus indicator centering regression and enable stableDigits (default: on) for dateTime and timeStatus variants.

### Mandatory preflight

Read these files before any code changes:
- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/widgets/position-coordinates.md`
- `documentation/shared/stable-digits.md`

### Context for Codex

`PositionCoordinateWidget.js` handles three display variants: `position`, `dateTime`, and `timeStatus`. The `coordinatesTabular` prop (line 169) defaults to `true` for ALL variants, which:
- Switches font to mono (via `tokens.font.familyMono`)
- Forces right-alignment (`coordinateAlign = "right"`)

For `dateTime` and `timeStatus`, right-alignment is wrong — these are not coordinates. The status indicator emoji (🟢/🔴) should be centered. The time value should also be centered (these widgets show date/time, not lat/lon coordinates).

The `coordinatesTabular` editable is NOT in the vessel cluster config, so users cannot toggle it for dateTime/timeStatus. It silently defaults to `true`.

### Task

#### 1. `PositionCoordinateWidget.js` — Override coordinatesTabular for non-coordinate variants

After line 169 (`const coordinatesTabular = p.coordinatesTabular !== false;`), add variant-aware override:

```js
const displayVariant = normalizeDisplayVariant(p.displayVariant);
const isCoordinateVariant = displayVariant === DISPLAY_VARIANT_POSITION;
const effectiveCoordinatesTabular = isCoordinateVariant
  ? coordinatesTabular
  : false;
```

Then replace all downstream uses of `coordinatesTabular` with `effectiveCoordinatesTabular`:
- Line 170–171: font selection → use `effectiveCoordinatesTabular` combined with stableDigits (see step 2)
- Line 176: `coordinateAlign` → use `effectiveCoordinatesTabular`

#### 2. `PositionCoordinateWidget.js` — Add stableDigits support

Read `stableDigits` from props with variant-aware default:
```js
const stableDigitsEnabled = isCoordinateVariant
  ? (p.stableDigits === true)        // position: explicit opt-in (default false)
  : (p.stableDigits !== false);       // dateTime/timeStatus: default true, opt-out
```

The font family logic becomes:
```js
const useMono = effectiveCoordinatesTabular || stableDigitsEnabled;
const family = useMono
  ? (tokens.font.familyMono || tokens.font.family)
  : tokens.font.family;
```

The alignment logic remains based on `effectiveCoordinatesTabular` only (stableDigits doesn't change alignment):
```js
const coordinateAlign = effectiveCoordinatesTabular ? "right" : "center";
```

**Result for each variant:**
- `position` with `coordinatesTabular=true` (default): mono + right-aligned (unchanged behavior).
- `position` with `stableDigits=true`: mono + right-aligned (coordinatesTabular is also true by default).
- `dateTime` with `stableDigits=true` (new default): mono + center-aligned.
- `timeStatus` with `stableDigits=true` (new default): mono + center-aligned.
- `dateTime`/`timeStatus` with `stableDigits=false`: proportional + center-aligned.

#### 3. `PositionCoordinateWidget.js` — Include stableDigitsEnabled in fit cache keys

Both flat and stacked fit cache keys (the `text.makeFitCacheKey` calls) must include `stableDigitsEnabled` so the cache invalidates when the toggle changes. Add `stableDigitsEnabled: stableDigitsEnabled` to the key object in both places.

#### 4. `config/clusters/vessel.js` — Add stableDigits conditions for dateTime and timeStatus

The editable parameter system (`runtime/editable-defaults.js`) has no per-kind default mechanism and no `key` aliasing — `defaultsFromEditableParams` maps `paramKey → spec.default` directly (line 25: `out[k] = spec.default`). A second declaration under a different key (e.g. `stableDigitsDateTime`) would create a separate prop, not override `stableDigits`.

**Therefore:** Add `{ kind: "dateTime" }` and `{ kind: "timeStatus" }` to the existing `stableDigits.condition` array. The `default` stays `false` (same as all other kinds in vessel.js). The "default true" behavior for dateTime/timeStatus is implemented widget-side in step 2 above:

```js
const stableDigitsEnabled = isCoordinateVariant
  ? (p.stableDigits === true)        // position: explicit opt-in (default false)
  : (p.stableDigits !== false);       // dateTime/timeStatus: default true, opt-out
```

This way, when a user has never touched the toggle (prop absent → `undefined`), dateTime/timeStatus get `stableDigits !== false → true`, while position kinds get `stableDigits === true → false`.

#### 5. Update `Depends` header

Add `StableDigits` to PositionCoordinateWidget's Depends header if the module is imported. Note: for dateTime/timeStatus, stableDigits only means "use mono font" (no zero-padding needed since time/date formats are already fixed-width). So `StableDigits` module import is NOT required — only the font switch logic is needed.

### Verification

- timeStatus in normal/high modes: status indicator emoji is horizontally centered.
- timeStatus in flat mode: emoji is centered in the inline layout.
- dateTime in all modes: date and time text is center-aligned.
- dateTime/timeStatus with stableDigits=true (default): text renders in Roboto Mono.
- dateTime/timeStatus with stableDigits=false: text renders in Roboto (proportional).
- position variant: unchanged behavior (mono + right-aligned when coordinatesTabular=true).
- `npm run check:all` passes.

---

## Phase 5 — Add stableDigits to HTML widgets (MapZoom, AisTarget, RoutePoints)

### Intent

Enable stableDigits on the three remaining HTML widgets that display numeric values.

### Mandatory preflight

Read these files before any code changes:
- `documentation/TABLEOFCONTENTS.md`
- `documentation/conventions/coding-standards.md`
- `documentation/conventions/smell-prevention.md`
- `documentation/shared/stable-digits.md`
- `documentation/widgets/map-zoom.md`
- `documentation/widgets/ais-target.md`
- `documentation/widgets/route-points.md`

### Context for Codex

Each HTML widget needs three things for stableDigits support:
1. **Render model:** Read `props.stableDigits === true`, use `StableDigits.normalize()` to pad numeric values, expose `stableDigitsEnabled` and `fallbackValue` on the model.
2. **Markup:** Add `dyni-tabular` CSS class to value text spans when `stableDigitsEnabled`.
3. **Fit (if applicable):** Use `tokens.font.familyMono` for value text measurement when `stableDigitsEnabled`. Include `stableDigitsEnabled` in fit cache signature.

Reference implementations:
- `EditRouteRenderModel.js` lines 122, 145–161 (render model pattern)
- `EditRouteMarkup.js` lines 60–63 (markup class toggle)
- `EditRouteHtmlFit.js` lines 202–208, 292 (fit mono font)

### Task A: MapZoomTextHtmlWidget

#### A1. `MapZoomTextHtmlWidget.js` — Add stableDigits to the build model

Import `StableDigits` module:
```js
const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
```

In the model building function, read the prop:
```js
const stableDigitsEnabled = p.stableDigits === true;
```

Pad the zoom value:
```js
const zoomStable = stableDigitsEnabled
  ? stableDigits.normalize(zoomText, {
    integerWidth: stableDigits.resolveIntegerWidth(zoomText, 2),
    reserveSignSlot: false
  })
  : { padded: zoomText, fallback: zoomText };
```

Use `zoomStable.padded` as the display value and `zoomStable.fallback` for the fit fallback path.

Add `stableDigitsEnabled` to the model object.

#### A2. `MapZoomTextHtmlWidget.js` — Add `dyni-tabular` class

In the markup rendering, add `dyni-tabular` to the zoom value span classes when `model.stableDigitsEnabled`:
```js
const valueClasses = ["dyni-map-zoom-value"];
if (model.stableDigitsEnabled) {
  valueClasses.push("dyni-tabular");
}
```

Apply to all three mode markup paths (flat, normal, high).

#### A3. `MapZoomHtmlFit.js` (if it exists) — Mono font for measurement

If a fit module exists, use `tokens.font.familyMono` for value text measurement when stableDigitsEnabled. Include `stableDigitsEnabled` in fit signature.

#### A4. `config/clusters/map.js` — Add zoom to stableDigits condition

Add `{ kind: "zoom" }` to the `stableDigits.condition` array alongside `centerDisplay`.

#### A5. Update `Depends` header

Add `StableDigits` to the MapZoomTextHtmlWidget's Depends header.

### Task B: AisTargetTextHtmlWidget

#### B1. `AisTargetRenderModel.js` — Add stableDigits support

Import `StableDigits`. Read `props.stableDigits === true`. Pad numeric metric values (distance, course, speed) using `stableDigits.normalize()`. Expose `stableDigitsEnabled` and fallback values on the model.

#### B2. `AisTargetTextHtmlWidget.js` (or its markup helper) — Add `dyni-tabular` class

Add `dyni-tabular` class to metric value spans when `stableDigitsEnabled`.

#### B3. Fit measurement — Mono font

If AisTarget has a fit module, use mono font for value measurement. Include `stableDigitsEnabled` in fit signature.

#### B4. `config/clusters/map.js` — Add aisTarget to stableDigits condition

Add `{ kind: "aisTarget" }` to `stableDigits.condition`.

#### B5. Update `Depends` headers.

### Task C: RoutePointsTextHtmlWidget

#### C1. `RoutePointsRenderModel.js` — Add stableDigits support

Import `StableDigits`. Read `props.stableDigits === true`. Pad numeric values in the route point rows (course, distance) using `stableDigits.normalize()`. Expose `stableDigitsEnabled` and fallback values.

**Note:** RoutePoints already uses `dyni-tabular` for `coordinatesTabular` on coordinate text (line 85 of `RoutePointsMarkup.js`). The stableDigits class should be added to the course/distance info text, NOT to the coordinate text (which is already covered by coordinatesTabular).

#### C2. `RoutePointsMarkup.js` — Add `dyni-tabular` to numeric info values

When `stableDigitsEnabled`, add `dyni-tabular` class to the info text spans that display course and distance (not coordinate text).

#### C3. `config/clusters/nav.js` — Add routePoints to stableDigits condition

Add `{ kind: "routePoints" }` to `stableDigits.condition`.

#### C4. Update `Depends` headers.

### Verification

- MapZoom with stableDigits enabled: zoom value in mono, zero-padded.
- AisTarget with stableDigits enabled: metric values in mono, zero-padded.
- RoutePoints with stableDigits enabled: course/distance values in mono, zero-padded; coordinate text still controlled by coordinatesTabular separately.
- All three widgets with stableDigits disabled: proportional font, no padding (existing behavior).
- `npm run check:all` passes.
- Coverage thresholds remain satisfied.

---

## Acceptance criteria (all phases)

- Every widget kind that displays numeric or time values offers a "Stable digits" toggle in the editor.
- dateTime and timeStatus default to stableDigits on.
- Enabling "Stable digits" visually switches value text to Roboto Mono and zero-pads numeric values.
- Disabling "Stable digits" restores proportional font with no padding.
- activeRoute stableDigits: monospace font renders correctly, fit is recalculated on toggle.
- editRoute layout: values do not clip into labels in any display mode.
- editRoute stableDigits: monospace font renders correctly.
- timeStatus indicator emoji is horizontally centered in all display modes.
- dateTime text is center-aligned (not right-aligned).
- position variant behavior is unchanged.
- No file exceeds 400 non-empty lines.
- Every modified file retains its Module/Documentation/Depends header.
- No new smell violations (`npm run check:all` passes).
- Coverage thresholds remain satisfied (`test:coverage:check`).
- PLAN10 perf gates remain satisfied (`perf:check` passes).

---

## Engineering invariants

- **No new modules**: All changes modify existing files. No new shared modules are introduced.
- **Per-widget editables**: stableDigits conditions remain in cluster config files, never in `config/shared/common-editables.js`.
- **ThreeValueTextWidget untouched**: Only config conditions are added for its kinds.
- **Backward-compatible defaults**: stableDigits defaults to `false` everywhere except dateTime and timeStatus (which default to `true`).
- **RoutePoints exemption preserved**: Compound-unit placeholders (`"--kt/--nm"`) in RoutePoints remain exempt from the dash-literal smell contract.

---

## Related

- [PLAN11.md](../completed/PLAN11.md) — Original stableDigits architecture and rollout.
- [PLAN12.md](../completed/PLAN12.md) — Post-PLAN11 regression fixes.
- [../conventions/coding-standards.md](../../documentation/conventions/coding-standards.md)
- [../conventions/smell-prevention.md](../../documentation/conventions/smell-prevention.md)
- [../shared/stable-digits.md](../../documentation/shared/stable-digits.md)
- [../shared/bundled-fonts.md](../../documentation/shared/bundled-fonts.md)
- [../widgets/active-route.md](../../documentation/widgets/active-route.md)
- [../widgets/edit-route.md](../../documentation/widgets/edit-route.md)
- [../widgets/position-coordinates.md](../../documentation/widgets/position-coordinates.md)
- [../widgets/map-zoom.md](../../documentation/widgets/map-zoom.md)
- [../widgets/ais-target.md](../../documentation/widgets/ais-target.md)
- [../widgets/route-points.md](../../documentation/widgets/route-points.md)