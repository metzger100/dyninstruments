# PLAN23: ETA Disambiguation, routePoints Height Fix, and Pre-Release Cleanup

**Goal:** Rename the standalone waypoint-ETA kind from `eta` to `wpEta`, relabel all route-ETA captions and internal metric IDs to `rteEta`/`"RTE ETA"`, scope the routePoints `60vh` height cap to vertical containers only, and remove stale pre-release language from living documents.

**Status:** 🔲 Not started

---

## Status

This plan is the implementation source of truth for four fixes from the ROADMAP. Three are bug fixes; the fourth is a documentation cleanup. Issues 1 and 3 are compatibility-breaking changes with no automatic migration. The fourth ROADMAP fix item ("Set the aspect ratio of Radial widgets in widgetContainer.vertical to 1") was already implemented and is removed from the roadmap as part of this plan or manually before that plan.

---

## Goal

After PLAN23 is complete, repository-visible and runtime-visible outcomes must be:

1. The standalone waypoint-ETA kind is `"wpEta"` everywhere: cluster routes, cluster config (storeKeys, select list, default, conditions, updateFunction fallback), kind-defaults, and all tests.
2. The kind-defaults default caption for `wpEta` is `"WP ETA"`.
3. The kind string `"eta"` does not appear in any cluster route, cluster config kind condition, or kind-defaults map.
4. The `activeRoute` widget's ETA caption default is `"RTE ETA"` with display name `"RTE ETA caption"` and unit name `"RTE ETA unit"`.
5. The `editRoute` widget's ETA caption default is `"RTE ETA"` with editor name `"RTE ETA caption"`.
6. The internal metric slot identifier `"eta"` in `activeRoute` and `editRoute` widget internals (viewmodels, mappers, layouts, render models, fit logic, markup) is `"rteEta"`.
7. The editable parameter names `caption_activeRouteEta`, `unit_activeRouteEta`, `caption_editRouteEta` are unchanged — they are layout-stored keys.
8. The AvNav store keys (`nav.wp.eta`, `nav.route.eta`) are unchanged — they are AvNav-internal.
9. The `routePoints` widget fills its allocated cell on normal gpspages without a viewport height cap.
10. The `routePoints` widget in vertical containers (navpage left panel) is capped at `max-height: calc(60vh)` and scrolls via the existing `.dyni-route-points-list` overflow rule.
11. `ROADMAP.md` no longer contains pre-release language.
12. All completed ROADMAP fix items (including the already-completed radial aspect ratio item) are removed from the Fixes section.
13. All PLAN22 bundled layout files use `"kind": "wpEta"` where they previously used `"kind": "eta"`.
14. All existing tests pass after assertion updates.

---

## Verified Baseline

These facts were verified against the current repository state before writing the plan.

1. `config/cluster-routes/nav.js` defines `kind: "eta"` with `rendererId: "ThreeValueTextWidget"`, `surface: "canvas-dom"`, `shellSizing: { kind: "ratio", aspectRatio: 2 }`.

2. `config/cluster-routes/nav.js` defines `kind: "rteEta"` with the same renderer, surface, and shell sizing as `eta`.

3. `config/shared/kind-defaults.js` `NAV_TEXT_KIND` map contains `eta: { cap: "ETA", unit: "" }`.

4. `config/shared/kind-defaults.js` `NAV_TEXT_KIND` map contains `rteEta: { cap: "RTE ETA", unit: "" }`.

5. `config/shared/kind-defaults.js` `NAV_TEXT_KIND` map contains `activeRouteEta: { cap: "ETA", unit: "", kind: "activeRoute", captionName: "ETA caption", unitName: "ETA unit" }`.

6. `config/clusters/nav.js` storeKeys map contains `eta: "nav.wp.eta"`.

7. `config/clusters/nav.js` kind select list contains `opt("ETA to waypoint", "eta")`.

8. `config/clusters/nav.js` kind default is `"eta"`.

