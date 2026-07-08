# dyninstruments

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that adds readable, configurable marine instrument widgets for navigation, wind, environment, alarms, and route handling.

## What you get

| Cluster | Includes |
|---|---|
| Course & Heading | Compass radial, compass linear, COG, HDT, HDM |
| Speed | SOG and STW as radial, linear, or text |
| Environment | Depth, temperature, voltage as radial, linear, or text |
| Wind | AWA/AWS and TWA/TWS radial with optional layline sectors |
| Navigation | Active route, route points, edit route, AIS target, map zoom, XTE, XTE linear gauge |
| Anchor | Anchor watch circle |
| Vessel | Alarms, regatta timer, position coordinates, center display, three-value text |

<img width="1920" height="1080" alt="Bildschirmfoto vom 2026-07-08 20-29-00" src="https://github.com/user-attachments/assets/6be666cf-df3c-4832-9ba3-265f5497e152" />
<img width="1920" height="1080" alt="Bildschirmfoto vom 2026-07-08 20-28-44" src="https://github.com/user-attachments/assets/097ad058-a6ca-43f8-b2bf-6879a877ef5d" />

## Installation

Linux AvNav servers can install or update from the latest GitHub Release with:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/metzger100/dyninstruments/main/install.sh)
```

The installer targets AvNav user plugins by default. It detects existing user plugin installs, AvNav service data directories, and documented Linux defaults before writing files. For custom setups, pass the AvNav data directory or the final plugin directory:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/metzger100/dyninstruments/main/install.sh) --data-dir <AVNAV_DATA_DIR>
bash <(curl -sSL https://raw.githubusercontent.com/metzger100/dyninstruments/main/install.sh) --plugin-dir <AVNAV_PLUGIN_DIR>/dyninstruments
```

Pinned release example:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/metzger100/dyninstruments/main/install.sh) --version 3.6.0
```

Manual install:

1. Download the latest release zip from GitHub Releases (or from `releases/` in this repository).
2. Extract it into your AvNav plugin directory so you get `<AVNAV_PLUGIN_DIR>/dyninstruments/`.
3. Restart AvNav.
4. Optional: open AvNav's layout selector and choose one of the bundled layouts:
   - `Dyni Motorboat`
   - `Dyni Sailboat`
5. Open the AvNav layout editor for further customization. Widgets are listed under `dyninstruments` (`dyni_*_Instruments`).

AvNav documents user plugins under the data directory's `plugins` folder and system plugins under `/usr/lib/avnav/plugins`. Use the installer `--system` option only when you intentionally want a system plugin install.

Bundled layouts are stored in:
- `layouts/dyni-motorboat.json`
- `layouts/dyni-sailboat.json`
- registered through root `plugin.json`

## AvNav compatibility

dyninstruments ships all current AvNav plugin surfaces:

- `plugin.js` is the conservative legacy entrypoint for older AvNav versions.
- `plugin.mjs` is the modern entrypoint used by current/future AvNav versions when available.
- `plugin.json` is declarative metadata for bundled layouts and does not duplicate widget runtime registration.
- `plugin.css` is loaded by AvNav as the plugin-wide stylesheet.

On AvNav versions that load `plugin.mjs` first, `plugin.js` is not used as an in-browser fallback. Module startup treats each AvNav API/timestamp invocation as a fresh generation, registers widgets against that API, and returns a shutdown function so AvNav reloads can clear generation-bound state.

## Configuration

1. Add a `dyni_*_Instruments` widget in the AvNav layout editor.
2. Choose a `kind` (for example `sogLinear`, `tempRadial`, `hdt`, `activeRoute`).
3. Override captions and units with `caption_*` and `unit_*` fields.
4. Set scale/range values for gauge kinds as needed.
5. Enable warning/alarm sectors on supported gauges.
6. Override SignalK data paths with `KEY` fields when you need custom store keys.
   Depth widgets default to depth below keel; use `Depth store path` to select below transducer, below surface/waterline, or another AvNav store key.

## Theming

dyninstruments follows AvNav day/night mode and supports `user.css` overrides via `--dyni-*` theme inputs.

Preset selector:

- `--dyni-theme-preset`: `default` (supported presets: `default`, `slim`, `bold`, `darkmode`, `highcontrast`; `night` is a mode, not a preset)

`darkmode` is a built-in black-surface preset with white foreground/borders and tuned semantic accents for warning/alarm, laylines, and AIS roles.
`night` remains the dim red AvNav navigation mode, not a preset family.

Theming uses a two-level hierarchy:

- Global tokens define shared visual semantics for surface, typography, opacity, and core colors.
- Scoped tokens specialize widget families and can cascade from a global parent when no scoped override is set.
- The role palette is documented in `documentation/shared/color-system.md`.

Global tokens:

| Category | Input var | Default |
|---|---|---|
| Surface | `--dyni-fg` | `#000000` |
| Surface | `--dyni-bg` | `#ffffff` |
| Surface | `--dyni-border` | Optional. If omitted, border follows resolved `surface.fg`; if set, explicit value wins. |
| Typography | `--dyni-font` | `"Roboto","Inter","SF Pro Text",-apple-system,"Segoe UI","Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"` |
| Typography | `--dyni-font-mono` | `"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace` |
| Typography | `--dyni-font-weight` | `700` |
| Typography | `--dyni-label-weight` | `700` |
| Opacity | `--dyni-caption-opacity` | `1.0` |
| Opacity | `--dyni-unit-opacity` | `1.0` |
| Semantic color | `--dyni-info` | `#3366cc` |
| Semantic color | `--dyni-warning` | `#e0a92e` |
| Semantic color | `--dyni-alarm` | `#d9534a` |
| Semantic color | `--dyni-ok` | `#2e9e6b` |
| Geometry weight | `--dyni-stroke-weight` | `1.28` |
| Geometry weight | `--dyni-pointer-depth-weight` | `1.15` |
| Geometry weight | `--dyni-pointer-side-weight` | `2.0` |

