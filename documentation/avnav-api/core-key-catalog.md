# Core Key Catalog

**Status:** ✅ Implemented | Complete plugin key/unit contracts for core integration

## Overview

This file is the complete key contract inventory for dyninstruments cluster widgets.  
It maps `storeKeys` and dynamic key overrides to formatter/unit expectations.

## Key Details

- This catalog covers all current cluster definitions in `config/clusters/*.js`.
- Not all dynamic SignalK paths are listed in core `viewer/util/keys.jsx`; plugin-maintained contracts are required.
- `nav.gps.signalk.*` paths are raw SignalK passthrough values in plugin runtime flow.

## API/Interfaces

### Fixed Store Key Inventory

| Cluster | Store field | Default key path | Used by kind(s) |
|---|---|---|---|
| `speed` | `sog` | `nav.gps.speed` | `sog`, `sogRadial` |
| `speed` | `stw` | `nav.gps.waterSpeed` | `stw`, `stwRadial` |
| `wind` | `awa` | `nav.gps.windAngle` | `angleApparent`, `angleApparentRadial` |
| `wind` | `twa` | `nav.gps.trueWindAngle` | `angleTrue`, `angleTrueRadial` |
| `wind` | `twd` | `nav.gps.trueWindDirection` | `angleTrueDirection` |
| `wind` | `aws` | `nav.gps.windSpeed` | `speedApparent`, `angleApparentRadial` |
| `wind` | `tws` | `nav.gps.trueWindSpeed` | `speedTrue`, `angleTrueRadial` |
| `environment` | `depth` | `nav.gps.depthBelowTransducer` | `depth`, `depthRadial` |
| `environment` | `temp` | `nav.gps.waterTemp` | `temp`, `tempRadial` (if no override) |
| `courseHeading` | `cog` | `nav.gps.course` | `cog` |
| `courseHeading` | `hdt` | `nav.gps.headingTrue` | `hdt`, `hdtRadial` |
| `courseHeading` | `hdm` | `nav.gps.headingMag` | `hdm`, `hdmRadial` |
| `courseHeading` | `brg` | `nav.wp.course` | `brg`, compass marker in radial kinds |
| `nav` | `eta` | `nav.wp.eta` | `eta` |
| `nav` | `rteEta` | `nav.route.eta` | `rteEta` |
| `nav` | `dst` | `nav.wp.distance` | `dst` |
| `nav` | `dtw` | `nav.wp.distance` | `xteDisplay` |
| `nav` | `xte` | `nav.wp.xte` | `xteDisplay` |
| `nav` | `cog` | `nav.gps.course` | `xteDisplay` |
| `nav` | `btw` | `nav.wp.course` | `xteDisplay` |
| `nav` | `wpName` | `nav.wp.name` | `xteDisplay` |
| `nav` | `wpServer` | `nav.wp.server` | disconnect state for `dst`, `positionWp`, `xteDisplay` |
| `nav` | `rteDistance` | `nav.route.remain` | `rteDistance` |
| `nav` | `vmg` | `nav.wp.vmg` | `vmg` |
| `nav` | `positionBoat` | `nav.gps.position` | `positionBoat` |
| `nav` | `positionWp` | `nav.wp.position` | `positionWp` |
| `anchor` | `distance` | `nav.anchor.distance` | `distance` |
| `anchor` | `watch` | `nav.anchor.watchDistance` | `watch` |
| `anchor` | `bearing` | `nav.anchor.direction` | `bearing` |
| `vessel` | `clock` | `nav.gps.rtime` | `clock`, `dateTime`, `timeStatus` |
| `vessel` | `gpsValid` | `nav.gps.valid` | `timeStatus` |
| `vessel` | `pitch` | `nav.gps.signalk.navigation.attitude.pitch` | `pitch` |
| `vessel` | `roll` | `nav.gps.signalk.navigation.attitude.roll` | `roll` |

### Dynamic Key Override Contracts

| Cluster | Editable key field | Store field affected | Active kind(s) | Behavior |
|---|---|---|---|---|
| `environment` | `tempKey` | `temp` | `temp`, `tempRadial` | non-empty override is used; empty falls back to `nav.gps.waterTemp` |
| `environment` | `value` | `value` | `pressure` | non-empty key stored for pressure source; removed when not pressure |
| `vessel` | `value` | `value` | `voltage`, `voltageRadial` | non-empty key stored for voltage source; removed for other kinds |
| `vessel` | `pitchKey` | `pitch` | `pitch` | non-empty override is used; empty falls back to default pitch key |
| `vessel` | `rollKey` | `roll` | `roll` | non-empty override is used; empty falls back to default roll key |

