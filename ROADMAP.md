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

- `dyninstruments_Nav` is canonical owner for `dst`, `rteDistance`, `positionBoat`, `positionWp`
- `dyninstruments_Anchor` remains owner for anchor distance/watch/bearing
- `dyninstruments_Vessel` owns time/clock (`clock`) and voltage kinds (`voltage`, `voltageRadial`, `voltageLinear`)

### Planned integration directions

- `vessel`: quick-win text kinds completed (`dateTime`, `timeStatus`, `pitch`, `roll`)
- linear gauge parity completed for speed/environment/vessel/wind/course-heading ownership (`sogLinear`, `stwLinear`, `depthLinear`, `tempLinear`, `voltageLinear`, `angleTrueLinear`, `angleApparentLinear`, `hdtLinear`, `hdmLinear`)
- `nav`: `activeRoute`, `routePoints`, `editRoute`
- planned new clusters: `ais` (for example `aisTarget`), `map` (for example `zoom`, `centerDisplay`)
- `default`: likely a dedicated utility/default widget instead of a cluster kind

### Practical implementation order

1. ✅ Quick wins (text): `DateTime`, `TimeStatus`, `signalKPitch`, `signalKRoll`
2. High-impact canvas visuals: ✅ `XteDisplay`, planned `ActiveRoute`
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
| DepthDisplay                 | dyninstruments_Environment → `depth` / `depthLinear`                         | ✅ covered                                  |
| DST                          | dyninstruments_Nav → `dst`                                                   | ✅ covered                                  |
| EditRoute                    | —                                                                            | ❌ not covered yet                          |
| ETA                          | dyninstruments_Nav → `eta`                                                   | ✅ covered                                  |
| HDM                          | dyninstruments_CourseHeading → `hdm`                                         | ✅ covered                                  |
| HDT                          | dyninstruments_CourseHeading → `hdt`                                         | ✅ covered                                  |
| LargeTime                    | dyninstruments_Vessel → `clock`                                              | ✅ covered                                  |
| linGauge_Compass             | dyninstruments_CourseHeading → `hdtLinear`/`hdmLinear`                       | ✅ covered                                  |
| linGauge_Compass180          | —                                                                            | ❌ not covered yet                          |
| linGauge_Temperature         | dyninstruments_Environment → `tempLinear`                                    | ✅ covered                                  |
| linGauge_Voltage             | dyninstruments_Vessel → `voltageLinear`                                      | ✅ covered                                  |
| Position                     | dyninstruments_Nav → `positionBoat`                                          | ✅ covered                                  |
| radGauge_Compass             | dyninstruments_CourseHeading → `hdtRadial`                                  | ✅ covered                                  |
| radGauge_Speed               | dyninstruments_Speed → `sogRadial`/`stwRadial`                             | ✅ covered                                  |
| radGauge_Temperature         | dyninstruments_Environment → `tempRadial`                                   | ✅ covered                                  |
| radGauge_Voltage             | dyninstruments_Vessel → `voltageRadial`                                     | ✅ covered                                  |
| RadialGauge                  | —                                                                            | ❌ not covered yet                          |
| RoutePoints                  | —                                                                            | ❌ not covered yet                          |
| RteDistance                  | dyninstruments_Nav → `rteDistance`                                           | ✅ covered                                  |
| RteEta                       | dyninstruments_Nav → `rteEta`                                                | ✅ covered                                  |
| signalKCelsius               | dyninstruments_Environment → `temp` / `tempLinear`                           | ✅ covered                                  |
| signalKPitch                 | dyninstruments_Vessel → `pitch`                                              | ✅ covered                                  |
| signalKPressureHpa           | dyninstruments_Environment → `pressure`                                      | ✅ covered                                  |
| signalKRoll                  | dyninstruments_Vessel → `roll`                                               | ✅ covered                                  |
| SOG                          | dyninstruments_Speed → `sog` / `sogLinear`                                   | ✅ covered                                  |
| STW                          | dyninstruments_Speed → `stw` / `stwLinear`                                   | ✅ covered                                  |
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
