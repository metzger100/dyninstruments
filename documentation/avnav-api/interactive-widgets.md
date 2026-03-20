# Interactive Widgets — Preventing Instrument-Page Click-to-Navigate (`GpsPage`)

**Status:** ✅ Reference | Special-case guidance for interactive widget behavior on AvNav's instrument dashboard page (`GpsPage`)

## Overview

On AvNav's instrument dashboard page (`GpsPage`), widget clicks normally navigate back to NavPage (`history.pop()`). This guide documents the plugin-safe way to keep button/timer/toggle interactions inside a widget without triggering page navigation.

## Key Details

- Default click flow is: `GpsPage.onItemClick` -> `ItemList` delegated click -> `WidgetFrame` outer `onClick` -> `history.pop()`.
- `WidgetFactory.registerWidget()` treats `onClick` as reserved, so plugin widget definitions cannot override it directly.
- `WidgetFrame` binds click handling at the outer widget container level; any bubbled click can trigger navigation.
- For interactive content, block propagation inside the plugin-rendered area.
- Native `WidgetHead` (caption/unit bar) sits outside plugin content; clicks there still navigate unless hidden (`wantsHideNativeHead: true`).
- Current viewer source exposes `window.avnav.api.routePoints`, and core pages register handlers on it, but maintainer guidance does not treat this as a documented/stable general plugin-action API.
- For missing route/AIS/editor workflow APIs, the accepted near-term path is plugin-owned `renderHtml` / React handlers first; treat AvNav-side actions only as optional fallback behavior.
- Mark any such workaround code with `// dyni-workaround(avnav-plugin-actions) -- <reason>` so it can be found and retired later.

## API/Interfaces

### Event Chain Snapshot (AvNav Source Analysis)

| Component | Behavior |
|---|---|
| `viewer/gui/GpsPage.jsx` | Default widget click path ends at `history.pop()` unless special-cased |
| `viewer/components/ItemList.jsx` | Delegates click to page handler when widget has no own `onClick` |
| `viewer/components/WidgetFactory.jsx` | Blocks plugin-defined `onClick` (reserved parameter) |
| `viewer/components/WidgetBase.jsx` | `WidgetFrame` outer `<div>` receives bubbled clicks |

### Approach A: `renderHtml` String + `this.eventHandler` (Recommended)

`ExternalWidget` wraps `this.eventHandler` callbacks and calls `ev.stopPropagation()` and `ev.preventDefault()` before invoking the handler.

```javascript
initFunction: function() {
  this.eventHandler.catchAll = function() {};
},
renderHtml: function(props) {
  this.eventHandler.startTimer = function() { startCountdown(); };
  this.eventHandler.stopTimer = function() { stopCountdown(); };

  return ''
    + '<div class="timer-wrap" onclick="catchAll">'
    +   '<div class="timer-value">' + formatTime(props.timerValue) + '</div>'
    +   '<button onclick="startTimer">Start</button>'
    +   '<button onclick="stopTimer">Stop</button>'
    + '</div>';
}
```

Use a wrapper `onclick="catchAll"` so empty-space taps inside the widget also stop bubbling.

For dyninstruments cluster HTML kinds, only `catchAll` is global. Named handlers are session-owned by `HtmlSurfaceController` and are attached/removed via `attach`/`detach`/`destroy`.

### Approach B: `renderHtml` Returning React/HTM Elements

When returning React elements, propagation control is manual (no auto-wrap).

```javascript
const blockNav = function(ev) { ev.stopPropagation(); };
return HTM`
  <div onClick=${blockNav}>
    <button onClick=${(ev) => { ev.stopPropagation(); startCountdown(); }}>
      Start
    </button>
  </div>
`;
```

## Caveats and Edge Cases

- `WidgetHead` remains clickable unless hidden; this is expected and can be used as an edit target.
- In layout edit mode, clicks that reach `WidgetFrame` open widget editing; clicks blocked inside interactive content do not.
- Touch interactions are usually covered by click propagation control; if raw touch handlers are used, apply propagation control there as well.
- `renderCanvas`-only widgets cannot attach inner DOM handlers; pair with `renderHtml` controls when interaction is needed.

## Host Workflow Caveat

- Do not treat source-visible page helpers or dialog wiring as plugin-safe API just because they are reachable in the current core tree.
- Avoid private-core coupling to `RouteEdit`, `NavData`, page-local `history`, or `AisInfoWithFunctions`.
- If parity needs a runtime-exposed helper such as `avnav.api.routePoints.activate(index)`, keep the usage narrow, guard it, and tag the block with the workaround marker.

## Recommendation for dyninstruments

For a Regatta Timer or similar control-heavy widget:

1. Register `catchAll` once in `initFunction`.
2. Render an interactive wrapper with `onclick="catchAll"`.
3. Attach named control handlers only for the active HTML surface session.
4. Remove named handlers on remount/surface switch/destroy.
5. Implement `resizeSignature(props)` and trigger `triggerResize()` on layout-relevant changes.
6. Prefer `wantsHideNativeHead: true` to maximize safe interactive area.

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — registration, `eventHandler`, lifecycle hooks
- [editable-parameters.md](editable-parameters.md) — parameter definitions for interactive widgets
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md) — cluster routing for non-interactive renderers
