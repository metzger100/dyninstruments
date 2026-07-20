const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("NavModeRatio", function () {
  function createModeRatio() {
    return loadFresh("shared/widget-kits/nav/NavModeRatio.js").create();
  }

  it("resolves the flat ratio for flat mode", function () {
    const modeRatio = createModeRatio();
    expect(modeRatio.resolve("flat", { flat: 1, normal: 2, high: 3 })).toBe(1);
  });

  it("resolves the high ratio for high mode", function () {
    const modeRatio = createModeRatio();
    expect(modeRatio.resolve("high", { flat: 1, normal: 2, high: 3 })).toBe(3);
  });

  it("falls back to the normal ratio for any other mode", function () {
    const modeRatio = createModeRatio();
    expect(modeRatio.resolve("normal", { flat: 1, normal: 2, high: 3 })).toBe(2);
    expect(modeRatio.resolve("unknown", { flat: 1, normal: 2, high: 3 })).toBe(2);
    expect(modeRatio.resolve(undefined, { flat: 1, normal: 2, high: 3 })).toBe(2);
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/nav/NavModeRatio.js", context);

    const component = context.DyniComponents.DyniNavModeRatio;
    expect(component.id).toBe("NavModeRatio");

    const api = component.create();
    expect(api.resolve("flat", { flat: "a", normal: "b", high: "c" })).toBe("a");
  });
});
