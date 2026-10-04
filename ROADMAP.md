# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`. It tracks development priorities and AvNav widget
coverage status.

## Roadmap

### Additional non-core concepts (post release)

- OBP60-style instruments:
  - graphical Roll/Pitch
  - graphical Rudder position
  - graphical Keel position
- C-net 2000 style multi instruments:
  - history graphs for values where the value history is interesting like TWS or water temperature.
  - anchor nav plot showing the orientation and position of the vessel relative to the anchor on a "radar" like chart
    with 2 rings around the anchor derived from the anchor distance value.
- Wind radial graphic version for `TWA`/`TWS`/`AWA`/`AWS` in one radial wind instrument showing apparent wind and
  displaying text tw and aw in one widget.

### Upstream PRs to AvNav

Two areas where the plugin works around missing AvNav features: value formatting and host actions.

**What was verified.** Every claim below was checked against a local AvNav checkout (`viewer/` sources dated 2026-03-14,
`docs/`, `server/`). The formatter outputs come from running AvNav's own `viewer/util/formatter.js`. Neither area needs
a server change; the server only serves the user's `keys.json` (`server/handler/avndirectories.py`). Re-check against
current AvNav master before opening anything.

**What cannot be verified.** Whether the maintainer merges a PR is his decision. The best available evidence is his
release history (`docs/en_release.html`), which shows small external PRs and formatter options being accepted:

- #354 (quantenschaum, ±180 directions);
- #433 (leading-zero parameter for `formatDirection`/`formatDirection360`);
- #390 (`useMinPath` option for the radial gauge);
- PRs #405/#407 (free-x) and #360 (hkapanen).

Issue #497 ("correctly show +/- 180° in wind displays", release 20250822) shows the ±180 display is already on his
radar.

**Rules for every PR**, to fit AvNav's conservative handling of its APIs:

- One concern per PR, small diff, no refactoring of the surrounding core code. Land the least controversial PRs first.
- Existing behaviour stays identical for built-in widgets and for existing parameters. The only outputs that change are
  ones that are wrong by definition (`360`, `-0`, `NaN`).
- New capability is opt-in: trailing optional formatter parameters, declared in `.parameters` so the layout editor shows
  them and existing layouts are unaffected, or new fields on the existing click data.
- Reuse concepts AvNav already has: formatter `.parameters`, the `ev.avnav` click data, and the documented key-handler
  actions. No new API object without prior agreement.
- Pure bug fixes can go straight to a PR. Anything that adds plugin-visible behaviour starts as a proposal in the
  existing issue or the forum thread, offering to implement it.
- AvNav's viewer has no unit-test runner; CI only builds (`.github/workflows/main.yml`). Every PR therefore carries a
  before/after table and the matching change to AvNav's plugin docs (`docs/hints/en_userjs.html` and `userjs.html`),
  because documented behaviour is what AvNav treats as stable.
- On the plugin side, a workaround is removed only once dyninstruments declares a minimum AvNav version that contains
  the PR. The README names none today, and `plugin.js` still supports older AvNav versions. Until then there are no dual
  code paths.

#### Value formatting

AvNav's formatters already do the unit conversion and number text; the plugin's unit tokens match theirs exactly. The
plugin adds layers only where a formatter falls short.

1. **Starter PR: TWA ignores the leading-zero option** (one-character bug fix).
   - `viewer/components/WidgetList.js:186` reads `props.laedingZero`, while AWA and TWD (`:184-185`) read
     `props.leadingZero`.
   - A trivial, obviously correct fix is a good first contribution.
2. **Round before normalizing in `formatDirection` and `formatDirection360`** (bug fix in AvNav's own displays).
   - The bug shows in AvNav's own wind displays (`WindWidget.jsx`, `WindGraphics.jsx`, the wind formatters in
     `WidgetList.js`) and in the five built-in widgets that use `formatDirection360`.
   - Fix: round first, then normalize into AvNav's existing ranges, [0, 360) and [-180, 180) (`Helper.to360`,
     `Helper.to180`), and keep the unchanged `formatDecimal` call.
   - Measured outputs, today and after the fix:

     | Call                                       | Today    | After    |
     | ------------------------------------------ | -------- | -------- |
     | `formatDirection(359.6)`                   | `"360"`  | `"  0"`  |
     | `formatDirection(-0.4, false, true)`       | `"  -0"` | `"  0"`  |
     | `formatDirection(-0.4, false, true, true)` | `"-000"` | `" 000"` |
     | `formatDirection(179.6, false, true)`      | `"180"`  | `"-180"` |
     | `formatDirection360(359.6)`                | `"360"`  | `"  0"`  |
     | `formatDirection360(-5)`                   | `"  -5"` | `"355"`  |
     | `formatDirection360(365)`                  | `"365"`  | `"  5"`  |

   - All other values are unchanged, including `180` → `"-180"`, which the fix makes consistent with `179.6`. Each new
     output has the same form AvNav already uses for that value; for example `"  0"` matches every other non-negative
     angle.
   - Plugin payoff: the three plugin-side angle formatters can go (`ValueMath.formatDirection360`,
     `ValueMath.formatAngle180`, `ClusterMapperToolkit.makeAngleFormatter`). One heading reads the same in every widget,
     and roll/pitch near level stops showing `-0`.
