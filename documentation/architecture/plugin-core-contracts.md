# Plugin Core Contracts

**Status:** ✅ Implemented | Core contract boundaries between AvNav upstream and dyninstruments

## Overview

This document defines the source-backed contracts that dyninstruments must follow when consuming AvNav core behavior.  
It exists to prevent formatter/key/unit regressions like the roll/pitch incident.

## Key Details

- Canonical upstream sources are read from `avnav-master.zip` snapshot and mapped to plugin behavior.
- Mapper output must remain declarative; formatter semantics come from core formatter contracts.
- Contract changes are fail-closed at review time: mapper formatter changes require doc updates in the same PR.
- The contract tuple below is the required format for each formatter-bearing kind.

## Upstream Source Snapshot

| Source | Contract extracted | Verified |
|---|---|---|
| `viewer/util/formatter.js` | Built-in formatter signatures, parameter order, and unit behavior | 2026-02-22 |
| `viewer/components/WidgetFactory.jsx` | Formatter resolution shape (`formatter` + `formatterParameters`) in widget flow | 2026-02-22 |
| `server/handler/signalkhandler.py` | SignalK values are stored under `gps.signalk.<path>` and passed through as raw values | 2026-02-22 |

## Boundary Contracts

| Layer | Must do | Must not do |
|---|---|---|
| Cluster mapper (`cluster/mappers/*`) | Route kind, normalize value presence, choose formatter key and parameters | Re-implement formatter math or unit conversion logic |
| Renderer (`cluster/rendering/*`, `widgets/*`) | Render layout and display text from mapper/runtime contracts | Invent new formatter semantics that contradict core catalog |
| Runtime helper (`runtime/helpers.js`) | Resolve formatter calls and fallback behavior centrally | Use truthy fallback that clobbers explicit falsy defaults |

## Contract Tuple Schema

```text
kind
-> storeKey(s)
-> rawType
-> rawUnit
-> formatter
-> formatterParameters
-> fallback/default behavior
-> source file(s) + verification date
```

## Worked Example: Vessel Pitch/Roll

| Field | Contract |
|---|---|
| kind | `pitch`, `roll` |
| storeKey(s) | `nav.gps.signalk.navigation.attitude.pitch`, `nav.gps.signalk.navigation.attitude.roll` |
| rawType | finite number or `undefined` (missing/blank normalized) |
| rawUnit | radians |
| formatter | `formatDirection` |
| formatterParameters | `[true, true, false]` |
| expected output | signed degree string in `-180..180` without forced leading zero |
| source + verified | `viewer/util/formatter.js`, `cluster/mappers/VesselMapper.js` (2026-02-22) |

### Incident Failure Mode (2026-02-22)

Invalid tuple that caused the regression:

```text
formatterParameters: [false, true, false]
```

Reason: first parameter (`inputRadian`) was set to `false`, so raw radian input was treated as degrees.

## Policy

- Any mapper change that edits `formatter` or `formatterParameters` must update:
  - `documentation/avnav-api/core-formatter-catalog.md`
  - `documentation/avnav-api/core-key-catalog.md` (if keys/units changed)
- Reviewers must reject formatter-bearing mapper changes that do not include tuple updates.

## Related

- [cluster-widget-system.md](cluster-widget-system.md)
- [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md)
- [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md)
- [../avnav-api/formatters.md](../avnav-api/formatters.md)
