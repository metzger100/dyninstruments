# Active Route Renderer

**Status:** ✅ Implemented | `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`

## Overview

`activeRoute` is a native HTML kind rendered by `ActiveRouteTextHtmlWidget` on `surface: "html"`.

- `kind: "activeRoute"` -> `renderer: "ActiveRouteTextHtmlWidget"`
- `kind: "activeRouteInteractive"` is removed and unsupported.

Domain ownership:

- `cluster/viewmodels/ActiveRouteViewModel.js` owns active-route data normalization (`routeName`, `disconnect`, `display`, `captions`, `units`).
- `ActiveRouteTextHtmlWidget` is output-only and consumes the normalized domain payload.

It renders:

- route name
- remaining route distance
- route ETA
- next-course tile only while approaching

Layout ownership:

- `shared/widget-kits/nav/ActiveRouteLayout.js` owns responsive insets, content rects, and mode-specific rectangle splitting.
- `shared/widget-kits/layout/ResponsiveScaleProfile.js` owns the shared `minDim -> t` compact curve consumed by `ActiveRouteLayout`.
- `shared/widget-kits/nav/ActiveRouteHtmlFit.js` owns HTML text fitting against the active route layout contract.

## Module Registration

```javascript
ActiveRouteTextHtmlWidget: {
  js: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
  css: BASE + "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css",
  globalKey: "DyniActiveRouteTextHtmlWidget",
  deps: ["ActiveRouteHtmlFit"]
}
```

Used by `ClusterWidget` via `NavMapper` with shared viewmodel payload:

- `kind: "activeRoute"` -> `renderer: "ActiveRouteTextHtmlWidget"`

## Shared Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `routeName` | string | `""` | Active route name, rendered without caption/unit |
| `display.remain` | number | — | Remaining route distance |
| `display.eta` | Date-like | — | Route ETA |
| `display.nextCourse` | number | — | Next route course, shown only while approaching |
| `display.isApproaching` | boolean | `false` | Enables approach accent + `NEXT` tile |
| `disconnect` | boolean | `false` | Forces placeholder metric values |
| `captions.remain` | string | `"RTE"` | Caption for remaining-distance tile |
| `units.remain` | string | `"nm"` | Unit for remaining-distance tile and formatter input |
| `captions.eta` | string | `"ETA"` | Caption for ETA tile |
| `units.eta` | string | `""` | ETA unit text (normally empty) |
| `captions.nextCourse` | string | `"NEXT"` | Caption for next-course tile |
| `units.nextCourse` | string | `"°"` | Unit text for next-course tile |
| `ratioThresholdNormal` | number | `1.2` | Ratio below this -> `high` |
| `ratioThresholdFlat` | number | `3.8` | Ratio above this -> `flat` |
| `default` | string | `"---"` | Placeholder for missing values |

## Layout Modes

Mode selection uses `ratio = W / H`.

```text
ratio < ratioThresholdNormal -> high
ratio > ratioThresholdFlat -> flat
otherwise -> normal
```

### high

- top route-name band
- stacked metric rows: `RTE`, `ETA`
- extra `NEXT` row while approaching

### normal

- top route-name band
- non-approach: one two-column row `RTE | ETA`
- approach: top row `RTE | ETA`, bottom row `NEXT` spanning full width

### flat

- left route-name panel (`~38%`)
- right metric panel
- non-approach: `RTE | ETA`
- approach: `RTE | ETA | NEXT`

## Formatting Contract

- `remain` -> `formatDistance(remain, remainUnit)`
- `eta` -> `formatTime(eta)`
- `nextCourse` -> `formatDirection(nextCourse)`
- `routeName` is fitted single-line text by responsive downscaling (no ellipsis).

When `disconnect` is true:

- metric values render with `default`
- approach layout still keeps the `NEXT` tile when `isApproaching === true`

## HTML Renderer Contract (`activeRoute`)

- Output is string-based `renderHtml(props)` with explicit `onclick` handler names for AvNav `eventHandler` wiring.
- Markup includes route-name block plus metric tiles for `RTE`, `ETA`, and conditional `NEXT` while approaching.
- In non-editing dispatch mode, wrapper includes `onclick="catchAll"` for empty-space click consumption.
- In non-editing dispatch mode, renderer adds a full-widget transparent hotspot with named handler wiring (`activeRouteOpen`) so any click inside the widget opens route editor.
- In editing mode or passive/unsupported capability mode, renderer does not capture clicks, allowing host click handling to continue.
- `resizeSignature(props)` drives layout-relevant `triggerResize()` calls through `HtmlSurfaceController`.

## Related

- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../shared/responsive-scale-profile.md](../shared/responsive-scale-profile.md)
