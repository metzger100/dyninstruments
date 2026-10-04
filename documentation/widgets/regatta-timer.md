# Regatta Timer HTML Renderer

**Status:** Current.

## Overview

`RegattaTimerTextHtmlWidget` is the committed HTML renderer for the vessel `regattaTimer` kind. It provides
Start/Sync/Reset controls, countdown-to-elapsed transition, optional progress strip, and Web Audio signal playback for
regatta start sequences.

Bundled layout integration:

- `layouts/dyni-sailboat.json` includes a dedicated `regattapage` with a `dyni_Vessel_Instruments` entry using
  `kind: "regattaTimer"` plus race-start companion instruments.

## Key Details

- Renderer class: `RegattaTimerTextHtmlWidget`, for cluster kind `regattaTimer` in the `vessel` cluster; render model:
  `shared/widget-kits/vessel/RegattaTimerModel.js`; audio engine: `shared/widget-kits/vessel/ RegattaTimerAudio.js`.
- States: `idle` (shows configured duration `MM:00`, action `START`), `countdown` (remaining `MM:SS`, actions
  `SYNC`/`RESET`), `elapsed` (elapsed `MM:SS`, action `RESET`).
- Editables: `regattaSoundEnabled` (default `true`), `regattaProgressBar` (default `true`), `regattaDuration`
  (`3`/`5`/`6` minutes, default `5`), `stableDigits` (default `false`), `regattaTimerRatioThresholdNormal` (default
  `1.0`), `regattaTimerRatioThresholdFlat` (default `3.0`).
- Audio signals: whole-minute boundaries during countdown play a `440 Hz`/`300 ms` beep; the final `0:10`-`0:01` plays
  an `880 Hz`/`150 ms` beep each second; reaching `0:00` plays an `880 Hz`/`800 ms` tone.
- Bundled layout: `layouts/dyni-sailboat.json` includes a `regattapage` with a `dyni_Vessel_Instruments` entry using
  `kind: "regattaTimer"`.

## Visual Contract

- Root and wrapper classes:
  - `.dyni-regatta-root`
  - `.dyni-regatta-html`
- State classes:
  - phase: `.dyni-regatta-phase-idle`, `.dyni-regatta-phase-countdown`, `.dyni-regatta-phase-elapsed`
  - color phase: `.dyni-regatta-color-normal`, `.dyni-regatta-color-warning`, `.dyni-regatta-color-critical`
  - mode: `.dyni-regatta-mode-high`, `.dyni-regatta-mode-normal`, `.dyni-regatta-mode-flat`
  - interaction: `.dyni-regatta-open-dispatch`, `.dyni-regatta-open-passive`
- Layering and structure:
  - wrapper: `.dyni-regatta-html`
  - optional strip: `.dyni-regatta-bar` (direct wrapper child, top edge overlay)
  - display block: `.dyni-regatta-display`
  - digits: `.dyni-regatta-time` (`.dyni-tabular` only when `stableDigits` is enabled)
  - controls: `.dyni-regatta-controls`
  - actions: `.dyni-regatta-btn-*` with `data-dyni-action` (`regatta-start`, `regatta-sync`, `regatta-reset`)
- Core layout constants from fit owner (`shared/widget-kits/vessel/RegattaTimerHtmlFit.js`):
  - `BAR_HEIGHT_FROM_WIDGET_HEIGHT_RATIO = 0.03`
  - Button outline width is computed from `GeometryScale.scaleStroke(minSide, 0.026, strokeWeight, 1)` and capped to 18%
    of the smaller button side.
  - high mode share: display `0.68`, controls `0.32`
  - normal mode share: display `0.62`, controls `0.38`
  - flat mode share: display `1.0`, controls `1.0`
  - fit cache key: `__dyniRegattaTimerHtmlFitCache`; the cached signature includes the surface `fontMetricsEpoch`, so
    the fit is recomputed once web fonts finish loading

## State Machine

| State       | Display                       | Actions         |
| ----------- | ----------------------------- | --------------- |
| `idle`      | configured duration (`MM:00`) | `START`         |
| `countdown` | remaining `MM:SS`             | `SYNC`, `RESET` |
| `elapsed`   | elapsed `MM:SS`               | `RESET`         |

Transitions:

- `idle` -> `countdown`: `start()`
- `countdown` -> `elapsed`: countdown reaches `0:00`; elapsed time counts from the countdown end
- `countdown` -> `countdown`: `sync()` snaps to a signal point (see below)
- `*` -> `idle`: `reset()`

## Sync Algorithm

- Signal points are derived from duration and include: `duration:00`, `(duration-1):00`, `4:00`, `1:00`, `0:00` (deduped
  and range-clamped), for example `6:00`, `5:00`, `4:00`, `1:00`, `0:00` for a 6-minute duration and `5:00`, `4:00`,
  `1:00`, `0:00` for a 5-minute duration.
- Let `remaining` be the unrounded seconds left. `sync()` targets the highest signal point `p` with `p <= remaining + 1`
  (`SYNC_SNAP_TOLERANCE_SECONDS = 1`): within ±1 s of a point it snaps to that point, otherwise it snaps to the next
  lower point. For a 6-minute duration, 299.2 s and 301.0 s snap to `05:00`, 298.9 s snaps to `04:00`, 59.2 s snaps to
  `01:00`, and 58.5 s starts the elapsed phase.