9. `config/clusters/nav.js` `caption_editRouteEta` editable parameter has `default: "ETA"` and `name: "ETA caption"`.

10. `config/clusters/nav.js` `updateFunction` fallback is `const kind = (values && values.kind) || "eta"`.

11. `config/clusters/nav.js` condition arrays referencing `{ kind: "eta" }` appear in: `NAV_TEXT_KIND_CONDITION`, `stableDigits`, `hideSeconds`, `ratioThresholdNormal`, `ratioThresholdFlat`, `captionUnitScale`.

12. `cluster/viewmodels/ActiveRouteViewModel.js` maps the ETA metric slot as `eta: p.activeRouteEta` (display), `eta: cap("activeRouteEta")` (captions), `eta: unit("activeRouteEta")` (units).

13. `cluster/viewmodels/EditRouteViewModel.js` maps the ETA metric slot as `eta: active ? p.rteEta : undefined`.

14. `cluster/mappers/NavMapper.js` passes `eta: activeRouteDomain.display.eta` for the activeRoute display and `eta: cap("editRouteEta")` for the editRoute captions.

15. `shared/widget-kits/nav/EditRouteRenderModel.js`, `EditRouteMarkup.js`, and `EditRouteHtmlFit.js` all define `METRIC_IDS = ["pts", "dst", "rte", "eta"]`.

16. `shared/widget-kits/nav/EditRouteRenderModel.js` accesses `captionsConfig.eta`, `metricCaptions.eta`, `domain.eta`, and writes `metrics.eta = { id: "eta", ... }`.

17. `shared/widget-kits/nav/ActiveRouteLayout.js` writes `layout.metricRects.eta` in four layout branches.

18. `shared/widget-kits/nav/ActiveRouteHtmlFit.js` defines metric spec `{ id: "eta", caption: model.etaCaption, value: model.etaText, ... }`.

19. `shared/widget-kits/nav/EditRouteLayout.js` writes `out.metricBoxes.eta` in four layout branches and reads `metricHasUnitConfig.eta`.

20. `shared/widget-kits/nav/EditRouteMarkup.js` generates CSS class `dyni-edit-route-metric-eta` from the metric ID string.

21. `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css` `:host` rule sets `max-height: calc(60vh)` unconditionally.

22. `widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css` already contains the rule `.dyni-html-root[data-dyni-orientation="vertical"] .dyni-route-points-html { height: auto; }`.

23. `.dyni-route-points-list` already has `overflow-y: auto; overflow-x: hidden;` — this is the existing scroll mechanism.

24. `plugin.css` overrides vertical container shell sizing: `.widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell { flex: 0 0 auto; height: auto; }`.

25. `ClusterShellRenderer.resolveShellStyle` emits an inline `aspect-ratio` CSS property only when `isVerticalShell(routeFrame)` returns true. For `shellSizing: { kind: "natural" }` routes (like `routePoints`), no aspect-ratio is emitted in either mode.

26. `HtmlWidgetUtils` sets `data-dyni-orientation="vertical"` (or `"default"`) on `.dyni-html-root` inside the shadow DOM based on `resolveContainerOrientation(props)`, which returns `"vertical"` when `props.mode === "vertical"`.

27. `ROADMAP.md` line 4 reads: "It tracks pre-release priorities and AvNav widget coverage status."

28. `exec-plans/completed/PLAN19.md` contains historical references to "before the first release". These are completed plan records and must not be rewritten.

29. The ROADMAP Fixes section lists four items. The fourth ("Set the aspect ratio of Radial widgets in widgetContainer.vertical to 1") was already implemented.

30. Ten test files assert on the internal `"eta"` metric ID: `EditRouteViewModel.test.js`, `ClusterMapperToolkit.test.js`, `EditRouteTextHtmlWidget.test.js`, `ActiveRouteLayout.test.js`, `ActiveRouteHtmlFit.test.js`, `EditRouteLayout.test.js`, `EditRouteHtmlFit.test.js`, `EditRouteMarkup.test.js`, `EditRouteRenderModel.test.js`, `nav.test.js`.

