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

- dyninstruments cluster widgets use renderHtml host path only
- pre-commit renderHtml returns inert shell markup
- committed HTML and canvas rendering happens after host commit through surface controllers
- theme outputs are applied to committed root before session reconcile
- dyninstruments HTML interaction uses committed direct DOM listeners, not host inline handler translation

## Related

- ../architecture/runtime-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/html-renderer-lifecycle.md
