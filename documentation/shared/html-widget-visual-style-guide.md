# HTML Widget Visual Style Guide

**Status:** ✅ Implemented | Normative visual contract for `surface: "html"` kinds

## Overview

Use this guide for every native HTML renderer routed through `HtmlSurfaceController`.
It defines visual ownership, CSS/state contracts, responsive-mode documentation format, and fail-closed guardrails.

## Key Details

- Scope: native HTML kinds only (`surface: "html"`), not `canvas-dom` wrappers.
- HTML renderers own inner markup/classes; shared host CSS owns root/shell/surface fill behavior.
- Responsive geometry ownership and text-fit ownership must be split across shared layout/fit modules.
- Visual docs must include exact class/state contracts and normative constants when they are runtime-owned.

## Ownership Contract

| Area | Owner | Non-owner rule |
|---|---|---|
| Root widget and shell sizing (`.widget.dyniplugin`, `.widgetData.dyni-shell`, `.dyni-surface-html`) | `plugin.css` and host lifecycle modules | Widget-local CSS must not override shell/root fill contracts |
| HTML surface lifecycle (`attach`/`update`/`detach`/`destroy`) | `cluster/rendering/HtmlSurfaceController.js` | Widget docs must not claim lifecycle ownership |
| Domain normalization (`display`, `captions`, `units`, disconnect derivation) | mapper + viewmodel modules | HTML renderer docs must consume normalized payload contract |
| Responsive geometry (`rects`, shares, insets, mode-specific splits) | shared layout-owner module | Renderer must not define a second compact curve |
| Text fitting (`font-size` ceilings, measurement) | shared fit module | Renderer applies styles; it does not own fit math |
| Visual tokens (font/color weights) | `ThemeResolver` + `Helpers` | No duplicated token defaults in widget code/docs |

## CSS Class and State Contract

Required naming shape for HTML widget docs:

- Wrapper base class: `dyni-<widget>-html`
- Element classes: `dyni-<widget>-<element>`
- Mode state classes: `dyni-<widget>-mode-high`, `dyni-<widget>-mode-normal`, `dyni-<widget>-mode-flat`
- Behavior/state classes: `dyni-<widget>-disconnect`, `dyni-<widget>-approaching`, `dyni-<widget>-open-dispatch`, `dyni-<widget>-open-passive`

Rules:

- State classes must be additive and renderer-owned.
- Do not encode runtime state in non-contract `data-dyni-*` attributes.
- Z-index/layering for hotspots must be explicit in widget-local CSS when interaction overlays are used.

## Responsive Mode Spec Format

Each HTML widget doc must include:

1. Mode selection formula (usually `ratio = W / H`).
2. Threshold source of truth (editable props with defaults).
3. Mode matrix (`high`/`normal`/`flat`) describing panel splits and conditional rows/tiles.
4. Layout-owner constants table (ratios/min-max clamps/scales).
5. Explicit note that shared `ResponsiveScaleProfile` owns base compact curve.

## Text-Fit Ownership Split

Document the split explicitly:

- Layout module: computes insets/content rects/mode rectangles/tile spacing.
- Fit module: measures text and emits inline style payload (`font-size:...`).
- Renderer: injects style attributes onto markup and escapes text content.

Fail-closed expectation:

- If fit context cannot be established, renderer should keep valid markup behavior without throwing from the fit path.

## Token Usage Contract

HTML renderer docs must state the visual token boundary:

- Font family and foreground color come from helper/theme owners (`Helpers.resolveFontFamily`, `Helpers.resolveTextColor`, `ThemeResolver.resolveForRoot` where needed).
- Font weight and label weight come from theme token contract (`tokens.font.weight`, `tokens.font.labelWeight`) when fit/layout logic depends on weights.
- Do not duplicate `plugin.css` or `ThemeResolver` defaults in widget-local docs/code unless boundary ownership requires it.

## Anti-Patterns (Fail-Closed)

| Anti-pattern | Required alternative | Related smell rule |
|---|---|---|
| Widget-local CSS modifies `.widget.dyniplugin` shell/root ownership | Keep shell/root ownership in `plugin.css` and host surface docs | `css-js-default-duplication` (warn), architecture boundary |
| Renderer defines responsive hard floors independent of shared profile | Move compaction math to layout owner + `ResponsiveScaleProfile` | `responsive-layout-hard-floor`, `responsive-profile-ownership` |
| Runtime state encoded in ad hoc attributes | Use explicit contract classes and documented handler names | compatibility cleanup policy |
| Renderer re-documents fallback literals owned by config/theme | Keep defaults at config/theme boundary and reference owner | `hardcoded-runtime-default`, `inline-config-default-duplication` |

## Visual Contract Template

Use this template section in each HTML widget module doc:

```markdown
## Visual Contract

### CSS State Classes
| Class | Source | Meaning |
|---|---|---|
| `dyni-<widget>-mode-high` | renderer mode resolver | Tall layout |
| `dyni-<widget>-mode-normal` | renderer mode resolver | Balanced layout |
| `dyni-<widget>-mode-flat` | renderer mode resolver | Wide layout |

### Layering
| Layer | Selector | Purpose |
|---|---|---|
| base content | `.dyni-<widget>-...` | Text/tiles |
| interaction overlay | `.dyni-<widget>-...` | Click capture |

### Layout Constants (Owner: `<LayoutModule>`)
| Constant | Value | Purpose |
|---|---|---|
| `...` | `...` | `...` |

### Text-Fit Constants (Owner: `<FitModule>`)
| Constant | Value | Purpose |
|---|---|---|
| `...` | `...` | `...` |

### Visual Regression Checklist
- [ ] Mode class matches shell ratio thresholds
- [ ] Conditional tiles appear/disappear by state
- [ ] Dispatch/passive click capture classes and handlers align
- [ ] Text is escaped and required props fail closed
```

## Related

- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
- [../widgets/active-route.md](../widgets/active-route.md)
- [css-theming.md](css-theming.md)
- [responsive-scale-profile.md](responsive-scale-profile.md)