31. `tests/config/clusters/nav.test.js` asserts `def.editableParameters.kind.default` is `"eta"`.

32. `tests/config/clusters/nav.test.js` asserts `caption_editRouteEta.default` is `"ETA"`.

33. `tests/config/clusters/nav.test.js` asserts `caption_activeRouteEta.displayName` is `"ETA caption"`.

34. `tests/config/clusters/static-clusters.test.js` contains `{ kind: "eta" }` in condition assertions.

35. `tests/cluster/rendering/RoutePointsTextHtmlWidget.test.js` asserts CSS content includes a `max-height` rule and a `[data-dyni-orientation="vertical"]` rule.

---

## Hard Constraints

1. **No compatibility shim.** The `"eta"` kind must not resolve to `"wpEta"` through a fallback alias. The rename is a clean break documented in release notes.
2. **No AvNav store key changes.** `nav.wp.eta` and `nav.route.eta` are AvNav-internal keys and must not be renamed.
3. **No editable parameter key changes.** `caption_activeRouteEta`, `unit_activeRouteEta`, and `caption_editRouteEta` are stored in user layout JSON and must not be renamed.
4. **No completed exec-plan edits.** Files in `exec-plans/completed/` are historical records.
5. **PLAN22 bundled layouts must be updated.** Every bundled layout file containing `"kind": "eta"` must be changed to `"kind": "wpEta"`.

---

## Compatibility and Release Notes

Issues 1 and 3 are breaking changes. The release that includes PLAN23 must document both:

> **Breaking changes:**
>
> - The standalone waypoint-ETA instrument has been renamed from `eta` to `wpEta`.
>   If you have custom layouts that use `"kind": "eta"` on a `dyni_Nav_Instruments`
>   widget, change the value to `"wpEta"`. The default caption is now "WP ETA".
>
> - The ETA captions in the Active Route and Edit Route widgets now default to
>   "RTE ETA" instead of "ETA" to correctly reflect that these instruments show
>   the route ETA, not the waypoint ETA. If you previously overrode these captions,
>   your custom values are preserved.

---

## Implementation Order

### Phase 1 — Rename `eta` kind to `wpEta`

**Intent:** Eliminate the ambiguous `"eta"` kind name from all config, routes, defaults, and tests.

**Deliverables:**

`config/cluster-routes/nav.js` — change `kind: "eta"` to `kind: "wpEta"`.

`config/shared/kind-defaults.js` — rename key `eta` to `wpEta`, change `cap` from `"ETA"` to `"WP ETA"`.

`config/clusters/nav.js` — six locations:

| Location | Before | After |
|---|---|---|
| storeKeys | `eta: "nav.wp.eta"` | `wpEta: "nav.wp.eta"` |
| Kind select list | `opt("ETA to waypoint", "eta")` | `opt("WP ETA to waypoint", "wpEta")` |
| Default kind | `default: "eta"` | `default: "wpEta"` |
| NAV_TEXT_KIND_CONDITION | `{ kind: "eta" }` | `{ kind: "wpEta" }` |
| All other condition arrays | `{ kind: "eta" }` | `{ kind: "wpEta" }` |
| updateFunction fallback | `\|\| "eta"` | `\|\| "wpEta"` |

Test updates:

| Test file | Change |
|---|---|
| `tests/config/clusters/nav.test.js` | `kind.default`: `"eta"` → `"wpEta"`; all `{ kind: "eta" }` conditions → `{ kind: "wpEta" }`; `updateFunction` inputs |
| `tests/config/clusters/static-clusters.test.js` | `{ kind: "eta" }` → `{ kind: "wpEta" }` |

PLAN22 bundled layouts — replace `"kind": "eta"` with `"kind": "wpEta"` in every layout file under `layouts/`.

**Exit conditions:** `npm test` passes. No occurrence of `"kind": "eta"` in config, cluster-routes, kind-defaults, or bundled layouts. `"kind": "wpEta"` resolves to `ThreeValueTextWidget`.

