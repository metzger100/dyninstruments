# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks development priorities and AvNav widget coverage status.

## Roadmap

### Additional non-core concepts (post release)

- add XteDisplayLinear optimized for small and flat widgets based on the linear gauge widgets (addressed by PLAN29)
- OBP60-style instruments:
  - graphical Roll/Pitch
  - analog Clock
  - graphical Rudder
  - graphical Keel
- C-net 2000 style multi instruments:
  - history graphs for values where the value history is interesting like TWS or battery voltage
  - anchor nav plot showing the orientation and position of the vessel relative to the anchor on a "radar" like chart with 2 rings around the anchor with configurable distance
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS` with fixed layout for a widgets that have an estimate 1:1 aspect ratio. It shows apparent wind in the graphical instrument.
