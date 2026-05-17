# PLAN26 — Theme tokens for caption and unit opacity

## Status

Ready to implement.

## Goal

Add two new theme tokens — `opacity.caption` and `opacity.unit` — that control the opacity of caption and unit text across all widget families. Today, caption and unit text renders at the same full opacity as the primary value, which gives every text element equal visual weight. These tokens let users de-emphasize secondary labels so the value pops. Both default to `1.0` (no visual change), making this pure opt-in via `user.css`. No preset or night-mode overrides ship with this change.

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

These define the project's coding conventions, header requirements, and quality gates. Follow them exactly.

## Repository findings

### Token system architecture

`runtime/theme/model.js` defines all tokens via `defineToken(path, inputVar, type, defaultValue, defaultByMode, outputVar)`. The resolver reads CSS input vars from the committed root, merges with preset/mode defaults per the 5-layer resolution order, and `applyToRoot()` materializes output vars onto the root element's inline style.

Canvas widgets consume tokens from the JS snapshot returned by `componentContext.theme.tokens.resolveForRoot(rootEl)`. HTML widgets consume tokens from the materialized `--dyni-theme-*` CSS custom properties via `var()`. This means new tokens need output vars if HTML widgets must read them.

### Caption/unit rendering paths — canvas widgets

All canvas rendering of captions and units flows through two shared modules:

**`shared/widget-kits/text/CanvasTextLayout.js`** — four drawing functions:

- `drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx, align, labelWeight, textOptions)` — draws only the caption line.
- `drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit, align, valueWeight, labelWeight, textOptions)` — draws value and unit on one line; the unit draw is a distinct code path inside the function (conditioned on `if (unit) { ... }`).
- `drawInlineCapValUnit(ctx, family, x, y, w, h, caption, value, unit, fit, valueWeight, labelWeight, textOptions)` — draws all three inline; caption and unit draws are distinct conditional blocks.
- `drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes, valueWeight, labelWeight, textOptions)` — draws caption row, value row, unit row sequentially; each is a distinct conditional block.

The `textOptions` parameter (last, optional) is an object currently used only for `{ useMono, monoFamily }` to select monospace rendering for the value. Many call sites do not pass it (it defaults to undefined/null, handled gracefully by `resolveFamily`).

**`shared/widget-kits/text/TextLayoutPrimitives.js`** — one drawing function:

- `drawInlineTriplet(args)` — draws caption + value + unit inline. Takes a flat `args` object with all config. Used by `TextLayoutComposite.drawValueUnitCaptionRows`.

**`shared/widget-kits/text/TextTileLayout.js`** — one metric drawing function:

- `drawMetricTile(cfg)` — calls `textApi.drawCaptionMax(...)` then `textApi.drawValueUnitWithFit(...)`. Used by `XteDisplayWidget` and `ThreeValueTextWidget` through `TextLayoutEngine`.

These are called from orchestrator modules that hold the theme snapshot:

- `SemicircleRadialTextLayout.drawModeText(state, display, fitCache)` — `state.theme` is the resolved token snapshot.
- `FullCircleRadialTextLayout` draw functions — `state.theme` available.
- `LinearGaugeTextLayout.drawCaptionRow/drawValueUnitRow/drawInlineRow(state, textApi, ...)` — `state.theme` available.
- `TextTileLayout.drawMetricTile(cfg)` — `cfg` is built by engines that resolve the theme.
- `TextLayoutComposite.drawValueUnitCaptionRows(args)` — called from `PositionCoordinateWidget` which resolves the theme.

No canvas rendering path currently applies `ctx.globalAlpha` around caption or unit text. The existing `TextTileLayout.drawFittedLine` does use `cfg.alpha` for a different purpose (per-line alpha), establishing the `globalAlpha` save/restore pattern as precedent.

### Caption/unit rendering paths — HTML widgets

Five HTML widgets render captions and/or units via CSS-styled elements:

- `MapZoomTextHtmlWidget` — classes `.dyni-map-zoom-caption` and `.dyni-map-zoom-unit`
- `AisTargetTextHtmlWidget` — classes `.dyni-ais-target-metric-caption` and `.dyni-ais-target-metric-unit`
- `AlarmTextHtmlWidget` — class `.dyni-alarm-caption`
- `ActiveRouteTextHtmlWidget` — classes `.dyni-active-route-metric-caption` and `.dyni-active-route-metric-unit`
- `EditRouteTextHtmlWidget` — class `.dyni-edit-route-metric-unit`

