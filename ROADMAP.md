# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks pre-release priorities and AvNav widget coverage status.

## Status and Scope

- Project stage: pre-release
- Backward compatibility is not guaranteed during pre-release evolution
- Scope: planned integration order and current coverage map

## Roadmap

### Planned integration directions

- `map`: `zoom`
- `nav`: `routePoints`, `editRoute`
- planned new clusters: `ais` (for example `aisTarget`)
- page/header utility parity: `alarm`
- `default`: likely a dedicated utility/default widget instead of a cluster kind

### Practical implementation order

1. Page-routed map action: `Zoom`
2. Route workflow widgets: `RoutePoints`, `EditRoute`
3. AIS workflow widget: `AisTarget`
4. Page/header utility parity: `Alarm`

### Core interaction notes

- Passive widget: `CenterDisplay`
- Page-routed click on passive renderer: `Zoom`, `ActiveRoute`, `EditRoute`
- Widget-owned click target with page/API workflow: `RoutePoints`, `AisTarget`
- Page-shell-owned widget: `Alarm`

### Additional non-core concepts

- OBP60-style instruments: graphical Roll/Pitch, Clock, Rudder, Keel
- C-net 2000 style multi instruments: history graphs, interactive regatta clock, anchor nav plot
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS`

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
| CenterDisplay                | dyni_Nav_Instruments → `centerDisplay`                                       | ✅ covered                                  |
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
