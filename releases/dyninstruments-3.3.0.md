# dyninstruments v3.3.0

## Highlights
- Navigation widgets now include an `XTE linear gauge` kind. It shows cross-track error on a horizontal bar with port/starboard direction, COG, DTW, bearing, optional waypoint name, smooth pointer motion, configurable scale, tick marks, and stable-digit support.
- The XTE linear gauge is available from the normal Navigation instrument selector and is included in the all-widgets showcase layout.
- Theme colors now use a global-to-scoped cascade. Setting shared colors such as `--dyni-alarm`, `--dyni-info`, or `--dyni-ok` updates dependent widget accents unless a scoped token is explicitly overridden.

## Fixes
- Regatta timer progress colors now read the normalized output variables `--dyni-theme-regatta-bar-warning`, `--dyni-theme-regatta-bar-critical`, and `--dyni-theme-regatta-bar-default`, keeping the timer aligned with the theme resolver output.
- Surface borders continue to follow the resolved foreground color when `--dyni-border` is omitted, including preset and night-mode resolution.

## Notes
- Existing regatta input variables with camelCase names still resolve with deprecation warnings, so current user CSS keeps working while moving to `--dyni-regatta-bar-warning`, `--dyni-regatta-bar-critical`, and `--dyni-regatta-bar-default`.
- Documentation and README theming tables now describe global tokens, scoped tokens, cascade parents, and the new XTE linear gauge behavior.