These widgets read theme values from materialized `--dyni-theme-*` output vars on the root element (e.g., `var(--dyni-theme-font-label-weight, 700)`).

### Canvas text widget theme access

- `ThreeValueTextWidget` — calls `componentContext.theme.tokens.resolveForRoot(rootEl)`, passes `tokens` into `TextLayoutEngine`.
- `CenterDisplayTextWidget` — same pattern, builds a `state` object with theme access.
- `PositionCoordinateWidget` — same pattern, threads theme through to `TextLayoutComposite`.
- `XteDisplayWidget` — same pattern, threads theme through to `TextTileLayout`.

## Product decisions already resolved

- Two independent tokens in a new `opacity` namespace: `opacity.caption` and `opacity.unit`.
- Input CSS vars: `--dyni-caption-opacity` and `--dyni-unit-opacity`.
- Output CSS vars: `--dyni-theme-opacity-caption` and `--dyni-theme-opacity-unit` (required for HTML widget consumption).
- Token type: `"number"`.
- Default value: `1.0` for both (fully opaque, opt-in only).
- No preset overrides (no entries in `slim`, `bold`, `darkmode`, `highcontrast`).
- No night-mode overrides (no `defaultByMode` entries).
- All widgets that render caption and/or unit text consume the tokens — radial, linear, canvas text, and HTML text families.
- Values are clamped to `[0, 1]` at the consumption site. Values outside this range are not meaningful for opacity.
- No backward-compatibility concern: the plugin is not published and not in use.

## Implementation

### 1. `runtime/theme/model.js` — add token definitions

Add two entries to the `TOKEN_DEFS` array, after the existing `font.labelWeight` token and before `colors.pointer`:

```javascript
defineToken("opacity.caption", "--dyni-caption-opacity", "number", 1.0, undefined, "--dyni-theme-opacity-caption"),
defineToken("opacity.unit", "--dyni-unit-opacity", "number", 1.0, undefined, "--dyni-theme-opacity-unit"),
```

No entries in `PRESETS`. No `defaultByMode`. The resolver, `applyToRoot`, and snapshot machinery all operate generically over `TOKEN_DEFS` — adding entries here is sufficient for the full pipeline.

### 2. `shared/widget-kits/text/CanvasTextLayout.js` — apply opacity in draw functions

Add a helper at the top of the `create` function:

```javascript
function resolveOpacity(textOptions, key) {
  if (!textOptions || typeof textOptions !== "object") {
    return 1;
  }
  const raw = textOptions[key];
  return typeof raw === "number" && raw >= 0 && raw <= 1 ? raw : 1;
}
```

Modify the four draw functions to apply `ctx.globalAlpha` around caption and unit draw calls. The value draw must not be affected. The pattern for each:

**`drawCaptionMax`** — the entire function draws only a caption. Wrap the draw with:

```javascript
const opacity = resolveOpacity(textOptions, "captionOpacity");
if (opacity < 1) {
  ctx.save();
  ctx.globalAlpha = opacity;
}
// ... existing caption draw code ...
if (opacity < 1) {
  ctx.restore();
}
```

Use the conditional save/restore pattern (only when opacity < 1) to avoid unnecessary canvas state churn on the default path.

**`drawValueUnitWithFit`** — draws value then unit. Wrap only the unit section (`if (unit) { ... }` block at the end of the function, inside the existing `ctx.save()`/`ctx.restore()` pair). The unit draw already happens inside a saved context. Apply `globalAlpha` after the value draw and before the unit draw:

```javascript
if (unit) {
  const unitOpacity = resolveOpacity(textOptions, "unitOpacity");
  if (unitOpacity < 1) {
    ctx.globalAlpha = unitOpacity;
  }
  setFont(ctx, uPx, labelWeight, family);
  ctx.fillText(String(unit), xStart + valueW + gap, yVal + Math.max(0, Math.floor(vPx * 0.08)));
}
```

Since this is already inside a `ctx.save()`/`ctx.restore()` block, the globalAlpha is naturally restored.

