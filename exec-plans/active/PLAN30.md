# PLAN30 — Theme Token Hierarchy: Global Defaults, Cascade, Naming, and Documentation Rework

## Status

Plan ready to implement. Verified against repository state at v3.2.0.

## Goal

After PLAN30 is complete:

1. Theme tokens follow a clear **two-level hierarchy**: a small set of global tokens at the top, and scoped (widget-specific) tokens that inherit from their global parent unless explicitly overridden. A user who sets `--dyni-alarm` to a custom color automatically changes all danger-red accents across AIS warnings and regatta critical bars — without touching any scoped token.

2. Two new global semantic color tokens exist: `--dyni-ok` (safe/green family, default `#70F3AF`) and `--dyni-info` (neutral/blue family, default `#70B0F3`). They participate in the same resolution cascade as all other tokens (root CSS override → preset mode → preset base → mode default → base default).

3. Scoped tokens that share their default value with a global token cascade from that global through a new `defaultFrom` field on the token definition. When a scoped token has no explicit value at any resolution level, the resolver resolves the parent global token's value (after mode/preset resolution) and uses that instead of a hardcoded default. This cascade is transparent: the shipped visual appearance does not change because all cascading pairs already have identical values today.

4. The five scoped tokens whose default values intentionally differ from any global (`--dyni-alarm-widget-bg`, `--dyni-alarm-widget-fg`, `--dyni-regatta-bar-warning`, `--dyni-ais-tracking`, `--dyni-ais-normal`) retain their own independent defaults with no cascade parent. The two layline tokens (`--dyni-layline-stb`, `--dyni-layline-port`) also remain independent.

5. Three regatta input vars are renamed from camelCase to kebab-case for naming consistency: `--dyni-regatta-barWarning` → `--dyni-regatta-bar-warning`, `--dyni-regatta-barCritical` → `--dyni-regatta-bar-critical`, `--dyni-regatta-barDefault` → `--dyni-regatta-bar-default`. The corresponding output vars are also updated to match. The old camelCase input var names are retained as **deprecation aliases**: if a user's `user.css` sets `--dyni-regatta-barWarning`, the resolver still reads it as a fallback and logs a console warning. The aliases will be removed in a future major version.

6. Preset definitions in `model.js` are simplified: scoped tokens whose values match their global parent within a given preset/mode layer are removed from that layer, relying on the cascade instead. This reduces duplication and makes presets easier to maintain.

7. All internal documentation is updated: `documentation/shared/theme-tokens.md` is restructured around the two-level hierarchy with a clear cascade reference table; `documentation/shared/css-theming.md` is updated for renamed vars and cascade semantics; widget-specific docs (`alarm.md`, `regatta-timer.md`) are updated for renamed token references.

8. The `README.md` theming section is rewritten to clearly present the global/scoped hierarchy, show which tokens exist, explain the cascade, document the renamed regatta vars, and provide `user.css` recipes.

9. `documentation/TABLEOFCONTENTS.md` is updated if any new doc files are added (none expected — existing files are updated in place).

10. All existing tests pass. New tests cover cascade resolution (scoped token inherits from global when no explicit value exists; scoped token overrides global when explicitly set; cascade works correctly in night mode and across presets). Modified tests account for renamed regatta token paths and vars.

---

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/shared/theme-tokens.md`
5. `documentation/shared/css-theming.md`
6. `documentation/widgets/alarm.md`
7. `documentation/widgets/regatta-timer.md`
8. `documentation/widgets/ais-target.md`
9. `documentation/conventions/testing-infrastructure.md`
10. `documentation/guides/documentation-maintenance.md`

---

## Product Decisions Resolved During Scoping

| Decision | Resolution | Rationale |
|---|---|---|
| Inheritance depth | Two levels: global → scoped | Only ~4 widget families consume semantic colors; a middle tier adds complexity without user benefit at this scale |
| Global semantic color set | `pointer`, `warning`, `alarm`, `ok` (new), `info` (new) | These are the five natural semantic roles reused across widgets; other colors are context-specific |
| Cascade scope | Only where current default values are already identical between parent and child | Avoids visual regression; tokens with intentionally different values stay independent |
| `alarm-widget-bg` cascade | Independent, no global parent | Darker shade (`#C73A32` vs `#FA584A`) is intentional for white-on-red readability |
| `regatta-bar-warning` cascade | Independent, no global parent | Amber (`#e7a834`) is intentionally different from warning yellow (`#e7c66a`) |
| Naming convention fix | Rename only the three regatta camelCase vars to kebab-case; old names kept as deprecation aliases with console warning | Only casing inconsistency in the token set; all other vars already use kebab-case. Aliases prevent silent breakage for existing `user.css` files |
| Naming convention documentation | Document the existing convention: color tokens omit `-color`, number tokens include their unit (`-weight`, `-opacity`, `-factor`) | Convention is consistent but was never written down; prevents future naming drift |
| JS token path rename | No — JS paths stay camelCase (`colors.regatta.barWarning`); only CSS input/output var strings change to kebab-case | JS object paths use camelCase by convention. The CSS vars `--dyni-regatta-barWarning` / `--dyni-theme-regatta-barWarning` change to kebab-case; the JS paths are unaffected. |
| User-facing documentation location | README.md theming section (no separate guide file) | User preference: single source of truth in README |
| Geometry token hierarchy | No changes — radial.\* and linear.\* stay as-is | Family-scoped geometry factors have different defaults between families; a shared global parent would be artificial |

