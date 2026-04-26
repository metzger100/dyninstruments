const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("shared/unit-format-families.js", function () {
  function loadCatalog() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    expect(context.DyniComponents).toBeUndefined();
    runIifeScript("shared/unit-format-families.js", context);

    return {
      context: context,
      catalog: context.DyniPlugin.config.shared.unitFormatFamilies
    };
  }

  it("bootstraps the shared catalog and exposes consistent family metadata", function () {
    const loaded = loadCatalog();
    const context = loaded.context;
    const catalog = loaded.catalog;

    expect(catalog).toBe(context.DyniComponents.DyniUnitFormatFamilies);
    expect(context.DyniPlugin.config.shared.unitFormatFamilies).toBe(catalog);

    expect(catalog.families.speed.selectorList).toEqual([
      { name: "kn", value: "kn" },
      { name: "m/s", value: "ms" },
      { name: "km/h", value: "kmh" }
    ]);
    expect(catalog.families.distance.selectorList).toEqual([
      { name: "nm", value: "nm" },
      { name: "m", value: "m" },
      { name: "km", value: "km" },
      { name: "ft", value: "ft" },
      { name: "yd", value: "yd" }
    ]);
    expect(catalog.families.temperature.selectorList).toEqual([
      { name: "°C", value: "celsius" },
      { name: "K", value: "kelvin" }
    ]);
    expect(catalog.families.pressure.selectorList).toEqual([
      { name: "Pa", value: "pa" },
      { name: "hPa", value: "hpa" },
      { name: "bar", value: "bar" }
    ]);

    Object.keys(catalog.metricBindings).forEach(function (metricKey) {
      const binding = catalog.metricBindings[metricKey];
      const family = catalog.families[binding.family];

      expect(family).toBeDefined();
      expect(family.tokens).toContain(binding.defaultToken);
    });
  });

  it("keeps rendererKey aliases unique within each compound payload", function () {
    const catalog = loadCatalog().catalog;
    const groups = [
      ["activeRouteRemain"],
      ["editRouteDst", "editRouteRte"],
      ["routePointsDistance"],
      ["xteDisplayXte", "xteDisplayDst"],
      ["centerDisplayMarker", "centerDisplayBoat", "centerDisplayMeasure"],
      ["aisTargetDst", "aisTargetCpa"]
    ];

    groups.forEach(function (metricKeys) {
      const aliases = metricKeys
        .map(function (metricKey) {
          return catalog.metricBindings[metricKey].rendererKey;
        })
        .filter(function (alias) {
          return typeof alias === "string" && alias.length > 0;
        });
      expect(new Set(aliases).size).toBe(aliases.length);
    });
  });
});
