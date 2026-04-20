# Alarm HTML Renderer

**Status:** ✅ Implemented | Native HTML alarm tile for `vessel/alarm`

## Overview

`AlarmTextHtmlWidget` renders the vessel alarm summary/control tile on the committed HTML surface path.

## Key Details

- Route tuple: `cluster: "vessel"`, `kind: "alarm"`, `viewModelId: "AlarmViewModel"`, `rendererId: "AlarmTextHtmlWidget"`, `surface: "html"`
- Source of truth: `nav.alarms.all`
- Active alarm names come from the alarm-map object keys, not from nested alarm labels
- Theme ownership lives in `ThemeModel` via `colors.alarmWidget.bg`, `colors.alarmWidget.fg`, and `colors.alarmWidget.strip`
- `user.css` can override the widget through `--dyni-alarm-widget-bg`, `--dyni-alarm-widget-fg`, and `--dyni-alarm-widget-strip`
- Active summary rules:
  - `0` active alarms -> `NONE`
  - `1` active alarm -> `name`
  - `2` active alarms -> `name1, name2`
  - `3+` active alarms -> `name1, name2 +N`
- Ordering contract follows the native `AlarmHandler.sortedActiveAlarms(...)` behavior:
  - source order is preserved within the same category
  - defined categories sort before undefined categories
  - `critical` sorts before `info`
- Idle state:
  - caption defaults to `ALARM`
  - value is `NONE`
  - blue strip visible
  - passive interaction
  - standard dyn surface background
- Active state:
  - caption is `ALARM`
  - value shows the sorted active alarm names
  - red alarm background is visible
  - blue strip is hidden
  - whole-tile dispatch is only enabled when `surfacePolicy.interaction.mode === "dispatch"`

## API / Interfaces

| Path | Contract |
|---|---|
| `surfacePolicy.actions.alarm.stopAll()` | Dispatches the core stop-all workflow when capability is available |
| `surfacePolicy.interaction.mode` | `dispatch` or `passive` |
| `getVerticalShellSizing()` | `{ kind: "ratio", aspectRatio: 2 }` |
| `colors.alarmWidget.bg` | Alarm background token |
| `colors.alarmWidget.fg` | Alarm foreground token |
| `colors.alarmWidget.strip` | Idle strip token |

## Scope Boundary

- Dyninstruments covers `vessel/alarm`
- The injected core Alarm badge is intentionally not replaced
- No dyn-managed overlay workaround is part of this rollout

## Behavior Boundary

- Idle Alarm remains visible even when the host suppresses the native injected badge
- Active Alarm remains visible but passive when host stop-all dispatch is unavailable

## Related

- [shared/theme-tokens.md](../shared/theme-tokens.md)
- [guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
- [widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js](../../widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js)
