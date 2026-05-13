# PLAN22 — Bundled Layouts for the Dyninstruments Plugin

## Goal and Scope

Ship two pre-designed AvNav layout files with the dyninstruments plugin so that
users can install the plugin, pick a layout from the AvNav layout selector, and
immediately have a working instrument panel — no manual widget placement needed.

The two layouts cover the two most common vessel types:

| Layout         | File                           |
| -------------- | ------------------------------ |
| Dyni Motorboat | `layouts/dyni-motorboat.json`  |
| Dyni Sailboat  | `layouts/dyni-sailboat.json`   |

Each layout includes:

- Three GPS dashboard pages with gauges and numeric instruments. Pages 1 and 2
  include `left_anchor` panels that switch to anchor watch data (bearing,
  distance, watch status, depth, voltage) when anchor watch is active.
- Navpage in **four explicit modes**: normal, small, anchor, anchor+small.
- Editroutepage with dyninstruments `editRoute`/`routePoints` and compact captions.

**Out of scope:** runtime layout generation, layout editor integration, user
customisation wizards, 24 V battery presets, non-metric depth/temperature units
as first-class variants. Users who need these can clone a bundled layout in AvNav
and tweak it.

## AvNav Layout / Plugin Facts Relevant to This Implementation

### Layout file format

```json
{
  "description": "...",
  "layoutVersion": 1,
  "properties": { "layers": { "ais": true } },
  "widgets": {
    "gpspage1": { "left": [...], "right": [...] },
    "navpage":  { "left": [...], "bottomLeft": [...], ... },
    "editroutepage": { "left": [...], ... }
  }
}
```

- `layoutVersion` must be `1`.
- Each page contains named panels; each panel is an array of widget objects.
- Widget objects reference either a native AvNav widget (`"name": "SOG"`) or a
  plugin widget (`"name": "dyni_Speed_Instruments", "kind": "sogLinear"`).

### Panel suffix conventions for navpage

The navpage supports two independent boolean options: **small** and **anchor**.
These combine into four modes. AvNav builds panel names by appending option
suffixes in declaration order: small first, anchor second.

| Mode           | Panel suffix example      |
| -------------- | ------------------------- |
| normal         | `bottomLeft`              |
| small          | `bottomLeft_small`        |
| anchor         | `bottomLeft_anchor`       |
| anchor + small | `bottomLeft_small_anchor` |

AvNav falls back to the base panel when a suffixed panel is missing. The bundled
layouts explicitly define every panel that carries widgets. The only intentional
omissions are `top` (normal mode) and `top_anchor` — the top bar is only useful
in small mode, so these fall back to the nonexistent base `top` panel (= empty),
which is the desired behaviour.

### Plugin layout registration

AvNav plugins can register layouts in two ways:

1. **`plugin.json` static registration** (preferred) — the AvNav server and the
   Android plugin manager both read a `"layouts"` array from `plugin.json`,
   validate that every referenced file exists, and register the layouts at
   startup. No Python or JS runtime code is needed.

2. **`plugin.py` `registerLayout(name, file)`** — a Python API that registers
   layouts at plugin load time. This is more complex and unnecessary for static
   bundled layouts.

This plan uses option 1 exclusively. Option 2 is noted as an alternative for
anyone who needs dynamic layout registration.

## Folder and File Names

All layout files live under a `layouts/` directory at the plugin repository root:

```
dyninstruments/
├── layouts/
│   ├── dyni-motorboat.json
│   └── dyni-sailboat.json
├── plugin.js
├── plugin.css
├── plugin.json          ← must be created or extended
├── config/
├── widgets/
└── ...
```

## Proposed plugin.json Change

The dyninstruments plugin currently has **no `plugin.json`**. Create one at the
repository root with at least the following content:

```json
{
  "layouts": [
    { "name": "Dyni Motorboat", "file": "layouts/dyni-motorboat.json" },
    { "name": "Dyni Sailboat",  "file": "layouts/dyni-sailboat.json" }
  ]
}
```

The `"file"` paths are relative to the plugin directory, matching AvNav's
resolution logic in `pluginhandler.py` (line ~395) and the Android plugin
manager.

If `plugin.json` later needs other keys (e.g. `editableParameters`, `version`),
they can be added alongside `"layouts"` without conflict.

