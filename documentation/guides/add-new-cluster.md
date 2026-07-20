# Guide: Create a New Cluster Widget

**Status:** ✅ Reference Guide | Modular ClusterWidget workflow

## Prerequisites

Read first:

- [../avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../architecture/component-system.md](../architecture/component-system.md)

## Overview

A cluster is one AvNav widget with multiple `kind` choices (numeric and optionally radial). All cluster widgets use
`widget: "ClusterWidget"`. Cluster host registration is `renderHtml`; per-kind render behavior is selected by route
metadata in `config.clusterRoutes.byRouteId`, which supplies `mapperId`, `rendererId`, `surface`, optional
`viewModelId`, and `shellSizing`. Route metadata stays data-only: transitive dependencies remain in `config.components`,
and renderer shadowCss stays on the component registry entry.

Translation logic lives in one mapper module per cluster.

Mapper contract:

- Keep mappers declarative only (`create` + `translate`, kind routing, value normalization).
- Put formatter/status/display logic in renderer modules or shared toolkit helpers.
- Do not emit renderer identity from the mapper; activation resolves it from route metadata.
- If a mapper needs renderer-specific values, put them under `rendererProps`; activation merges that object and strips
  it from the final payload.
- For each formatter-bearing kind, define/update a contract tuple in docs:
  - [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md)
  - [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md)
  - [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md)

## Step 1: Add Kind Defaults

Add entries in `config/shared/kind-defaults.js`:

```javascript
shared.kindMaps.NEW_KIND = {
  value1: { cap: "VAL1", unit: "X" },
  value2: { cap: "VAL2", unit: "Y" },
  value1Radial: { cap: "VAL1", unit: "X" },
  value1RadialMain: {
    cap: "VAL1",
    unit: "X",
    kind: "value1Radial",
    captionName: "Main caption",
    unitName: "Main unit"
  }
};
```

Use CamelCase-suffix keys for multi-value radial fields (`value1RadialMain`, `xteDisplayBrg`, ...), so generated
editable keys stay predictable (`caption_<mapKey>`, `unit_<mapKey>`).

## Step 2: Add Cluster Definition

Create `config/clusters/new-cluster.js` and push cluster definition:

```javascript
config.clusters.push({
  widget: "ClusterWidget",
  def: {
    name: "dyni_NewCluster_Instruments",
    description: "...",
    caption: "",
    unit: "",
    default: "---",
    cluster: "newcluster",
    storeKeys: {
      value1: "signalk.path.value1",
      value2: "signalk.path.value2"
    },
    editableParameters: {
      kind: {
        type: "SELECT",
        list: [
          { name: "Value 1", value: "value1" },
          { name: "Value 2", value: "value2" },
          { name: "Value 1 [Radial]", value: "value1Radial" }
        ],
        default: "value1",
        name: "Instrument"
      },
      caption: false,
      unit: false,
      formatter: false,
      formatterParameters: false,
      className: true,
      ...makePerKindTextParams(shared.kindMaps.NEW_KIND)
    }
  }
});
```

Then include the config script in `config/bootstrap-manifest.js` load order.

Internal-only responsive layout knobs must be marked `internal: true` on the editable spec. Examples:
`ratioThresholdNormal`, `ratioThresholdFlat`, and widget-specific `*RatioThreshold*` values. This keeps their runtime
defaults active while hiding them from the AvNav editor.

## Step 3: Add Mapper Module

