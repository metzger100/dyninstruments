# Layout File Conventions

**Status:** ✅ Implemented | Canonical layout JSON structure and page naming rules

## Overview

`layouts/dyni-sailboat.json` and `layouts/dyni-motorboat.json` are bundled dashboard layouts for different vessel types.
This guide defines the required JSON shape, page-key naming, and widget entry conventions.

## Key Details

- Layout files are JSON objects with top-level keys:
  - `description`
  - `layoutVersion`
  - `properties`
  - `widgets`
- `widgets` maps page IDs to page objects.
- Each page object maps position slots (`left`, `m1`, `right`, `bottomLeft`, `bottomRight`, `left_small`, `top_small`, anchor variants, and similar host-supported keys) to arrays of widget entries.

## Page Naming Convention

Allowed bundled page key families:

- `navpage`
- `gpspage1`, `gpspage2`, ... `gpspageN` (strictly sequential numbering, no gaps)
- `editroutepage`

Do not introduce domain-specific page IDs such as `regattapage` or `anchorpage`.
New bundled pages must use the next sequential `gpspage{N}` key.

Normative reference from shipped layouts:

- `layouts/dyni-sailboat.json`: `navpage`, `gpspage1`, `gpspage2`, `gpspage3`, `gpspage4`, `editroutepage`
- `layouts/dyni-motorboat.json`: `navpage`, `gpspage1`, `gpspage2`, `gpspage3`, `editroutepage`

## Widget Entry Contract

Each slot array contains widget entries shaped like:

```json
{
  "name": "dyni_{Cluster}_Instruments",
  "kind": "clusterKind",
  "weight": 1
}
```

Rules:

- `name` must match a registered cluster widget name.
- `kind` selects the cluster kind.
- `weight` is optional and controls relative slot sizing.
- Any editable parameter key may be added as an override (`caption_*`, `unit_*`, `formatUnit_*`, thresholds, behavior toggles, etc.).

## Adding a New Page

1. Determine the highest existing `gpspageN` in the target layout file.
2. Add a new page under `widgets` using the next sequential key (`gpspage{N+1}`).
3. Populate slot arrays with valid widget entries for the intended use case.
4. Update `tests/layouts/gpspage-all-widgets.json` to include the new page fixture content.
5. Update `tests/layouts/gpspage-all-widgets.test.js`:
   - extend the enumerated page-key assertion list
   - add/adjust assertions for the new page slots and widget expectations.

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [add-new-html-kind.md](add-new-html-kind.md)
