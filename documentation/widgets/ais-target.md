# AisTarget HTML Renderer

**Status:** ✅ Implemented | `widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js`

## Overview

`aisTarget` is a native HTML kind (`surface: "html"`) in the map cluster.

Route tuple:

- `cluster: "map"`
- `kind: "aisTarget"`
- `renderer: "AisTargetTextHtmlWidget"`

Ownership split:

- `AisTargetViewModel` normalizes selected target domain from `nav.ais.nearest`
- `MapMapper` maps grouped renderer payload (`domain`, `layout`, `captions`, `units`, `default`)
- `AisTargetRenderModel` owns render-state, interaction-state, branch selection, and formatter wiring
- `AisTargetLayout` owns `flat`/`normal`/`high` geometry plus committed vertical shell profile
- `AisTargetHtmlFit` owns text fitting and AIS accent token resolution
- `AisTargetMarkup` owns escaped HTML markup assembly and conditional hotspot/accent nodes
- `HtmlSurfaceController` owns HTML lifecycle (`attach`/`update`/`detach`/`destroy`)
- `TemporaryHostActionBridge` owns page-aware `hostActions.ais.showInfo(mmsi)` dispatch

This widget is intentionally summary/workflow-entry only. It does not embed AIS dialog actions (`track`, `hide`, `center`, `locate`) and leaves detailed AIS workflows host-owned.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `domain.hasTargetIdentity` | boolean | `false` | Selected target identity presence (`target.mmsi !== undefined`) |
| `domain.hasDispatchMmsi` | boolean | `false` | Dispatch-safe normalized MMSI availability |
| `domain.mmsiNormalized` | string | `""` | Normalized MMSI for host action dispatch |
| `domain.nameOrMmsi` | string | `""` | Name fallback chain (`name`/`shipname`/`mmsi`) |
| `domain.frontText` | string | `"-"` | Front/back/pass state text |
| `domain.frontInitial` | string | `"-"` | Initial for flat mode identity tile |
| `domain.distance` | number | — | Distance input for `DST` |
| `domain.cpa` | number | — | CPA input for `DCPA` |
| `domain.tcpa` | number | — | TCPA input (seconds) |
| `domain.headingTo` | number | — | Bearing input for `BRG` |
| `domain.showTcpaBranch` | boolean | `false` | `true` => `DCPA` + `TCPA`, `false` => `BRG` |
| `domain.colorRole` | string | `""` | `warning`/`nearest`/`tracking`/`normal` |
| `domain.hasColorRole` | boolean | `false` | Enables accent role class and accent strip |
| `layout.ratioThresholdNormal` | number | `1.2` | Ratio below/at this threshold -> `high` |
| `layout.ratioThresholdFlat` | number | `3.8` | Ratio above/at this threshold -> `flat` |
| `captions.dst/cpa/tcpa/brg` | string | kind defaults | Per-metric caption text |
| `units.dst/cpa/tcpa/brg` | string | kind defaults | Per-metric unit text |
| `default` | string | `"---"` | Placeholder fallback for missing formatter values |
| `editing` | boolean | `false` | Forces passive interaction state |
| `dyniLayoutEditing` | boolean | `false` | Dyn layout-edit fallback flag when AvNav strips `editing` |

## Visual Contract

### CSS State Classes

| Class | Source | Meaning |
|---|---|---|
| `dyni-ais-target-html` | renderer wrapper | Base widget block |
| `dyni-ais-target-mode-high` | mode resolver | Tall layout |
| `dyni-ais-target-mode-normal` | mode resolver | Balanced layout |
| `dyni-ais-target-mode-flat` | mode resolver | Wide layout |
| `dyni-ais-target-data` | render-state resolver | Target summary visible |
| `dyni-ais-target-placeholder` | render-state resolver | Passive placeholder (`No AIS`) |
| `dyni-ais-target-hidden` | render-state resolver | Hidden output state |
| `dyni-ais-target-open-dispatch` | interaction resolver | Active click capture/dispatch |
| `dyni-ais-target-open-passive` | interaction resolver | Passive click ownership |
| `dyni-ais-target-branch-tcpa` | branch resolver | `DST + DCPA + TCPA` branch |
| `dyni-ais-target-branch-brg` | branch resolver | `DST + BRG` branch |
| `dyni-ais-target-color-warning` / `-nearest` / `-tracking` / `-normal` | color-role resolver | Accent role class for token color mapping |
| `dyni-ais-target-vertical` | committed ancestry check | `.widgetContainer.vertical` committed shell mode |

### Element Class Contract

