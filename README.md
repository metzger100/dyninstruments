# dyninstruments

`dyninstruments` is an [AvNav](https://github.com/wellenvogel/avnav) plugin that adds readable, configurable marine instrument widgets for navigation, wind, environment, alarms, and route handling.

## What you get

| Cluster | Includes |
|---|---|
| Course & Heading | Compass radial, compass linear, COG, HDT, HDM |
| Speed | SOG and STW as radial, linear, or text |
| Environment | Depth, temperature, voltage as radial, linear, or text |
| Wind | AWA/AWS and TWA/TWS radial with optional layline sectors |
| Navigation | Active route, route points, edit route, AIS target, map zoom, XTE |
| Anchor | Anchor watch circle |
| Vessel | Alarms, position coordinates, center display, three-value text |

<img width="1919" height="933" alt="image" src="https://github.com/user-attachments/assets/ac61d16d-027c-47f8-844b-b68103746221" />

## Installation

1. Download the latest release zip from GitHub Releases (or from `releases/` in this repository).
2. Extract it into your AvNav plugin directory so you get `.../plugins/dyninstruments/`.
3. Restart AvNav.
4. Optional: open AvNav's layout selector and choose one of the bundled layouts:
   - `Dyni Motorboat`
   - `Dyni Sailboat`
5. Open the AvNav layout editor for further customization. Widgets are listed under `dyninstruments` (`dyni_*_Instruments`).

Bundled layouts are stored in:
- `layouts/dyni-motorboat.json`
- `layouts/dyni-sailboat.json`
- registered through root `plugin.json`

## Configuration

1. Add a `dyni_*_Instruments` widget in the AvNav layout editor.
2. Choose a `kind` (for example `sogLinear`, `tempRadial`, `hdt`, `activeRoute`).
3. Override captions and units with `caption_*` and `unit_*` fields.
4. Set scale/range values for gauge kinds as needed.
5. Enable warning/alarm sectors on supported gauges.
6. Override SignalK data paths with `KEY` fields when you need custom store keys.

## Theming

dyninstruments follows AvNav day/night mode and supports `user.css` overrides via `--dyni-*` theme inputs.

Preset selector:

- `--dyni-theme-preset`: `default` (supported presets: `default`, `slim`, `bold`, `highcontrast`; `night` is a mode, not a preset)

Complete token list with defaults:

| Token | Default |
|---|---|
| `--dyni-fg` | `black` |
| `--dyni-bg` | `white` |
| `--dyni-border` | Optional. If omitted, border follows resolved `surface.fg` (`--dyni-fg` after mode/preset resolution). If set, this explicit value overrides that fallback. |
| `--dyni-font` | `"Roboto","Inter","SF Pro Text",-apple-system,"Segoe UI","Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"` |
| `--dyni-font-mono` | `"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace` |
| `--dyni-font-weight` | `700` |
| `--dyni-label-weight` | `700` |
| `--dyni-pointer` | `#ff2b2b` |
| `--dyni-warning` | `#e7c66a` |
| `--dyni-alarm` | `#ff7a76` |
| `--dyni-alarm-widget-bg` | `#e04040` |
| `--dyni-alarm-widget-fg` | `#ffffff` |
| `--dyni-alarm-widget-strip` | `#66b8ff` |
| `--dyni-layline-stb` | `#82b683` |
| `--dyni-layline-port` | `#ff7a76` |
| `--dyni-ais-warning` | `#f39b52` |
| `--dyni-ais-nearest` | `#66b8ff` |
| `--dyni-ais-tracking` | `#89d38f` |
| `--dyni-ais-normal` | `#8da0b3` |
| `--dyni-stroke-weight` | `1.0` |
| `--dyni-pointer-depth-weight` | `1.0` |
| `--dyni-pointer-side-weight` | `1.0` |
| `--dyni-radial-tick-major-len-factor` | `0.087` |
| `--dyni-radial-tick-major-width-factor` | `0.022` |
| `--dyni-radial-tick-minor-len-factor` | `0.051` |
| `--dyni-radial-tick-minor-width-factor` | `0.011` |
| `--dyni-radial-pointer-side-factor` | `0.11` |
| `--dyni-radial-pointer-depth-factor` | `0.22` |
| `--dyni-radial-arc-linewidth-factor` | `0.0145` |
| `--dyni-radial-ring-width` | `0.16` |
| `--dyni-radial-label-inset` | `1.8` |
| `--dyni-radial-label-font` | `0.14` |
| `--dyni-radial-fullcircle-normal-inner-margin` | `0.03` |
| `--dyni-radial-fullcircle-normal-min-height` | `0.45` |
| `--dyni-radial-fullcircle-normal-dual-gap` | `0.05` |
| `--dyni-linear-track-width` | `0.16` |
| `--dyni-linear-track-linewidth-factor` | `0.018` |
| `--dyni-linear-tick-major-len-factor` | `0.109` |
| `--dyni-linear-tick-major-width-factor` | `0.027` |
| `--dyni-linear-tick-minor-len-factor` | `0.064` |
| `--dyni-linear-tick-minor-width-factor` | `0.014` |
| `--dyni-linear-pointer-side-factor` | `0.12` |
| `--dyni-linear-pointer-depth-factor` | `0.24` |
| `--dyni-linear-label-inset` | `1.8` |
| `--dyni-linear-label-font` | `0.14` |

Example override:

```css
.widget.dyniplugin {
  --dyni-theme-preset: bold;
  --dyni-pointer: #00aaff;
  --dyni-warning: #f5c542;
  --dyni-alarm: #ff5533;
}
```

## Requirements

- AvNav server installation with plugin support (Raspberry Pi/Linux/Windows server setups).
- Android AvNav is supported through the modern module startup path (`plugin.mjs`) when plugin loading is enabled.
- Browser with ES6 and Canvas 2D support (modern browsers).

## Development

dyninstruments is developed with AI-assisted tooling. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, coding standards, and release process.

## License

Bundled Roboto and Roboto Mono font assets include Apache 2.0 license text and attribution in [assets/fonts/LICENSE.txt](assets/fonts/LICENSE.txt).
