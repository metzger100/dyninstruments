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

Two areas where the plugin works around missing AvNav features: value formatting and host actions. The proposals below
were checked against an AvNav `viewer/` checkout dated 2026-03-14; re-check them against current AvNav master before
opening anything.

Rules for every PR, to fit AvNav's conservative handling of its APIs:

- One concern per PR, small diff, no refactoring of the surrounding core code.
- Existing behaviour stays identical for built-in widgets and for existing parameters. The only outputs that change are
  ones that are wrong by definition (`360`, `-0`, `NaN`).
- New capability is opt-in: trailing optional formatter parameters, declared in `.parameters` so the layout editor shows
  them and existing layouts are unaffected, or new fields on the existing click data.
- Reuse concepts AvNav already has: formatter `.parameters`, the `ev.avnav` click data, and the key handler's named
  actions. No new API object without prior agreement.
- Pure bug fixes can go straight to a PR. Anything that adds plugin-visible behaviour starts as a proposal in the
  existing issue or the forum thread, offering to implement it.
- Every PR carries a before/after table and the matching change to AvNav's plugin docs (`docs/hints/en_userjs.html` and
  `userjs.html`), because documented behaviour is what AvNav treats as stable.
- On the plugin side, a workaround is removed only once dyninstruments declares a minimum AvNav version that contains
  the PR. The README names none today, and `plugin.js` still supports older AvNav versions. Until then there are no dual
  code paths.

#### Value formatting

AvNav's formatters already do the unit conversion and number text; the plugin's unit tokens match theirs exactly. The
plugin adds layers only where a formatter falls short.

1. **Round before normalizing in `formatDirection` and `formatDirection360`** (bug fix, first PR).
   - Today 359.6° shows as `360`, -0.4° as `-0`, and 179.6° with `range180` as `180`. `formatDirection360` does not
     normalize at all.
   - Fix: round first, then normalize into AvNav's existing ranges, [0, 360) and [-180, 180) (`Helper.to360`,
     `Helper.to180`). Only these boundary outputs change: `0`, `0`, `-180`. Width and padding stay the same.
   - Plugin payoff: the three plugin-side angle formatters can go (`ValueMath.formatDirection360`,
     `ValueMath.formatAngle180`, `ClusterMapperToolkit.makeAngleFormatter`). One heading reads the same in every widget,
     and roll/pitch near level stops flickering `-0`.
2. **Fix the two broken missing-value outputs of `formatPressure`** (bug fix).
   - For a missing value, hPa returns `"NaN"` and Pa returns an empty string.
   - Fix: return dashes at the formatter's normal width, as `formatTemperature` already does. All other placeholders
     stay as they are.
3. **Opt-in fixed width for `formatSpeed`, `formatTemperature`, and `formatPressure`** (additive).
   - Add trailing optional parameters with the same names and meaning as `formatDistance`'s existing `numDigits` and
     `fillRight`. The defaults reproduce today's output exactly.
   - Plugin payoff: `StableDigits` no longer pads these values. The sign slot and the XTE `L`/`R` suffix stay in the
     plugin.
4. **A new `formatDuration` formatter** (additive).
   - Seconds to `mm:ss`, or `h:mm:ss` past one hour, with `.parameters` for the layout editor. No existing output
     changes, and AvNav's own AIS display is not touched.
   - Plugin payoff: the regatta countdown and elapsed time, and the TCPA text (today decimal minutes via
     `formatDecimal`).

Deliberately not proposed:

- **Unifying all placeholders.** Core layouts rely on each formatter's fixed-width dashes. The plugin's
  `PlaceholderNormalize` stays.
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
   - The page's `onClick` is passed to plugin widgets (`allowedDynamicProps` in `components/WidgetFactory.jsx`).
     `ItemList` keeps click data that is already on the event (`ev.avnav`) and passes it to the page's dispatch.
   - Clicks the widget owns stop propagation, as AvNav's own named-handler wrapper does (`components/UserHtml.tsx`).
     Clicks it does not own reach the page's default action. This also covers GpsPage's `history.pop()`, so that needs
     no AvNav change beyond one sentence in the plugin docs.
   - Reaching a built-in workflow still means sending the built-in widget's name. That part stays marked as a
     workaround.
2. **Click roles on the existing click data** (concept proposal first, then a PR of a few lines).
   - Today pages decide by the exact widget name: `NavPage` (`AisTarget`, `ActiveRoute`, `Zoom`), `GpsPage`
     (`AisTarget`), `EditRoutePage` (`EditRoute`, `RoutePoints`).
   - Proposal: pages match `ev.avnav.clickAs || item.name`. A plugin widget sets `clickAs` plus the data the built-in
     widget already sends: `mmsi` for `AisTarget`, and the point index for `RoutePoints`, which the page resolves from
     its own route.
   - Why it fits:
     - It adds no API object and no new action, so plugins can only request workflows a page already runs for its
       built-in widget.
     - Layout editing and the gpspage fallback keep using the real widget item.
     - Unknown roles, and older AvNav versions, fall back to the page default.
   - Coverage: AIS info (and through its dialog locate, track, hide, and the AIS list), the active-route editor, the
     edit-route dialog, route-point activation, and auto-zoom. It replaces the broader `avnav.api.routeEditor` and
     `avnav.api.ais` sketch in the issue.
3. **Trigger an already-registered named action** (only if the maintainer agrees to one small API addition).
   - AvNav's key handler already has named actions. Page buttons register as `button`/`<name>`, widgets as
     `widget`/`<name>`, and the alarm stop as `alarm`/`stop`. Users bind these names to keys in their key mappings, so
     they are already a user-facing contract.
   - Proposal: `avnav.api.triggerAction(component, action)` runs exactly the handlers a key mapping would run on the
     current page, and returns whether any ran. It defines no new actions and follows the page context automatically.
   - Coverage: the plugin's "stop all alarms", which is found today by DOM and React probing, and page buttons.

`TemporaryHostActionBridge` goes once the minimum supported AvNav version contains step 2, plus step 3 if accepted. The
`dyni-workaround(avnav-plugin-actions)` markers mark every call site. The route-point relay the bridge uses
(`avnav.api.routePoints`) does not exist in the checked AvNav version, which step 2 makes unnecessary.
