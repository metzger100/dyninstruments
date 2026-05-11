# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks pre-release priorities and AvNav widget coverage status.

## Roadmap

### Fixes

- activeRoute shows rteEta but the label says ETA which is wrong. Label and all other strings must make clear that it is RTE ETA.
- routePoints is limited in height on normal gpspages
- Rename ETA to wpEta including the label and strings (compatibility change)
- Set the aspect ratio of Radial widgets in widgetContainer.vertical to 1

### Improvements for the existing widgets

- add a theme token for opacity of captions and units

### Additional non-core concepts (post release)

- OBP60-style instruments: graphical Roll/Pitch, analog Clock, Rudder, Keel
- C-net 2000 style multi instruments: history graphs, anchor nav plot
- interactive regatta clock
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS`
- add linearXteDisplay optimized for small and flat widgets.