# Color System

**Status:** ✅ Implemented | Role-based palette for readable marine instruments

## Overview

The dyninstruments palette is optimized for tablet readability in bright daylight while keeping semantic roles consistent across radial, linear, HTML, and text widgets.

## Key Details

- Day mode uses a white surface, near-black foreground, and moderate-saturation accents.
- Default day accents are intentionally desaturated so `highcontrast` has real headroom to increase separation.
- The pointer is the primary live-value locator and must stay blue, not red/yellow/green.
- Warning and alarm colors are reserved for sectors, alerts, and critical bars.
- Info, warning, alarm, and OK are the four daylight hue anchors; every other color role inherits from one of them.
- Info is the blue source; the pointer inherits info. Usage, label, and placement distinguish the two roles.
- Alarm-widget background inherits alarm, AIS tracking inherits warning, and AIS normal inherits OK.
- Starboard laylines inherit OK, and port laylines inherit alarm.
- Related roles keep explicit override inputs while sharing the same default anchors.
- Night mode remains a dim red navigation mode owned by AvNav night detection.
- `darkmode` is a black-surface readability preset, not the same as night mode.

## API/Interfaces

### Day Palette (Anchors)

| Role | Token path | Input var | Default |
|---|---|---|---|
| Surface foreground | `surface.fg` | `--dyni-fg` | `#000000` |
| Surface background | `surface.bg` | `--dyni-bg` | `#ffffff` |
| Info / blue source | `colors.info` | `--dyni-info` | `#3366cc` |
| Warning | `colors.warning` | `--dyni-warning` | `#e0a92e` |
| Alarm | `colors.alarm` | `--dyni-alarm` | `#d9534a` |
| OK / positive | `colors.ok` | `--dyni-ok` | `#2e9e6b` |

### Inheriting Roles

Every non-anchor color role resolves through `defaultFrom` and stays synchronized with its
anchor unless a user override or preset override is present.

| Role | Token path | Input var | Inherits |
|---|---|---|---|
| Pointer / live locator | `colors.pointer` | `--dyni-pointer` | `colors.info` |
| Starboard layline | `colors.laylineStb` | `--dyni-layline-stb` | `colors.ok` |
| Port layline | `colors.laylinePort` | `--dyni-layline-port` | `colors.alarm` |
| Alarm widget background | `colors.alarmWidget.bg` | `--dyni-alarm-widget-bg` | `colors.alarm` |
| Alarm widget strip | `colors.alarmWidget.strip` | `--dyni-alarm-widget-strip` | `colors.ok` |
| AIS warning | `colors.ais.warning` | `--dyni-ais-warning` | `colors.alarm` |
| AIS nearest | `colors.ais.nearest` | `--dyni-ais-nearest` | `colors.ok` |
| AIS tracking | `colors.ais.tracking` | `--dyni-ais-tracking` | `colors.warning` |
| AIS normal | `colors.ais.normal` | `--dyni-ais-normal` | `colors.ok` |
| Regatta warning bar | `colors.regatta.barWarning` | `--dyni-regatta-bar-warning` | `colors.warning` |
| Regatta critical bar | `colors.regatta.barCritical` | `--dyni-regatta-bar-critical` | `colors.alarm` |
| Regatta default bar | `colors.regatta.barDefault` | `--dyni-regatta-bar-default` | `colors.info` |

The alarm-widget foreground (`colors.alarmWidget.fg`, `--dyni-alarm-widget-fg`) stays an
independent `#ffffff` so alarm text remains legible on the inherited alarm background.

### Darkmode Palette (Anchors)

`darkmode` only overrides the four anchors and the surface; the inheriting roles above cascade
from these values automatically.

| Role | Token path | Default |
|---|---|---|
| Surface foreground | `surface.fg` | `#ffffff` |
| Surface background | `surface.bg` | `#000000` |
| Info / blue source | `colors.info` | `#5aa2ff` |
| Warning | `colors.warning` | `#ffd24a` |
| Alarm | `colors.alarm` | `#ff6b5c` |
| OK / positive | `colors.ok` | `#5fd68b` |