## Notes on plugin.py registerLayout

**Not needed.** The `plugin.json` static registration path handles bundled
layouts without any Python code. `registerLayout` is the right choice only if a
plugin needs to generate or discover layouts at runtime — which is not the case
here.

If someone later wants to register additional layouts dynamically (e.g. from a
user template directory), they can use `registerLayout` in `plugin.py` alongside
the static `plugin.json` entries.

## Layout Design Rationale

### Motorboat layout

- **Priority data:** COG/HDT, SOG, depth, active route, XTE, AIS, battery,
  clock/time.
- **Speed gauge range:** 0–30 kn (covers displacement and semi-planing hulls).
  Warning at 25 kn, alarm at 28 kn.
- **No wind instruments.** AWA/AWS are irrelevant for powerboat driving.
- **No VMG.** Velocity made good is a sailing concept.
- **SOG replaces VMG** in navpage bottomLeft (alongside BRG and DST).
- **GPS pages are differentiated by purpose, not visual format:**
  - Page 1 "Helm": linear compass (180°, hero), HDT + BRG text, SOG radial
    gauge, depth linear gauge, voltage, position, AIS — the instruments you
    watch while driving.
  - Page 2 "Route": XTE display (full textual metrics), SOG, route timing
    (ETA, rteEta, rteDistance), routePoints list.
  - Page 3 "Systems": voltage linear, depth linear, temperature, pressure,
    dateTime, position, alarm — system health and environment monitoring
    (identical to sailboat).

### Sailboat layout

- **Priority data:** apparent wind angle/speed (primary for sail trim), heading,
  SOG, depth, VMG, route/XTE, battery.
- **Speed gauge range:** 0–12 kn (typical cruising sailboat). Warning at 8 kn,
  alarm at 10 kn.
- **Apparent wind radial** with layline sectors (35°–55°) is the hero helm
  instrument on Page 1.
- **True wind as text only** — strategic info (did the wind shift/build?), not a
  helm instrument. A `CombinedWidget` shows TWA and TWS side by side.
- **VMG** on navpage bottom-left alongside BRG and SOG.
- **GPS pages are differentiated by purpose, not visual format:**
  - Page 1 "Helm": apparent wind radial rose, linear compass (180°), HDT + BRG
    text, SOG radial (12 kn), VMG, depth, true wind angle + speed as text —
    active sailing instruments.
  - Page 2 "Route": XTE display (full textual metrics), SOG, VMG, route timing
    (ETA, rteEta, rteDistance), routePoints list.
  - Page 3 "Systems": voltage linear, depth linear, temperature, pressure,
    dateTime, position, alarm — system health and environment monitoring
    (identical to motorboat).

### Navpage modes (both layouts)

| Mode           | Design intent                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Normal         | Full left sidebar: activeRoute, XTE highway (graphic only), depth, AIS — plus wind for sailboat / voltage for motorboat. Bottom: navigation metrics (left) + vessel data (right). |
| Small          | Empty sidebar. Top bar: depth only. Bottom panels: reduced to essential helm data (BRG + SOG or VMG left, COG + time right).                           |
| Anchor         | Sidebar: dyni anchor widgets + depth + speed. Bottom-left: contextual data — wind (sailboat) / temp+pressure (motorboat). Bottom-right: voltage + time. |
| Anchor + small | Empty sidebar. Top bar: depth. Bottom-left: anchor bearing + distance. Bottom-right: anchor watch + time.                                              |

### Anchor widget choice

All anchor panels use **dyninstruments anchor widgets** (`dyni_Anchor_Instruments`
with kinds `anchorBearing`, `anchorDistance`, `anchorWatch`). These read the same
AvNav store keys (`nav.anchor.distance`, `nav.anchor.watchDistance`,
`nav.anchor.direction`) as the native widgets and support the same unit formatting.
Distance and watch widgets default to metres (`formatUnit_anchorDistance: "m"`,
`formatUnit_anchorWatch: "m"`); bearing uses `leadingZero: true`.

### GPS page anchor panels

