# Bundled Fonts

**Status:** ✅ Implemented | Plugin-shipped Roboto and Roboto Mono assets for offline-capable rendering

## Overview

dyninstruments ships font binaries in `assets/fonts/` so the plugin can render consistent typography without network access.

## Key Details

- Runtime URLs resolve from plugin root as `AVNAV_BASE_URL/assets/fonts/<filename>`.
- `plugin.css` defines four `@font-face` entries with `font-display: swap` and `local(...)` fallbacks before `url(...)`.
- Theme token `font.familyMono` materializes to `--dyni-theme-font-family-mono` and is consumed by `.dyni-tabular`.

## Bundled Files

- `assets/fonts/Roboto-Regular.woff2`
- `assets/fonts/Roboto-Bold.woff2`
- `assets/fonts/RobotoMono-Regular.woff2`
- `assets/fonts/RobotoMono-Bold.woff2`
- `assets/fonts/LICENSE.txt`

## License and Sources

- License text and attribution live in `assets/fonts/LICENSE.txt` (Apache 2.0).
- Source families: Roboto and Roboto Mono.
- Distribution format in this repository: `.woff2` only.

## Rationale

- Offline-capable typography in AvNav plugin environments.
- Stable tabular number alignment through Roboto Mono fallback chain.

## Related

- [css-theming.md](css-theming.md)
- [theme-tokens.md](theme-tokens.md)