**`drawInlineCapValUnit`** — draws caption, value, unit inline inside a single `ctx.save()`/`ctx.restore()` block. Apply `globalAlpha` before the caption draw and reset it before the value draw, then reapply before the unit draw:

```javascript
const capOpacity = resolveOpacity(textOptions, "captionOpacity");
const uniOpacity = resolveOpacity(textOptions, "unitOpacity");

// inside existing ctx.save() block:
if (caption) {
  if (capOpacity < 1) { ctx.globalAlpha = capOpacity; }
  setFont(ctx, data.cPx, labelWeight, family);
  ctx.fillText(String(caption), xStart, yMid);
  if (capOpacity < 1) { ctx.globalAlpha = 1; }
  xStart += measureTextWidth(ctx, caption) + data.g1;
}

// value draw (no opacity change)
setFont(ctx, data.vPx, valueWeight, resolveFamily(family, textOptions));
ctx.fillText(String(value), xStart, yMid);
xStart += measureTextWidth(ctx, value);

if (unit) {
  xStart += data.g2;
  if (uniOpacity < 1) { ctx.globalAlpha = uniOpacity; }
  setFont(ctx, data.uPx, labelWeight, family);
  ctx.fillText(String(unit), xStart, yMid);
}
// existing ctx.restore() handles cleanup
```

**`drawThreeRowsBlock`** — draws caption, value, unit as three sequential rows. Apply `globalAlpha` around caption and unit blocks:

```javascript
const capOpacity = resolveOpacity(textOptions, "captionOpacity");
const uniOpacity = resolveOpacity(textOptions, "unitOpacity");

if (caption) {
  if (capOpacity < 1) { ctx.save(); ctx.globalAlpha = capOpacity; }
  setFont(ctx, cPx, labelWeight, family);
  drawClampedLine(ctx, caption, anchor, yCap, w, mode);
  if (capOpacity < 1) { ctx.restore(); }
}
if (value) {
  setFont(ctx, vPx, valueWeight, resolveFamily(family, textOptions));
  drawClampedLine(ctx, value, anchor, yVal, w, mode);
}
if (unit) {
  if (uniOpacity < 1) { ctx.save(); ctx.globalAlpha = uniOpacity; }
  setFont(ctx, uPx, labelWeight, family);
  drawClampedLine(ctx, unit, anchor, yUni, w, mode);
  if (uniOpacity < 1) { ctx.restore(); }
}
```

### 3. `shared/widget-kits/text/TextLayoutPrimitives.js` — apply opacity in `drawInlineTriplet`

`drawInlineTriplet` takes a flat `args` object. Add `captionOpacity` and `unitOpacity` fields. Apply the same conditional `globalAlpha` pattern:

```javascript
const capOpacity = (typeof cfg.captionOpacity === "number" && cfg.captionOpacity >= 0 && cfg.captionOpacity <= 1) ? cfg.captionOpacity : 1;
const uniOpacity = (typeof cfg.unitOpacity === "number" && cfg.unitOpacity >= 0 && cfg.unitOpacity <= 1) ? cfg.unitOpacity : 1;

if (captionText) {
  if (capOpacity < 1) { ctx.save(); ctx.globalAlpha = capOpacity; }
  primitiveSetFont(ctx, fit.sPx, labelWeight, family);
  ctx.fillText(captionText, xPos, yMid);
  if (capOpacity < 1) { ctx.restore(); }
  xPos += cW + gap;
}
primitiveSetFont(ctx, fit.vPx, valueWeight, family, valueMonoOptions);
ctx.fillText(valueText, xPos, yMid);
xPos += vW;
if (unitText) {
  xPos += gap;
  if (uniOpacity < 1) { ctx.save(); ctx.globalAlpha = uniOpacity; }
  primitiveSetFont(ctx, fit.sPx, labelWeight, family);
  ctx.fillText(unitText, xPos, yMid);
  if (uniOpacity < 1) { ctx.restore(); }
}
```

### 4. Orchestrator modules — thread opacity through to draw functions

Each orchestrator module that calls into `CanvasTextLayout` or `TextLayoutPrimitives` must build a `textOptions` object (or extend the existing one) with `captionOpacity` and `unitOpacity` from the resolved theme snapshot.

**`shared/widget-kits/radial/SemicircleRadialTextLayout.js`**

