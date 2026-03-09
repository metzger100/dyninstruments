# Implementation Plan

**Status:** ⏳ In Progress | Phase 0 resolved; cluster/runtime parity work still pending

## Overview

This plan covers feature-parity support for the core route/AIS workflow widgets inside the existing cluster system:

- `ActiveRoute`
- `EditRoute`
- `RoutePoints`
- `AisTarget`

The chosen direction for dyninstruments is:

- keep these widgets inside `dyni_Nav_Instruments` for now
- extend the cluster runtime so cluster sub-renderers can use `renderHtml` in addition to `renderCanvas`
- defer any `nav` cluster split until later if the mapper/config grows into a hotspot
- replace the temporary summary-style `activeRoute` cluster kind with the core-parity implementation instead of preserving a compatibility path

The remaining hard problem is extending the cluster runtime to support HTML/interactivity cleanly.

Phase 0 is considered resolved for now:

- current viewer source still exposes `window.avnav.api.routePoints`, and core pages use it
- maintainer feedback does not treat this area as a documented/stable public plugin-action contract
- the accepted near-term path is plugin-owned `renderHtml` / React click handling, with AvNav actions treated only as optional fallback behavior
- generalized host-action API work is deferred until core defines a broader concept for exposing such actions to plugins

## Core Behavior Summary

| Widget | Core data inputs | Visible behavior | Core click/workflow behavior | Parity risk |
|---|---|---|---|---|
| `ActiveRoute` | `nav.route.name`, `nav.route.remain`, `nav.route.eta`, `nav.route.nextCourse`, `nav.route.isApproaching`, `gui.global.layoutEditing`, `nav.wp.server` | Shows route name, remaining distance, ETA, and `NEXT` only while approaching. Hidden when there is no route unless layout editing is active. Uses approach background state. | In `NavPage`, click runs `activeRoute.setIndexToTarget()`, `activeRoute.syncTo(RouteEdit.MODES.EDIT)`, then `history.push("editroutepage")`. In `GpsPage` it is not special-cased and falls back to page pop behavior. | No documented host action API today. Use plugin-owned click handling and defer generalized route-editor API work. |
| `EditRoute` | `RouteEdit.MODES.EDIT` store keys plus `nav.route.remain`, `nav.route.eta`, `nav.route.isApproaching`, `nav.routeHandler.useRhumbLine` | Shows route name, point count, route length, and in non-horizontal mode also RTG and ETA. Uses different border colors for editable vs active route. Shows `No Route` fallback. | In `EditRoutePage`, click opens `EditRouteDialog`. | No documented host action API today. Keep parity work on the plugin side and revisit host APIs later. |
| `RoutePoints` | `RouteEdit.MODES.EDIT` store keys plus `properties.routeShowLL`, `gui.global.layoutEditing`, `nav.routeHandler.useRhumbLine` | Shows waypoint list, selected-row highlight, and auto-scrolls the selected row into view. Hidden in horizontal mode unless layout editing is active. | Row click activates the current route point. Re-clicking the already centered point opens the waypoint dialog. Page code also exposes `avnav.api.routePoints.activate(index)` via registered handlers. | Current viewer source exposes `routePoints`, but maintainer feedback does not bless it as stable public plugin API. Any use must stay isolated and tagged as workaround code. |
| `AisTarget` | `nav.ais.nearest`, `gui.global.layoutEditing`, `nav.ais.trackedMmsi` and AIS color properties | Shows nearest AIS target, uses compact horizontal layout on dashboard-like panels, and colors background by warning/nearest/tracked state. | In `NavPage` and `GpsPage`, click opens `AisInfoWithFunctions`; dialog buttons trigger nearest/locate/hide/list actions. | No documented AIS plugin-action API today. Prefer plugin-owned interaction and defer generalized host-action API work. |

Observed source detail that still needs validation against live behavior:

- `viewer/components/ActiveRouteWidget.jsx` uses both `isApproaching` and `isAproaching`. Parity tests must follow actual runtime behavior, not the typo in isolation.

## Confirmed Interaction Ownership Split

The core widgets do not all own their workflows the same way. This matters for plugin parity because cluster kinds inside `dyni_Nav_Instruments` cannot rely on built-in widget names being special-cased by core pages.

