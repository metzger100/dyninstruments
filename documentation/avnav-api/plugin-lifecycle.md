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
- dyninstruments cluster widgets use renderHtml host path only
- pre-commit renderHtml returns inert shell markup
- committed HTML and canvas rendering happens after host commit through surface controllers
- theme outputs are applied to committed root before session reconcile
- dyninstruments HTML interaction uses committed direct DOM listeners, not host inline handler translation

## Related

- ../architecture/runtime-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/html-renderer-lifecycle.md
