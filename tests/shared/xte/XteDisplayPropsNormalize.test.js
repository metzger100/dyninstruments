const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("XteDisplayPropsNormalize", function () {
  function create() {
    return loadFresh("shared/widget-kits/xte/XteDisplayPropsNormalize.js").create();
  }

  it("projects mapper-owned fields without changing their values", function () {
    const api = create();
    const display = { xte: 0.2 };
    const captions = { xte: "XTE" };
    const units = { xte: "nm" };
    const formatUnits = { xte: "nm" };
    const layout = { easing: false, hideTextualMetrics: true };
    const result = api.read({
      display,
      captions,
      units,
      formatUnits,
      layout,
      xteScale: 2.5
    });

    expect(result).toEqual({
      display,
      captions,
      units,
      formatUnits,
      layoutConfig: layout,
      easingEnabled: false,
      hideTextualMetrics: true,
      xteScale: 2.5
    });
    expect(result.display).toBe(display);
    expect(result.layoutConfig).toBe(layout);
  });

  it("registers through browser-global and AMD UMD paths", function () {
    const browserContext = createScriptContext({ __skipDefaultDyniComponents: true });
    runIifeScript("shared/widget-kits/xte/XteDisplayPropsNormalize.js", browserContext);
    expect(browserContext.DyniComponents.DyniXteDisplayPropsNormalize.id).toBe("XteDisplayPropsNormalize");

    /** @type {any} */
    let amdModule;
    /** @param {unknown[]} _deps @param {() => any} factory */
    const define = function (_deps, factory) {
      amdModule = factory();
    };
    define.amd = true;
    const amdContext = createScriptContext({ define, __skipDefaultDyniComponents: true });
    runIifeScript("shared/widget-kits/xte/XteDisplayPropsNormalize.js", amdContext);
    expect(amdModule.id).toBe("XteDisplayPropsNormalize");
  });
});
