# dyninstruments - Modern Instrument Widgets for AvNav

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that provides a modern, highly legible instrument panel with cluster-based widgets and canvas-based gauges.
The goal is maximum readability at the helm with minimal configuration overhead.

> ⚠️ **Status:** Pre-release. APIs, widget names, and editor options may still change.

---

## Features

### Cluster widgets

- Related values are grouped into thematic clusters: `courseHeading`, `speed`, `environment`, `wind`, `nav`, `anchor`, `vessel`.
- In the editor you usually select only a `kind` (for example `cog`, `hdt`, `sog`, `stwLinear`, `tempLinear`, `tempRadial`) instead of building custom widgets per value.

### Readability-first layouts

- Caption, value, and unit are auto-scaled for available space.
- Layout adapts to aspect ratio (flat / normal / high).
- Numeric values stay visually dominant.

### Canvas gauges

- `WindRadialWidget` for AWA/AWS and TWA/TWS with optional layline sectors.
- `CompassRadialWidget` for HDT/HDM radial kinds.
- Semicircle gauges:
  - `SpeedRadialWidget`
  - `DepthRadialWidget`
  - `TemperatureRadialWidget`
  - `VoltageRadialWidget`
- Linear gauges:
  - `SpeedLinearWidget` (`sogLinear`, `stwLinear`)
  - `DepthLinearWidget`
  - `TemperatureLinearWidget`
  - `VoltageLinearWidget`

### Editor options

- `kind` selection and per-kind caption/unit overrides (`caption_*`, `unit_*`).
- Shared text scale options such as `captionUnitScale`.
- Gauge range and optional warning/alarm sectors via enable toggles.
- SignalK path overrides through `KEY` fields.

### AvNav integration

- Styling is scoped to plugin widgets and does not modify standard AvNav instrument widgets.
- Day/night theming is respected via plugin CSS variables and resolved colors.

---

## Requirements

- AvNav server installation (Raspberry Pi, Linux, Windows Desktop).
- Pure Android app is not supported for plugin loading.
- Browser with Canvas 2D and modern JavaScript support.

---

## Installation

### 1) Download ZIP

1. Download the latest `dyninstruments` ZIP from GitHub Releases.
2. Unzip it and confirm the `dyninstruments/` folder contains at least:
   - `plugin.js`
   - `plugin.css`
   - `widgets/...`

### 2) Copy to AvNav plugin directory

**Raspberry Pi (default):**

```bash
cd /home/pi/avnav/data/plugins
unzip /path/to/dyninstruments.zip
# result: /home/pi/avnav/data/plugins/dyninstruments/
```

**Other Linux setups (example):**

```bash
cd /home/<user>/avnav/plugins
unzip /path/to/dyninstruments.zip
# result: /home/<user>/avnav/plugins/dyninstruments/
```

Restart the AvNav server after installation.

---

## Usage Quickstart

1. Open AvNav in your browser.
2. Enter edit mode for your instrument layout.
3. Add cluster widgets named `dyni_*_Instruments`.
4. Pick a `kind` in the widget editor.
5. Optionally adjust captions, units, and gauge sector toggles.

Current cluster widgets:

- `dyni_CourseHeading_Instruments`
- `dyni_Speed_Instruments`
- `dyni_Environment_Instruments`
- `dyni_Wind_Instruments`
- `dyni_Nav_Instruments`
- `dyni_Anchor_Instruments`
- `dyni_Vessel_Instruments`

---

## Customize Instruments

You can customize dyninstruments at two levels:

1. Per-widget behavior in the AvNav widget editor (`kind`, `caption_*`, `unit_*`, ranges, sectors, `KEY` fields)
2. Global visual style in AvNav `user.css` using dyninstruments CSS variables

### 1) Select a preset from `user.css`

```css
.widget.dyniplugin,
[data-dyni] {
  --dyni-theme-preset: bold;
}
```

Available preset names:

- `default`
- `slim`
- `bold`
- `night`
- `highcontrast`

### 2) Override individual style tokens

```css
.widget.dyniplugin,
[data-dyni] {
  --dyni-pointer: #00aaff;
  --dyni-warning: #f5c542;
  --dyni-alarm: #ff5533;
  --dyni-radial-arc-linewidth: 1.5;
  --dyni-radial-tick-major-width: 2.5;
  --dyni-radial-pointer-width: 1.2;
  --dyni-xte-boat-size-factor: 1.2;
  --dyni-font-weight: 800;
}
```

Direct token overrides beat the active preset. They are resolved by `ThemeResolver`, so they no longer depend on `plugin.css` load order.

### 3) Full CSS token reference

Values below are valid `user.css` examples. For `ThemeResolver` tokens, the example matches the shipped default unless noted otherwise.

#### Preset and structural tokens

| Token | Example value | Description |
|---|---|---|
| `--dyni-theme-preset` | `bold` | Selects the active runtime preset (`default`, `slim`, `bold`, `night`, `highcontrast`). |
| `--dyni-font` | `"Inter", "SF Pro Text", -apple-system, "Segoe UI", Roboto, sans-serif` | Font stack used by dyninstruments canvas and HTML rendering. |
| `--dyni-fg` | `#dfe6ee` | Plugin-specific foreground color override used by text/ticks before AvNav fallback colors. |
| `--dyni-border-day` | `rgba(0, 0, 0, 0.30)` | Widget border color in day mode. |
| `--dyni-border-night` | `rgba(252, 11, 11, 0.18)` | Widget border color in night mode. |

