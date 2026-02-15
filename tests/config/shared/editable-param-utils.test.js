const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/shared/editable-param-utils.js", function () {
  it("builds per-kind caption/unit params and option helpers", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/editable-param-utils.js", context);

    const shared = context.DyniPlugin.config.shared;
    const params = shared.makePerKindTextParams({
      sog: { cap: "SOG", unit: "kn" },
      empty: {}
    });

    expect(params.caption_sog.default).toBe("SOG");
    expect(params.unit_sog.default).toBe("kn");
    expect(params.caption_empty.default).toBe("");

    expect(shared.opt("Label", "value")).toEqual({ name: "Label", value: "value" });
  });
});
