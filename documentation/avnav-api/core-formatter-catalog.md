# Core Formatter Catalog

**Status:** ✅ Implemented | Canonical formatter signatures from AvNav core snapshot

## Overview

This is the authoritative formatter signature catalog for dyninstruments integration decisions.  
Source of truth: AvNav `viewer/util/formatter.js` snapshot verified on 2026-02-22.

## Key Details

- Parameter order is positional and must be preserved exactly.
- Mapper code should reference formatter names and parameters, not re-implement conversions.
- Roll/pitch contract is normative: `formatDirection` with `[true, true, false]`.

## API/Interfaces

### Canonical Formatter Signatures

| Formatter | Signature | Notes |
|---|---|---|
| `formatLonLatsDecimal` | `(coordinate, axis)` | axis: `lat`/`lon` |
| `formatLonLats` | `(lonlat)` | expects object with `lat` and `lon` |
| `formatDecimal` | `(number, fix, fract, addSpace, prefixZero)` | core numeric formatter |
| `formatDecimalOpt` | `(number, fix, fract, addSpace, prefixZero)` | fractional digits shown only when needed |
| `formatFloat` | `(number, digits, maxPlaces, leadingZeroes)` | variable decimal placement |
| `formatDistance` | `(distance, unit, numDigits, fillRight)` | distance conversion and formatting |
| `formatSpeed` | `(speed, unit)` | speed conversion and formatting |
| `formatDirection` | `(dir, inputRadian, range180, leadingZero)` | direction conversion and range formatting |
| `formatDirection360` | `(dir, leadingZero)` | direct `0..360` formatting |
| `formatTime` | `(dateValue)` | expects Date-like value in AvNav flow |
| `formatClock` | `(dateValue)` | `HH:MM` |
| `formatDateTime` | `(dateValue)` | date + time |
| `formatDate` | `(dateValue)` | date only |
| `formatString` | `(value)` | passthrough |
| `formatPressure` | `(value, unit)` | `pa`/`hpa`/`bar` |
| `formatTemperature` | `(value, unit)` | `kelvin`/`celsius` |

### Legacy Aliases Present in Core

| Alias | Target |
|---|---|
| `skTemperature` | `formatTemperature` |
| `skPressure` | `formatPressure` |

## Normative Vessel Attitude Contract

| Kind | Raw unit | Formatter | formatterParameters |
|---|---|---|---|
| `pitch` | radians | `formatDirection` | `[true, true, false]` |
| `roll` | radians | `formatDirection` | `[true, true, false]` |

## Normative XteDisplay Renderer Contract

| Field | Formatter | formatterParameters |
|---|---|---|
| `xte` | `formatDistance` | `[unit]` |
| `dtw` | `formatDistance` | `[unit]` |
| `cog` | `formatDirection360` | `[leadingZero]` |
| `btw` | `formatDirection360` | `[leadingZero]` |

## Common Mistakes

| Mistake | Wrong example | Correct contract |
|---|---|---|
| Wrong parameter order | `[true, false, true]` interpreted ad hoc | Keep exact order: `[inputRadian, range180, leadingZero]` |
| Wrong rad/deg assumption | `[false, true, false]` for raw radians | `[true, true, false]` |
| Wrong formatter choice | `formatDirection360` for pitch/roll | `formatDirection` with `range180=true` |

## Related

- [formatters.md](formatters.md)
- [core-key-catalog.md](core-key-catalog.md)
- [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md)
