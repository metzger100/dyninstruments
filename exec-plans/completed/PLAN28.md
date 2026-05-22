# PLAN28 — Interactive Regatta Timer Widget in Vessel Cluster

## Status



## Goal

After PLAN28 is complete:

1. The vessel cluster offers a new `regattaTimer` kind — an interactive HTML widget that provides a countdown timer for standard sailing regatta starts with acoustic signals, sync capability, and elapsed race time.

2. A sailor can press **Start** to begin a configurable countdown (default 5 minutes), press **Sync** to snap the timer to the next whole-minute signal point below the current value (enabling rapid correction or late entry via Start → Sync → Sync…), and press **Reset** to return to idle. After the countdown reaches 0:00, the timer counts up as elapsed race time.

3. Acoustic signals use the **Web Audio API** (`OscillatorNode`) with two distinct pitches: a **low tone** (single beep) at each whole minute mark during countdown, and a **high tone** (short beeps) every second during the final 10 seconds, concluding with a long high tone at 0:00 (start). Zero audio asset files are shipped.

4. A thin horizontal **progress bar** (visually the same like the alarm/AIS accent strip but horizontal) optionally shows countdown position. The bar and timer digits shift color in the **final minute** (warning) and **final 10 seconds** (critical), using new regatta-specific theme tokens with full night-mode and preset support.

5. All new theme tokens (`colors.regatta.barWarning`, `colors.regatta.barCritical`, `colors.regatta.barDefault`) are defined in `runtime/theme/model.js` with day defaults, night defaults, and per-preset overrides for `default`, `darkmode`, and `highcontrast`. They are materialized as `--dyni-theme-*` output vars and consumable from both shadow CSS and JS token snapshots.

6. Created an extra regatta layout page on the sailboat layout for regatta usecases.

7. The widget follows all project conventions: UMD component pattern, committed HTML renderer lifecycle (`mount`/`update`/`postPatch`/`detach`/`destroy`), shadow-local CSS consuming migrated output vars, responsive ratio-mode adaptation (high/normal/flat), direct DOM listener interaction under dispatch/passive policy, mandatory file headers, and ≤400-line file targets.

8. All existing tests pass. New tests cover the timer state machine, audio scheduling logic, sync algorithm, mapper translation, route resolution, and the required HTML-kind test matrix.

---

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`
4. `documentation/guides/add-new-html-kind.md`
5. `documentation/guides/add-new-cluster.md`
6. `documentation/shared/html-widget-visual-style-guide.md`
7. `documentation/shared/theme-tokens.md`
8. `documentation/architecture/html-renderer-lifecycle.md`

---

## UX Concept

### User scenario

The sailor is approaching the start line. The race committee fires the 5-minute warning signal. The sailor is mid-maneuver, hands wet, boat heeling. They glance at the widget and tap **Start** — possibly 20, 40, or even 90 seconds late. The timer begins counting from the configured duration (default 5:00). The timer is now ahead of reality. When the 4-minute preparatory gun fires, the sailor taps **Sync** — the timer snaps to 4:00 at that instant. If he is later than 90 seconds he has to sync to 1:00 Minuta signal of course by tapping sync two times. The timer is now perfectly aligned. Acoustic beeps mark each subsequent minute and count down the final 10 seconds. At 0:00 the race starts. The timer switches to counting up, showing elapsed race time until Reset.

### State machine

```
IDLE ──[Start]──▶ COUNTDOWN ──[reaches 0:00]──▶ ELAPSED
  ▲                   │   │                         │
  │                   │   └──[Sync]──▶ COUNTDOWN    │
  └──[Reset]──────────┴─────────────────────────────┘