Create `cluster/mappers/NewClusterMapper.js`:

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniNewClusterMapper = factory();
  }
})(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      if (p.kind === "value1Radial") {
        return {
          value: p.value1,
          caption: cap("value1Radial"),
          unit: unit("value1Radial")
        };
      }

      if (p.kind === "value1") {
        return out(p.value1, cap("value1"), unit("value1"), "formatDecimal", [3, 1, true]);
      }

      if (p.kind === "value2") {
        return out(p.value2, cap("value2"), unit("value2"), "formatDecimal", [3, 1, true]);
      }

      return {};
    }

    return { cluster: "newcluster", translate: translate };
  }

  return { id: "NewClusterMapper", create: create };
});
```

## Step 4: Register Mapper Module

1. `config/components/registry-cluster.js`

- Add module entry for `NewClusterMapper`

## Step 5: Add Route Metadata

Create or update the route entry in `config/cluster-routes/<cluster>.js` so `config.clusterRoutes.byRouteId[routeId]`
points at the new route.

Set:

- `mapperId: "NewClusterMapper"`
- `rendererId: "NewGauge"` or an existing renderer component
- `surface: "canvas-dom"` or `"html"`
- optional `viewModelId`
- `shellSizing`

If the route needs a new renderer component, register that renderer in the appropriate `config/components/registry-*.js`
fragment and keep its shadow CSS declaration with the component.

Do not add ad hoc router, catalog, or renderer-props wiring here; route metadata plus `ClusterWidget`,
`RouteActivationController`, and `RouteActivationPayloadBuilder` own the live route selection. Do not add dependency
buckets, preload hints, or any other transitive-dependency data to the route entry.

## Renderer Decision Rule

When adding a new cluster `kind`, use this rule to decide between routing to an existing renderer vs creating a
dedicated renderer module:

- If the mapper must set more than 6 renderer-specific props for one `kind`, create a dedicated renderer.
- If the mapper sets props that change renderer behavior mode (for example `rawMode`, axis formatter overrides, or
  flatten-from-axes flags), create a dedicated renderer.
- If the new kind's visual output differs from the existing renderer's primary purpose, create a dedicated renderer.
- If the visual layout stays the same, prefer extending the existing renderer with a renderer-owned variant contract
  (pattern: `PositionCoordinateWidget` `displayVariant`) instead of adding a cluster-side forwarding shim.

## Adding a New Kind

For a new `kind` in an existing cluster:

1. Extend kind defaults in `config/shared/kind-defaults.js`
2. Extend the cluster `kind` SELECT in `config/clusters/<cluster>.js`
3. Add any new `storeKeys` / `editableParameters` Mark runtime-only threshold/ratio editables with `internal: true`;
   keep real user controls visible.
4. Update matching mapper module in `cluster/mappers/<Cluster>.js`
5. Add or update the route entry in `config/cluster-routes/<cluster>.js` with `mapperId`, `rendererId`, `surface`,
   optional `viewModelId`, and `shellSizing`
6. If the kind is radial and uses a new renderer, register that renderer component and its shadow CSS in the appropriate
   component fragment

## Validate

- Ensure each `kind` translates to expected output
- Ensure numeric kinds route to `ThreeValueTextWidget`
- Ensure radial kinds set correct route metadata and props
- Ensure unknown kinds return `{}`
- Resize widget and verify layout behavior in AvNav
- If the new/changed kind has user-visible visual/layout differences, update the showcase fixture
  `tests/layouts/gpspage-all-widgets.json` and assertions in `tests/layouts/gpspage-all-widgets.test.js`

## Checklist

- [ ] Kind defaults added in `config/shared/kind-defaults.js`
- [ ] Cluster config created/updated in `config/clusters/`
- [ ] Cluster script included in `config/bootstrap-manifest.js` load order
- [ ] Mapper module added/updated in `cluster/mappers/`
- [ ] Module entry added in `config/components/registry-cluster.js`
- [ ] Route metadata added/updated in `config/cluster-routes/<cluster>.js`
- [ ] Renderer component registered if the route needs a new renderer
- [ ] For new/visually changed kinds, `tests/layouts/gpspage-all-widgets.json` and
      `tests/layouts/gpspage-all-widgets.test.js` updated
- [ ] Every formatter-bearing kind has documented tuple
      (`kind -> key -> raw unit/type -> formatter -> formatterParameters`) in core contract docs

## Related

- [add-new-gauge.md](add-new-gauge.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