The `drawModeText(state, display, fitCache)` function calls `text.drawCaptionMax`, `text.drawValueUnitWithFit`, `text.drawInlineCapValUnit`, and `text.drawThreeRowsBlock`. `state.theme` is the resolved snapshot. Build a `textOptions` object early in `drawModeText`:

```javascript
const textOptions = {
  captionOpacity: state.theme.opacity.caption,
  unitOpacity: state.theme.opacity.unit
};
```

If the engine already passes `textOptions` for mono font support, merge the opacity fields into the existing object. Pass `textOptions` as the last argument to each `text.draw*` call. Several of these calls currently omit the `textOptions` parameter — add it.

**`shared/widget-kits/radial/FullCircleRadialTextLayout.js`**

Same pattern. The draw functions (`drawBlock`, `drawSingleCompactCenterRow`, `drawDualCompactRows`, `drawInlineRow`) call `state.text.drawThreeRowsBlock`, `state.text.drawValueUnitWithFit`, `state.text.drawCaptionMax`, `state.text.drawInlineCapValUnit`. Build `textOptions` from `state.theme.opacity` and pass to all draw calls that currently omit it.

**`shared/widget-kits/linear/LinearGaugeTextLayout.js`**

The `drawCaptionRow`, `drawValueUnitRow`, and `drawInlineRow` functions call `textApi.drawCaptionMax`, `textApi.drawValueUnitWithFit`, and `textApi.drawInlineCapValUnit`. `state.theme` is available. Build `textOptions` and pass as the last argument.

**`shared/widget-kits/text/TextTileLayout.js`**

`drawMetricTile(cfg)` calls `textApi.drawCaptionMax(...)` and `textApi.drawValueUnitWithFit(...)`. The `cfg` object is built by widget engines that resolve the theme. Add `captionOpacity` and `unitOpacity` to `cfg`, then build `textOptions` from them and pass to both draw calls.

The callers of `drawMetricTile` — `TextLayoutEngine` (used by `ThreeValueTextWidget` and `XteDisplayWidget`) — must thread `captionOpacity` and `unitOpacity` from the resolved theme into the `cfg` they build. The theme is available at the widget level via `componentContext.theme.tokens.resolveForRoot(rootEl)`.

**`shared/widget-kits/text/TextLayoutComposite.js`**

`drawValueUnitCaptionRows(args)` calls `primitive.drawInlineTriplet(...)`. Thread `captionOpacity` and `unitOpacity` from `args` into the `drawInlineTriplet` call's flat argument object. The caller (`PositionCoordinateWidget`) resolves the theme and must pass the opacity values into `args`.

### 5. Canvas text widgets — thread opacity from theme to engine

**`widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js`**

Resolves tokens via `theme.resolveForRoot(rootEl)`. Pass `tokens.opacity.caption` and `tokens.opacity.unit` into the `TextLayoutEngine` render config so they reach `TextTileLayout.drawMetricTile`.

**`widgets/text/XteDisplayWidget/XteDisplayWidget.js`**

Same pattern — resolves tokens, passes opacity into metric tile config.

**`widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js`**

Builds a `state` object. Add `captionOpacity` and `unitOpacity` from the resolved tokens. Two functions render caption labels via `TextTileLayout.drawFittedLine`: `drawCenterPanel` (draws the position caption) and `drawRelationRows` (draws per-row captions). In both, pass `alpha: captionOpacity` on the `drawFittedLine` calls that render caption text. The existing `cfg.alpha` pattern in `drawFittedLine` is an exact precedent.

**`widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js`**

Resolves tokens, passes opacity into `TextLayoutComposite` call args.

### 6. HTML widget CSS files — consume output vars

For each HTML widget, add `opacity: var(--dyni-theme-opacity-caption, 1);` to caption class rules and `opacity: var(--dyni-theme-opacity-unit, 1);` to unit class rules.

**`widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css`**

Add to `.dyni-html-root .dyni-map-zoom-caption`:
```css
opacity: var(--dyni-theme-opacity-caption, 1);
```

Add to `.dyni-html-root .dyni-map-zoom-unit`:
```css
opacity: var(--dyni-theme-opacity-unit, 1);
```

**`widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css`**

Add to the shared rule `.dyni-html-root .dyni-ais-target-metric-caption`:
```css
opacity: var(--dyni-theme-opacity-caption, 1);
```