```

| State         | Display                         | Buttons visible |
| ------------- | ------------------------------- | --------------- |
| **IDLE**      | Configured duration (e.g. 5:00) | Start           |
| **COUNTDOWN** | MM:SS counting down             | Sync, Reset     |
| **ELAPSED**   | MM:SS counting up               | Reset           |

### Sync algorithm

Sync snaps to the highest start signal value that is **strictly less than** the current timer value (with a ≤1-second grace zone so that landing exactly on a minute boundary allows advancing to the next one).

Signal points for a 5-minute countdown: 5:00, 4:00, 1:00, 0:00.

Signal points for a 6-minute countdown: 6:00, 5:00, 4:00, 1:00, 0:00.

Signal points for a 3-minute countdown: 3:00, 2:00, 1:00, 0:00

Examples:

- Timer at 4:25 → Sync → 4:00 (heard the 4-minute gun)
- Timer at 4:00 → Sync → 1:00 (rapid skip)
- Preparation (6:00) → Start (5:00) → Sync → 4:00 → Sync → 1:00 (late entry)

### Audio signal pattern

| Timer value                                      | Signal                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| Each whole minute (5:00, 4:00, 3:00, 2:00, 1:00) | Single **low tone** (440 Hz, 300 ms)             |
| 0:10 through 0:01                                | Short **high tone** each second (880 Hz, 150 ms) |
| 0:00                                             | Long **high tone** (880 Hz, 800 ms) — START      |

Web Audio API `AudioContext` is created on the first user gesture (Start button press), satisfying browser autoplay policy. The `OscillatorNode` uses a sine waveform for clean audibility on cockpit speakers.

### Visual design

- **Timer digits** dominate the widget area. Monospace rendering (`dyni-tabular`) for column-stable countdown.
- **Button** is sized for touch on a moving boat — minimum tap target enforced by layout math.
- **Progress bar** (optional via config): thin horizontal strip along the top edge, shrinking toward zero. Inspired by the alarm/AIS accent strip but horizontal.
- **Color shifts** via theme tokens:
  - Normal countdown: standard foreground (`--dyni-theme-surface-fg`)
  - Final minute (1:00–0:11): regatta warning color
  - Final 10 seconds (0:10–0:00): regatta critical color
  - Elapsed: standard foreground

### Responsive layout modes

The widget adapts to aspect ratio via the standard ratio-threshold system:

| Mode       | Layout                                                   |
| ---------- | -------------------------------------------------------- |
| **high**   | Timer stacked above buttons                               |
| **normal** | Timer prominent, buttons below                             |
| **flat**   | Timer and buttons side by side (timer left, buttons right) |

Buttons, Timer and Strip sizing scales with widget dimensions.

---

## Product Decisions Resolved During Scoping

| Decision            | Resolution                                                | Rationale                                                                     |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Audio generation    | Web Audio API (programmatic `OscillatorNode`)             | Zero asset payload, precise pitch/duration control, universal browser support |
| Sync behavior       | Snap to next signal point strictly below current value    | Forward-looking sync; rapid multi-tap for late entry (Start, Sync, Sync…)     |
| Post-start behavior | Count up as elapsed race time + Reset                     | Useful for tactical decisions during the race                                 |
| Progress bar        | Optional thin horizontal strip                            | Alarm/AIS accent strip style, configurable via editable                       |
| Color shifts        | Final minute (warning) + final 10 seconds (critical)      | Theme token–driven, customizable, night-mode compatible                       |
| Countdown duration  | Configurable, default 5 minutes                           | Accommodates non-standard sequences (3-min, 6-min)                            |
| Signal points       | Every whole minute (not only official 5/4/1/0)            | Provides audible checkpoints during the silent 4:00→1:00 gap                  |
| Timer accuracy      | `Date.now()`-based absolute time, not relative increments | Immune to `setInterval` drift and background-tab throttling                   |

---

## Repository Findings

### Existing infrastructure to reuse

| Infrastructure                                         | Location                                               | Use in regatta timer                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HtmlWidgetUtils`                                      | `shared/widget-kits/html/HtmlWidgetUtils.js`           | `patchInnerHtml`, `escapeHtml`, `toStyleAttr`, `applyMirroredContext`, `resolveSurfacePolicy`, `resolveRatioModeForRect`, `canDispatchSurfaceInteraction`, `isEditingMode` |
| `ValueMath`                                            | `shared/widget-kits/value/ValueMath.js`                | `toFiniteNumber`, `toOptionalFiniteNumber`, `toObject`                                                                                                                     |
| `HtmlShadowCommon.css`                                 | `shared/html/HtmlShadowCommon.css`                     | `.dyni-tabular` for monospace digits                                                                                                                                       |
| Theme token system                                     | `runtime/theme/model.js`, `runtime/theme/resolver.js`  | New regatta tokens, night mode, presets, output var materialization                                                                                                        |
| `componentContext.theme.tokens.resolveForRoot(rootEl)` | `runtime/theme-runtime.js`                             | JS-side token access for audio/color decisions                                                                                                                             |
| Ratio-mode helpers                                     | `HtmlWidgetUtils.resolveRatioModeForRect()`            | Responsive high/normal/flat layout selection                                                                                                                               |
| `PreparedPayloadModelCache`                            | `shared/widget-kits/html/PreparedPayloadModelCache.js` | Memoized model reuse across `layoutSignature`/`update`                                                                                                                     |
| Committed renderer pattern                             | `AlarmTextHtmlWidget`, `MapZoomTextHtmlWidget`         | Reference implementations for HTML renderer lifecycle, interaction dispatch, shadow CSS                                                                                    |
| `StateScreenLabels` / `StateScreenMarkup`              | `shared/widget-kits/state/`                            | Editing-mode state screen rendering                                                                                                                                        |

