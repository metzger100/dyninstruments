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
- Gauge core split completed (`RadialToolkit` + shared core modules)
- Semicircle gauges unified on `SemicircleRadialEngine`

### Cluster refactor baseline

- `dyni_Nav_Instruments` is canonical owner for `dst`, `rteDistance`, `positionBoat`, `positionWp`
- `dyni_Anchor_Instruments` remains owner for anchor distance/watch/bearing
- `dyni_Vessel_Instruments` owns time/clock (`clock`) and voltage kinds (`voltage`, `voltageRadial`, `voltageLinear`)

### Planned integration directions

- `vessel`: quick-win text kinds completed (`dateTime`, `timeStatus`, `pitch`, `roll`)
- linear gauge parity completed for speed/environment/vessel/wind/course-heading ownership (`sogLinear`, `stwLinear`, `depthLinear`, `tempLinear`, `voltageLinear`, `angleTrueLinear`, `angleApparentLinear`, `hdtLinear`, `hdmLinear`)
- `nav`: `activeRoute` completed, `routePoints`, `editRoute`
- planned new clusters: `ais` (for example `aisTarget`), `map` (for example `zoom`, `centerDisplay`)
- `default`: likely a dedicated utility/default widget instead of a cluster kind

### Practical implementation order

1. ✅ Quick wins (text): `DateTime`, `TimeStatus`, `signalKPitch`, `signalKRoll`
2. High-impact canvas visuals: ✅ `XteDisplay`, ✅ `ActiveRoute`
3. Lists and controls (interaction-heavy): `RoutePoints`, `EditRoute`, `Zoom`, `CenterDisplay`
4. ✅ Linear gauges: range + wind + compass alternatives (`sogLinear`, `stwLinear`, `depthLinear`, `tempLinear`, `voltageLinear`, `angleTrueLinear`, `angleApparentLinear`, `hdtLinear`, `hdmLinear`)
5. AIS: `AisTarget` (requires additional data logic and responsive layout)

### Additional non-core concepts