---

## Verified Baseline (Repository-Verified Facts)

### Token definitions

1. `runtime/theme/model.js` defines 47 tokens via `defineToken(path, inputVar, type, default, defaultByMode, outputVar)`.
2. 12 tokens have output vars (`--dyni-theme-*`): `surface.fg`, `surface.bg`, `surface.border`, `font.family`, `font.familyMono`, `font.weight`, `font.labelWeight`, `opacity.caption`, `opacity.unit`, `colors.regatta.barWarning`, `colors.regatta.barCritical`, `colors.regatta.barDefault`.
3. Token definition has no `defaultFrom` or cascade parent field today.
4. `defineToken` signature: `(path, inputVar, type, defaultValue, defaultByMode, outputVar)`.

### Cascade value identity verification

5. `colors.alarm` day `#FA584A` = `colors.ais.warning` day `#FA584A` — identical.
6. `colors.alarm` night `rgba(250, 88, 74, 0.60)` = `colors.ais.warning` night `rgba(250, 88, 74, 0.60)` — identical.
7. `colors.alarm` day `#FA584A` = `colors.regatta.barCritical` day `#FA584A` — identical.
8. `colors.alarm` night `rgba(250, 88, 74, 0.60)` = `colors.regatta.barCritical` night `rgba(250, 88, 74, 0.60)` — identical.
9. `colors.ais.nearest` day `#70F3AF` = `colors.alarmWidget.strip` day `#70F3AF` — identical.
10. `colors.ais.nearest` night `rgba(112, 243, 175, 0.60)` = `colors.alarmWidget.strip` night `rgba(112, 243, 175, 0.60)` — identical.
11. `colors.regatta.barDefault` day `#70B0F3` and night `rgba(112, 176, 243, 0.60)` — unique to this token, no existing global matches.

### Cascade value identity in presets

12. `highcontrast.base`: `alarm` = `#FF3300`, `ais.warning` = `#FF3300`, `regatta.barCritical` = `#FF3300` — all identical.
13. `highcontrast.base`: `alarmWidget.strip` = `#00AA66`, `ais.nearest` = `#00AA66` — identical.
14. `highcontrast.base`: `regatta.barDefault` = `#00AAFF` — unique, will cascade from new `colors.info` highcontrast value.
15. `highcontrast.night`: `alarm` = `rgba(250, 88, 74, 0.60)`, `ais.warning` = `rgba(250, 88, 74, 0.60)`, `regatta.barCritical` = `rgba(250, 88, 74, 0.60)` — all identical.
16. `highcontrast.night`: `alarmWidget.strip` = `rgba(112, 243, 175, 0.60)`, `ais.nearest` = `rgba(112, 243, 175, 0.60)` — identical.
17. `darkmode.base` repeats the same day-default values as the global base defaults for all semantic color tokens.
18. `darkmode.night` repeats the same night values as the `default.night` preset.

### Independent tokens (no cascade parent)

19. `colors.alarmWidget.bg` day `#C73A32` ≠ `colors.alarm` day `#FA584A` — intentionally darker.
20. `colors.alarmWidget.fg` day `#ffffff` — surface color, no semantic global parent.
21. `colors.regatta.barWarning` day `#e7a834` ≠ `colors.warning` day `#e7c66a` — intentionally different amber.
22. `colors.ais.tracking` day `#f8a601` — unique orange, no global parent.
23. `colors.ais.normal` day `#EBEB55` — unique yellow, no global parent.
24. `colors.laylineStb` day `#82b683` — domain-specific starboard green.
25. `colors.laylinePort` day `#ff7a76` — domain-specific port red.

### Resolver

26. `runtime/theme/resolver.js` resolves tokens via `resolveTokenValue()` with cascade: root CSS input override → preset mode → preset base → mode default → base default.
27. `resolveTokenValue()` returns `tokenDef.default` as the final fallback — no parent resolution step exists.
28. The resolver uses `createTokenMetadata()` to pre-compute path segments and input var lists.

### CSS consumers

29. `plugin.css` consumes output vars: `--dyni-theme-surface-fg`, `--dyni-theme-surface-bg`, `--dyni-theme-surface-border`, `--dyni-theme-font-family`, `--dyni-theme-font-family-mono`, `--dyni-theme-font-label-weight`.
30. `RegattaTimerTextHtmlWidget.css` consumes: `var(--dyni-theme-regatta-barDefault, #70B0F3)`, `var(--dyni-theme-regatta-barWarning, #e7a834)`, `var(--dyni-theme-regatta-barCritical, #FA584A)` — 6 occurrences across bar background and time color rules.

### JS consumers

31. All gauge widgets (radial and linear) consume `theme.colors.warning` and `theme.colors.alarm` for sector band colors.
32. Wind radial consumes `theme.colors.pointer`, `theme.colors.laylineStb`, `theme.colors.laylinePort`.
33. XTE widgets consume `theme.colors.pointer` and `theme.colors.alarm`.
34. Compass radial consumes `theme.colors.pointer`.
35. `AlarmHtmlFit.js` consumes `theme.colors.alarmWidget.bg`, `.fg`, `.strip`.
36. `AisTargetHtmlFit.js` consumes `theme.colors.ais[colorRole]` where colorRole is one of `warning`, `nearest`, `tracking`, `normal`.

### Presets