### Theme token integration pattern

New tokens follow the established `defineToken(path, inputVar, type, defaultValue, defaultByMode, outputVar)` pattern. Tokens with `outputVar` are automatically materialized by `runtime.theme.applyToRoot()`. Shadow CSS consumes them via `var(--dyni-theme-regatta-*, fallback)`. Canvas/JS code consumes them via `tokens.colors.regatta.*`.

Night mode: regatta colors shift to reduced-opacity variants matching the existing night mode vocabulary (60% opacity reds). Presets (`darkmode`, `highcontrast`) override with tuned values.

### Timer implementation pattern

The timer uses `Date.now()` to compute remaining/elapsed time relative to an absolute `endTime` (for countdown) or `startTime` (for elapsed). A `setInterval` at ~100 ms drives display updates and audio scheduling. On each tick, the model checks whether a signal boundary has been crossed since the last tick and triggers the appropriate tone.

`setInterval` is only used for display refresh — actual time computation is always `Date.now()`-based, so background-tab throttling causes visual stutter at worst, never timing drift. When the tab returns to foreground, the next tick immediately shows the correct time.

The `AudioContext` is created lazily on the first Start press (user gesture), stored on the renderer closure, and closed on destroy.

---

## Implementation Phases

### Phase 1: Theme tokens

**Goal:** Add regatta color tokens with night mode and preset support.

**Files modified:**

1. `runtime/theme/model.js`
   
   - Add three token definitions to `TOKEN_DEFS`:
     
     ```
     defineToken("colors.regatta.barWarning",  "--dyni-regatta-barWarning",  "color", "#e7a834", { night: "rgba(231, 168, 52, 0.60)" }, "--dyni-theme-regatta-barWarning")
     defineToken("colors.regatta.barCritical", "--dyni-regatta-barCritical", "color", "#FA584A", { night: "rgba(250, 88, 74, 0.60)" }, "--dyni-theme-regatta-barCritical")
     defineToken("colors.regatta.barDefault",      "--dyni-regatta-barDefault",      "color", "#70B0F3", { night: "rgba(112, 176, 243, 0.60)" }, "--dyni-theme-regatta-barDefault")
     ```
   - Add regatta token overrides to `PRESETS.default.night`, `PRESETS.darkmode.base`, `PRESETS.darkmode.night`, `PRESETS.highcontrast.base`, `PRESETS.highcontrast.night`

2. `documentation/shared/theme-tokens.md`
   
   - Add "Regatta Timer Tokens" section documenting the three new tokens, their input vars, defaults, night defaults, and preset overrides
   - Add paths to "Exposed Semantic Token Paths" list
   - Add input vars to "Public Input Variables" list
   - Add output vars to "Materialized Output Variables" list

**Verification:**

- Existing tests pass (theme model snapshot tests may need updating for new token count)
- `resolveForRoot` returns regatta tokens in day and night mode
- Output vars are materialized on committed roots

### Phase 2: Kind defaults and cluster config

**Goal:** Register `regattaTimer` as a vessel cluster kind with editable parameters.

**Files modified:**

1. `config/shared/kind-defaults.js`
   
   - Add `regattaTimer: { cap: "REGATTA", unit: "" }` to `VESSEL_KIND`

2. `config/clusters/vessel.js`
   
   - Add `opt("Regatta timer", "regattaTimer")` to the `kind` SELECT list
   - Add editable parameters:
     
     ```javascript
     regattaSoundEnabled: {
       type: "BOOLEAN",
       default: true,
       name: "Acoustic signals",
       condition: { kind: "regattaTimer" }
     },
     regattaProgressBar: {
       type: "BOOLEAN",
       default: true,
       name: "Show progress bar",
       condition: { kind: "regattaTimer" }
     },
     regattaDuration: {
       type: "SELECT",
       list: [opt("5 Minutes", 5), opt("6 Minutes", 6), opt("3 Minutes", 3)],
       default: 5,
       name: "Countdown (minutes)",
       condition: { kind: "regattaTimer" }
     }
     ```
   - Add internal ratio thresholds conditioned on `{ kind: "regattaTimer" }`:
     
     ```javascript
     regattaTimerRatioThresholdNormal: {
       type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
       internal: true,
       name: "RegattaTimer: Normal Threshold",
       condition: { kind: "regattaTimer" }
     },
     regattaTimerRatioThresholdFlat: {
       type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
       internal: true,
       name: "RegattaTimer: Flat Threshold",
       condition: { kind: "regattaTimer" }
     }
     ```