AvNav's `GpsPage.jsx` passes `OPTIONS.ANCHOR` to `getPanelData`, so GPS pages
switch panels when anchor watch is active. Both bundled layouts define
`left_anchor` on gpspage1 and gpspage2, containing: `dyni_Anchor_Instruments`
(anchorBearing, anchorDistance, anchorWatch), `dyni_Environment_Instruments` depth,
and `dyni_Vessel_Instruments` voltage. This ensures anchor data is visible even
when the user swipes away from the navpage — important on smartphones and tablets
where users move between pages frequently. gpspage3 has no anchor variant (same as
AvNav defaults).

### Small-mode top bar

The `top_small` panel contains a single **dyninstruments** depth widget. This
keeps the layouts minimal in small mode while surfacing the most safety-critical
reading (shallow water). All other data is available in the bottom panels.

### Editroutepage

Both layouts share the same editroutepage structure:

- `left`: dyninstruments `editRoute` widget (full compact captions/units) +
  `routePoints`.
- `left_small`: empty (collapsed).
- `top_small`: dyninstruments `editRoute` (compact fallback).
- `bottomLeft`: BRG, DST, ETA, positionWp.
- `bottomRight`: COG, SOG, timeStatus, positionBoat.

### Depth gauge settings

- Dashboard/GPS pages: 0–30 m range, 5 m major ticks, 1 m minor, warning at 5 m,
  alarm at 2 m.
- These are general-purpose shallow-water defaults. Users in deep-water areas can
  adjust max range via the layout editor.

### Voltage gauge settings

- Range: 10.5–15.5 V (standard 12 V system).
- Warning at 12.2 V, alarm at 11.8 V.
- 0.5 V major ticks, 0.1 V minor ticks.
- 24 V systems will need manual adjustment.

### Hidden textual metrics

Captions and units are set to empty strings on widgets whose values are already
shown by another widget on the same page. For example, on GPS page 3 the large
radial gauges hide their textual readouts because the same data (heading, speed,
depth, wind angle/speed) appears in accompanying numeric widgets on that page.
The same principle applies to composite widgets like `xteDisplay` — individual
sub-fields (COG, BRG, DST) can suppress their captions when a dedicated widget
already displays that value nearby.

## Validation Steps

After adding the layout files and creating plugin.json:

1. **JSON validity** — each layout file parses as valid JSON.

2. **layoutVersion** — each layout has `"layoutVersion": 1`.

3. **Widget name validity** — every dyninstruments widget `"name"` matches one of
   the nine registered cluster widget names:
   
   - `dyni_CourseHeading_Instruments`
   - `dyni_Speed_Instruments`
   - `dyni_Environment_Instruments`
   - `dyni_Wind_Instruments`
   - `dyni_Nav_Instruments`
   - `dyni_Map_Instruments`
   - `dyni_Vessel_Instruments`
   - `dyni_Default_Instruments`
   - `dyni_Anchor_Instruments`
   
   (The bundled layouts use the first eight. `dyni_Default_Instruments` is
   registered by the plugin but not referenced in these layouts.)

4. **Kind validity** — every `"kind"` value exists in the cluster-routes registry
   (`config/cluster-routes/*.js`).

5. **Kind–cluster consistency** — every `"kind"` is used with the correct cluster
   widget name (e.g. `"sog"` only with `dyni_Speed_Instruments`).

6. **Navpage mode completeness** — each layout's navpage defines explicit panels
   for all four modes (fourteen panels total — `top` is only needed in small
   modes, so `top` and `top_anchor` are intentionally absent):
   
   - normal: `left`, `bottomLeft`, `bottomRight`
   - small: `left_small`, `top_small`, `bottomLeft_small`, `bottomRight_small`
   - anchor: `left_anchor`, `bottomLeft_anchor`, `bottomRight_anchor`
   - anchor+small: `left_small_anchor`, `top_small_anchor`,
     `bottomLeft_small_anchor`, `bottomRight_small_anchor`

7. **GPS page anchor panels** — each layout's gpspage1 and gpspage2 define a
   `left_anchor` panel containing anchor watch widgets.

8. **plugin.json references** — every `"file"` in plugin.json points to an
   existing layout file.

9. **Functional test** — install the plugin, open AvNav, switch to each bundled
   layout, and verify:
   
   - All GPS pages render correctly.
   - GPS pages 1 and 2 switch to anchor data when anchor watch is active.
   - Navpage shows correct widgets in normal, small, anchor, and anchor+small
     modes.
   - Editroutepage shows editRoute + routePoints.
   - No console errors related to missing widget kinds or names.