37. Five presets exist: `default`, `slim`, `bold`, `darkmode`, `highcontrast`.
38. `slim` and `bold` presets define only geometry weights — no color overrides.
39. `default` preset has empty `base` and a `night` object with all color overrides.
40. `darkmode` preset defines `base` and `night` with full color sets.
41. `highcontrast` preset defines `base` and `night` with full color sets and geometry weights.

### Documentation

42. `documentation/shared/theme-tokens.md` lists token paths, input vars, output vars, geometry, opacity, alarm, AIS, and regatta sections separately without a hierarchy overview.
43. `documentation/shared/css-theming.md` describes input/output flow, root consumer rule, shadow CSS rule, and preset ingestion.
44. `documentation/widgets/regatta-timer.md` has a token table referencing `--dyni-theme-regatta-barWarning`, `barCritical`, `barDefault`.
45. `documentation/widgets/alarm.md` references `--dyni-alarm-widget-bg`, `--dyni-alarm-widget-fg`, `--dyni-alarm-widget-strip`.
46. `README.md` theming section lists all 30+ input vars in a flat table without hierarchy or cascade information.

### Tests

47. `tests/runtime/theme-runtime.test.js` tests token resolution across presets and modes. References `colors.regatta.barWarning`, `.barCritical`, `.barDefault` in 6 test blocks. References output vars `--dyni-theme-regatta-barWarning`, `barCritical`, `barDefault` in 1 test block.
48. `tests/css/plugin-css.test.js` exists but does not reference regatta output vars.

### Negative facts

49. No `colors.ok` token exists anywhere in the repository.
50. No `colors.info` token exists anywhere in the repository.
51. No `--dyni-ok` or `--dyni-info` CSS variable exists anywhere in the repository.
52. No `defaultFrom` field or cascade-parent mechanism exists in the token definition system.
53. No kebab-case `bar-warning`, `bar-critical`, or `bar-default` strings exist in token definitions.

---

## Hard Constraints

1. **No visual regression.** The shipped appearance of every widget in every preset/mode combination must remain pixel-identical after this change. All cascading token pairs have verified-identical values today (facts 5–18).
2. **No changes to widget renderer files.** Widgets consume tokens via JS snapshot paths (`theme.colors.*`) — these paths are unchanged. The cascade is invisible to consumers.
3. **No changes to `resolver.js` resolution order for explicit values.** The existing five-level cascade (root override → preset mode → preset base → mode default → base default) remains intact. The parent cascade is a new sixth step that fires only when the first five produce no value.
4. **No changes to geometry tokens.** Radial and linear family factors are untouched.
5. **No changes to `plugin.css`.** The root consumer rules are unaffected (they consume output vars, not input vars).
6. **No new doc files.** Existing documentation files are updated in place. README stays the single user-facing theming reference.
7. **JS token paths remain camelCase.** `colors.regatta.barWarning` stays as-is in JS — only the CSS input/output var strings change to kebab-case. Widget JS code consuming `theme.colors.regatta.barWarning` is unaffected.

---

## Complete Token Hierarchy Reference

### Tier 1 — Global Tokens

These are the top-level defaults. Changing a global token cascades to all scoped tokens that inherit from it (unless those scoped tokens are explicitly overridden).

**Surface:**

| Path | Input var | Type | Default | Night |
|---|---|---|---|---|
| `surface.fg` | `--dyni-fg` | color | `black` | `rgba(252, 11, 11, 0.60)` |
| `surface.bg` | `--dyni-bg` | color | `white` | `black` |
| `surface.border` | `--dyni-border` | color | *(derives from resolved `surface.fg`)* | *(derives from resolved `surface.fg`)* |

**Typography:**

| Path | Input var | Type | Default |
|---|---|---|---|
| `font.family` | `--dyni-font` | string | `"Roboto",...` (full stack) |
| `font.familyMono` | `--dyni-font-mono` | string | `"Roboto Mono",...` (full stack) |
| `font.weight` | `--dyni-font-weight` | number | `700` |
| `font.labelWeight` | `--dyni-label-weight` | number | `700` |

**Opacity:**

| Path | Input var | Type | Default |
|---|---|---|---|
| `opacity.caption` | `--dyni-caption-opacity` | number | `1.0` |
| `opacity.unit` | `--dyni-unit-opacity` | number | `1.0` |

**Semantic colors:**

| Path | Input var | Type | Default | Night |
|---|---|---|---|---|
| `colors.pointer` | `--dyni-pointer` | color | `#ff2b2b` | `#cc2222` |
| `colors.warning` | `--dyni-warning` | color | `#e7c66a` | `#8b6914` |
| `colors.alarm` | `--dyni-alarm` | color | `#FA584A` | `rgba(250, 88, 74, 0.60)` |
| `colors.ok` | `--dyni-ok` | color | `#70F3AF` | `rgba(112, 243, 175, 0.60)` |
| `colors.info` | `--dyni-info` | color | `#70B0F3` | `rgba(112, 176, 243, 0.60)` |

**Geometry weights:**

| Path | Input var | Type | Default |
|---|---|---|---|
| `strokeWeight` | `--dyni-stroke-weight` | number | `1.0` |
| `pointerDepthWeight` | `--dyni-pointer-depth-weight` | number | `1.0` |
| `pointerSideWeight` | `--dyni-pointer-side-weight` | number | `1.0` |

### Tier 2 — Scoped Tokens

**Scoped tokens with cascade parent** (inherit from global when not explicitly set):