**Verification:**

- Existing config tests pass
- Kind SELECT includes `regattaTimer`
- Editables resolve correct defaults and conditions

### Phase 3: Route metadata and mapper

**Goal:** Wire the regatta timer kind to a new HTML renderer via route metadata and mapper translation.

**Files modified:**

1. `config/cluster-routes/vessel.js`
   
   - Add route entry:
     
     ```javascript
     {
       cluster: "vessel",
       kind: "regattaTimer",
       mapperId: "VesselMapper",
       rendererId: "RegattaTimerTextHtmlWidget",
       surface: "html",
       shellSizing: { kind: "ratio", aspectRatio: 2 }
     }
     ```

2. `cluster/mappers/VesselMapper.js`
   
   - Add `regattaTimer` kind branch:
     
     ```javascript
     if (req === "regattaTimer") {
       return {
         caption: cap("regattaTimer"),
         unit: unit("regattaTimer"),
         rendererProps: {
           regattaSoundEnabled: p.regattaSoundEnabled !== false,
           regattaProgressBar: p.regattaProgressBar !== false,
           regattaDuration: p.regattaDuration,
           regattaTimerRatioThresholdNormal: num(p.regattaTimerRatioThresholdNormal),
           regattaTimerRatioThresholdFlat: num(p.regattaTimerRatioThresholdFlat),
           captionUnitScale: num(p.captionUnitScale)
         }
       };
     }
     ```

3. `tests/cluster/mappers/VesselMapper.test.js`
   
   - Add test cases for `regattaTimer` kind: default output, custom duration, sound/progress bar toggles, unknown kind fallback still returns `{}`

**Verification:**

- Route resolves to `surface: "html"`, `rendererId: "RegattaTimerTextHtmlWidget"`
- Mapper emits correct `rendererProps`
- `npm run check:all` passes

### Phase 4: Timer state machine module

**Goal:** Implement the core timer logic as a shared kit module.

**New file:** `shared/widget-kits/vessel/RegattaTimerModel.js`

Module contract:

- `createTimerModel(options)` factory
  - `options.durationMinutes` — countdown duration (default 5)
  - `options.onTick(state)` — callback on each tick
  - `options.onSignal(type, frequency, durationMs)` — callback for audio signals
- Returned API:
  - `start()` — begin countdown, set `endTime = Date.now() + duration`
  - `sync()` — snap to next signalpoint below current value (with ≤1 s grace zone)
  - `reset()` — return to idle, clear interval
  - `destroy()` — clear interval, release references
  - `getState()` — returns `{ phase, remainingMs, elapsedMs, displayTime, colorPhase }`
- State phases: `"idle"`, `"countdown"`, `"elapsed"`
- Color phases: `"normal"`, `"warning"` (final minute), `"critical"` (final 10 s)
- Signal detection: on each tick, compare current second to last-checked second. If a minute boundary was crossed → emit low signal. If in final 10 s and a second boundary was crossed → emit high signal. If 0:00 crossed → emit long high signal.
- Tick interval: 100 ms via `setInterval`. Display time formatted as `MM:SS`.
- All time computation is `Date.now()`-based (no cumulative drift).

**New test file:** `tests/shared/vessel/RegattaTimerModel.test.js`

Test matrix:

- Idle state returns configured duration display
- Start sets phase to countdown, endTime is correct
- Tick emits correct displayTime as time passes (use fake timers)
- Sync snaps to correct minute boundary
- Sync at exactly N:00 (within grace zone) advances to the correct signal point
- Sync when timer < 1:00 snaps to 0:00 (immediate start)
- Countdown reaching 0:00 transitions to elapsed phase
- Elapsed phase counts up correctly
- Reset from any phase returns to idle
- Destroy clears interval
- Signal emission at minute boundaries
- Signal emission during final 10 seconds
- Long signal at 0:00
- No signals when sound is disabled (model does not own sound toggle — that is the renderer's gate — but verify `onSignal` callback fires correctly)
- Configurable duration (3 min, 10 min)

### Phase 5: Audio engine module

**Goal:** Implement Web Audio API tone generation as a shared kit module.

**New file:** `shared/widget-kits/vessel/RegattaTimerAudio.js`

Module contract:

- `createAudioEngine()` factory
- Returned API:
  - `ensureContext()` — create `AudioContext` if not yet created (must be called from user gesture handler). Returns `true` if context is available.
  - `playTone(frequency, durationMs)` — create `OscillatorNode` (sine wave), connect to `GainNode` (for envelope shaping / click prevention), connect to `destination`, schedule start/stop
  - `destroy()` — close `AudioContext`, release references
- Gain envelope: short ramp-up (5 ms) and ramp-down (10 ms) to prevent audio clicks
- Frequency constants: `LOW_TONE_HZ = 440`, `HIGH_TONE_HZ = 880`
- Duration constants: `MINUTE_BEEP_MS = 300`, `SECOND_BEEP_MS = 150`, `START_TONE_MS = 800`
- Error handling: if `AudioContext` creation fails (e.g., no audio hardware), `playTone` is a silent no-op. No throws.

**New test file:** `tests/shared/vessel/RegattaTimerAudio.test.js`

Test matrix (jsdom — Web Audio API must be mocked):

- `ensureContext` creates AudioContext on first call
- `ensureContext` reuses existing context on subsequent calls
- `playTone` creates OscillatorNode with correct frequency
- `playTone` is no-op if context creation failed
- `destroy` closes context
- `destroy` is idempotent

### Phase 6: Markup builder module

**Goal:** Implement HTML markup generation as a shared kit module.

**New file:** `shared/widget-kits/vessel/RegattaTimerMarkup.js`

Module contract:

- `render(options)` — returns HTML string
  - `options.model` — timer model state (`phase`, `displayTime`, `colorPhase`)
  - `options.fit` — layout fit result (inline styles for timer digits, buttons)
  - `options.config` — `{ soundEnabled, progressBarEnabled, durationMinutes }`
  - `options.mode` — `"high"` | `"normal"` | `"flat"`
  - `options.interactionState` — `"dispatch"` | `"passive"`
  - `options.htmlUtils` — for `escapeHtml`, `toStyleAttr`

Markup structure:

```html
<div class="dyni-regatta-html dyni-regatta-mode-{mode} dyni-regatta-phase-{phase} dyni-regatta-color-{colorPhase} dyni-regatta-open-{interactionState}">
  <div class="dyni-regatta-display">
    <div class="dyni-regatta-time dyni-tabular" style="{timerFitStyle}">{displayTime}</div>
    <!-- progress bar only if enabled -->
    <div class="dyni-regatta-bar" style="width:{barPercent}%;{barColorStyle}"></div>
  </div>
  <div class="dyni-regatta-controls">
    <!-- button set depends on phase -->
    <div class="dyni-regatta-btn dyni-regatta-btn-start" data-dyni-action="regatta-start">START</div>
    <div class="dyni-regatta-btn dyni-regatta-btn-sync" data-dyni-action="regatta-sync">SYNC</div>
    <div class="dyni-regatta-btn dyni-regatta-btn-reset" data-dyni-action="regatta-reset">RESET</div>
  </div>
</div>
```

Button visibility is controlled by CSS classes on the wrapper (`dyni-regatta-phase-idle` shows Start only, `dyni-regatta-phase-countdown` shows Sync + Reset, `dyni-regatta-phase-elapsed` shows Reset only).

All text content is escaped via `htmlUtils.escapeHtml`.

### Phase 7: HTML fit module

**Goal:** Compute responsive layout and font sizing.

**New file:** `shared/widget-kits/vessel/RegattaTimerHtmlFit.js`

Module contract:

- `compute(options)` — returns fit result with inline style strings
  - `options.model` — timer model state
  - `options.shellRect` — committed shell dimensions
  - `options.mode` — ratio mode (high/normal/flat)
  - `options.hostContext` — for fit cache

Fit responsibilities:

- Timer digit font size: computed from shell height, filling available space with a ceiling (similar to existing HTML fit modules)
- Button sizing: computed from shell dimensions with minimum tap-target safety floor
- Progress bar height: thin fraction of shell height
- All sizing uses proportional computation, no fixed px breakpoints (responsive to any aspect ratio and size)

Fit cache pattern follows `AlarmHtmlFit` / `MapZoomHtmlFit` — cache keyed on `hostContext[FIT_CACHE_KEY]` with invalidation on detach/destroy.

### Phase 8: Committed HTML renderer

**Goal:** Wire everything together in the committed renderer component.

**New files:**

- `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js`
- `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css`

**Renderer contract (`RegattaTimerTextHtmlWidget.js`):**

```javascript
create(def, componentContext) → {
  id: "RegattaTimerTextHtmlWidget",
  wantsHideNativeHead: true,
  createCommittedRenderer: function(rendererContext) → {
    mount, update, postPatch, detach, destroy, layoutSignature
  }
}
```

Renderer lifecycle:

- `mount(mountHostEl, payload)`: create root element, initialize `RegattaTimerModel`, initialize `RegattaTimerAudio`, patch initial markup, bind button click handlers under dispatch policy
- `update(payload)`: re-resolve theme tokens, re-compute fit, patch markup. Timer model continues running across updates (does not restart on re-render).
- `postPatch()`: returns `false` (no rerender needed)
- `layoutSignature(payload)`: concatenated key from `shellRect`, `mode`, `phase`, `colorPhase`, `displayTime`, config flags
- `detach()`: destroy timer model (clears interval), destroy audio engine, remove event listeners, remove root element
- `destroy()`: delegates to detach

Button interaction:

- Buttons are bound via event delegation on the wrapper element (single click handler)
- Handler reads `data-dyni-action` from event target
- Actions are gated by `htmlUtils.canDispatchSurfaceInteraction(props)` and `!htmlUtils.isEditingMode(props)`
- Start: calls `timerModel.start()`, calls `audioEngine.ensureContext()` (user gesture)
- Sync: calls `timerModel.sync()`
- Reset: calls `timerModel.reset()`

Timer display updates:

- The timer model's `onTick` callback triggers markup re-patch via `htmlUtils.patchInnerHtml`
- Audio signals from the model's `onSignal` callback are forwarded to `audioEngine.playTone()` gated by the `soundEnabled` config flag

Theme token consumption:

- `componentContext.theme.tokens.resolveForRoot(rootEl)` provides `colors.regatta.barWarning`, `colors.regatta.barCritical`, `colors.regatta.barDefault`
- Shadow CSS consumes `var(--dyni-theme-regatta-barWarning)`, `var(--dyni-theme-regatta-barCritical)`, `var(--dyni-theme-regatta-barDefault)` with fallbacks

**Shadow CSS (`RegattaTimerTextHtmlWidget.css`):**

Key CSS contracts:

- `.dyni-html-root .dyni-regatta-root` — full-size container
- `.dyni-html-root .dyni-regatta-html` — grid layout adapting to mode class
- `.dyni-html-root .dyni-regatta-time` — monospace via `.dyni-tabular`, font-weight from theme
- `.dyni-html-root .dyni-regatta-btn` — touch-sized button elements, cursor: pointer in dispatch mode
- `.dyni-html-root .dyni-regatta-bar` — thin horizontal strip, transition on width for smooth countdown animation
- `.dyni-html-root .dyni-regatta-color-warning .dyni-regatta-time` — color: `var(--dyni-theme-regatta-barWarning, #e7a834)`
- `.dyni-html-root .dyni-regatta-color-critical .dyni-regatta-time` — color: `var(--dyni-theme-regatta-barCritical, #FA584A)`
- `.dyni-html-root .dyni-regatta-color-warning .dyni-regatta-bar` — background: `var(--dyni-theme-regatta-barWarning, #e7a834)`
- `.dyni-html-root .dyni-regatta-color-critical .dyni-regatta-bar` — background: `var(--dyni-theme-regatta-barCritical, #FA584A)`
- `.dyni-html-root .dyni-regatta-color-normal .dyni-regatta-bar` — background: `var(--dyni-theme-regatta-barDefault, #70B0F3)`
- Phase-based button visibility via `.dyni-regatta-phase-idle`, `.dyni-regatta-phase-countdown`, `.dyni-regatta-phase-elapsed` controlling `display` on button elements
- Mode-based layout via `.dyni-regatta-mode-high`, `.dyni-regatta-mode-normal`, `.dyni-regatta-mode-flat` adjusting grid template
- Dispatch/passive cursor via `.dyni-regatta-open-dispatch` / `.dyni-regatta-open-passive`

### Phase 9: Component registration

**Goal:** Register all new components so the component loader can resolve them.

**Files modified:**

1. `config/components/registry-shared-foundation-layout.js`
   
   - Add fit component entry (following project convention — fit modules live in shared foundation, not widget registries):
     
     ```javascript
     sf.RegattaTimerHtmlFit = {
       js: BASE + "shared/widget-kits/vessel/RegattaTimerHtmlFit.js",
       css: undefined,
       globalKey: "DyniRegattaTimerHtmlFit",
       deps: ["HtmlWidgetUtils", "ValueMath"]
     };
     ```

2. `config/components/registry-widgets-vessel.js`
   
   - Add component entries:
     
     ```javascript
     w.RegattaTimerModel = {
       js: BASE + "shared/widget-kits/vessel/RegattaTimerModel.js",
       css: undefined,
       globalKey: "DyniRegattaTimerModel",
       deps: []
     };
     
     w.RegattaTimerAudio = {
       js: BASE + "shared/widget-kits/vessel/RegattaTimerAudio.js",
       css: undefined,
       globalKey: "DyniRegattaTimerAudio",
       deps: []
     };
     
     w.RegattaTimerMarkup = {
       js: BASE + "shared/widget-kits/vessel/RegattaTimerMarkup.js",
       css: undefined,
       globalKey: "DyniRegattaTimerMarkup",
       deps: ["HtmlWidgetUtils"]
     };
     
     w.RegattaTimerTextHtmlWidget = {
       js: BASE + "widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js",
       css: undefined,
       shadowCss: [SHARED_HTML_SHADOW_CSS, BASE + "widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css"],
       globalKey: "DyniRegattaTimerTextHtmlWidget",
       deps: ["RegattaTimerModel", "RegattaTimerAudio", "RegattaTimerMarkup", "RegattaTimerHtmlFit", "HtmlWidgetUtils", "ValueMath"]
     };
     ```

**Verification:**

- Component loader resolves all dependencies transitively
- Shadow CSS preload includes both common and widget-specific sheets
- No circular dependencies

### Phase 10: Documentation

**Goal:** Document the new widget and update navigation indexes.

**New file:** `documentation/widgets/regatta-timer.md`

Contents:

- Overview (interactive regatta countdown timer in vessel cluster)
- Visual contract (CSS state classes, layering, layout constants, text-fit constants)
- State machine description
- Sync algorithm specification
- Audio signal table
- Theme token table
- Editable parameter table
- Responsive mode matrix (high/normal/flat)
- Required HTML-kind test matrix checklist

**Files modified:**

1. `documentation/TABLEOFCONTENTS.md`
   
   - Add to "Module Reference (Renderers)": `**Regatta timer HTML renderer (countdown, sync, audio signals)** → [widgets/regatta-timer.md](widgets/regatta-timer.md)`

2. `ROADMAP.md`
   
   - Mark "interactive regatta clock" item as addressed by PLAN28

### Phase 11: Tests

**Goal:** Full test coverage for all new modules and integration points.

**New test files:**

1. `tests/shared/vessel/RegattaTimerModel.test.js` (see Phase 4 matrix)
2. `tests/shared/vessel/RegattaTimerAudio.test.js` (see Phase 5 matrix)
3. `tests/cluster/rendering/RegattaTimerTextHtmlWidget.test.js`

**Widget test matrix (per `add-new-html-kind.md` Step 7):**

- Route resolves to `surface: "html"` and `rendererId: "RegattaTimerTextHtmlWidget"`
- Inert shell contains mount host and no semantic content
- Committed renderer mount produces expected initial markup (idle state)
- Update patches markup correctly across phase transitions
- Detach removes root element and clears timer interval
- Destroy delegates to detach
- Shadow CSS preload/injection for this renderer
- Dispatch mode: click handlers are attached, Start/Sync/Reset dispatch correctly
- Passive mode: no click handlers
- Dispatch-mode blank-space click suppression (clicks outside buttons don't propagate)
- layoutSignature changes when phase, displayTime, shellRect, or mode changes
- Ratio threshold editables control mode selection
- Timer model survives across update calls (countdown continues)
- Sound toggle gates audio engine calls
- Progress bar toggle controls bar element presence

**Modified test files:**

4. `tests/cluster/mappers/VesselMapper.test.js` — add regattaTimer kind cases
5. `tests/config/clusters/vessel.test.js` — add `"regattaTimer"` to enumerated kind list
6. `tests/config/shared/kind-defaults.test.js` — verify regattaTimer default entry

### Phase 12: Layout file

**Goal:** Add a dedicated regatta page to the sailboat reference layout.

**File modified:** `layouts/dyni-sailboat.json`

- Add a new `regattapage` entry under `widgets` containing a vessel cluster instance with `kind: "regattaTimer"` (plus any complementary instruments useful during a race start, e.g. speed, wind)

---

## File Inventory

### New files (10)

| File                                                                     | Lines (est.) | Purpose                      |
| ------------------------------------------------------------------------ | ------------ | ---------------------------- |
| `shared/widget-kits/vessel/RegattaTimerModel.js`                         | ~200         | Timer state machine          |
| `shared/widget-kits/vessel/RegattaTimerAudio.js`                         | ~100         | Web Audio API tone generator |
| `shared/widget-kits/vessel/RegattaTimerMarkup.js`                        | ~150         | HTML markup builder          |
| `shared/widget-kits/vessel/RegattaTimerHtmlFit.js`                       | ~180         | Responsive layout/fit        |
| `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js`  | ~300         | Committed HTML renderer      |
| `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css` | ~200         | Shadow CSS                   |
| `documentation/widgets/regatta-timer.md`                                 | ~200         | Widget documentation         |
| `tests/shared/vessel/RegattaTimerModel.test.js`              | ~300         | Timer model tests            |
| `tests/shared/vessel/RegattaTimerAudio.test.js`              | ~100         | Audio engine tests           |
| `tests/cluster/rendering/RegattaTimerTextHtmlWidget.test.js`                  | ~350         | Widget integration tests     |

### Modified files (14)

| File                                                    | Change scope                                           |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `runtime/theme/model.js`                                | Add 3 token definitions + preset overrides (~30 lines) |
| `config/shared/kind-defaults.js`                        | Add 1 kind entry (~1 line)                             |
| `config/clusters/vessel.js`                             | Add kind option + 5 editables (~40 lines)              |
| `config/cluster-routes/vessel.js`                       | Add 1 route entry (~8 lines)                           |
| `cluster/mappers/VesselMapper.js`                       | Add 1 kind branch (~15 lines)                          |
| `config/components/registry-shared-foundation-layout.js`| Add 1 fit component entry (~7 lines)                   |
| `config/components/registry-widgets-vessel.js`          | Add 4 component entries (~28 lines)                    |
| `documentation/shared/theme-tokens.md`                  | Add regatta token section (~30 lines)                  |
| `documentation/TABLEOFCONTENTS.md`                      | Add 1 line                                             |
| `ROADMAP.md`                                            | Mark 1 item (~1 line)                                  |
| `layouts/dyni-sailboat.json`                            | Add regattapage with regatta timer (~10 lines)         |
| `tests/cluster/mappers/VesselMapper.test.js`            | Add regattaTimer test cases (~40 lines)                |
| `tests/config/clusters/vessel.test.js`                  | Add regattaTimer to enumerated kind list (~1 line)     |
| `tests/config/shared/kind-defaults.test.js`             | Verify regattaTimer default entry (~3 lines)           |

---

## Verification

### Required completion gate

```bash
npm run check:all
```

This runs `check:core` + `test:coverage:check` + `perf:check`.

### Manual verification checklist

- [ ] Completed mandatory preflight reads
- [ ] Theme tokens resolve correctly in day mode, night mode, and all presets (default, darkmode, highcontrast)
- [ ] Theme output vars materialize on committed roots
- [ ] Kind appears in vessel cluster widget editor dropdown
- [ ] Editables show/hide correctly by condition
- [ ] Route resolves to HTML surface with correct renderer
- [ ] Mapper emits correct rendererProps
- [ ] Widget renders in idle state with configured duration and Start button
- [ ] Start begins countdown, timer displays correct MM:SS
- [ ] Sync snaps to correct minute boundary
- [ ] Rapid Start → Sync → Sync reaches expected time
- [ ] Reset returns to idle from countdown and elapsed states
- [ ] Countdown reaching 0:00 transitions to elapsed and counts up
- [ ] Audio plays low tone at minute marks (when sound enabled)
- [ ] Audio plays high tones in final 10 seconds
- [ ] Audio plays long tone at 0:00
- [ ] No audio when sound is disabled
- [ ] Progress bar shows and shrinks during countdown (when enabled)
- [ ] Progress bar hidden when disabled
- [ ] Color shift to warning in final minute
- [ ] Color shift to critical in final 10 seconds
- [ ] Night mode shows correct reduced-opacity colors
- [ ] Widget adapts layout at different aspect ratios (high/normal/flat)
- [ ] Buttons are touch-targetable at small widget sizes
- [ ] Editing mode shows state screen, no interaction
- [ ] Passive mode shows timer but buttons are inert
- [ ] All existing tests pass
- [ ] New tests cover the required HTML-kind test matrix
- [ ] Documentation is complete and linked from TABLEOFCONTENTS.md
- [ ] `npm run check:all` passes