---

### Phase 2 — RTE ETA label fix and internal metric ID rename

**Intent:** Relabel all route-ETA captions to "RTE ETA" and rename the internal metric slot identifier from `"eta"` to `"rteEta"` across both composite widgets.

**Depends on:** Phase 1 (overlapping test files; doing this second avoids editing the same assertions twice).

**Deliverables — caption defaults:**

`config/shared/kind-defaults.js` — update `activeRouteEta`:

```js
activeRouteEta: {
  cap: "RTE ETA",
  unit: "",
  kind: "activeRoute",
  captionName: "RTE ETA caption",
  unitName: "RTE ETA unit"
},
```

`config/clusters/nav.js` — update `caption_editRouteEta`:

```js
caption_editRouteEta: {
  type: "STRING",
  default: "RTE ETA",
  name: "RTE ETA caption",
  condition: { kind: "editRoute" }
},
```

**Deliverables — internal metric ID rename (`"eta"` → `"rteEta"`):**

`cluster/viewmodels/ActiveRouteViewModel.js` — rename key in all three domain objects:

```js
{ rteEta: p.activeRouteEta }       // display
{ rteEta: cap("activeRouteEta") }  // captions
{ rteEta: unit("activeRouteEta") } // units
```

`cluster/viewmodels/EditRouteViewModel.js`:

```js
rteEta: active ? p.rteEta : undefined,
```

`cluster/mappers/NavMapper.js` — two locations:

```js
// activeRoute display
rteEta: activeRouteDomain.display.rteEta,

// editRoute captions
captions: {
  pts: cap("editRoutePts"),
  dst: cap("editRouteDst"),
  rte: cap("editRouteRte"),
  rteEta: cap("editRouteEta")
},
```

`shared/widget-kits/nav/EditRouteRenderModel.js` — update `METRIC_IDS` and all property accesses:

```js
const METRIC_IDS = ["pts", "dst", "rte", "rteEta"];
```

All `captionsConfig.eta`, `metricCaptions.eta`, `domain.eta`, `metrics.eta`, and `id: "eta"` become their `rteEta` equivalents.

`shared/widget-kits/nav/EditRouteMarkup.js` — update `METRIC_IDS`. Generated CSS class changes from `dyni-edit-route-metric-eta` to `dyni-edit-route-metric-rteEta`.

`shared/widget-kits/nav/EditRouteHtmlFit.js` — update `METRIC_IDS`.

`shared/widget-kits/nav/ActiveRouteLayout.js` — four assignments: `layout.metricRects.eta` → `layout.metricRects.rteEta`.

`shared/widget-kits/nav/ActiveRouteHtmlFit.js` — metric spec: `id: "eta"` → `id: "rteEta"`. The `model.etaCaption`, `model.etaText`, `model.etaPlainText`, and `model.etaUnit` property names derive from the view model field name `activeRouteEta` and do not change.

`shared/widget-kits/nav/EditRouteLayout.js` — four `out.metricBoxes.eta` → `out.metricBoxes.rteEta` and one `metricHasUnitConfig.eta` → `metricHasUnitConfig.rteEta`.

Test updates:

| Test file | Change |
|---|---|
| `tests/config/clusters/nav.test.js` | `caption_editRouteEta.default`: `"ETA"` → `"RTE ETA"`; `caption_activeRouteEta.displayName`: `"ETA caption"` → `"RTE ETA caption"` |
| `tests/shared/nav/ActiveRouteHtmlFit.test.js` | `etaCaption` fixtures → `"RTE ETA"`; metric keys `"eta"` → `"rteEta"` |
| `tests/shared/nav/ActiveRouteLayout.test.js` | `metricRects.eta` → `metricRects.rteEta` |
| `tests/shared/nav/EditRouteRenderModel.test.js` | `visibleMetricIds`, `metrics.eta` → `metrics.rteEta` |
| `tests/shared/nav/EditRouteMarkup.test.js` | `visibleMetricIds`, CSS class assertions |
| `tests/shared/nav/EditRouteHtmlFit.test.js` | `METRIC_IDS` / `visibleMetricIds` assertions |
| `tests/shared/nav/EditRouteLayout.test.js` | `metricBoxes.eta` → `metricBoxes.rteEta` |
| `tests/cluster/viewmodels/EditRouteViewModel.test.js` | `.eta` → `.rteEta` |
| `tests/cluster/mappers/ClusterMapperToolkit.test.js` | Metric key assertions |
| `tests/cluster/rendering/EditRouteTextHtmlWidget.test.js` | `visibleMetricIds`, metric class assertions |