| Path | Input var | Cascade parent | Default (= parent default) |
|---|---|---|---|
| `colors.ais.warning` | `--dyni-ais-warning` | `colors.alarm` | `#FA584A` |
| `colors.regatta.barCritical` | `--dyni-regatta-bar-critical` | `colors.alarm` | `#FA584A` |
| `colors.ais.nearest` | `--dyni-ais-nearest` | `colors.ok` | `#70F3AF` |
| `colors.alarmWidget.strip` | `--dyni-alarm-widget-strip` | `colors.ok` | `#70F3AF` |
| `colors.regatta.barDefault` | `--dyni-regatta-bar-default` | `colors.info` | `#70B0F3` |

**Scoped tokens without cascade parent** (own independent defaults):

| Path | Input var | Default | Night |
|---|---|---|---|
| `colors.alarmWidget.bg` | `--dyni-alarm-widget-bg` | `#C73A32` | `rgba(199, 58, 50, 0.60)` |
| `colors.alarmWidget.fg` | `--dyni-alarm-widget-fg` | `#ffffff` | `#ffffff` |
| `colors.regatta.barWarning` | `--dyni-regatta-bar-warning` | `#e7a834` | `rgba(231, 168, 52, 0.60)` |
| `colors.ais.tracking` | `--dyni-ais-tracking` | `#f8a601` | `rgba(248, 166, 1, 0.60)` |
| `colors.ais.normal` | `--dyni-ais-normal` | `#EBEB55` | `rgba(235, 235, 85, 0.60)` |
| `colors.laylineStb` | `--dyni-layline-stb` | `#82b683` | `#3d6b3d` |
| `colors.laylinePort` | `--dyni-layline-port` | `#ff7a76` | `#8b3333` |

### Tier 2 — Family-Scoped Geometry (unchanged)

Radial and linear geometry factors remain as-is. No hierarchy changes. See existing `theme-tokens.md` for the full list.

---

## Cascade Resolution Order (Updated)

Per token path, the resolver tries these sources in order and returns the first defined value:

1. **Root CSS input override** — explicit `--dyni-*` value on the committed `.widget.dyniplugin` root (from `user.css` or inline style). If the primary input var has no value and the token has a `deprecatedInputVar`, the deprecated name is checked as a fallback (with a console warning).
2. **Preset mode override** — active preset's mode layer (e.g. `highcontrast.night.colors.alarm`)
3. **Preset base override** — active preset's base layer (e.g. `highcontrast.base.colors.alarm`)
4. **Global mode default** — token definition's `defaultByMode[mode]` value
5. **Global base default** — token definition's `default` value
6. **Parent cascade** *(new)* — if the token has a `defaultFrom` parent path, resolve the parent token through steps 1–5 (recursively) and return that value

For tokens without a `defaultFrom` field, step 6 is skipped and step 5 is the final fallback.

For tokens with `defaultFrom`, the `default` and `defaultByMode` fields on the scoped token definition are removed (set to `undefined`). The parent's resolved value serves as the default. This means: in night mode, a scoped token with `defaultFrom: "colors.alarm"` gets the resolved alarm night value (`rgba(250, 88, 74, 0.60)`) — not a hardcoded scoped night default.

---

## Implementation Order

### Phase 1: Token Model — New Globals, `defaultFrom`, Rename

**Intent:** Extend the token definition schema with the `defaultFrom` cascade field, add the two new global tokens, rename the three regatta CSS var strings, and wire the cascade parent references.

**Dependencies:** None.

**Deliverables:**

1. `runtime/theme/model.js` — Extend `defineToken` with optional 7th parameter `defaultFrom` and optional 8th parameter `deprecatedInputVar`:

   ```javascript
   function defineToken(path, inputVar, type, defaultValue, defaultByMode, outputVar, defaultFrom, deprecatedInputVar) {
     return {
       path: path,
       inputVar: inputVar,
       type: type,
       default: defaultValue,
       defaultByMode: defaultByMode || undefined,
       outputVar: outputVar || undefined,
       defaultFrom: defaultFrom || undefined,
       deprecatedInputVar: deprecatedInputVar || undefined
     };
   }
   ```

2. `runtime/theme/model.js` — Add two new global token definitions after `colors.alarm`:

   ```javascript
   defineToken("colors.ok", "--dyni-ok", "color", "#70F3AF", { night: "rgba(112, 243, 175, 0.60)" }),
   defineToken("colors.info", "--dyni-info", "color", "#70B0F3", { night: "rgba(112, 176, 243, 0.60)" }),
   ```

3. `runtime/theme/model.js` — Update cascading scoped tokens to use `defaultFrom` and remove their own `default`/`defaultByMode`:

   ```javascript
   defineToken("colors.ais.warning", "--dyni-ais-warning", "color", undefined, undefined, undefined, "colors.alarm"),
   defineToken("colors.ais.nearest", "--dyni-ais-nearest", "color", undefined, undefined, undefined, "colors.ok"),
   defineToken("colors.alarmWidget.strip", "--dyni-alarm-widget-strip", "color", undefined, undefined, undefined, "colors.ok"),
   defineToken("colors.regatta.barCritical", "--dyni-regatta-bar-critical", "color", undefined, undefined, undefined, "colors.alarm", "--dyni-regatta-barCritical"),
   defineToken("colors.regatta.barDefault", "--dyni-regatta-bar-default", "color", undefined, undefined, undefined, "colors.info", "--dyni-regatta-barDefault"),
   ```

   Note: `barCritical` and `barDefault` also get renamed input vars (kebab-case). Output vars change too:
   - `--dyni-theme-regatta-barWarning` → `--dyni-theme-regatta-bar-warning`
   - `--dyni-theme-regatta-barCritical` → `--dyni-theme-regatta-bar-critical`
   - `--dyni-theme-regatta-barDefault` → `--dyni-theme-regatta-bar-default`