Add to `.dyni-html-root .dyni-ais-target-metric-unit`:
```css
opacity: var(--dyni-theme-opacity-unit, 1);
```

**`widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css`**

Add to `.dyni-html-root .dyni-alarm-caption`:
```css
opacity: var(--dyni-theme-opacity-caption, 1);
```

(This widget has no separate unit element.)

**`widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css`**

Add to `.dyni-html-root .dyni-active-route-metric-caption`:
```css
opacity: var(--dyni-theme-opacity-caption, 1);
```

Add to `.dyni-html-root .dyni-active-route-metric-unit`:
```css
opacity: var(--dyni-theme-opacity-unit, 1);
```

**`widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css`**

Add to `.dyni-html-root .dyni-edit-route-metric-unit`:
```css
opacity: var(--dyni-theme-opacity-unit, 1);
```

(This widget has no separate caption element.)

### 7. Tests

#### `tests/runtime/theme-runtime.test.js` — add token resolution tests

Add tests for the new tokens following the existing test patterns:

- **"resolves opacity.caption to default 1.0"**: Set up context, configure theme, resolve for a root element. Assert `snapshot.opacity.caption === 1`.
- **"resolves opacity.unit to default 1.0"**: Same, assert `snapshot.opacity.unit === 1`.
- **"opacity.caption respects root CSS input override"**: Create a root element whose `getComputedStyle` returns `"0.6"` for `--dyni-caption-opacity`. Resolve and assert `snapshot.opacity.caption === 0.6`.
- **"opacity.unit respects root CSS input override"**: Same pattern for `--dyni-unit-opacity`.
- **"applyToRoot materializes --dyni-theme-opacity-caption"**: Configure, call `applyToRoot(rootEl)`, assert `rootEl.style.setProperty` was called with `("--dyni-theme-opacity-caption", "1")`.
- **"applyToRoot materializes --dyni-theme-opacity-unit"**: Same for `--dyni-theme-opacity-unit`.
- **"opacity tokens have no preset overrides"**: For each preset (`slim`, `bold`, `darkmode`, `highcontrast`), configure with that preset, resolve, and assert both opacity values are `1`.
- **"opacity tokens have no night mode override"**: Configure default preset, set night mode, resolve, assert both are `1`.

#### `tests/shared/text/CanvasTextLayout.test.js` — new file: opacity draw tests

Test that `globalAlpha` is set correctly during caption/unit draws. Use the existing mock canvas context pattern:

- **"drawCaptionMax applies captionOpacity via globalAlpha"**: Create a mock `ctx` with `save`, `restore`, `globalAlpha` tracking, `fillText` spy. Call `drawCaptionMax(...)` with `textOptions: { captionOpacity: 0.6 }`. Assert `ctx.globalAlpha` was set to `0.6` before `fillText` was called. Assert `ctx.restore()` was called.
- **"drawCaptionMax does not save/restore when captionOpacity is 1"**: Call with `captionOpacity: 1` or no `textOptions`. Assert `ctx.save()` was not called for opacity purposes (only for any pre-existing saves).
- **"drawValueUnitWithFit applies unitOpacity to unit only"**: Call with a value and unit, `textOptions: { unitOpacity: 0.5 }`. Assert the first `fillText` (value) happened at `globalAlpha = 1` and the second `fillText` (unit) happened at `globalAlpha = 0.5`.
- **"drawThreeRowsBlock applies captionOpacity and unitOpacity independently"**: Call with caption, value, unit, `textOptions: { captionOpacity: 0.7, unitOpacity: 0.5 }`. Assert three `fillText` calls with correct `globalAlpha` bracketing: 0.7 for caption, 1 for value, 0.5 for unit.
- **"drawInlineCapValUnit applies both opacities"**: Same as above for the inline variant.

#### `tests/shared/text/TextLayoutPrimitives.test.js` — new file: opacity test for `drawInlineTriplet`

- **"drawInlineTriplet applies captionOpacity and unitOpacity"**: Call with `captionOpacity: 0.6, unitOpacity: 0.4`. Assert `globalAlpha` transitions: 0.6 → 1 → 0.4 around the three `fillText` calls.

### 8. Documentation

#### `documentation/shared/theme-tokens.md`

**Exposed Semantic Token Paths** section — add:

```
- `opacity.caption`
- `opacity.unit`
```

**Public Input Variables** section — add:

```
- --dyni-caption-opacity
- --dyni-unit-opacity
```

**Materialized Output Variables** section — add:

```
- --dyni-theme-opacity-caption
- --dyni-theme-opacity-unit
```

**Add a new section** after "Geometry Inputs" and before "Alarm Widget Surface Tokens":

```markdown
## Opacity Tokens

| Path | Input var | Default | Use |
|---|---|---|---|
| `opacity.caption` | `--dyni-caption-opacity` | `1.0` | Opacity for caption text in all widget families |
| `opacity.unit` | `--dyni-unit-opacity` | `1.0` | Opacity for unit text in all widget families |

Both tokens default to `1.0` (fully opaque). Set values between `0` and `1` in `user.css` to de-emphasize secondary labels:

```css
.widget.dyniplugin {
  --dyni-caption-opacity: 0.7;
  --dyni-unit-opacity: 0.7;
}
```

No preset or night-mode overrides are defined. These tokens are consumed by canvas widgets via the JS token snapshot (`theme.opacity.caption`, `theme.opacity.unit`) and by HTML widgets via CSS output vars (`var(--dyni-theme-opacity-caption, 1)`, `var(--dyni-theme-opacity-unit, 1)`).
```

### 9. `ROADMAP.md` — remove completed item

Remove the line `- add a theme token for opacity of captions and units` from the "Improvements for the existing widgets" section. If that section becomes empty, remove the section header as well.

### 10. `tests/css/theme-token-extremes.user.css` — add opacity extremes

This file tests extreme token values. Add:

```css
.widget.dyniplugin {
  --dyni-caption-opacity: 0;
  --dyni-unit-opacity: 0;
}
```

This exercises the minimum bound. (The maximum `1.0` is the default and is already tested implicitly.)

## File change summary

| File | Change |
|---|---|
| `runtime/theme/model.js` | 2 new `defineToken` entries |
| `shared/widget-kits/text/CanvasTextLayout.js` | `resolveOpacity` helper + globalAlpha wrapping in 4 draw functions |
| `shared/widget-kits/text/TextLayoutPrimitives.js` | globalAlpha wrapping in `drawInlineTriplet` |
| `shared/widget-kits/text/TextTileLayout.js` | Thread opacity from cfg to textOptions in `drawMetricTile` |
| `shared/widget-kits/text/TextLayoutComposite.js` | Thread opacity from args to `drawInlineTriplet` |
| `shared/widget-kits/radial/SemicircleRadialTextLayout.js` | Build textOptions with opacity, pass to draw calls |
| `shared/widget-kits/radial/FullCircleRadialTextLayout.js` | Build textOptions with opacity, pass to draw calls |
| `shared/widget-kits/linear/LinearGaugeTextLayout.js` | Build textOptions with opacity, pass to draw calls |
| `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js` | Thread opacity from tokens to engine config |
| `widgets/text/XteDisplayWidget/XteDisplayWidget.js` | Thread opacity from tokens to metric tile config |
| `widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js` | Thread opacity from tokens to draw config |
| `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | Thread opacity from tokens to composite args |
| `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css` | Add opacity to caption and unit rules |
| `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css` | Add opacity to caption and unit rules |
| `widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css` | Add opacity to caption rule |
| `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css` | Add opacity to caption and unit rules |
| `widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css` | Add opacity to unit rule |
| `tests/runtime/theme-runtime.test.js` | 8 new tests for token resolution, output, presets, modes |
| `tests/shared/text/CanvasTextLayout.test.js` | New file: 5 tests for globalAlpha behavior |
| `tests/shared/text/TextLayoutPrimitives.test.js` | New file: 1 test for drawInlineTriplet opacity |
| `tests/css/theme-token-extremes.user.css` | 2 new opacity extreme entries |
| `documentation/shared/theme-tokens.md` | New Opacity Tokens section + list updates |
| `ROADMAP.md` | Remove completed roadmap item |

## Completion Gate

After implementation, run:

```bash
npm run check:all
```

This runs `check:core` (coding standards, smells, docs, file sizes, headers, dependencies, UMD, naming), `test:coverage:check` (all tests + coverage thresholds), and `perf:check`. All must pass.