#### Theme colors

| Token | Example value | Description |
|---|---|---|
| `--dyni-pointer` | `#ff2b2b` | Main pointer/needle color for gauges and dials. |
| `--dyni-warning` | `#e7c66a` | Warning sector color. |
| `--dyni-alarm` | `#ff7a76` | Alarm sector color. |
| `--dyni-layline-stb` | `#82b683` | Starboard layline color. |
| `--dyni-layline-port` | `#ff7a76` | Port layline color. |

#### Radial tokens

| Token | Example value | Description |
|---|---|---|
| `--dyni-radial-tick-major-len` | `12` | Major radial tick length in px-style factor units. |
| `--dyni-radial-tick-major-width` | `3` | Major radial tick stroke width. |
| `--dyni-radial-tick-minor-len` | `7` | Minor radial tick length. |
| `--dyni-radial-tick-minor-width` | `1.5` | Minor radial tick stroke width. |
| `--dyni-radial-pointer-width` | `1` | Full-width factor for radial pointers. |
| `--dyni-radial-pointer-length` | `2` | Length factor for radial pointers. |
| `--dyni-radial-arc-linewidth` | `2` | Arc stroke width. |
| `--dyni-radial-ring-width` | `0.16` | Ring thickness factor. |
| `--dyni-radial-label-inset` | `1.8` | Label inset factor from the ring edge. |
| `--dyni-radial-label-font` | `0.14` | Radial label font-size factor. |
| `--dyni-radial-fullcircle-normal-inner-margin` | `0.03` | Inner margin factor for normal-mode full-circle dials. |
| `--dyni-radial-fullcircle-normal-min-height` | `0.45` | Minimum text block height factor for normal-mode full-circle dials. |
| `--dyni-radial-fullcircle-normal-dual-gap` | `0.05` | Gap factor between dual columns in normal-mode full-circle dials. |

#### Linear tokens

| Token | Example value | Description |
|---|---|---|
| `--dyni-linear-track-width` | `0.16` | Linear track thickness factor. |
| `--dyni-linear-track-linewidth` | `2` | Linear track stroke width. |
| `--dyni-linear-tick-major-len` | `12` | Major linear tick length. |
| `--dyni-linear-tick-major-width` | `3` | Major linear tick stroke width. |
| `--dyni-linear-tick-minor-len` | `7` | Minor linear tick length. |
| `--dyni-linear-tick-minor-width` | `1.5` | Minor linear tick stroke width. |
| `--dyni-linear-pointer-width` | `1` | Full-width factor for linear pointers. |
| `--dyni-linear-pointer-length` | `2` | Length factor for linear pointers. |
| `--dyni-linear-label-inset` | `1.8` | Label inset factor for linear gauges. |
| `--dyni-linear-label-font` | `0.14` | Linear label font-size factor. |

#### Text and XTE tokens

| Token | Example value | Description |
|---|---|---|
| `--dyni-font-weight` | `700` | Primary numeric/value text weight. |
| `--dyni-label-weight` | `700` | Caption/unit/tick-label text weight. |
| `--dyni-xte-line-width-factor` | `1.5` | Stroke width multiplier for the XTE highway renderer. |
| `--dyni-xte-boat-size-factor` | `1` | Size multiplier for the XTE boat indicator glyph. |

### 4) Preset precedence

Preset source order:

1. Settings API (future integration)
2. `window.DyniPlugin.theme`
3. `--dyni-theme-preset` from `user.css`
4. `default`

If you want `user.css` to control the preset, make sure `window.DyniPlugin.theme` is not set.

### 5) Apply changes immediately

After editing `user.css`, hard-refresh AvNav.  
Optional browser-console reapply:

```javascript
window.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets();
```

For full theming reference, see:
- `documentation/shared/css-theming.md`
- `documentation/shared/theme-tokens.md`

---

## Architecture (Short Overview)

The plugin uses a split bootstrap/runtime architecture:

- `plugin.js` starts runtime initialization.
- `runtime/` loads registered components and registers widgets in AvNav.
- `cluster/` maps `cluster + kind` values to renderer props.
- `widgets/` render text and gauges using shared utility modules in `shared/widget-kits/`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full layer map and dependency rules.

---

## Roadmap (Short)

- Foundation refactors are complete (bootstrap split, shared gauge core, semicircle engine unification).
- Linear parity for non-compass/non-wind radial kinds is complete (`sogLinear`, `stwLinear`, `depthLinear`, `tempLinear`, `voltageLinear`).
- Next focus is coverage expansion for remaining AvNav widget categories.
- Cluster-first integration remains the primary strategy.
- Backward compatibility is not guaranteed during pre-release.

Full roadmap details and the AvNav widget coverage matrix are tracked in [ROADMAP.md](ROADMAP.md).

---

## For Developers

Developer setup, AI-assisted workflow rules, quality gates, and pre-PR checklist are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

`tools/check-patterns.mjs` now enforces aggressive cross-file duplication detection (body-level function clones + long cloned blocks) and emits warn-only fail-fast fallback/legacy findings. Shared helper extraction is required for repeated logic, and intentional exceptions must use:

```javascript
// dyni-lint-disable-next-line <rule-name> -- <reason>
/* dyni-lint-disable-line <rule-name> -- <reason> */
```

Final validation uses the full gate: `npm run check:all`.