4. `runtime/theme/model.js` — Rename `barWarning` input/output vars (no cascade parent, stays independent). Old input var kept as deprecation alias:

   ```javascript
   defineToken(
     "colors.regatta.barWarning",
     "--dyni-regatta-bar-warning",
     "color",
     "#e7a834",
     { night: "rgba(231, 168, 52, 0.60)" },
     "--dyni-theme-regatta-bar-warning",
     undefined,
     "--dyni-regatta-barWarning"
   ),
   ```

5. `runtime/theme/model.js` — Update `buildBaseDefaults()` to skip tokens where `def.default` is `undefined` (cascading tokens have no base default — they resolve via parent).

6. `runtime/theme/model.js` — Update `buildModeDefaults(mode)` to skip tokens where `def.defaultByMode` is `undefined`.

6b. `runtime/theme/model.js` — Add `"parentCascade"` to the `MERGE_ORDER` constant so it reflects the new 6-step resolution order.

7. `runtime/theme/model.js` — Simplify preset definitions. Remove scoped token entries from preset layers where the value matches the global parent in that same layer. For example, in `highcontrast.base`:

   Before:
   ```javascript
   colors: {
     alarm: "#FF3300",
     ais: { warning: "#FF3300", nearest: "#00AA66", ... },
     regatta: { barCritical: "#FF3300", barDefault: "#00AAFF", ... }
   }
   ```

   After:
   ```javascript
   colors: {
     alarm: "#FF3300",
     ok: "#00AA66",
     info: "#00AAFF",
     ais: { tracking: "#CC6600", normal: "#8A7300" },
     regatta: { barWarning: "#ffcc00" }
   }
   ```

   The removed entries (`ais.warning`, `ais.nearest`, `alarmWidget.strip`, `regatta.barCritical`, `regatta.barDefault`) cascade from their global parents (`alarm`, `ok`, `info`) which are defined in the same preset layer.

   **Critical: night layers must include `ok` and `info` wherever the base layer defines them.** Because preset base (step 3) takes priority over global mode default (step 4), a preset that defines `ok: "#00AA66"` in its base layer would return that day value even in night mode unless the night layer also defines `ok`. Without this, cascading tokens like `ais.nearest` regress to day colors at night.

   Night-layer additions required:

   - `default.night`: add `ok: "rgba(112, 243, 175, 0.60)"`, `info: "rgba(112, 176, 243, 0.60)"` (matches existing scoped night values being removed)
   - `highcontrast.night`: add `ok: "rgba(112, 243, 175, 0.60)"`, `info: "rgba(112, 176, 243, 0.60)"`
   - `darkmode.base`: add `ok: "#70F3AF"`, `info: "#70B0F3"` (day values matching removed scoped tokens)
   - `darkmode.night`: add `ok: "rgba(112, 243, 175, 0.60)"`, `info: "rgba(112, 176, 243, 0.60)"`

   Apply the same simplification to all presets (`default`, `darkmode`, `highcontrast`) in both `base` and `night` layers.

8. `runtime/theme/model.js` — Add a `getTokenDefinitionByPath` lookup function (or reuse existing `TOKEN_DEF_BY_PATH`) and expose it on the model API for the resolver to look up parent tokens.

**Exit condition:** `model.js` parses without errors. `buildBaseDefaults()` and `buildModeDefaults()` produce correct objects (verified by existing tests after Phase 3 updates). The new tokens appear in `getTokenDefinitions()`. Cascading tokens have `defaultFrom` set and `default`/`defaultByMode` set to `undefined`.

---

### Phase 2: Resolver — Parent Cascade Step

**Intent:** Extend the resolver's `resolveTokenValue()` to implement the `defaultFrom` cascade as step 6 in the resolution order.

**Dependencies:** Phase 1.

**Deliverables:**

1. `runtime/theme/resolver.js` — Update `readTokenInputOverride()` to check `deprecatedInputVar` as a fallback when the primary input var has no value:

   ```javascript
   function readTokenInputOverride(style, tokenDef, inputReader) {
     const raw = inputReader(style, tokenDef.inputVar);
     if (raw) {
       return parseOverride(raw, tokenDef);
     }
     // Deprecation alias fallback
     if (tokenDef.deprecatedInputVar) {
       const deprecatedRaw = inputReader(style, tokenDef.deprecatedInputVar);
       if (deprecatedRaw) {
         logDeprecationWarning(tokenDef.deprecatedInputVar, tokenDef.inputVar);
         return parseOverride(deprecatedRaw, tokenDef);
       }
     }
     return { hasValue: false, value: tokenDef.default };
   }
   ```

   The `logDeprecationWarning` helper logs once per deprecated var name (deduplicated via a `Set`) to avoid flooding the console:

   ```javascript
   const warnedDeprecations = new Set();
   function logDeprecationWarning(oldVar, newVar) {
     if (warnedDeprecations.has(oldVar)) return;
     warnedDeprecations.add(oldVar);
     console.warn("DyniPlugin: CSS variable " + oldVar + " is deprecated. Use " + newVar + " instead.");
   }
   ```