**Exit conditions:** `npm test` passes. A grep for `"eta"` across `shared/widget-kits/nav/`, `cluster/viewmodels/`, and `cluster/mappers/` returns no hits that refer to the metric slot (excluding `rteEta`, `activeRouteEta`, `editRouteEta`, `etaFormatter`, and similar prefixed forms).

---

### Phase 3 — routePoints height fix

**Intent:** Scope the `60vh` viewport cap to vertical containers only so routePoints fills its cell on normal gpspages.

**Depends on:** None (independent of phases 1 and 2).

**Deliverables:**

`widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css`:

Remove `max-height` from `:host`:

```css
/* Before */
:host {
  height: auto;
  max-height: calc(60vh);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* After */
:host {
  height: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
```

Add the viewport limit to the existing vertical orientation rule:

```css
/* Before */
.dyni-html-root[data-dyni-orientation="vertical"] .dyni-route-points-html {
  height: auto;
}

/* After */
.dyni-html-root[data-dyni-orientation="vertical"] .dyni-route-points-html {
  height: auto;
  max-height: calc(60vh);
}
```

Scrolling is already handled by `.dyni-route-points-list` which has `overflow-y: auto`. No additional overflow rule is needed on the parent.

Why `:host` cannot be scoped directly: the `:host` pseudo-element targets the shadow DOM host from inside the shadow tree. The `data-dyni-orientation` attribute is set on `.dyni-html-root`, a child inside the shadow DOM, not an attribute on the host element. Moving the constraint one level inward under the orientation attribute selector is the correct approach.

Test updates:

| Test file | Change |
|---|---|
| `tests/cluster/rendering/RoutePointsTextHtmlWidget.test.js` | Update CSS assertion to verify `max-height` is scoped under `[data-dyni-orientation="vertical"]` and absent from `:host` |

**Exit conditions:** `npm test` passes. `:host` rule in `RoutePointsTextHtmlWidget.css` does not contain `max-height`.

---

### Phase 4 — Remove stale pre-release language

**Intent:** Correct stale pre-release references in living documents.

**Depends on:** None.

**Deliverables:**

`ROADMAP.md` — update line 4:

```md
<!-- Before -->
It tracks pre-release priorities and AvNav widget coverage status.

<!-- After -->
It tracks development priorities and AvNav widget coverage status.
```

`ROADMAP.md` — remove the four completed fix items from the Fixes section (the three fixes implemented by this plan plus the already-completed radial aspect ratio item).

Sweep: a full-repo search for `pre-release`, `pre release`, `before release`, `first release`, `not yet released` must be run at implementation time to catch any other living documents added between plan acceptance and implementation. Completed exec-plans are excluded.

**Exit conditions:** No living document contains pre-release language. The ROADMAP Fixes section is empty or removed.

---

## Acceptance Criteria

### Kind rename

- `"wpEta"` exists in `config/cluster-routes/nav.js`. `"eta"` does not.
- `config/shared/kind-defaults.js` `NAV_TEXT_KIND` has key `wpEta` with `cap: "WP ETA"`. No key `eta`.
- `config/clusters/nav.js` `editableParameters.kind.default` is `"wpEta"`.
- `config/clusters/nav.js` `updateFunction` fallback is `|| "wpEta"`.
- No bundled layout file contains `"kind": "eta"`.