3. **Fix the missing-value output of `formatPressure`** (bug fix).
   - For a missing value, hPa returns `"NaN"` and Pa returns `""`; bar returns `"--"`.
   - Fix: return dashes at the formatter's normal width, as `formatTemperature` (`"---"`) and `formatSpeed` already do.
     All other placeholders stay as they are. This fits the missing-value cleanup of release 20250723 (#347/#348).
4. **Opt-in fixed width for `formatSpeed`, `formatTemperature`, and `formatPressure`** (additive, lower priority).
   - Add trailing optional parameters with the same names and meaning as `formatDistance`'s existing `numDigits` (zero
     padding: `formatDistance(4630, "nm", 4)` gives `"002.5"`) and `fillRight`. The defaults reproduce today's output
     exactly. This follows the precedent of #433.
   - It also helps core users through the layout editor. Plugin payoff: `StableDigits` no longer pads these values; the
     sign slot and the XTE `L`/`R` suffix stay in the plugin.

Deliberately not proposed:

- **Unifying all placeholders.** Core layouts rely on each formatter's fixed-width dashes. The plugin's
  `PlaceholderNormalize` stays.
- **A `formatDuration` formatter.** Nothing in AvNav core would use it (AvNav shows TCPA as decimal minutes,
  `viewer/nav/aisformatter.jsx:82`), and plugins can already register their own formatters with
  `avnav.api.registerFormatter`.
- **A unit-conversion API.** The gauges parse the number back out of the formatted text to place the needle
  (`ValueMath.formatGaugeDisplay`, `DepthDisplayFormatter`). That works; raise it only if it causes a real defect.
- **Exposing AIS field formatting** (`viewer/nav/aisformatter.jsx`). It would add API surface for small, stable logic
  that `AisTargetViewModel` already mirrors.

#### Host actions (`TemporaryHostActionBridge`)

Maintainer position from the existing issue (2026-03-09): there is no concept yet for exposing actions to plugins.
Plugin widgets should handle their own clicks, AvNav's page action is the fallback, and a general concept comes first.
The steps follow that order, and each one builds only on mechanisms AvNav already has.

1. **Plugin side first, no AvNav change.** Stop searching React internals and the DOM, and use what AvNav already hands
   every widget:
   - The page's `onClick` is passed to plugin widgets: `onClick` is in `allowedDynamicProps`
     (`viewer/components/WidgetFactory.jsx`), and `ExternalWidget` forwards its props to `renderHtml`.
   - `ItemList` keeps click data that is already on the event (`ev.avnav`, `viewer/components/ItemList.jsx`) and passes
     it to the page's dispatch. Map-panel widgets take the same path (`viewer/components/MapPage.jsx`).
   - Clicks the widget owns stop propagation, as AvNav's own named-handler wrapper does
     (`viewer/components/UserHtml.tsx`). Clicks it does not own reach the page's default action. This also covers
     GpsPage's `history.pop()`, so that needs no AvNav change.
   - Reaching a built-in workflow still means sending the built-in widget's name, and must only happen outside layout
     editing, where the page would otherwise open the edit dialog for that name. That part stays marked as a workaround.
2. **Click roles on the existing click data** (concept proposal first, then a PR of six one-line changes).
   - Pages decide by the exact widget name in exactly six places: `viewer/gui/GpsPage.jsx:230` (`AisTarget`),
     `viewer/gui/NavPage.jsx:538`, `:543`, `:550` (`AisTarget`, `ActiveRoute`, `Zoom`), and
     `viewer/gui/EditRoutePage.jsx:630`, `:642` (`EditRoute`, `RoutePoints`).
   - Proposal: those comparisons use `ev.avnav.clickAs || item.name`. A plugin widget sets `clickAs` plus the data the
     built-in widget already sends: `mmsi` for `AisTarget`, and for `RoutePoints` a point index that `EditRoutePage`
     resolves with the existing `getPointAt(index)` (`viewer/nav/routeeditor.js:377`).
   - Why it fits:
     - It adds no API object and no new action, so plugins can only request workflows a page already runs for its
       built-in widget.
     - Layout editing and the gpspage fallback keep using the real widget item.
     - Unknown roles, and older AvNav versions, fall back to the page default.
   - Coverage: AIS info (and through its dialog locate, track, hide, and the AIS list), the active-route editor, the
     edit-route dialog, route-point activation, and auto-zoom. It replaces the broader `avnav.api.routeEditor` and
     `avnav.api.ais` sketch in the issue.
3. **Trigger an already-registered named action** (only if the maintainer agrees to one small API addition).
   - AvNav's key handler (`viewer/util/keyhandler.js`) runs named actions that users bind in `keys.json`. AvNav's
     keyboard docs (`docs/hints/en_keyboard.html`) document them, including `alarm`/`stop` (default key `a`) and
     `widget`/`<name>`; page buttons register as `button`/`<name>`. The names are therefore already a user-facing
     contract.
   - `alarm`/`stop` exists on every page, because `PageLeft` always mounts the built-in alarm widget with the page's
     stop-all handler (`viewer/components/Page.jsx`).
   - Proposal: `avnav.api.triggerAction(component, action)` runs exactly the handlers a key mapping would run on the
     current page, and returns whether any ran. It defines no new actions and follows the page context automatically.
   - Coverage: the plugin's "stop all alarms", which is found today by DOM and React probing, and page buttons.
   - Side note for the same discussion: the keyboard docs call the widget group `"widgets"` in the prose but `widget` in
     the table, and the code registers `widget`.

`TemporaryHostActionBridge` goes once the minimum supported AvNav version contains step 2, plus step 3 if accepted. The
`dyni-workaround(avnav-plugin-actions)` markers mark every call site. The route-point relay the bridge uses
(`avnav.api.routePoints`) does not exist in the checked AvNav version, which step 2 makes unnecessary.
