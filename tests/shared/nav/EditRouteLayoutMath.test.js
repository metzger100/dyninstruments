const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("EditRouteLayoutMath", function () {
  function createContext() {
    return createComponentContextMock({
      modules: {
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
      }
    });
  }

  function createLayoutMath() {
    return loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js").create({}, createContext());
  }

  it("exposes the real ValueMath numeric guards", function () {
    const layoutMath = createLayoutMath();

    expect(layoutMath.id).toBe("EditRouteLayoutMath");
    expect(layoutMath.toFiniteNumber("42")).toBe(42);
    expect(layoutMath.toFiniteNumber("not-a-number")).toBeUndefined();
    expect(layoutMath.toOptionalFiniteNumber(null)).toBeUndefined();
    expect(layoutMath.toOptionalFiniteNumber("7.5")).toBe(7.5);
    expect(layoutMath.clampNumber(500, 0, 100, 10)).toBe(100);
    expect(layoutMath.clampNumber(undefined, 0, 100, 10)).toBe(10);
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/nav/EditRouteLayoutMath.js", context);

    const component = context.DyniComponents.DyniEditRouteLayoutMath;
    expect(component.id).toBe("EditRouteLayoutMath");

    const api = component.create({}, createContext());
    expect(api.toFiniteNumber("13")).toBe(13);
    expect(api.clampNumber(-5, 0, 10, 3)).toBe(0);
  });
});