| Selector | Purpose |
|---|---|
| `.dyni-ais-target-identity` | Identity panel wrapper |
| `.dyni-ais-target-name` | Full name/MMSI line (`normal`/`high`) |
| `.dyni-ais-target-front` | Front/back/pass text line (`normal`/`high`) |
| `.dyni-ais-target-front-initial` | Initial-only identity tile (`flat`) |
| `.dyni-ais-target-metrics` | Metric grid container |
| `.dyni-ais-target-metric-*` | Per-metric tile (`dst`, `cpa`, `tcpa`, `brg`) |
| `.dyni-ais-target-metric-caption` | Caption line |
| `.dyni-ais-target-metric-value` | Value line |
| `.dyni-ais-target-metric-unit` | Unit line (`:empty` hidden) |
| `.dyni-ais-target-state-accent` | Left accent strip (theme token color) |
| `.dyni-ais-target-open-hotspot` | Full-surface click hotspot (`onclick="aisTargetShowInfo"`) |
| `.dyni-ais-target-placeholder-text` | Placeholder text node |

### Layering and Click Ownership

| Layer | Selector | z-index | Contract |
|---|---|---|---|
| Accent strip | `.dyni-ais-target-state-accent` | `0` | Visual state role indicator |
| Base content | identity + metrics + placeholder | `1` | Summary text and metric tiles |
| Interaction overlay | `.dyni-ais-target-open-hotspot` | `2` | Full-widget dispatch target |

Dispatch mode:

- wrapper includes `onclick="catchAll"`
- hotspot is present and uses `onclick="aisTargetShowInfo"`
- `namedHandlers()` returns `{ aisTargetShowInfo }`

Passive mode:

- no `catchAll` wrapper attribute
- no hotspot node
- `namedHandlers()` returns `{}`

## Layout and State Contract

Mode selection:

```text
ratio = shellWidth / shellHeight
ratio <= ratioThresholdNormal -> high
ratio >= ratioThresholdFlat -> flat
otherwise -> normal
```

Committed vertical ancestry (`.widgetContainer.vertical`) forces `high` and switches to a widget-owned shell profile:

- `height:auto`
- `aspect-ratio:7/8`
- `min-height:8em`

Mode matrix:

| Mode | Identity fields | Metric field set |
|---|---|---|
| `flat` | `frontInitial` only | `DST` + (`TCPA` or `BRG`) |
| `normal` | `nameOrMmsi` + `frontText` | `DST` + (`DCPA` + `TCPA` or `BRG`) |
| `high` | `nameOrMmsi` + `frontText` | `DST` + (`DCPA` + `TCPA` or `BRG`) |

Render-state policy:

| State | Rule |
|---|---|
| `data` | `domain.hasTargetIdentity === true` |
| `placeholder` | no target identity and (`editing` OR `pageId === "gpspage"`) |
| `hidden` | no target identity and not placeholder |

Interaction-state policy:

| State | Rule |
|---|---|
| `dispatch` | `renderState === "data"` AND not editing AND `domain.hasDispatchMmsi` AND capabilities `ais.showInfo === "dispatch"` |
| `passive` | all other cases |

Current bridge capability behavior is page-limited: dispatch mode is exposed on `navpage` and `gpspage`; other pages remain passive.

## Formatting and Theme Contract

Formatter contract:

- `distance` -> `formatDistance(distance, units.dst)`
- `cpa` -> `formatDistance(cpa, units.cpa)`
- `tcpa` -> `formatDecimal(tcpa / 60, 3, Math.abs(tcpa) > 60 ? 0 : 2)`
- `headingTo` -> `formatDirection(headingTo)`

Branch rule:

- `tcpa > 0` => `TCPA` branch (`DST`, `DCPA`, `TCPA`)
- otherwise => `BRG` branch (`DST`, `BRG`)

Theme/token contract:

- accent strip color is token-derived from `ThemeResolver.resolveForRoot(root).colors.ais.<role>`
- used role keys: `warning`, `nearest`, `tracking`, `normal`
- no AvNav AIS style-store color reads are used in renderer code

## Resize Signature Contract

`resizeSignature(props)` includes:

- mode
- render state
- branch state (`tcpa`/`brg`)
- interaction state (`dispatch`/`passive`)
- vertical committed flag
- shell width
- shell height (non-vertical) or effective layout height (vertical)
- field-length terms for visible text nodes (identity + metric caption/value/unit)

In committed vertical mode, raw host shell height is excluded in favor of the effective widget-owned vertical height to avoid self-induced resize loops.

## Parity Boundary

Included parity:

- selected-target summary role from `nav.ais.nearest`
- workflow-entry click dispatch to host AIS info flow (`hostActions.ais.showInfo`)
- branch/data/format/color-role semantics used by summary display

Explicitly excluded:

- AIS detail dialogs
- inline AIS action buttons (`track`, `hide`, `center`, `locate`)
- host page workflow internals and bridge implementation changes

## Related

- [map-zoom.md](map-zoom.md)
- [active-route.md](active-route.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
- [../avnav-api/interactive-widgets.md](../avnav-api/interactive-widgets.md)