- If the target is `0`, the model transitions immediately to `elapsed`, with elapsed time starting at the press.

## Elapsed Time and Missed Signals

- Elapsed time is anchored to the countdown end (`endTimeMs`), both for the natural transition and when a countdown
  snapshot whose end already passed is restored after a remount, so a late tick or a remount shows the true time since
  the start instead of restarting at `00:00`.
- A tick that skipped at most 2 countdown seconds still emits the minute and final-ten-second signals it crossed; a
  later tick drops them instead of replaying a burst of stale beeps.
- The start tone plays only when the tick that observes the countdown end is at most 2 s late.

## Audio Signal Contract

| Event                                    | Signal                 | Constants          |
| ---------------------------------------- | ---------------------- | ------------------ |
| Whole-minute boundaries during countdown | low beep               | `440 Hz`, `300 ms` |
| Final `0:10` to `0:01`                   | high beep every second | `880 Hz`, `150 ms` |
| Countdown reaches `0:00`                 | long high tone         | `880 Hz`, `800 ms` |

Audio engine details:

- Web Audio owner: `shared/widget-kits/vessel/RegattaTimerAudio.js`
- One `AudioContext` per page lives in the audio module scope and is shared by every engine. The widget creates a new
  engine on every mount, so signals keep playing after a remount.
- `ensureContext()` creates the shared context on first use and resumes it when it is suspended; the widget calls it
  from the `START`, `SYNC`, and `RESET` handlers, which run inside a user gesture.
- `destroy()` releases an engine but never closes the shared context.
- Tone shaping uses `GainNode` envelope (`ATTACK_SECONDS = 0.005`, `RELEASE_SECONDS = 0.01`).
- The click handler is rebound whenever the interaction state changes, so a wrapper kept across patches stops
  intercepting clicks as soon as the widget becomes passive (layout editing).

## Theme Tokens

| Token path                   | Output var                          | Default   | Night default             |
| ---------------------------- | ----------------------------------- | --------- | ------------------------- |
| `colors.regatta.barWarning`  | `--dyni-theme-regatta-bar-warning`  | `#e0a92e` | `#8b6914`                 |
| `colors.regatta.barCritical` | `--dyni-theme-regatta-bar-critical` | `#d9534a` | `rgba(250, 88, 74, 0.60)` |
| `colors.regatta.barDefault`  | `--dyni-theme-regatta-bar-default`  | `#3366cc` | `#cc2222`                 |

Presets:

- `default`, `darkmode`, and `highcontrast` define base/night overrides in `runtime/theme/model.js`.
- `barWarning` cascades from global `--dyni-warning` when `--dyni-regatta-bar-warning` is not explicitly set.
- `barCritical` cascades from global `--dyni-alarm` when `--dyni-regatta-bar-critical` is not explicitly set.
- `barDefault` cascades from global `--dyni-info` when `--dyni-regatta-bar-default` is not explicitly set.
- Button outline width uses `--dyni-regatta-button-stroke-weight`, which inherits from `--dyni-stroke-weight` when
  unset.
- Deprecated input aliases still resolve with warning: `--dyni-regatta-barWarning`, `--dyni-regatta-barCritical`, and
  `--dyni-regatta-barDefault`.

## Editable Parameters

| Key                                | Type                     | Default | Condition                  |
| ---------------------------------- | ------------------------ | ------- | -------------------------- |
| `regattaSoundEnabled`              | `BOOLEAN`                | `true`  | `{ kind: "regattaTimer" }` |
| `regattaProgressBar`               | `BOOLEAN`                | `true`  | `{ kind: "regattaTimer" }` |
| `regattaDuration`                  | `SELECT` (`3`, `5`, `6`) | `5`     | `{ kind: "regattaTimer" }` |
| `stableDigits`                     | `BOOLEAN`                | `false` | `{ kind: "regattaTimer" }` |
| `regattaTimerRatioThresholdNormal` | `FLOAT` (`0.5..2.0`)     | `1.0`   | `{ kind: "regattaTimer" }` |
| `regattaTimerRatioThresholdFlat`   | `FLOAT` (`1.5..6.0`)     | `3.0`   | `{ kind: "regattaTimer" }` |

Notes:

- `caption_regattaTimer` and `unit_regattaTimer` are hidden in editor UI (renderer does not display them).

## Responsive Mode Matrix

| Mode     | Layout                                                                |
| -------- | --------------------------------------------------------------------- |
| `high`   | single-column grid, display above controls                            |
| `normal` | single-column grid, display above controls with tighter display share |
| `flat`   | two-column grid, timer block left and controls right                  |

## Required HTML-Kind Test Matrix Checklist

- [ ] route resolves to html surface and committed renderer factory
- [ ] inert shell contains mount host and no semantic content
- [ ] committed renderer mount/update/detach/destroy behavior
- [ ] shadow CSS preload/injection for this renderer
- [ ] dispatch vs passive listener ownership
- [ ] dispatch-mode blank-space click suppression
- [ ] layoutSignature-driven relayout and bounded postPatch behavior
- [ ] route metadata `shellSizing` and committed shadow CSS sizing behavior

## Related

- [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
- [../../widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js](../../widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js)
- [../../shared/widget-kits/vessel/RegattaTimerModel.js](../../shared/widget-kits/vessel/RegattaTimerModel.js)
