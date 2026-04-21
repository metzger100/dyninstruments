# Roadmap and Coverage

This file is human-facing roadmap planning for `dyninstruments`.
It tracks pre-release priorities and AvNav widget coverage status.

## Status and Scope

- Project stage: pre-release
- Backward compatibility is not guaranteed during pre-release evolution
- Scope: planned integration order and current coverage map

## Roadmap

### Core widgets to implement

- A new cluster dyni_Default_Instruments with "empty" widgets of every type (radialGauge, linearGauge, threeElements) with extensive customizability to be available for "self configurable" Instruments for external values of other Plugins oder Apps that are not covered by the Plugin. For example to offer lower AND and higher end sectors, maybe with customizable colors for the sectors as well, since those are not customizable via user.css if using a default widget more than once. And many other extra settings that might be handy for the users.

### Fixes for existing widgets and architecture

- Add option to hide textual Metrics in graphical Widgets like (radial, linear, compass, XTE etc.). Note: some widgets also need to center aligned (e.g.: XTE and linear) or stretched (e.g.: XTE and linear), when the textual metrics are hidden, while others just hide the text (e.g.: compass radial, radial gauges) (default: off)
- Add a plugin loader compliant export tool to create a code only zip of the plugin for the users and completely revise the README.md to be completely user focused

### Additional non-core concepts (post release)

- OBP60-style instruments: graphical Roll/Pitch, analog Clock, Rudder, Keel
- C-net 2000 style multi instruments: history graphs, anchor nav plot
- interactive regatta clock
- Wind four-corner graphic for `TWA`/`TWS`/`AWA`/`AWS`

## AvNav Widget Coverage Matrix

| AvNav Widget                 | dyninstruments                                                               | Coverage                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| ActiveRoute                  | dyni_Nav_Instruments → `activeRoute`                                         | ✅ covered                                  |
| AisTarget                    | dyni_Map_Instruments → `aisTarget`                                           | ✅ covered                                  |
| Alarm                        | dyni_Vessel_Instruments → `alarm`                                            | ✅ covered                                  |
| AnchorBearing                | dyni_Anchor_Instruments → `bearing`                                          | ✅ covered                                  |
| AnchorDistance               | dyni_Anchor_Instruments → `distance`                                         | ✅ covered                                  |
| AnchorWatchDistance          | dyni_Anchor_Instruments → `watch`                                            | ✅ covered                                  |
| BRG                          | dyni_CourseHeading_Instruments → `brg`                                       | ✅ covered                                  |
| CenterDisplay                | dyni_Map_Instruments → `centerDisplay`                                       | ✅ covered                                  |
| COG                          | dyni_CourseHeading_Instruments → `cog`                                       | ✅ covered                                  |
| CombinedWidget               | —                                                                            | ❌ not covered yet                          |
| DateTime                     | dyni_Vessel_Instruments → `dateTime`                                         | ✅ covered                                  |
| Default                      | —                                                                            | ❌ not covered yet                          |
| DepthDisplay                 | dyni_Environment_Instruments → `depth` / `depthLinear`                       | ✅ covered                                  |
| DST                          | dyni_Nav_Instruments → `dst`                                                 | ✅ covered                                  |
| EditRoute                    | dyni_Nav_Instruments → `editRoute`                                           | ✅ covered                                  |
| ETA                          | dyni_Nav_Instruments → `eta`                                                 | ✅ covered                                  |
| HDM                          | dyni_CourseHeading_Instruments → `hdm`                                       | ✅ covered                                  |
| HDT                          | dyni_CourseHeading_Instruments → `hdt`                                       | ✅ covered                                  |
| LargeTime                    | dyni_Vessel_Instruments → `clock`                                            | ✅ covered                                  |
| linGauge_Compass             | dyni_CourseHeading_Instruments → `hdtLinear`/`hdmLinear`                     | ✅ covered                                  |
| linGauge_Compass180          | dyni_CourseHeading_Instruments → `hdtLinear`/`hdmLinear`                     | ✅ covered                                  |
| linGauge_Temperature         | dyni_Environment_Instruments → `tempLinear`                                  | ✅ covered                                  |
| linGauge_Voltage             | dyni_Vessel_Instruments → `voltageLinear`                                    | ✅ covered                                  |
| Position                     | dyni_Nav_Instruments → `positionBoat`                                        | ✅ covered                                  |
| radGauge_Compass             | dyni_CourseHeading_Instruments → `hdtRadial`                                 | ✅ covered                                  |
| radGauge_Speed               | dyni_Speed_Instruments → `sogRadial`/`stwRadial`                             | ✅ covered                                  |
| radGauge_Temperature         | dyni_Environment_Instruments → `tempRadial`                                  | ✅ covered                                  |
| radGauge_Voltage             | dyni_Vessel_Instruments → `voltageRadial`                                    | ✅ covered                                  |
| RadialGauge                  | —                                                                            | ❌ not covered yet                          |
| RoutePoints                  | dyni_Nav_Instruments → `routePoints`                                         | ✅ covered                                  |
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
| Zoom                         | dyni_Map_Instruments → `zoom`                                                | ✅ covered                                  |
