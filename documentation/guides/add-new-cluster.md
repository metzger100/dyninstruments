# Guide: Create a New Cluster Widget

**Status:** ✅ Reference Guide | Modular ClusterWidget workflow

## Prerequisites

Read first:

- [../avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../architecture/component-system.md](../architecture/component-system.md)

## Overview

A cluster is one AvNav widget with multiple `kind` choices (numeric and optionally graphic). All cluster widgets use `widget: "ClusterWidget"`.

Translation logic lives in one mapper module per cluster.

Mapper contract:
- Keep mappers declarative only (`create` + `translate`, kind routing, value normalization).
- Put formatter/status/display logic in renderer modules or shared toolkit helpers.

## Step 1: Add Kind Defaults

Add entries in `config/shared/kind-defaults.js`:

```javascript
shared.kindMaps.NEW_KIND = {
  value1: { cap: "VAL1", unit: "X" },
  value2: { cap: "VAL2", unit: "Y" },
  value1Graphic: { cap: "VAL1", unit: "X" }
};
```

## Step 2: Add Cluster Definition

Create `config/clusters/new-cluster.js` and push cluster definition:

```javascript
config.clusters.push({
  widget: "ClusterWidget",
  def: {
    name: "dyninstruments_NewCluster",
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
          { name: "Value 1 [Graphic]", value: "value1Graphic" }
        ],
        default: "value1",
        name: "Kind"
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

Then include the config script in `plugin.js` internal load order.

## Step 3: Add Mapper Module

Create `cluster/mappers/NewClusterMapper.js`:

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNewClusterMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      if (p.kind === "value1Graphic") {
        return {
          renderer: "NewGauge",
          value: p.value1,
          caption: cap("value1Graphic"),
          unit: unit("value1Graphic")
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
}));
```

## Step 4: Register Mapper Module

Update both config-time and runtime mapper lists:

1. `config/components.js`
- Add module entry for `NewClusterMapper`
- Add to `ClusterMapperRegistry.deps`
2. `cluster/mappers/ClusterMapperRegistry.js`
- Add `"newcluster": "NewClusterMapper"` to `MAPPER_MODULE_IDS`

## Step 5: Optional Graphic Renderer Wiring

If mapper returns `renderer: "NewGauge"`:

1. Register `NewGauge` in `config/components.js`
2. Add `NewGauge` to `ClusterRendererRouter.deps` in `config/components.js`
3. Wire runtime selection in `cluster/rendering/ClusterRendererRouter.js`:
- add `NewGauge: Helpers.getModule("NewGauge").create(def, Helpers)` to `rendererSpecs`

Naming rule for `cluster/rendering/` wrappers:
- Use role-based IDs (example: `DateTimeWidget`, `TimeStatusWidget`), not cluster-prefixed IDs.
- Keep file basename, component ID, returned `id`, and `globalKey` aligned.

## Adding a New Kind

For a new `kind` in an existing cluster:

1. Extend kind defaults in `config/shared/kind-defaults.js`
2. Extend the cluster `kind` SELECT in `config/clusters/<cluster>.js`
3. Add any new `storeKeys` / `editableParameters`
4. Update matching mapper module in `cluster/mappers/<Cluster>.js`
5. If the kind is graphic and uses a new renderer, also complete renderer wiring from Step 5

## Validate

- Ensure each `kind` translates to expected output
- Ensure numeric kinds route to `ThreeValueTextWidget`
- Ensure graphic kinds set correct `renderer` and props
- Ensure unknown kinds return `{}`
- Resize widget and verify layout behavior in AvNav

## Checklist

- [ ] Kind defaults added in `config/shared/kind-defaults.js`
- [ ] Cluster config created/updated in `config/clusters/`
- [ ] Cluster script included in `plugin.js` internal load order
- [ ] Mapper module added/updated in `cluster/mappers/`
- [ ] Module entry added in `config/components.js`
- [ ] Mapper added in `ClusterMapperRegistry.deps` (`config/components.js`)
- [ ] Mapper added in runtime `MAPPER_MODULE_IDS` (`cluster/mappers/ClusterMapperRegistry.js`)
- [ ] Renderer wiring updated (if graphic)

## Related

- [add-new-gauge.md](add-new-gauge.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
