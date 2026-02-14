# Guide: Create a New Cluster Widget

**Status:** ✅ Reference Guide | Modular ClusterHost workflow

## Prerequisites

Read first:

- [../avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md)
- [../architecture/cluster-system.md](../architecture/cluster-system.md)
- [../architecture/module-system.md](../architecture/module-system.md)

## Overview

A cluster is one AvNav widget with multiple `kind` choices (numeric and optionally graphic). All cluster widgets use `module: "ClusterHost"`.

With the modular refactor, translation logic lives in a dedicated dispatch module per cluster.

## Step 1: Add Kind Defaults

Add entries to `config/shared/kind-maps.js`:

```javascript
shared.kindMaps.NEW_KIND = {
  value1: { cap: "VAL1", unit: "X" },
  value2: { cap: "VAL2", unit: "Y" },
  value1Graphic: { cap: "VAL1", unit: "X" }
};
```

## Step 2: Add Cluster Definition

Create `config/clusters/new-cluster.js` and push a cluster definition:

```javascript
config.clusters.push({
  module: "ClusterHost",
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

Then add this file to `plugin.js` internal load order (next to other cluster config scripts).

## Step 3: Add Dispatch Module

Create `modules/ClusterHost/Dispatch/NewCluster.js`:

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchNewCluster = factory(); }
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

  return { id: "ClusterHostDispatchNewCluster", create: create };
}));
```

## Step 4: Register Dispatch Module

In `config/modules.js`:

1. Add module entry for `ClusterHostDispatchNewCluster`.
2. Add it to `ClusterHostDispatchRegistry.deps`.

If `renderer: "NewGauge"` is used:

1. Register `NewGauge` module in `config/modules.js`.
2. Add `NewGauge` to `ClusterHostRendererRegistry.deps`.
3. Add renderer selection in `modules/ClusterHost/Core/RendererRegistry.js`.

## Step 5: Validate

- Ensure each `kind` translates to expected output.
- Ensure numeric kinds route to `ThreeElements`.
- Ensure graphic kinds set correct `renderer` and props.
- Ensure unknown kinds return `{}`.
- Resize widget and verify layout behavior in AvNav.

## Checklist

- [ ] Kind defaults added in `config/shared/kind-maps.js`
- [ ] Cluster config file created in `config/clusters/`
- [ ] Cluster script included in `plugin.js` load list
- [ ] Dispatch module added in `modules/ClusterHost/Dispatch/`
- [ ] Module entry added in `config/modules.js`
- [ ] Dispatch added to `ClusterHostDispatchRegistry.deps`
- [ ] Renderer wiring updated (if graphic)

## Related

- [add-new-gauge.md](add-new-gauge.md)
- [../architecture/cluster-system.md](../architecture/cluster-system.md)