| Widget | Ownership pattern in core | Confirmed source behavior | Scope for this plan |
|---|---|---|---|
| `CenterDisplay` | passive renderer | no widget-specific click handling; `MapPage` only gates visibility when center lock is active | out of scope here; roadmap item |
| `Zoom` | page-routed click on passive renderer | `ZoomWidget` is passive; `NavPage` intercepts widget click and runs `MapHolder.checkAutoZoom(true)` | out of scope here, but useful evidence for Phase 0 issue framing |
| `Alarm` | page-shell widget with widget-owned click trap | `AlarmWidget` stops propagation, but `PageLeft` injects the actual "stop running alarms" callback | out of scope here, but useful evidence for Phase 0 issue framing |
| `ActiveRoute` | page-routed click on passive renderer | `ActiveRouteWidget` renders only; `NavPage` opens edit-route flow; `GpsPage` has no special-case and falls back to page pop | in scope |
| `EditRoute` | page-routed click on passive renderer | `EditRouteWidget` renders only; `EditRoutePage` opens `EditRouteDialog` on widget click | in scope |
| `RoutePoints` | widget-owned row clicks + page/API workflow | `RoutePointsWidget` emits clicked row data; pages register `avnav.api.routePoints.activate(index)` handlers | in scope |
| `AisTarget` | widget-owned click + page-owned dialog workflow | `AisTargetWidget` forwards `mmsi`; `NavPage` and `GpsPage` open `AisInfoWithFunctions` | in scope |

## Current Dyninstruments Gaps

- `config/widget-definitions.js` already matches the desired registration model because the plan stays cluster-based.
- `ClusterWidget` currently exposes `translateFunction`, `renderCanvas`, and `finalizeFunction`, but not `renderHtml` or lifecycle delegation needed for HTML sub-renderers.
- `ClusterRendererRouter` currently fans out only `renderCanvas` and `finalizeFunction`. It has no contract for:
  - HTML sub-rendering
  - HTML event-handler wiring
  - per-sub-renderer `initFunction`
  - per-sub-renderer `wantsHideNativeHead` behavior beyond canvas-based marking
- `runtime/widget-registrar.js` only marks hide-native-head/theme roots from the `renderCanvas` path. Pure HTML cluster kinds cannot currently mark the widget root.
- `runtime/init.js` discovers plugin containers via `canvas.widgetData`, so pure HTML cluster kinds are invisible to theme-preset discovery.
- `config/clusters/nav.js` and `cluster/mappers/NavMapper.js` currently model only the existing summary-style nav kinds. They do not yet carry the active-workflow kinds.
- The current `nav` cluster already has an `activeRoute` kind for the newly added summary widget. Under a fail-fast approach, that kind should be replaced directly by the core-parity implementation instead of carrying both variants.
- The current viewer source attaches `routePoints.activate/registerHandler` to `window.avnav.api`, but maintainer feedback indicates there is no generalized documented plugin-action concept for this area. There is still no corresponding documented/stable API for:
  - opening the route editor page/dialog
  - syncing active route state into edit-route state
  - opening AIS info/list workflows
  - performing AIS target actions (`nearest`, `locate`, `hide`, `track`) from plugins
- Adjacent core widgets confirm the same architectural split:
  - `Zoom` uses page-routed click behavior on top of a passive widget renderer
  - `Alarm` is mounted by page shell code rather than panel-layout widget routing
  - `CenterDisplay` is a passive map widget with no widget-owned interaction at all

## Final Implementation Goal

- Extend `dyni_Nav_Instruments` so cluster sub-renderers can support both `renderCanvas` and `renderHtml`.
- Add the core-style active-workflow kinds to `nav` for now:
  - `activeRoute`
  - `editRoute`
  - `routePoints`
  - `aisTarget`