### Kind -> Formatter -> Key Contracts (Numeric/Text Paths)

| Kind | Primary store field(s) | Formatter contract | Unit/typing note |
|---|---|---|---|
| `sog`, `stw` | `sog` / `stw` | `formatSpeed` + `[unit]` | speed values expected in core speed units |
| `angleTrue`, `angleApparent` | `twa` / `awa` | `makeAngleFormatter(false, leadingZero, default)` | signed angle formatting in mapper toolkit |
| `angleTrueDirection` | `twd` | `makeAngleFormatter(true, leadingZero, default)` | direction formatting in mapper toolkit |
| `speedTrue`, `speedApparent` | `tws` / `aws` | `formatSpeed` + `[unit]` | speed values expected in core speed units |
| `depth` | `depth` | `formatDecimal` + `[3, 1, true]` | numeric depth text |
| `temp` | `temp` | `formatTemperature` + `["celsius"]` | input source is water temperature key |
| `pressure` | `value` (dynamic) | `skPressure` + `["hPa"]` | alias of core pressure formatter |
| `cog`, `hdt`, `hdm`, `brg` | `cog`/`hdt`/`hdm`/`brg` | `formatDirection360` + `[leadingZero]` | heading/course/bearing text |
| `eta`, `rteEta` | `eta` / `rteEta` | `formatTime` + `[]` | Date/time value path |
| `dst`, `rteDistance` | `dst` / `rteDistance` | `formatDistance` + `[]` | distance text |
| `xteDisplay` | `xte`, `cog`, `dtw`, `btw`, `wpName` | renderer wrapper (`XteDisplayWidget`) using `formatDistance` (`xte`, `dtw`) + `formatDirection360` (`cog`, `btw`) | fail-closed if required numeric inputs are missing |
| `vmg` | `vmg` | `formatSpeed` + `[unit]` | speed text |
| `positionBoat`, `positionWp` | `positionBoat` / `positionWp` | `formatLonLats` + coordinate formatter `formatLonLatsDecimal` | position object expected |
| `distance`, `watch` | `distance` / `watch` | `formatDistance` + `[unit]` | anchor distances |
| `bearing` | `bearing` | `formatDirection360` + `[leadingZero]` | anchor bearing |
| `voltage` | `value` (dynamic) | `formatDecimal` + `[3, 1, true]` | numeric voltage |
| `clock` | `clock` | `formatTime` + `[]` | Date/time value |
| `dateTime` | `clock` | renderer wrapper (`DateTimeRendererWrapper` -> `PositionCoordinateWidget`) | date/time split formatting |
| `timeStatus` | `gpsValid`, `clock` | renderer wrapper (`TimeStatusRendererWrapper` -> `PositionCoordinateWidget`) | status + time split formatting |
| `pitch` | `pitch` | `formatDirection` + `[true, true, false]` | raw radians required |
| `roll` | `roll` | `formatDirection` + `[true, true, false]` | raw radians required |

### Core-Backed Key Semantics

| Key path | Semantic | Confidence | Source (verified 2026-02-22) |
|---|---|---|---|
| `nav.gps.rtime` | Date/time value for `formatTime`/`formatDate`/`formatDateTime` family | high | `viewer/util/keys.jsx`, mapper usage |
| `nav.gps.valid` | GPS validity bool-like flag | high | `viewer/util/keys.jsx`, vessel mapper usage |
| `nav.gps.signalk.navigation.attitude.pitch` | SignalK pitch (radians) | medium | `config/clusters/vessel.js`, `server/handler/signalkhandler.py`, vessel mapper |
| `nav.gps.signalk.navigation.attitude.roll` | SignalK roll (radians) | medium | `config/clusters/vessel.js`, `server/handler/signalkhandler.py`, vessel mapper |

## Notes

- Confidence for pitch/roll unit is `medium` because core key metadata does not annotate unit for every dynamic `gps.signalk.*` path; contract is derived from SignalK semantics plus formatter behavior.
- Any mapper change that edits key binding, formatter, or formatterParameters must update this file and [core-formatter-catalog.md](core-formatter-catalog.md) in the same PR.

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md)
- [core-formatter-catalog.md](core-formatter-catalog.md)
- [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md)
