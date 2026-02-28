# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks pre-release priorities and AvNav widget coverage status.

## Status and Scope

- Project stage: pre-release
- Backward compatibility is not guaranteed in this phase
- Scope: planned integration order and current coverage map

## Roadmap

### Completed foundation refactors

- Plugin bootstrap/config split completed (`plugin.js` + `runtime/*` + `config/*`)
- Gauge core split completed (`GaugeToolkit` + shared core modules)
- Semicircle gauges unified on `SemicircleGaugeEngine`

### Cluster refactor baseline

- `dyninstruments_Nav` is canonical owner for `dst`, `rteDistance`, `positionBoat`, `positionWp`
- `dyninstruments_Anchor` remains owner for anchor distance/watch/bearing
- `dyninstruments_Vessel` owns time/clock (`clock`) and voltage kinds

### Planned integration directions

- `vessel`: quick-win text kinds completed (`dateTime`, `timeStatus`, `pitch`, `roll`)
- `nav`: `activeRoute`, `routePoints`, `editRoute`
- planned new clusters: `ais` (for example `aisTarget`), `map` (for example `zoom`, `centerDisplay`)
- `default`: likely a dedicated utility/default widget instead of a cluster kind

### Practical implementation order

1. ✅ Quick wins (text): `DateTime`, `TimeStatus`, `signalKPitch`, `signalKRoll`
2. High-impact canvas visuals: ✅ `XteDisplay`, `ActiveRoute`
3. Lists and controls (interaction-heavy): `RoutePoints`, `EditRoute`, `Zoom`, `CenterDisplay`
4. Linear gauges: alternatives for radial kinds
5. AIS: `AisTarget` (requires additional data logic and responsive layout)

### Additional non-core concepts

- OBP60-style instruments: graphical Roll/Pitch, Clock, Rudder, Keel
- C-net 2000 style multi instruments: history graphs, interactive regatta clock, anchor nav plot
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS`

## AvNav Widget Coverage Matrix

| AvNav Widget                 | dyninstruments                                                               | Coverage                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| ActiveRoute                  | —                                                                            | ❌ not covered yet                          |
| AisTarget                    | —                                                                            | ❌ not covered yet                          |
| Alarm                        | —                                                                            | ❌ not covered yet                          |
| AnchorBearing                | dyninstruments_Anchor → `bearing`                                            | ✅ covered                                  |
| AnchorDistance               | dyninstruments_Anchor → `distance`                                           | ✅ covered                                  |
| AnchorWatchDistance          | dyninstruments_Anchor → `watch`                                              | ✅ covered                                  |
| BRG                          | dyninstruments_CourseHeading → `brg`                                         | ✅ covered                                  |
| CenterDisplay                | —                                                                            | ❌ not covered yet                          |
| COG                          | dyninstruments_CourseHeading → `cog`                                         | ✅ covered                                  |
| CombinedWidget               | —                                                                            | ❌ not covered yet                          |
| DateTime                     | dyninstruments_Vessel → `dateTime`                                           | ✅ covered                                  |
| Default                      | —                                                                            | ❌ not covered yet                          |
| DepthDisplay                 | dyninstruments_Environment → `depth`                                         | ✅ covered                                  |
| DST                          | dyninstruments_Nav → `dst`                                                   | ✅ covered                                  |
| EditRoute                    | —                                                                            | ❌ not covered yet                          |
| ETA                          | dyninstruments_Nav → `eta`                                                   | ✅ covered                                  |
| HDM                          | dyninstruments_CourseHeading → `hdm`                                         | ✅ covered                                  |
| HDT                          | dyninstruments_CourseHeading → `hdt`                                         | ✅ covered                                  |
| LargeTime                    | dyninstruments_Vessel → `clock`                                              | ✅ covered                                  |
| linGauge_Compass             | —                                                                            | ❌ not covered yet                          |
| linGauge_Compass180          | —                                                                            | ❌ not covered yet                          |
| linGauge_Temperature         | —                                                                            | ❌ not covered yet                          |
| linGauge_Voltage             | —                                                                            | ❌ not covered yet                          |
| Position                     | dyninstruments_Nav → `positionBoat`                                          | ✅ covered                                  |
| radGauge_Compass             | dyninstruments_CourseHeading → `hdtRadial`                                  | ✅ covered                                  |
| radGauge_Speed               | dyninstruments_Speed → `sogRadial`/`stwRadial`                             | ✅ covered                                  |
| radGauge_Temperature         | dyninstruments_Environment → `tempRadial`                                   | ✅ covered                                  |
| radGauge_Voltage             | dyninstruments_Vessel → `voltageRadial`                                     | ✅ covered                                  |
| RadialGauge                  | —                                                                            | ❌ not covered yet                          |
| RoutePoints                  | —                                                                            | ❌ not covered yet                          |
| RteDistance                  | dyninstruments_Nav → `rteDistance`                                           | ✅ covered                                  |
| RteEta                       | dyninstruments_Nav → `rteEta`                                                | ✅ covered                                  |
| signalKCelsius               | dyninstruments_Environment → `temp`                                          | ✅ covered                                  |
| signalKPitch                 | dyninstruments_Vessel → `pitch`                                              | ✅ covered                                  |
| signalKPressureHpa           | dyninstruments_Environment → `pressure`                                      | ✅ covered                                  |
| signalKRoll                  | dyninstruments_Vessel → `roll`                                               | ✅ covered                                  |
| SOG                          | dyninstruments_Speed → `sog`                                                 | ✅ covered                                  |
| STW                          | dyninstruments_Speed → `stw`                                                 | ✅ covered                                  |
| TimeStatus                   | dyninstruments_Vessel → `timeStatus`                                         | ✅ covered                                  |
| VMG                          | dyninstruments_Nav → `vmg`                                                   | ✅ covered                                  |
| WaterTemp                    | dyninstruments_Environment → `temp`                                          | ✅ covered                                  |
| WindAngle                    | dyninstruments_Wind → `angleApparent`                                        | ✅ covered                                  |
| WindDisplay                  | dyninstruments_Wind → `angleApparentRadial`                                 | ✅ covered                                  |
| WindGraphics                 | dyninstruments_Wind → `angleApparentRadial`/`angleTrueRadial`              | ✅ covered                                  |
| WindSpeed                    | dyninstruments_Wind → `speedApparent`                                        | ✅ covered                                  |
| WpPosition                   | dyninstruments_Nav → `positionWp`                                            | ✅ covered                                  |
| XteDisplay                   | dyninstruments_Nav → `xteDisplay`                                            | ✅ covered                                  |
| Zoom                         | —                                                                            | ❌ not covered yet                          |