2. `runtime/theme/resolver.js` — Update `resolveTokenValue()` to handle the parent cascade:

   ```javascript
   function resolveTokenValue(tokenDef, pathSegments, context) {
     // Steps 1-4 unchanged: root override, preset mode, preset base, mode default
     const rootOverride = readTokenInputOverride(context.style, tokenDef, context.inputReader);
     if (rootOverride.hasValue) return rootOverride.value;

     const presetModeValue = getByPath(context.presetMode, pathSegments);
     if (typeof presetModeValue !== "undefined") return presetModeValue;

     const presetBaseValue = getByPath(context.presetBase, pathSegments);
     if (typeof presetBaseValue !== "undefined") return presetBaseValue;

     const modeDefault = tokenDef.defaultByMode && ...
     if (typeof modeDefault !== "undefined") return modeDefault;

     // Step 5: own base default
     if (typeof tokenDef.default !== "undefined") return tokenDef.default;

     // Step 6 (new): parent cascade
     if (tokenDef.defaultFrom) {
       const parentDef = model.getTokenDefinition(tokenDef.defaultFrom);
       if (parentDef) {
         return resolveTokenValue(parentDef, parentDef.path.split("."), context);
       }
     }

     return undefined;
   }
   ```

3. The recursive call is safe because the hierarchy is exactly two levels deep (no grandparent chains) and global tokens always have a `default` value, so recursion terminates at step 5.

4. `runtime/theme/resolver.js` — The resolver already receives the model via `createThemeResolver(themeModel, options)`. The model's `getTokenDefinition(path)` method (fact 26, existing) provides parent lookup.

5. Pre-compute parent token path segments in `createTokenMetadata()` to avoid repeated `split(".")` calls during resolution. Store `parentPathSegments` alongside `pathSegments` for tokens with `defaultFrom`. Also add `deprecatedInputVar` values to the `inputVars` list so they are included in the inline input signature for cache invalidation.

**Exit condition:** Resolver resolves all tokens correctly. Cascading tokens produce the same values as before (verified by Phase 3 tests). Setting a deprecated input var on the root element resolves the token correctly and logs a console warning.

---

### Phase 3: CSS Updates

**Intent:** Update the regatta timer shadow CSS to use the renamed output var strings.

**Dependencies:** Phase 1.

**Deliverables:**

1. `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css` — Replace all 6 occurrences:

   | Old | New |
   |---|---|
   | `var(--dyni-theme-regatta-barDefault, #70B0F3)` | `var(--dyni-theme-regatta-bar-default, #70B0F3)` |
   | `var(--dyni-theme-regatta-barWarning, #e7a834)` | `var(--dyni-theme-regatta-bar-warning, #e7a834)` |
   | `var(--dyni-theme-regatta-barCritical, #FA584A)` | `var(--dyni-theme-regatta-bar-critical, #FA584A)` |

**Exit condition:** CSS file contains zero camelCase regatta output var references. `grep -c "barWarning\|barCritical\|barDefault" RegattaTimerTextHtmlWidget.css` returns `0`.

---

### Phase 4: Tests

**Intent:** Update existing tests for renamed vars and add new tests for cascade behavior and new global tokens.

**Dependencies:** Phases 1, 2, 3.

**Deliverables:**

1. `tests/runtime/theme-runtime.test.js` — Update all references to regatta token paths in JS assertions. The JS paths remain `colors.regatta.barWarning` etc. (camelCase in JS). No changes needed for JS path assertions.

2. `tests/runtime/theme-runtime.test.js` — Update the output var assertion block: `--dyni-theme-regatta-barWarning` → `--dyni-theme-regatta-bar-warning` (and likewise for `barCritical`, `barDefault`).

3. `tests/runtime/theme-runtime.test.js` — Add test cases for new global tokens:

   - `colors.ok` resolves to `#70F3AF` in day mode (default preset)
   - `colors.ok` resolves to `rgba(112, 243, 175, 0.60)` in night mode (default preset)
   - `colors.info` resolves to `#70B0F3` in day mode (default preset)
   - `colors.info` resolves to `rgba(112, 176, 243, 0.60)` in night mode (default preset)
   - `colors.ok` resolves to `#00AA66` in day mode (highcontrast preset)
   - `colors.info` resolves to `#00AAFF` in day mode (highcontrast preset)

4. `tests/runtime/theme-runtime.test.js` — Add cascade behavior tests:

   - **Cascade default**: `colors.ais.warning` resolves to same value as `colors.alarm` when no explicit override exists (day and night, default preset)
   - **Cascade with parent override**: set `--dyni-alarm` as root CSS input override to `#00ff00` → verify `colors.ais.warning` resolves to `#00ff00`
   - **Cascade with scoped override**: set `--dyni-ais-warning` as root CSS input override to `#0000ff` → verify `colors.ais.warning` resolves to `#0000ff` (scoped wins over cascade)
   - **Cascade in preset**: verify `colors.ais.warning` = `colors.alarm` = `#FF3300` in highcontrast day
   - **Cascade ok→nearest**: verify `colors.ais.nearest` = `colors.ok` = `#70F3AF` in default day
   - **Cascade ok→strip**: verify `colors.alarmWidget.strip` = `colors.ok` = `#70F3AF` in default day
   - **Cascade info→barDefault**: verify `colors.regatta.barDefault` = `colors.info` = `#70B0F3` in default day
   - **No cascade for independent tokens**: verify `colors.alarmWidget.bg` = `#C73A32` (unchanged, no parent)

