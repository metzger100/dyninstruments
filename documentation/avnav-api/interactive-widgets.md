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
renderHtml: function(props) {
  this.eventHandler.catchAll = function() {};
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

## Recommendation for dyninstruments

For a Regatta Timer or similar control-heavy widget:

1. Use `renderHtml` string mode with `this.eventHandler`.
2. Add a wrapper-level no-op catch-all click handler.
3. Register all control handlers in `this.eventHandler`.
4. Prefer `wantsHideNativeHead: true` to maximize safe interactive area.
5. Manage lifecycle with `initFunction` / `finalizeFunction`, and refresh UI via `triggerRedraw()`.

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — registration, `eventHandler`, lifecycle hooks
- [editable-parameters.md](editable-parameters.md) — parameter definitions for interactive widgets
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md) — cluster routing for non-interactive renderers