### Highcontrast Palette (Anchors)

`highcontrast` keeps the anchors at full saturation for maximum daylight separation; the gap to
the muted `default` anchors is the whole point of the preset. Inheriting roles cascade from these.

| Role | Token path | Default |
|---|---|---|
| Info / blue source | `colors.info` | `#0057ff` |
| Warning | `colors.warning` | `#ffd200` |
| Alarm | `colors.alarm` | `#ff3b2f` |
| OK / positive | `colors.ok` | `#008f5a` |

### Night Mode

Night mode uses dim red semantic overrides from `runtime/theme/model.js`.
Do not reuse night-mode colors for daylight or `darkmode`; the night palette is optimized for low-light navigation, not sun readability.

### Preset Intent

| Preset | Intent |
|---|---|
| `default` | Bright-day cockpit readability with balanced, muted color volume |
| `slim` | Lower visual weight, same semantic colors |
| `bold` | Heavier strokes and pointer geometry, same semantic colors |
| `darkmode` | Black-surface readability with brighter dark-surface accents |
| `highcontrast` | Maximum daylight separation for pointer, sectors, laylines, and status colors |

## Rules for Adding a New Color

Follow these rules whenever a new color role is introduced. They keep the palette
semantic, override-friendly, and free of duplicated literals.

1. **Anchor or inherit — never a fifth literal.** There are exactly four day hue anchors
   (`colors.info`, `colors.warning`, `colors.alarm`, `colors.ok`). A new role must either
   be one of these anchors or inherit from one via `defaultFrom`. Do not introduce a new
   standalone color literal for a role that is semantically "a kind of blue/warning/alarm/ok".
   Note the blue anchor is `colors.info`; `colors.pointer` itself inherits `colors.info`.
2. **Pick the anchor by meaning, not by hue.** Map the role to the anchor that matches its
   intent: blue / live locators → `colors.info`, cautions/attention → `colors.warning`,
   danger/critical → `colors.alarm`, safe/positive/starboard → `colors.ok`. Pointer, AIS, and
   regatta roles in this document are worked examples.
3. **Declare inheriting tokens with `defaultFrom` only.** In `runtime/theme/model.js`, an
   inheriting token passes `undefined` for `default` and `defaultByMode` and sets the seventh
   `defineToken(...)` argument to the parent path (for example `"colors.alarm"`). Do not also
   give it a hard-coded default or a `night` value — the cascade resolves both from the anchor.
4. **Do not re-override inherited roles in presets.** If a token inherits an anchor, it must be
   absent from every preset `base`/`night` block. Setting it there defeats the cascade
   (preset override outranks `defaultFrom`) and reintroduces drift. Presets should override
   anchors only; inheriting roles follow automatically.
5. **Keep a public input var for overrides.** Every role gets a `--dyni-*` input var following
   the naming convention in [theme-tokens.md](theme-tokens.md#naming-convention) so users can
   still override the role independently of its anchor.
6. **Contrast is the caller's responsibility, not the token's.** When a role is used as a fill
   behind text (like the alarm widget), pair it with an independent, non-inheriting foreground
   token (`colors.alarmWidget.fg`) rather than tinting the background token.
7. **Anchors carry day + night; inheriting roles carry neither.** A new anchor needs a day
   `default` plus a `night` entry in `defaultByMode` (and matching preset `night` overrides where
   the preset diverges). Reducing or raising anchor saturation is a day-only decision; the night
   palette stays dim red.
8. **Update the fail-closed surfaces in the same change.** New/changed color defaults must be
   reflected in this file, [theme-tokens.md](theme-tokens.md), `README.md`,
   `tests/css/theme-token-extremes.user.css`, and the theme resolver tests under
   `tests/runtime/`.

## Related

- [theme-tokens.md](theme-tokens.md)
- [css-theming.md](css-theming.md)
- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
