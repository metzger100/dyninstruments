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
    expect(editables.ratioThresholdNormal.internal).toBe(true);
    expect(editables.ratioThresholdFlat.internal).toBe(true);
    expect(editables.captionUnitScale.internal).not.toBe(true);
    expect(editables.captionUnitScale.default).toBe(0.8);
    expect(editables.captionUnitScale.name).toBe("Caption/Unit size");
  });
});