Scoped tokens by family:

| Family | Input var | Default | Cascades from |
|---|---|---|---|
| Pointer | `--dyni-pointer` | inherits global when unset | `--dyni-info` |
| Alarm widget | `--dyni-alarm-widget-bg` | inherits global when unset | `--dyni-alarm` |
| Alarm widget | `--dyni-alarm-widget-fg` | `#ffffff` | — |
| Alarm widget | `--dyni-alarm-widget-strip` | inherits global when unset | `--dyni-ok` |
| AIS | `--dyni-ais-warning` | inherits global when unset | `--dyni-alarm` |
| AIS | `--dyni-ais-nearest` | inherits global when unset | `--dyni-ok` |
| AIS | `--dyni-ais-tracking` | inherits global when unset | `--dyni-warning` |
| AIS | `--dyni-ais-normal` | inherits global when unset | `--dyni-ok` |
| Regatta | `--dyni-regatta-bar-warning` | inherits global when unset | `--dyni-warning` |
| Regatta | `--dyni-regatta-bar-critical` | inherits global when unset | `--dyni-alarm` |
| Regatta | `--dyni-regatta-bar-default` | inherits global when unset | `--dyni-info` |
| Regatta outline | `--dyni-regatta-button-stroke-weight` | inherits global when unset | `--dyni-stroke-weight` |
| Wind/layline | `--dyni-layline-stb` | inherits global when unset | `--dyni-ok` |
| Wind/layline | `--dyni-layline-port` | inherits global when unset | `--dyni-alarm` |

Regatta input vars should use kebab-case (`--dyni-regatta-bar-*`). Existing camelCase aliases still resolve with a deprecation warning.

Family geometry factors (advanced):

| Family | Input var | Default |
|---|---|---|
| Radial | `--dyni-radial-tick-major-len-factor` | `0.087` |
| Radial | `--dyni-radial-tick-major-width-factor` | `0.022` |
| Radial | `--dyni-radial-tick-minor-len-factor` | `0.051` |
| Radial | `--dyni-radial-tick-minor-width-factor` | `0.011` |
| Radial | `--dyni-radial-pointer-side-factor` | `0.11` |
| Radial | `--dyni-radial-pointer-depth-factor` | `0.22` |
| Radial | `--dyni-radial-arc-linewidth-factor` | `0.0145` |
| Radial | `--dyni-radial-ring-width` | `0.16` |
| Radial | `--dyni-radial-label-inset` | `1.8` |
| Radial | `--dyni-radial-label-font` | `0.14` |
| Radial | `--dyni-radial-fullcircle-normal-inner-margin` | `0.03` |
| Radial | `--dyni-radial-fullcircle-normal-min-height` | `0.45` |
| Radial | `--dyni-radial-fullcircle-normal-dual-gap` | `0.05` |
| Radial | `--dyni-radial-fullcircle-tick-major-len-factor` | `0.131` |
| Radial | `--dyni-radial-fullcircle-tick-minor-len-factor` | `0.077` |
| Linear | `--dyni-linear-track-width` | `0.16` |
| Linear | `--dyni-linear-track-linewidth-factor` | `0.018` |
| Linear | `--dyni-linear-tick-major-len-factor` | `0.109` |
| Linear | `--dyni-linear-tick-major-width-factor` | `0.027` |
| Linear | `--dyni-linear-tick-minor-len-factor` | `0.064` |
| Linear | `--dyni-linear-tick-minor-width-factor` | `0.014` |
| Linear | `--dyni-linear-pointer-side-factor` | `0.12` |
| Linear | `--dyni-linear-pointer-depth-factor` | `0.24` |
| Linear | `--dyni-linear-label-inset` | `1.8` |
| Linear | `--dyni-linear-label-font` | `0.14` |


`user.css` input overrides always win over Dyni defaults. If you override colors only on `.widget.dyniplugin`, those values stay active in AvNav Night Mode too. Add matching `.nightMode .widget.dyniplugin` rules when you want separate night colors.

Example day + night override:

```css
.widget.dyniplugin {
  --dyni-fg: white;
  --dyni-bg: black;
  --dyni-info: #3366cc;
}

.nightMode .widget.dyniplugin {
  --dyni-fg: rgba(252, 11, 11, 0.60);
  --dyni-bg: black;
  --dyni-info: #cc2222;
}
```

Example override:

```css
.widget.dyniplugin {
  --dyni-theme-preset: bold;
  --dyni-pointer: #00aaff;
  --dyni-warning: #f5c542;
  --dyni-alarm: #ff5533;
}
```

Cascade recipe example:

```css
.widget.dyniplugin {
  --dyni-alarm: #ff5533;
}
```

Setting `--dyni-alarm` updates every token cascading from alarm (for example AIS warning and regatta critical) unless those scoped tokens are explicitly overridden.

## Requirements

- AvNav server installation with plugin support (Raspberry Pi/Linux/Windows server setups).
- Android AvNav is supported through the modern module startup path (`plugin.mjs`) when plugin loading is enabled.
- Browser with ES6 and Canvas 2D support (modern browsers).

## Development

dyninstruments is developed with AI-assisted tooling. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, coding standards, and release process.

## License

Bundled Roboto and Roboto Mono font assets include Apache 2.0 license text and attribution in [assets/fonts/LICENSE.txt](assets/fonts/LICENSE.txt).
