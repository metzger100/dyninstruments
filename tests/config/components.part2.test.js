// @ts-nocheck
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const BASE_URL = "http://host/plugins/dyninstruments/";

// Each of these fragments shares the same boundary contract: fail fast when
// baseUrl is missing, and create config.shared / componentRegistryGroups
// from scratch when no earlier fragment (or runtime/namespace.js) has done so
// yet. components.test.js only exercises the "already initialized" path
// (it always loads runtime/namespace.js first, which pre-creates
// config.shared), so these tests cover the other side of each contract.
const REGISTRY_FRAGMENTS = [
  {
    file: "config/components/registry-cluster.js",
    groupKey: "cluster",
    sampleId: "ClusterWidget"
  },
  {
    file: "config/components/registry-shared-engines.js",
    groupKey: "sharedEngines",
    sampleId: "RadialToolkit"
  },
  {
    file: "config/components/registry-shared-foundation-geometry.js",
    groupKey: "sharedFoundation",
    sampleId: "RadialAngleMath"
  },
  {
    file: "config/components/registry-shared-foundation-layout.js",
    groupKey: "sharedFoundation",
    sampleId: "AisTargetLayoutSizing"
  },
  {
    file: "config/components/registry-shared-foundation-state.js",
    groupKey: "sharedFoundation",
    sampleId: "StateScreenLabels"
  },
  {
    file: "config/components/registry-shared-foundation-xte.js",
    groupKey: "sharedFoundation",
    sampleId: "XteHighwayLayout"
  },
  {
    file: "config/components/registry-widgets-gauge.js",
    groupKey: "widgets",
    sampleId: "ClockRadialWidget"
  }
];

describe("config/components registry fragment boundary contract", function () {
  REGISTRY_FRAGMENTS.forEach(function (fragment) {
    it(`throws a descriptive error when baseUrl is missing before ${fragment.file} loads`, function () {
      const context = createScriptContext({
        DyniPlugin: {
          runtime: {},
          state: {},
          config: { shared: {}, clusters: [] }
        }
      });

      expect(function () {
        runIifeScript(fragment.file, context);
      }).toThrow("dyninstruments: baseUrl missing before " + fragment.file + " load");
    });

    it(`creates config.shared and the ${fragment.groupKey} registry group from scratch for ${fragment.file}`, function () {
      const context = createScriptContext({
        DyniPlugin: {
          baseUrl: BASE_URL,
          runtime: {},
          state: {},
          config: {}
        }
      });

      expect(context.DyniPlugin.config.shared).toBeUndefined();

      runIifeScript(fragment.file, context);

      const shared = context.DyniPlugin.config.shared;
      expect(shared).toBeTruthy();
      const group = shared.componentRegistryGroups[fragment.groupKey];
      expect(group[fragment.sampleId]).toBeTruthy();
      expect(group[fragment.sampleId].js.indexOf(BASE_URL)).toBe(0);
    });
  });
});
