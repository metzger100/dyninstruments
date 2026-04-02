# Vertical Container Contract

**Status:** ✅ Reference | `.widgetContainer.vertical` detection and intrinsic-height contract for HTML kinds

## Overview

This document defines how HTML renderers should behave when hosted inside `.widgetContainer.vertical`. It separates shipped CSS-only behavior from the architectural intrinsic-height contract for kinds that must compute natural height.

## Key Details

- `.widgetContainer.vertical` is host-owned layout context; the plugin does not own when this class is applied.
- Shipped behavior today is CSS-only presentation override in:
  - `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css`
  - `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css`
- Architectural intrinsic-height contract (for kinds that need it): force `high` mode, width-only responsive anchor, natural-height computation, wrapper-owned height injection.

## API/Interfaces

### Detection Contract

- Detection requires committed ancestry: `targetEl.closest(".widgetContainer.vertical")`.
- Detection is authoritative only after mount (corrective rerender or later updates).
- First pre-commit `renderHtml()` pass must treat vertical state as unknown and use host-sized assumptions.

### Width-Only Anchor Contract

- In vertical mode, shell height can be widget-produced and must not be used as responsive anchor.
- Use `ResponsiveScaleProfile.computeProfile(W, W, spec)` so `minDim` is width-anchored.
- Derive row/header/gap geometry from that width-only profile.

### Natural Height Contract (Architectural Pattern)

For kinds that need intrinsic sizing, compute wrapper height as:

```text
naturalHeight =
  headerHeight + headerGap +
  rowCount * rowHeight +
  max(0, rowCount - 1) * rowGap +
  outerPadding
```

- Cap to `75vh` using `window.innerHeight` (or injected `viewportHeight` in tests).
- Clamp derived heights to `>= 0`.
- Apply height inline on widget wrapper (for example `.dyni-<widget>-html`).
- Never mutate shared host/surface elements (`.dyni-surface-html`, `.widgetData.dyni-shell`).

### Vertical-Mode Resize Signature Contract

- Exclude shell height from signature in vertical mode (height is widget-produced).
- Include shell width, row/point count inputs, mode flag, and `isVerticalCommitted` flag.
- Signature must stay stable when only widget-computed height changes.

### CSS Pattern

```css
.widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-<widget>-html {
  height: auto;
  /* natural height is injected inline by renderer */
}
```

## Related

- [html-renderer-lifecycle.md](html-renderer-lifecycle.md)
- [../shared/responsive-scale-profile.md](../shared/responsive-scale-profile.md)
- [../shared/html-widget-visual-style-guide.md](../shared/html-widget-visual-style-guide.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