- Use `renderHtml` string mode plus `this.eventHandler` for interactive cluster kinds.
- Support plugin theming and hide-native-header behavior for HTML cluster kinds, not only canvas kinds.
- Match core visibility rules and layout variants, and keep interaction ownership on the plugin side where no stable host API exists yet.
- Avoid private-core coupling: do not ship parity that depends on private `RouteEdit`, `NavData`, `MapHolder`, or page-local `history` objects.
- Keep any temporary dependency on runtime-exposed but undocumented actions narrow, optional, and explicitly marked as workaround code.
- Accept that `nav` may become a temporary hotspot and may need to split later once the feature set stabilizes.

## Related Files

| File | Description | Planned/Actual Change |
|---|---|---|
| `documentation/PLAN.md` | This implementation handoff document | Actual change in this session |
| `cluster/ClusterWidget.js` | Cluster orchestrator | Planned change: expose HTML delegation and lifecycle hooks in addition to canvas |
| `cluster/rendering/ClusterRendererRouter.js` | Cluster sub-renderer routing | Planned change: support `renderHtml`, renderer lifecycle fan-out, and HTML capability selection |
| `cluster/mappers/NavMapper.js` | `nav` cluster kind translation | Planned change: add active-workflow kinds and keep mapper output declarative |
| `config/clusters/nav.js` | `dyni_Nav_Instruments` config | Planned change: add new kinds, editables, and kind-specific defaults/conditions |
| `config/components.js` | Component registry | Planned change: register new HTML renderers and any shared helper modules |
| `runtime/widget-registrar.js` | Widget registration composition | Planned change: support HTML hide-native-head/theme-root contracts for cluster widgets |
| `runtime/init.js` | Init, component loading, theme preset application | Planned change: discover/apply presets for HTML cluster widgets too |
| `plugin.css` | Plugin-wide styling and hide-native-head rules | Planned change: support HTML cluster kinds without affecting existing canvas kinds |
| `tests/cluster/ClusterWidget.test.js` | Cluster orchestration coverage | Planned change |
| `tests/cluster/rendering/ClusterRendererRouter.test.js` | Router/capability coverage | Planned change |
| `tests/cluster/mappers/NavMapper.test.js` | `nav` mapper coverage | Planned change |
| `tests/config/clusters/nav.test.js` | `nav` cluster config coverage | Planned change |
| `tests/runtime/widget-registrar.test.js` | HTML hide-native-head registration coverage | Planned change |
| `tests/runtime/init.test.js` | Theme preset/init coverage | Planned change |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/components/ActiveRouteWidget.jsx` | Core behavior reference | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/components/EditRouteWidget.jsx` | Core behavior reference | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/components/RoutePointsWidget.jsx` | Core behavior reference | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/components/AisTargetWidget.jsx` | Core behavior reference | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/gui/NavPage.jsx` | Core widget-click routing | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/gui/GpsPage.jsx` | Core dashboard click behavior | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/gui/EditRoutePage.jsx` | Core route-edit workflow | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/components/AisInfoDisplay.jsx` | Core AIS dialog/actions | Reference only |
| `/home/leobareth/Dokumente/Programmieren/avnav/viewer/util/api.js` | Public plugin API surface | Reference only |
| `widgets/html/ActiveRouteWidget/ActiveRouteWidget.js` | New HTML sub-renderer for `nav` cluster | Likely new file |
| `widgets/html/EditRouteWidget/EditRouteWidget.js` | New HTML sub-renderer for `nav` cluster | Likely new file |
| `widgets/html/RoutePointsWidget/RoutePointsWidget.js` | New HTML sub-renderer for `nav` cluster | Likely new file |
| `widgets/html/AisTargetWidget/AisTargetWidget.js` | New HTML sub-renderer for `nav` cluster | Likely new file |

## Todo Steps

### Phase 0 - Resolved for now: use plugin-owned handlers and defer host API enhancement

1. Record the current core clarification:
   - there is no generalized concept yet for exposing host actions to plugins
   - current viewer source still exposes `window.avnav.api.routePoints`, and core pages register handlers on it
   - this source/runtime exposure must not be treated as a documented/stable plugin contract
2. Do not block dyninstruments parity work on new core APIs.
3. Use plugin-owned `renderHtml` / React click handlers as the accepted near-term workaround.
4. Treat AvNav-side action behavior only as fallback where it is actually available at runtime; do not assume built-in widget-name special-cases can be reused by plugin widgets.
5. Do not add private-core shims for `RouteEdit`, `NavData`, `AisInfoWithFunctions`, or page-local `history` objects.
6. When workaround code is added for this gap, mark it with the inline comment:
   - `// dyni-workaround(avnav-plugin-actions) -- <reason>`
