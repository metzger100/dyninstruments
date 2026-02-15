const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/shared/common-editables.js", function () {
  it("registers shared ThreeValueTextWidget editables", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/common-editables.js", context);

    const editables = context.DyniPlugin.config.shared.commonThreeElementsEditables;
    expect(editables.ratioThresholdNormal.default).toBe(1.0);
    expect(editables.ratioThresholdFlat.default).toBe(3.0);
    expect(editables.captionUnitScale.default).toBe(0.8);
  });
});