- OBP60-style instruments: graphical Roll/Pitch, Clock, Rudder, Keel
- C-net 2000 style multi instruments: history graphs, interactive regatta clock, anchor nav plot
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS`

## Linear Naming Convention

- Linear kinds mirror existing radial ownership and naming with `*Linear` suffix.
- Examples:
  - `sogRadial` -> `sogLinear`
  - `stwRadial` -> `stwLinear`
  - `depthRadial` -> `depthLinear`
  - `tempRadial` -> `tempLinear`
  - `voltageRadial` -> `voltageLinear`
  - `hdtRadial` -> `hdtLinear` (implemented)
  - `angleTrueRadial` -> `angleTrueLinear` (implemented)
- Axis mode reservation in shared linear engine:
  - `range` for speed/depth/temperature/voltage
  - `centered180` for wind angle kinds with mirrored layline sectors
  - `fixed360` for compass with fixed scale and moving indicator

## AvNav Widget Coverage Matrix

| AvNav Widget                 | dyninstruments                                                               | Coverage                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| ActiveRoute                  | dyni_Nav_Instruments → `activeRoute`                                         | ✅ covered                                  |
| AisTarget                    | —                                                                            | ❌ not covered yet                          |
| Alarm                        | —                                                                            | ❌ not covered yet                          |
| AnchorBearing                | dyni_Anchor_Instruments → `bearing`                                          | ✅ covered                                  |
| AnchorDistance               | dyni_Anchor_Instruments → `distance`                                         | ✅ covered                                  |
| AnchorWatchDistance          | dyni_Anchor_Instruments → `watch`                                            | ✅ covered                                  |
| BRG                          | dyni_CourseHeading_Instruments → `brg`                                       | ✅ covered                                  |
| CenterDisplay                | —                                                                            | ❌ not covered yet                          |
| COG                          | dyni_CourseHeading_Instruments → `cog`                                       | ✅ covered                                  |
| CombinedWidget               | —                                                                            | ❌ not covered yet                          |
| DateTime                     | dyni_Vessel_Instruments → `dateTime`                                         | ✅ covered                                  |
| Default                      | —                                                                            | ❌ not covered yet                          |
| DepthDisplay                 | dyni_Environment_Instruments → `depth` / `depthLinear`                       | ✅ covered                                  |
| DST                          | dyni_Nav_Instruments → `dst`                                                 | ✅ covered                                  |
| EditRoute                    | —                                                                            | ❌ not covered yet                          |
| ETA                          | dyni_Nav_Instruments → `eta`                                                 | ✅ covered                                  |
| HDM                          | dyni_CourseHeading_Instruments → `hdm`                                       | ✅ covered                                  |
| HDT                          | dyni_CourseHeading_Instruments → `hdt`                                       | ✅ covered                                  |
| LargeTime                    | dyni_Vessel_Instruments → `clock`                                            | ✅ covered                                  |
| linGauge_Compass             | dyni_CourseHeading_Instruments → `hdtLinear`/`hdmLinear`                     | ✅ covered                                  |
| linGauge_Compass180          | —                                                                            | ❌ not covered yet                          |
| linGauge_Temperature         | dyni_Environment_Instruments → `tempLinear`                                  | ✅ covered                                  |
| linGauge_Voltage             | dyni_Vessel_Instruments → `voltageLinear`                                    | ✅ covered                                  |
| Position                     | dyni_Nav_Instruments → `positionBoat`                                        | ✅ covered                                  |
| radGauge_Compass             | dyni_CourseHeading_Instruments → `hdtRadial`                                 | ✅ covered                                  |
| radGauge_Speed               | dyni_Speed_Instruments → `sogRadial`/`stwRadial`                             | ✅ covered                                  |
| radGauge_Temperature         | dyni_Environment_Instruments → `tempRadial`                                  | ✅ covered                                  |
| radGauge_Voltage             | dyni_Vessel_Instruments → `voltageRadial`                                    | ✅ covered                                  |
| RadialGauge                  | —                                                                            | ❌ not covered yet                          |
| RoutePoints                  | —                                                                            | ❌ not covered yet                          |
| RteDistance                  | dyni_Nav_Instruments → `rteDistance`                                         | ✅ covered                                  |
| RteEta                       | dyni_Nav_Instruments → `rteEta`                                              | ✅ covered                                  |
| signalKCelsius               | dyni_Environment_Instruments → `temp` / `tempLinear`                         | ✅ covered                                  |
| signalKPitch                 | dyni_Vessel_Instruments → `pitch`                                            | ✅ covered                                  |
| signalKPressureHpa           | dyni_Environment_Instruments → `pressure`                                    | ✅ covered                                  |
| signalKRoll                  | dyni_Vessel_Instruments → `roll`                                             | ✅ covered                                  |
| SOG                          | dyni_Speed_Instruments → `sog` / `sogLinear`                                 | ✅ covered                                  |
| STW                          | dyni_Speed_Instruments → `stw` / `stwLinear`                                 | ✅ covered                                  |
| TimeStatus                   | dyni_Vessel_Instruments → `timeStatus`                                       | ✅ covered                                  |
| VMG                          | dyni_Nav_Instruments → `vmg`                                                 | ✅ covered                                  |
| WaterTemp                    | dyni_Environment_Instruments → `temp`                                        | ✅ covered                                  |
| WindAngle                    | dyni_Wind_Instruments → `angleApparent`                                      | ✅ covered                                  |
| WindDisplay                  | dyni_Wind_Instruments → `angleApparentRadial`                                | ✅ covered                                  |
| WindGraphics                 | dyni_Wind_Instruments → `angleApparentRadial`/`angleTrueRadial`              | ✅ covered                                  |
| WindSpeed                    | dyni_Wind_Instruments → `speedApparent`                                      | ✅ covered                                  |
| WpPosition                   | dyni_Nav_Instruments → `positionWp`                                          | ✅ covered                                  |
| XteDisplay                   | dyni_Nav_Instruments → `xteDisplay`                                          | ✅ covered                                  |
| Zoom                         | —                                                                            | ❌ not covered yet                          |