### RTE ETA labels and internal metric IDs

- `config/shared/kind-defaults.js` `activeRouteEta.cap` is `"RTE ETA"`, `captionName` is `"RTE ETA caption"`, `unitName` is `"RTE ETA unit"`.
- `config/clusters/nav.js` `caption_editRouteEta.default` is `"RTE ETA"`, `name` is `"RTE ETA caption"`.
- `METRIC_IDS` in `EditRouteRenderModel.js`, `EditRouteMarkup.js`, and `EditRouteHtmlFit.js` is `["pts", "dst", "rte", "rteEta"]`.
- `ActiveRouteLayout.js` writes `metricRects.rteEta`. No `metricRects.eta`.
- `ActiveRouteHtmlFit.js` metric spec has `id: "rteEta"`. No `id: "eta"`.
- `EditRouteLayout.js` writes `metricBoxes.rteEta`. No `metricBoxes.eta`.
- `EditRouteMarkup.js` generates class `dyni-edit-route-metric-rteEta`.
- `ActiveRouteViewModel.js` and `EditRouteViewModel.js` domain keys are `rteEta`.
- `NavMapper.js` passes `rteEta` keys for both activeRoute display and editRoute captions.

### routePoints height

- `RoutePointsTextHtmlWidget.css` `:host` does not contain `max-height`.
- `max-height: calc(60vh)` appears only under `.dyni-html-root[data-dyni-orientation="vertical"]`.

### Pre-release language

- `ROADMAP.md` does not contain `pre-release`.
- No living document (excluding `exec-plans/completed/`) contains `pre-release`, `before release`, `first release`, or `not yet released`.
- ROADMAP Fixes section contains no completed items.

### Gates

- `npm test` passes.
- `npm run check:all` passes (if available).

---

## Test Plan

Existing test files requiring assertion updates:

```text
tests/config/clusters/nav.test.js
tests/config/clusters/static-clusters.test.js
tests/cluster/viewmodels/EditRouteViewModel.test.js
tests/cluster/mappers/ClusterMapperToolkit.test.js
tests/cluster/rendering/EditRouteTextHtmlWidget.test.js
tests/cluster/rendering/RoutePointsTextHtmlWidget.test.js
tests/shared/nav/ActiveRouteLayout.test.js
tests/shared/nav/ActiveRouteHtmlFit.test.js
tests/shared/nav/EditRouteLayout.test.js
tests/shared/nav/EditRouteHtmlFit.test.js
tests/shared/nav/EditRouteMarkup.test.js
tests/shared/nav/EditRouteRenderModel.test.js
```

Additional guard tests:

1. **Stale kind rejection guard:** assert `"eta"` is not present in the cluster-routes registry.
2. **Internal metric ID guard:** assert no source file in `shared/widget-kits/nav/`, `cluster/viewmodels/`, or `cluster/mappers/` contains the bare string `"eta"` as a metric slot identifier.
3. **routePoints CSS orientation guard:** assert `max-height` appears only under the `[data-dyni-orientation="vertical"]` selector, not on `:host`.
4. **Bundled layout kind audit:** assert no bundled layout file contains `"kind": "eta"`.

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Users with custom layouts containing `"kind": "eta"` lose per-kind overrides | Document in release notes; widget falls through to new default `"wpEta"` which shows the same data |
| DOM class `dyni-edit-route-metric-eta` changes to `dyni-edit-route-metric-rteEta` | Class is not used by any plugin stylesheet; document in release notes if custom CSS targeting is a known pattern |
| `60vh` cap may not match actual vertical panel height on all displays | Practical default for typical marine displays; a future plan can replace with container-relative units if needed |

---

## Related

- `exec-plans/active/PLAN22.md` — introduces bundled layouts that must be updated by Phase 1
- `documentation/guides/exec-plan-authoring.md`
- `documentation/guides/release-workflow.md`
- `ROADMAP.md`