7. Keep future route-editor / AIS API enhancement as deferred follow-up, not as a blocker for the cluster/runtime work.

### Phase 1 - Extend the cluster runtime to support HTML sub-renderers

1. Extend `ClusterWidget` so the cluster registration contract can expose:
   - `renderCanvas`
   - `renderHtml`
   - `initFunction`
   - `finalizeFunction`
   - aggregated `wantsHideNativeHead`
2. Extend `ClusterRendererRouter` so a picked renderer may implement either or both:
   - `renderCanvas(canvas, props)`
   - `renderHtml(props)`
3. Add lifecycle fan-out rules for cluster sub-renderers:
   - `initFunction` should initialize only the active renderer contract or an explicit router-owned shared contract
   - `finalizeFunction` should still fan out defensively where shared cleanup is required
4. Define the renderer capability contract clearly:
   - pure canvas renderer
   - pure HTML renderer
   - mixed renderer if ever needed
5. Keep mappers declarative. Renderer selection and mode switching belong in the mapper output and router, not inside `NavMapper` helper logic.
6. Add tests proving that `ClusterWidget` and `ClusterRendererRouter` correctly delegate HTML and canvas renderers without breaking existing canvas-only kinds.

### Phase 2 - Make HTML cluster kinds first-class dyninstruments widgets

1. Stop relying on the canvas-only `data-dyni` marker as the only hide-native-head contract.
2. Add a class-based or equivalent registrar-owned contract for widgets that want to hide AvNav's native header/value area, for example a marker class applied when `wantsHideNativeHead === true`.
3. Update `plugin.css` to scope hide-native-head behavior to that explicit contract instead of requiring canvas-root discovery.
4. Expand theme-preset discovery/application in `runtime/init.js` so it finds pure HTML cluster widgets as well, not only `canvas.widgetData`.
5. Ensure theme preset application still works for late-mounted HTML widgets. The mechanism can be a class-based rescan, a DOM observer, or another runtime-safe approach, but it must not remain canvas-only.
6. Add tests for:
   - HTML cluster widgets receiving hide-native-head styling
   - HTML cluster widgets being included in theme-preset application
   - existing canvas cluster widgets keeping their current behavior

### Phase 3 - Expand the `nav` cluster contract

1. Extend `config/clusters/nav.js` so `dyni_Nav_Instruments` offers the active-workflow kinds.
2. Replace the current summary implementation behind `kind: "activeRoute"` with the core-parity implementation. Do not keep a second summary-only variant for compatibility.
3. Add `editRoute`, `routePoints`, and `aisTarget` kinds to the `nav` selector list.
4. Remove any config or mapper paths that only exist to support the temporary summary behavior once the parity implementation is in place.
5. Add only the editable parameters that the `nav` cluster can actually honor. Avoid speculative editables that depend on unresolved host APIs.
6. Keep `NavMapper` output declarative:
   - route to renderer ID
   - normalize numbers and booleans
   - pass renderer-owned props only
   - do not embed layout or HTML assembly in the mapper
7. Track `nav` cluster growth as an explicit follow-up risk. If config or mapper complexity becomes a hotspot, split into a dedicated cluster later rather than overloading it indefinitely.

### Phase 4 - Implement the new HTML sub-renderers

1. Implement the `activeRoute` renderer as the core-parity HTML sub-renderer used by the `nav` cluster.
   - Use `renderHtml` string mode and `this.eventHandler`.
   - Preserve the core visibility rule: hide when there is no route unless layout editing is active.
   - Match the approach-state visual treatment and field set from the core widget.
   - Preserve context-sensitive click behavior. In particular, do not accidentally suppress `GpsPage` fallback navigation if parity requires the core default there.
2. Implement the `editRoute` renderer as an HTML sub-renderer.
   - Match the core border state, horizontal layout reduction, and `No Route` fallback.
   - Do not add adapters or compatibility wrappers around private route-object contracts. If the required route data is not available through a stable contract, stop and raise the core API blocker.
