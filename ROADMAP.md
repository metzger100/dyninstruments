# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks development priorities and AvNav widget coverage status.

## Roadmap

### Improvements for the existing widgets

- add a theme token for opacity of captions and units

### Additional non-core concepts (post release)

- interactive regatta clock with clock, buttons to start and sync the clock with the regatta start and acoustic signals each minute and in the last 10 Seconds.
- add linearXteDisplay optimized for small and flat widgets based on the linear gauge widgets
- OBP60-style instruments:
  - graphical Roll/Pitch
  - analog Clock
  - graphical Rudder
  - graphical Keel
- C-net 2000 style multi instruments:
  - history graphs for values where the value history is interesting like TWS or battery voltage
  - anchor nav plot showing the orientation and position of the vessel relative to the anchor on a "radar" like chart with 2 rings around the anchor with configurable distance
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS` with fixed layout for a widgets that have an estimate 1:1 aspect ratio. It shows apparent wind in the graphical instrument.
