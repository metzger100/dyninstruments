# Plugin Lifecycle (AvNav Host API)

**Status:** ✅ Reference | Host-facing widget lifecycle callbacks and dyninstruments integration notes

## Overview

AvNav registers widgets via registerWidget and calls lifecycle callbacks on host context.

Common callbacks:

- translateFunction(props)
- renderHtml(props)
- initFunction()
- finalizeFunction()

## dyninstruments Notes

- dyninstruments ships two startup adapters:
  - `plugin.js` for legacy AvNav startup (`AVNAV_BASE_URL` + `avnav.api` discovery)
  - `plugin.mjs` for modern AvNav module startup (default export, AvNav passes API object)
- both adapters delegate to one shared bootstrap owner: `runtime/plugin-bootstrap-core.js`
- `plugin.mjs` is the current/future-facing entry when AvNav reports a module file; `plugin.js` is retained for older AvNav versions and is not a runtime fallback after AvNav chooses `plugin.mjs`
- `plugin.json` stays declarative and currently registers bundled layouts only
- required host API methods are checked before startup: `getBaseUrl`, `registerWidget`, and `log` on the module path; `registerWidget` and `log` on the legacy path
- module startup returns a shutdown function that clears generation-bound init state when AvNav calls it during disable or timestamp reload
- dyninstruments cluster widgets use renderHtml host path only
- pre-commit renderHtml returns inert shell markup
- committed HTML and canvas rendering happens after host commit through surface controllers
- theme outputs are applied to committed root before session reconcile
- dyninstruments HTML interaction uses committed direct DOM listeners, not host inline handler translation
- `updateFunction(values)` receives live store values, not editable config props; configured props such as `kind` are available on the host `this` object in AvNav's widget call path.
- `KEY` editables store selected paths in `storeKeys.<parameterName>`; if `<parameterName>` is an alias such as `depthKey`, `updateFunction` must copy the live value to the mapper prop, for example `depth`.

## Related

- ../architecture/runtime-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/html-renderer-lifecycle.md