3. Implement the `routePoints` renderer as an HTML sub-renderer.
   - Match the core list shape, `showLatLon` switch, and selected-row behavior.
   - Hide it in horizontal mode unless layout editing is active.
   - If parity needs `avnav.api.routePoints.activate(index)`, treat it as a runtime-exposed workaround only: isolate usage, guard it, and tag the block with `// dyni-workaround(avnav-plugin-actions) -- ...`.
   - Add selected-row auto-scroll after render.
4. Implement the `aisTarget` renderer as an HTML sub-renderer.
   - Match the core compact-vs-full layout behavior.
   - Match background-state coloring for warning, nearest, tracked, and normal target states.
   - Keep rendering logic separate from the eventual click/dialog workflow wiring.

### Phase 5 - Wire interactions through plugin-owned handlers first

1. Because these features live inside `dyni_Nav_Instruments`, core page-level widget-name special cases will not help. The HTML renderers must own their own click behavior through `this.eventHandler`.
2. `activeRoute` parity kind:
   - keep interaction on the plugin side for now
   - keep the `GpsPage` behavior aligned with core instead of making it globally interactive by accident
3. `editRoute` kind:
   - implement the plugin-side behavior that is possible without private-core page wiring
4. `routePoints` kind:
   - row click may use `avnav.api.routePoints.activate(index)` only as a guarded workaround if parity requires it
   - re-click behavior should not duplicate private core dialog logic inside the plugin
5. `aisTarget` kind:
   - keep the click behavior plugin-owned until a documented AIS host API exists
   - do not copy private dialog logic or page-local action wiring

### Phase 6 - Tests and verification

1. Add unit tests for HTML cluster rendering and event-handler wiring.
2. Add behavior tests for:
   - active-route parity visibility and approach state
   - `editRoute` horizontal-vs-normal layout
   - `routePoints` row activation and selected-row rendering
   - `aisTarget` compact layout and state-based color choice
3. Add runtime tests covering theme preset application and hide-native-head behavior for HTML cluster kinds.
4. Add `nav` cluster config and mapper tests for the new kinds and for the direct replacement of the temporary `activeRoute` summary path.
5. Manually compare dyninstruments behavior against core on:
   - `NavPage`
   - `GpsPage`
   - `EditRoutePage`
   - `AisPage` / AIS info workflow
6. Run the final gate: `npm run check:all`.

## Deferred Future Core Follow-Up

Generalized plugin-action APIs for route-editor and AIS workflows are deferred until core defines a broader concept for exposing host actions to plugins.

If this is revisited later, preferred high-level shapes remain:

- `avnav.api.routeEditor.openActiveRoute()`
- `avnav.api.routeEditor.openEditRoute()`
- `avnav.api.routePoints.activate(index)` or `avnav.api.routeEditor.activatePoint(index)`
- `avnav.api.ais.showInfo(mmsi)`
- `avnav.api.ais.openList(mmsi)`
- `avnav.api.ais.setTrackedTarget(mmsiOrZero)`
- `avnav.api.ais.setHidden(mmsi, hidden)`

## Acceptance Criteria

- `dyni_Nav_Instruments` supports both canvas and HTML sub-renderers through the cluster pipeline.
- `kind: "activeRoute"` is the core-parity implementation, not a temporary summary variant.
- The `nav` cluster includes the active-workflow kinds for now, without compatibility aliases or duplicate fallback kinds.
- HTML cluster kinds receive dyninstruments theming and hide-native-head behavior without depending on canvas presence.
- Route and AIS interactions avoid private core modules and page-local wiring.
- Any temporary use of runtime-exposed but undocumented actions is isolated, guarded, and tagged with `// dyni-workaround(avnav-plugin-actions) -- ...`.
- Visual and workflow behavior matches the current core widgets closely enough to swap layouts without user-visible regression.
- `npm run check:all` passes.

## Completed Investigation

1. Read the mandatory preflight docs:
   - `documentation/TABLEOFCONTENTS.md`
   - `documentation/conventions/coding-standards.md`
   - `documentation/conventions/smell-prevention.md`
