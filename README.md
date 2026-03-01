# dyninstruments - Modern Instrument Widgets for AvNav

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that provides a modern, highly legible instrument panel with cluster-based widgets and canvas-based gauges.
The goal is maximum readability at the helm with minimal configuration overhead.

> ⚠️ **Status:** Pre-release. APIs, widget names, and editor options may still change.

---

## Features

### Cluster widgets

- Related values are grouped into thematic clusters: `courseHeading`, `speed`, `environment`, `wind`, `nav`, `anchor`, `vessel`.
- In the editor you usually select only a `kind` (for example `cog`, `hdt`, `sog`, `stw`, `tempRadial`) instead of building custom widgets per value.

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
3. Add widgets prefixed with `dyninstruments_`.
4. Pick a `kind` in the widget editor.
5. Optionally adjust captions, units, and gauge sector toggles.

Current cluster widgets:

- `dyninstruments_CourseHeading`
- `dyninstruments_Speed`
- `dyninstruments_Environment`
- `dyninstruments_Wind`
- `dyninstruments_Nav`
- `dyninstruments_Anchor`
- `dyninstruments_Vessel`

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
  --dyni-radial-pointer-side: 0.3;
  --dyni-font-weight: 800;
}
```

Common tokens:

- Colors: `--dyni-pointer`, `--dyni-warning`, `--dyni-alarm`, `--dyni-layline-stb`, `--dyni-layline-port`
- Ring/ticks: `--dyni-radial-arc-linewidth`, `--dyni-radial-ring-width`, `--dyni-radial-tick-major-len`, `--dyni-radial-tick-major-width`, `--dyni-radial-tick-minor-len`, `--dyni-radial-tick-minor-width`
- Pointer geometry: `--dyni-radial-pointer-side`, `--dyni-radial-pointer-length`
- Labels/text: `--dyni-radial-label-inset`, `--dyni-radial-label-font`, `--dyni-font-weight`, `--dyni-label-weight`, `--dyni-font`

### 3) Preset precedence

Preset source order:

1. Settings API (future integration)
2. `window.DyniPlugin.theme`
3. `--dyni-theme-preset` from `user.css`
4. `default`

If you want `user.css` to control the preset, make sure `window.DyniPlugin.theme` is not set.

### 4) Apply changes immediately

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
- Next focus is coverage expansion for remaining AvNav widget categories.
- Cluster-first integration remains the primary strategy.
- Backward compatibility is not guaranteed during pre-release.

Full roadmap details and the AvNav widget coverage matrix are tracked in [ROADMAP.md](ROADMAP.md).

---

## For Developers

Developer setup, AI-assisted workflow rules, quality gates, and pre-PR checklist are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

`tools/check-patterns.mjs` now enforces aggressive cross-file duplication detection (body-level function clones + long cloned blocks), so shared helper extraction is required for repeated logic.

Final validation uses the full gate: `npm run check:all`.
