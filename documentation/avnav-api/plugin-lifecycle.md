# Plugin Lifecycle (AvNav Host API)

**Status:** Current.

## Overview

AvNav registers widgets via registerWidget and calls lifecycle callbacks on host context.

Common callbacks:

- translateFunction(props)
- renderHtml(props)
- initFunction()
- finalizeFunction()

## Key Details

- Core AvNav lifecycle callbacks: `translateFunction(props)`, `renderHtml(props)`, `initFunction()`,
  `finalizeFunction()`, registered via `registerWidget`.
- Two startup adapters share one bootstrap owner: `plugin.js` (legacy AvNav startup via `AVNAV_BASE_URL` + `avnav.api`
  discovery) and `plugin.mjs` (modern module startup, default export, AvNav passes the API object directly); both
  delegate to `runtime/plugin-bootstrap-core.js`.
- `plugin.mjs` is the current/future-facing entry when AvNav reports a module file; `plugin.js` is retained only for
  older AvNav versions and is not used as a fallback once `plugin.mjs` is chosen.
- `plugin.json` stays declarative and currently registers bundled layouts only.
- Required host API methods checked before startup: `getBaseUrl`, `registerWidget`, `log` on the module (`plugin.mjs`)
  path; `registerWidget`, `log` on the legacy (`plugin.js`) path.
- Module startup returns a shutdown function that clears generation-bound init state when AvNav invokes it during
  disable or timestamp reload.
- dyninstruments cluster widgets use the renderHtml host path only; pre-commit renderHtml returns inert shell markup,
  and real HTML/canvas rendering happens after host commit through surface controllers.
- Theme outputs are applied to the committed root before session reconcile.
- dyninstruments HTML interaction relies on committed direct DOM listeners rather than AvNav's inline handler
  translation.
- AvNav calls `updateFunction` as a method of the widget props: `this` carries editable config props such as `kind`, and
  the `values` argument holds only live store values. Cluster `updateFunction`s therefore read `kind` from `this`.
- `KEY` editables store their selected path in `storeKeys.<parameterName>`; for alias parameters (`depthKey`, `tempKey`,
  `pitchKey`, `rollKey`), `updateFunction` must copy the live value onto the mapper-owned prop (`depth`, `temp`,
  `pitch`, `roll`).
- AvNav deletes `storeKeys` and `visible` from the `updateFunction` result, so an `updateFunction` cannot rewrite store
  subscriptions or widget visibility.

## dyninstruments Notes

- dyninstruments ships two startup adapters:
  - `plugin.js` for legacy AvNav startup (`AVNAV_BASE_URL` + `avnav.api` discovery)
  - `plugin.mjs` for modern AvNav module startup (default export, AvNav passes API object)
- both adapters delegate to one shared bootstrap owner: `runtime/plugin-bootstrap-core.js`
- `plugin.mjs` is the current/future-facing entry when AvNav reports a module file; `plugin.js` is retained for older
  AvNav versions and is not a runtime fallback after AvNav chooses `plugin.mjs`
- `plugin.json` stays declarative and currently registers bundled layouts only
- required host API methods are checked before startup: `getBaseUrl`, `registerWidget`, and `log` on the module path;
  `registerWidget` and `log` on the legacy path
- module startup returns a shutdown function that clears generation-bound init state when AvNav calls it during disable
  or timestamp reload
- dyninstruments cluster widgets use renderHtml host path only
- pre-commit renderHtml returns inert shell markup
- committed HTML and canvas rendering happens after host commit through surface controllers
- theme outputs are applied to committed root before session reconcile
- dyninstruments HTML interaction uses committed direct DOM listeners, not host inline handler translation
- `updateFunction(values)` receives live store values, not editable config props; configured props such as `kind` are
  available on the host `this` object in AvNav's widget call path. Tests call it in the host shape:
  `def.updateFunction.call(widgetProps, storeValues)`.
- `KEY` editables store selected paths in `storeKeys.<parameterName>`; if `<parameterName>` is an alias such as
  `depthKey` or `pitchKey`, `updateFunction` must copy the live value to the mapper prop, for example `depth` or
  `pitch`.
- AvNav keeps every saved parameter that differs from its default, whatever its `condition`, so a `KEY` entered for one
  kind stays subscribed after the kind changes. Mapper output therefore always carries `value` (an absent value is an
  own `undefined`), so a raw leftover `value` can never be shown as another kind's value.

## Related

- ../architecture/runtime-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/html-renderer-lifecycle.md