2. Read the plugin docs relevant to this task:
   - `documentation/avnav-api/plugin-lifecycle.md`
   - `documentation/avnav-api/interactive-widgets.md`
   - `documentation/widgets/active-route.md`
   - `documentation/architecture/cluster-widget-system.md`
   - `ARCHITECTURE.md`
3. Inspected the current dyninstruments runtime and cluster path:
   - `cluster/ClusterWidget.js`
   - `cluster/rendering/ClusterRendererRouter.js`
   - `runtime/widget-registrar.js`
   - `runtime/init.js`
   - `config/components.js`
4. Inspected the current `nav` cluster implementation:
   - `cluster/mappers/NavMapper.js`
   - `config/clusters/nav.js`
5. Inspected the core widget implementations:
   - `viewer/components/ActiveRouteWidget.jsx`
   - `viewer/components/EditRouteWidget.jsx`
   - `viewer/components/RoutePointsWidget.jsx`
   - `viewer/components/AisTargetWidget.jsx`
6. Inspected the surrounding core workflow code:
   - `viewer/gui/NavPage.jsx`
   - `viewer/gui/GpsPage.jsx`
   - `viewer/gui/EditRoutePage.jsx`
   - `viewer/gui/AisPage.jsx`
   - `viewer/components/AisInfoDisplay.jsx`
   - `viewer/nav/routeeditor.js`
   - `viewer/util/api.js`
7. Confirmed that current viewer source exposes `window.avnav.api.routePoints`, but maintainer feedback does not treat this area as a documented/stable plugin-action contract.
8. Confirmed the accepted near-term workaround:
   - use plugin-owned `renderHtml` / React handlers
   - treat AvNav-side actions only as optional fallback behavior
   - defer generalized API enhancement until later
9. Confirmed the broader ownership split around adjacent widgets:
   - `CenterDisplay` is passive
   - `Zoom` is page-routed
   - `Alarm` is page-shell-owned

## Open Questions / Validation Points

- Does core want to bless the current route-object store contract for plugin use, or should dyninstruments eventually move to a plain read-model API?
- If route/AIS host APIs are revisited later, should `avnav.api.routePoints.activate(index)` be documented as stable plugin API or replaced?
- What is the preferred host API shape for future AIS workflows: one high-level dialog API or several smaller actions?
- For late-mounted HTML cluster widgets, should dyninstruments use a rescan-based theme application or a DOM observer?
- Does the `ActiveRouteWidget.jsx` `isAproaching` typo affect live behavior, or is it dead code in practice?
- At what point should `nav` be split once active-workflow kinds are added?

## Relevant Information

- The current plugin already supports `renderHtml` and `this.eventHandler` at the registered-widget boundary. The missing piece is carrying that capability through the cluster pipeline.
- Because these features stay inside `dyni_Nav_Instruments`, page-specific core click handlers keyed by built-in widget names cannot be reused directly.
- Current viewer source exposes `window.avnav.api.routePoints`, but maintainer guidance says there is no general plugin-action concept here yet. Treat it as runtime-exposed workaround surface, not stable plugin API.
- Workaround code for this gap must be tagged with `// dyni-workaround(avnav-plugin-actions) -- <reason>` so it can be found and retired later.
- Core interaction ownership is mixed even among nearby widgets:
  - passive renderer + page click routing (`Zoom`, `ActiveRoute`, `EditRoute`)
  - widget-owned click target + page/API workflow (`RoutePoints`, `AisTarget`)
  - page-shell widget ownership (`Alarm`)
  - fully passive display (`CenterDisplay`)
- The plan intentionally removes backward-compatibility strategies because the plugin is not released yet. The temporary summary-style `activeRoute` path should be replaced directly instead of carried forward.
- The safest implementation order is:
  1. extend cluster HTML support and HTML theming infrastructure
  2. expand the `nav` cluster contract
  3. implement the HTML sub-renderers
  4. wire workflows through plugin-owned handlers first
  5. verify parity and run `npm run check:all`

## Related

- [TABLEOFCONTENTS.md](TABLEOFCONTENTS.md)
- [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)
- [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- [widgets/active-route.md](widgets/active-route.md)
