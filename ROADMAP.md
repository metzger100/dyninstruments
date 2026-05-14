# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks development priorities and AvNav widget coverage status.

## Roadmap

### Fixes

- connect the border color to the --dyni-fg color token (default to dyni-fg if not changed for example in user.css)
- xteDisplay no Waypoint display doesn't apply to navpage and visually doesn't align with other widgets like activeRoute, editRoute or Routepoints

### Improvements for the existing widgets

- add a theme token for opacity of captions and units

### Additional non-core concepts (post release)

- OBP60-style instruments: graphical Roll/Pitch, analog Clock, Rudder, Keel
- C-net 2000 style multi instruments: history graphs, anchor nav plot
- interactive regatta clock
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS`
- add linearXteDisplay optimized for small and flat widgets.
