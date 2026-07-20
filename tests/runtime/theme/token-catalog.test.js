const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("runtime/theme/token-catalog.js", function () {
  function loadCatalog() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/theme/token-catalog.js", context);
    return context.DyniPlugin.runtime.createThemeTokenCatalog();
  }

  it("registers createThemeTokenCatalog on the runtime namespace", function () {
    const context = createScriptContext({
      DyniPlugin: { runtime: {}, state: {}, config: { shared: {}, clusters: [] } }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/theme/token-catalog.js", context);

    expect(typeof context.DyniPlugin.runtime.createThemeTokenCatalog).toBe("function");
  });

  it("returns a frozen TOKEN_DEFS array covering every declared theme token path", function () {
    const catalog = loadCatalog();

    expect(Object.isFrozen(catalog.TOKEN_DEFS)).toBe(true);
    expect(catalog.TOKEN_DEFS.length).toBeGreaterThan(50);

    const surfaceFg = catalog.TOKEN_DEFS.find(function (/** @type {any} */ def) {
      return def.path === "surface.fg";
    });
    expect(surfaceFg).toEqual(
      expect.objectContaining({
        path: "surface.fg",
        inputVar: "--dyni-fg",
        type: "color",
        default: "#000000",
        defaultByMode: { night: "rgba(252, 11, 11, 0.60)" },
        outputVar: "--dyni-theme-surface-fg"
      })
    );

    const fontFamily = catalog.TOKEN_DEFS.find(function (/** @type {any} */ def) {
      return def.path === "font.family";
    });
    expect(fontFamily.default).toContain("Roboto");

    const derivedToken = catalog.TOKEN_DEFS.find(function (/** @type {any} */ def) {
      return def.path === "colors.pointer";
    });
    expect(derivedToken.defaultFrom).toBe("colors.info");
  });

  it("returns a frozen PRESETS map with the five named presets", function () {
    const catalog = loadCatalog();

    expect(Object.isFrozen(catalog.PRESETS)).toBe(true);
    expect(Object.keys(catalog.PRESETS).sort()).toEqual(["bold", "darkmode", "default", "highcontrast", "slim"]);
    expect(catalog.PRESETS.default.night.colors.info).toBe("#cc2222");
    expect(catalog.PRESETS.slim.base.strokeWeight).toBe(0.66);
    expect(catalog.PRESETS.darkmode.base.surface.fg).toBe("#ffffff");
    expect(catalog.PRESETS.highcontrast.base.strokeWeight).toBe(1.32);
  });

  it("returns fresh but structurally identical catalogs across repeated calls", function () {
    const context = createScriptContext({
      DyniPlugin: { runtime: {}, state: {}, config: { shared: {}, clusters: [] } }
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/theme/token-catalog.js", context);

    const first = context.DyniPlugin.runtime.createThemeTokenCatalog();
    const second = context.DyniPlugin.runtime.createThemeTokenCatalog();

    expect(second.TOKEN_DEFS).toBe(first.TOKEN_DEFS);
    expect(second.PRESETS).toBe(first.PRESETS);
  });
});
