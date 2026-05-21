# Regatta Timer HTML Renderer

**Status:** ✅ Implemented | Interactive countdown/sync/elapsed timer for `vessel/regattaTimer`

## Overview

`RegattaTimerTextHtmlWidget` is the committed HTML renderer for the vessel `regattaTimer` kind. It provides Start/Sync/Reset controls, countdown-to-elapsed transition, optional progress strip, and Web Audio signal playback for regatta start sequences.

Bundled layout integration:

- `layouts/dyni-sailboat.json` includes a dedicated `regattapage` with a `dyni_Vessel_Instruments` entry using `kind: "regattaTimer"` plus race-start companion instruments.

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
  - display block: `.dyni-regatta-display`
  - digits: `.dyni-regatta-time.dyni-tabular`
  - controls: `.dyni-regatta-controls`
  - actions: `.dyni-regatta-btn-*` with `data-dyni-action` (`regatta-start`, `regatta-sync`, `regatta-reset`)
  - optional strip: `.dyni-regatta-bar`
- Core layout constants from fit owner (`shared/widget-kits/vessel/RegattaTimerHtmlFit.js`):
  - `MIN_BUTTON_TAP_TARGET_PX = 32`
  - high mode share: display `0.68`, controls `0.32`
  - normal mode share: display `0.62`, controls `0.38`
  - flat mode share: display `1.0`, controls `1.0`
  - fit cache key: `__dyniRegattaTimerHtmlFitCache`

## State Machine

| State | Display | Actions |
|---|---|---|
| `idle` | configured duration (`MM:00`) | `START` |
| `countdown` | remaining `MM:SS` | `SYNC`, `RESET` |
| `elapsed` | elapsed `MM:SS` | `RESET` |

Transitions:

- `idle` -> `countdown`: `start()`
- `countdown` -> `elapsed`: countdown reaches `0:00`
- `countdown` -> `countdown`: `sync()` snaps to lower signal point
- `*` -> `idle`: `reset()`

## Sync Algorithm

- Signal points are derived from duration and include: `duration:00`, `(duration-1):00`, `4:00`, `1:00`, `0:00` (deduped and range-clamped).
- `sync()` selects the highest point strictly below the current value, using `SYNC_GRACE_SECONDS = 1`.
- If target is `0`, the model transitions immediately to `elapsed`.

## Audio Signal Contract

| Event | Signal | Constants |
|---|---|---|
| Whole-minute boundaries during countdown | low beep | `440 Hz`, `300 ms` |
| Final `0:10` to `0:01` | high beep every second | `880 Hz`, `150 ms` |
| Countdown reaches `0:00` | long high tone | `880 Hz`, `800 ms` |

Audio engine details:

- Web Audio owner: `shared/widget-kits/vessel/RegattaTimerAudio.js`
- `AudioContext` is created lazily via `ensureContext()` on user interaction.
- Tone shaping uses `GainNode` envelope (`ATTACK_SECONDS = 0.005`, `RELEASE_SECONDS = 0.01`).

## Theme Tokens

| Token path | Output var | Default | Night default |
|---|---|---|---|
| `colors.regatta.barWarning` | `--dyni-theme-regatta-barWarning` | `#e7a834` | `rgba(231, 168, 52, 0.60)` |
| `colors.regatta.barCritical` | `--dyni-theme-regatta-barCritical` | `#FA584A` | `rgba(250, 88, 74, 0.60)` |
| `colors.regatta.barDefault` | `--dyni-theme-regatta-barDefault` | `#70B0F3` | `rgba(112, 176, 243, 0.60)` |

Presets:

- `default`, `darkmode`, and `highcontrast` define base/night overrides in `runtime/theme/model.js`.

## Editable Parameters

| Key | Type | Default | Condition |
|---|---|---|---|
| `regattaSoundEnabled` | `BOOLEAN` | `true` | `{ kind: "regattaTimer" }` |
| `regattaProgressBar` | `BOOLEAN` | `true` | `{ kind: "regattaTimer" }` |
| `regattaDuration` | `SELECT` (`3`, `5`, `6`) | `5` | `{ kind: "regattaTimer" }` |
| `regattaTimerRatioThresholdNormal` | `FLOAT` (`0.5..2.0`) | `1.0` | `{ kind: "regattaTimer" }` |
| `regattaTimerRatioThresholdFlat` | `FLOAT` (`1.5..6.0`) | `3.0` | `{ kind: "regattaTimer" }` |

## Responsive Mode Matrix

| Mode | Layout |
|---|---|
| `high` | single-column grid, display above controls |
| `normal` | single-column grid, display above controls with tighter display share |
| `flat` | two-column grid, timer block left and controls right |

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
