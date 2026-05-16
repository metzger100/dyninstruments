# dyninstruments v3.1.0

## Highlights
- Android AvNav installations can now load dyninstruments through the modern module startup path (`plugin.mjs`) when plugin loading is enabled.
- Startup now shares one bootstrap core between the legacy script path and the modern module path, so release bundles load first and development installs still fall back to the manifest script list.
- A new `darkmode` theme preset provides a black instrument surface with white text, white borders, and tuned warning, alarm, layline, and AIS colors.

## Fixes
- Horizontal Dyni widgets now keep a usable width in AvNav map-page top and bottom containers instead of collapsing into impossible browser layout widths.
- XTE graphics-only mode now still shows the `No Waypoint` state when no waypoint is active.
- XTE highway backgrounds now stay correctly sized when rendered through the cached static canvas layer on high-DPI displays.
- Canvas state screens now match HTML state screens by showing fitted labels without a dim overlay.
- Missing or empty numeric values no longer turn into zero across gauge, text, route, AIS, alarm, map zoom, position, and XTE render paths.
- Depth, speed, temperature, voltage, wind, route, AIS, and coordinate displays now use the shared optional-number handling so blank source values render as placeholders instead of misleading readings.
- Alarm and AIS colors now follow AvNav role semantics more closely, including a green nearest/okay accent and red warning/alarm roles.
- Theme borders now follow the resolved foreground color unless `--dyni-border` is explicitly set.

## Notes
- `night` remains the dim red AvNav navigation mode; use `--dyni-theme-preset: darkmode` for the new black-and-white preset.
- `user.css` color overrides on `.widget.dyniplugin` continue to win in both day and night mode unless separate `.nightMode .widget.dyniplugin` overrides are provided.