## Testing Suggestions

### Automated tests

Add to the existing test suite (alongside
`tests/layouts/gpspage-all-widgets.test.js`):

1. **Layout JSON parse test** — for each `.json` file in `layouts/`, verify it
   parses and has `layoutVersion: 1`.

2. **Widget kind registry test** — extract all `kind` values from every bundled
   layout; assert each exists in the cluster-routes registry.

3. **Kind–cluster cross-check** — for each widget in every layout that has an
   explicit `kind`, assert the `name` matches the cluster that owns that kind.
   Widgets without `kind` use the cluster default and need no cross-check.

4. **Navpage mode coverage test** — for each layout, assert the navpage object
   contains the fourteen required panels listed in validation step 6.

5. **GPS page anchor panel test** — for each layout, assert gpspage1 and gpspage2
   each contain a `left_anchor` panel with the expected anchor watch widgets.

6. **plugin.json file-exists test** — parse `plugin.json`, iterate `layouts`,
   assert each `file` exists on disk relative to the repository root.

### Manual / integration tests

- Install the plugin on a Raspberry Pi and an Android device.
- Switch between both layouts in the AvNav layout selector.
- On each layout: cycle through GPS pages, toggle small mode, activate anchor
  watch, verify GPS pages 1–2 switch to anchor data, toggle small mode during
  anchor watch.
- Verify editroutepage renders the dyni editRoute widget and routePoints list.
- Verify AIS overlay is enabled (layouts set `"layers": {"ais": true}`).

## Known Tradeoffs

1. **Hidden textual metrics** — captions and units are set to empty strings on
   widgets whose values already appear in another widget on the same page (e.g.
   radial gauge readouts suppressed when a numeric widget shows the same data
   alongside). This avoids visual redundancy but means users who remove a
   companion widget may need to re-enable captions on the remaining one.

2. **Defaults used where already good** — many dyninstruments widgets have
   sensible built-in defaults. The layouts only override values where the
   defaults are too generic for practical use (speed max, depth range, voltage
   range, wind layline sectors).

3. **Tightened gauge ranges** — speed (30 kn motorboat / 12 kn sailboat), depth
   (0–30 m), voltage (10.5–15.5 V). Users with different needs (fast planing
   boats, 24 V systems, deep-water sailing) will need to clone and adjust.

4. **12 V battery assumption** — voltage gauge range and warning/alarm thresholds
   assume a 12 V system. 24 V users must adjust manually.

5. **Three GPS pages per layout** — a balance between comprehensiveness and
   overwhelming new users. Power users can add more via the layout editor.

6. **Shared editroutepage** — both layouts use the same editroutepage structure.
   A sailboat-specific editroutepage with VMG could be added later.

7. **Landscape-only layouts** — these layouts use a three-column GPS page
   structure (left/m1/right) optimised for landscape displays. They work in
   portrait mode but the centre column may feel cramped on narrow screens.
   Dedicated portrait variants could be added in a future iteration.

## Manual Follow-Up

After this plan is accepted:

1. **Add layout files** — copy the two layout JSON files to `layouts/` in
   the plugin repository.

2. **Create plugin.json** — add the file at the repository root with the
   `"layouts"` array shown above. If other plugin.json keys are needed (version,
   editableParameters), add them at the same time.

3. **Add tests** — implement the automated tests described above.

4. **Update documentation** — mention the bundled layouts in README.md and any
   user-facing docs.

5. **Packaging / release** — ensure the `layouts/` directory and `plugin.json`
   are included in the plugin package/distribution. Verify on both Raspberry Pi
   and Android.
    - Update `tools/release-zip-builder.mjs` so `plugin.json` and `layouts/` are treated as runtime release assets.
    - Update the release zip builder tests to assert bundled layouts and `plugin.json` are included in release zips.

6. **Future iteration** — consider adding:
   
   - Portrait-optimised layout variants (two-column GPS pages, 3-widget bottom
     panel limit, adjusted navpage sidebar for narrow screens).
   - A racing sailboat layout (tighter wind angles, more performance data).
   - 24 V voltage presets.
   - Catamaran/multihull layout.
   - Layout variants with SignalK-specific data paths.
