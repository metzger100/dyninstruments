// @ts-check
const { BASE_URL, REGISTRY_FRAGMENTS, createScriptContext, runIifeScript } = require("./components-setup");

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