5. `tests/runtime/theme-runtime.test.js` — Add input var rename test: verify that setting `--dyni-regatta-bar-warning` (kebab-case) on root element overrides the resolved value of `colors.regatta.barWarning`.

6. `tests/runtime/theme-runtime.test.js` — Add deprecation alias tests:

   - **Alias resolves**: set `--dyni-regatta-barWarning` (old camelCase) on root element → verify `colors.regatta.barWarning` resolves to the overridden value
   - **New name wins over alias**: set both `--dyni-regatta-bar-warning` and `--dyni-regatta-barWarning` on root → verify the new kebab-case value wins
   - **Alias warns**: verify `console.warn` is called with a message containing the old and new var names when the deprecated alias is used
   - **Warning deduplication**: verify the warning fires only once per deprecated var across multiple resolve cycles

**Exit condition:** `npm test` passes. All new test cases pass. Zero test references to old camelCase CSS var strings (`--dyni-regatta-barWarning`, `--dyni-theme-regatta-barWarning`, etc.) except in deprecation alias tests and comments explaining the rename.

---

### Phase 5: Documentation

**Intent:** Update all documentation to reflect the hierarchy, cascade, new tokens, and renamed vars.

**Dependencies:** Phases 1–4 (all code changes complete and tested).

**Deliverables:**

1. `documentation/shared/theme-tokens.md` — Restructure around the two-level hierarchy:

   - Add a new "Token Hierarchy" section at the top explaining global vs scoped tokens and the cascade concept.
   - Add the "Complete Token Hierarchy Reference" table from this plan (Tier 1 globals, Tier 2 scoped with cascade parent, Tier 2 scoped independent).
   - Update the "Resolution Order" section to document the new 6-step cascade (adding parent cascade as step 6).
   - Add `colors.ok` and `colors.info` to the "Exposed Semantic Token Paths" list.
   - Add `--dyni-ok` and `--dyni-info` to the "Public Input Variables" list.
   - Rename all regatta var references from camelCase to kebab-case.
   - Remove duplicated per-section tables (alarm widget, AIS, regatta) and consolidate into the hierarchy reference.
   - Add a "Naming Convention" section documenting the input var naming rules: color tokens omit `-color` (e.g. `--dyni-alarm`, not `--dyni-alarm-color`); number tokens include their unit concept (`-weight`, `-opacity`, `-factor`); string tokens omit their type (e.g. `--dyni-font`, not `--dyni-font-family`). Scoped tokens are prefixed by widget family (`--dyni-ais-*`, `--dyni-alarm-widget-*`, `--dyni-regatta-*`).
   - Add a "Deprecated Aliases" section listing the three renamed regatta input vars and their old names.

2. `documentation/shared/css-theming.md` — Add a note about the cascade:
   - Explain that scoped input vars (e.g. `--dyni-ais-warning`) cascade from their global parent (e.g. `--dyni-alarm`) when not set.
   - Add `--dyni-ok` and `--dyni-info` to the canonical input var list.
   - No structural changes needed — the input/output flow description remains valid.

3. `documentation/widgets/regatta-timer.md` — Update the token table:
   - `--dyni-theme-regatta-barWarning` → `--dyni-theme-regatta-bar-warning`
   - `--dyni-theme-regatta-barCritical` → `--dyni-theme-regatta-bar-critical`
   - `--dyni-theme-regatta-barDefault` → `--dyni-theme-regatta-bar-default`
   - Add a note that `barCritical` cascades from `--dyni-alarm` and `barDefault` cascades from `--dyni-info`.
   - Add a note that the old camelCase input vars still work as deprecated aliases.

4. `documentation/widgets/alarm.md` — Add a note that `--dyni-alarm-widget-strip` cascades from `--dyni-ok` when not explicitly set.

5. `README.md` — Rewrite the "Theming" section:

   - Open with a brief explanation of the two-level hierarchy (global tokens control the overall look; scoped tokens fine-tune individual widgets and cascade from globals).
   - Present global tokens first in a clear table (surface, typography, opacity, semantic colors, geometry weights).
   - Present scoped tokens second, grouped by widget family, with a "Cascades from" column showing which global they inherit from (or "—" for independent).
   - Keep the family geometry tokens (radial/linear) in a separate collapsed section or at the end — most users don't touch these.
   - Document the regatta rename: `--dyni-regatta-barWarning` → `--dyni-regatta-bar-warning` (and the other two). Note that old names still work as deprecated aliases with a console warning, and will be removed in a future major version.
   - Keep the `user.css` example recipes (day+night override, preset override) and add a new "cascade recipe" example showing how setting `--dyni-alarm` cascades to multiple widgets.
   - Remove the old flat token table.

**Exit condition:** `npm run check:docs` passes (if doc checks exist). All documentation references use the new kebab-case var names as the canonical form. The deprecated aliases are mentioned in `theme-tokens.md` and `regatta-timer.md`. The naming convention is documented in `theme-tokens.md`. The hierarchy is clearly presented in both `theme-tokens.md` and `README.md`.

---

## User-Facing Documentation Impact

README.md changes are required. This plan changes the theming surface (new tokens, renamed vars, cascade semantics).

