# State Screens

**Status:** ✅ Implemented | Shared state-screen vocabulary, precedence helper, and rendering primitives

## Overview

State-screens are semantic full-body replacement states for disconnected/empty conditions.
Each widget owns resolver logic and uses shared helpers for labels, precedence, interaction gating, and HTML/canvas rendering primitives.

## Key Details

- Canonical kinds: `disconnected`, `noRoute`, `noTarget`, `noAis`, `hidden`, `data`.
- Canonical precedence order: `disconnected > noRoute > noTarget > noAis > hidden > data`.
- `disconnected` is mandatory in every resolver and is normally first.
- AIS exception: AIS is the only resolver that allows `hidden` before `disconnected` (`hidden > disconnected > noAis > data`) so non-applicable pages stay invisible during disconnect.
- `data` is always the final catch-all candidate (`{ kind: "data", when: true }`).
- Shared labels:
  - `disconnected` -> `GPS Lost`
  - `noRoute` -> `No Route`
  - `noTarget` -> `No Waypoint`
  - `noAis` -> `No AIS`
- `StateScreenPrecedence.pickFirst([...])` returns the first truthy `when` candidate or `data` when none match.
- `StateScreenInteraction.resolveInteraction({ kind, baseInteraction })` forces `passive` for any non-`data` kind.
- `StateScreenMarkup.renderStateScreen(...)` emits wrapper markup with `dyni-state-<kind>` class and passive interaction class normalization.
- `StateScreenCanvasOverlay.drawStateScreen(...)` draws dim-and-label overlay for non-`hidden` non-`data` kinds.

## API/Interfaces

```javascript
StateScreenLabels.KINDS
StateScreenLabels.LABELS

StateScreenPrecedence.pickFirst([{ kind: "disconnected", when: p.disconnect === true }, ...])

// Canonical order (omissions allowed except disconnected/data)
StateScreenPrecedence.pickFirst([
  { kind: "disconnected", when: p.disconnect === true },
  { kind: "noRoute", when: routeName === "" },
  { kind: "noTarget", when: wpName === "" },
  { kind: "noAis", when: hasTargetIdentity === false },
  { kind: "hidden", when: false },
  { kind: "data", when: true }
]);

// AIS-only exception
StateScreenPrecedence.pickFirst([
  { kind: "hidden", when: hideAisOnThisPage === true },
  { kind: "disconnected", when: p.disconnect === true },
  { kind: "noAis", when: hasTargetIdentity === false },
  { kind: "data", when: true }
]);

StateScreenInteraction.resolveInteraction({ kind, baseInteraction })

StateScreenMarkup.renderStateScreen({
  kind,
  label,
  wrapperClasses,
  extraAttrs,
  fitStyle,
  htmlUtils
})

StateScreenCanvasOverlay.drawStateScreen({
  ctx,
  W,
  H,
  family,
  color,
  labelWeight,
  kind,
  label
})
```

## Related

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [../widgets/route-points.md](../widgets/route-points.md)
- [../widgets/ais-target.md](../widgets/ais-target.md)