| Section | Change |
|---|---|
| README.md "Theming" | Rewrite: two-level hierarchy explanation, global token table, scoped token table with "Cascades from" column, regatta rename + deprecation note, cascade `user.css` recipe |
| `documentation/shared/theme-tokens.md` | Major restructure: hierarchy overview, cascade reference table, naming convention section, deprecated aliases section, `--dyni-ok` / `--dyni-info` additions |
| `documentation/shared/css-theming.md` | Add cascade note and new input vars |
| `documentation/widgets/regatta-timer.md` | Rename 3 output var references, add cascade and deprecation notes |
| `documentation/widgets/alarm.md` | Add cascade note for `--dyni-alarm-widget-strip` |

---

## File Inventory

### New files (0)

No new files. All changes are to existing files.

### Modified files (9)

| File | Change scope |
|---|---|
| `runtime/theme/model.js` | Add `defaultFrom` and `deprecatedInputVar` parameters, 2 new tokens, rename 3 CSS var strings, add ok/info to preset night layers, simplify presets (~90 lines changed) |
| `runtime/theme/resolver.js` | Add parent cascade step in `resolveTokenValue()`, add deprecated alias fallback in `readTokenInputOverride()` with console warning (~30 lines added) |
| `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css` | Rename 6 output var references |
| `tests/runtime/theme-runtime.test.js` | Rename output var assertions, add ~20 new cascade/global/deprecation test cases (~130 lines added) |
| `documentation/shared/theme-tokens.md` | Restructure around hierarchy, add cascade docs, rename vars (~major rewrite) |
| `documentation/shared/css-theming.md` | Add cascade note, add new vars (~10 lines added) |
| `documentation/widgets/regatta-timer.md` | Rename 3 output var references, add cascade notes (~6 lines changed) |
| `documentation/widgets/alarm.md` | Add cascade note for `--dyni-alarm-widget-strip` (~2 lines added) |
| `README.md` | Rewrite theming section with hierarchy (~major rewrite of theming section) |

---

## Acceptance Criteria

### Gate

- [ ] `npm run check:all` passes (`check:core` + `test:coverage:check` + `perf:check`)
- [ ] Completed mandatory preflight reads

### Token model

- [ ] `colors.ok` and `colors.info` appear in `getTokenDefinitions()` output
- [ ] `colors.ok` resolves to `#70F3AF` (day) and `rgba(112, 243, 175, 0.60)` (night)
- [ ] `colors.info` resolves to `#70B0F3` (day) and `rgba(112, 176, 243, 0.60)` (night)

### Cascade behavior

- [ ] Setting `--dyni-alarm` to `#00ff00` on root causes `colors.ais.warning` to resolve to `#00ff00`
- [ ] Setting `--dyni-ok` to `#00ff00` on root causes `colors.ais.nearest` and `colors.alarmWidget.strip` to resolve to `#00ff00`
- [ ] Setting `--dyni-info` to `#00ff00` on root causes `colors.regatta.barDefault` to resolve to `#00ff00`
- [ ] Setting `--dyni-ais-warning` explicitly still overrides the cascade from `--dyni-alarm`
- [ ] `colors.alarmWidget.bg` remains `#C73A32` and is NOT affected by any global token change
- [ ] `colors.regatta.barWarning` remains `#e7a834` and is NOT affected by any global token change

### Preset and mode regression

- [ ] Highcontrast preset: `colors.ok` = `#00AA66`, `colors.info` = `#00AAFF`
- [ ] Highcontrast night: `colors.ok` = `rgba(112, 243, 175, 0.60)`, `colors.info` = `rgba(112, 176, 243, 0.60)` (not day values)
- [ ] Darkmode preset: all values identical to pre-change (no visual regression)
- [ ] Darkmode night: `colors.ok` and `colors.info` resolve to night-mode rgba values, not day hex
- [ ] Night mode: all values identical to pre-change across all presets

### Rename and deprecation

- [ ] `--dyni-regatta-bar-warning` (kebab-case) is the input var that overrides `colors.regatta.barWarning`
- [ ] Old camelCase input vars (`--dyni-regatta-barWarning`) still resolve correctly as deprecated aliases
- [ ] Setting the old camelCase var logs a console deprecation warning
- [ ] Setting both old and new var on the same root: new kebab-case var wins
- [ ] Deprecation warning fires only once per var name per resolver instance

### CSS consumers

- [ ] Regatta timer CSS renders correct colors (bar-default blue, bar-warning amber, bar-critical red)
- [ ] No camelCase regatta CSS var strings remain in any `.js`, `.css`, or `.md` file (except `deprecatedInputVar` definitions, deprecation alias tests, completed exec plans, and deprecation docs)

### Documentation

- [ ] `README.md` theming section clearly shows global vs scoped hierarchy
- [ ] `README.md` documents the rename and deprecation aliases
- [ ] `theme-tokens.md` has the cascade reference table
- [ ] `theme-tokens.md` has the naming convention section

### Tests

- [ ] All existing tests pass
- [ ] New cascade tests pass
- [ ] New deprecation alias tests pass

---

## Related

- `documentation/shared/theme-tokens.md`
- `documentation/shared/css-theming.md`
- `documentation/widgets/alarm.md`
- `documentation/widgets/regatta-timer.md`
- `documentation/guides/exec-plan-authoring.md`
- `documentation/conventions/coding-standards.md`
- `exec-plans/completed/PLAN28.md` (regatta timer — introduced the camelCase regatta tokens)
