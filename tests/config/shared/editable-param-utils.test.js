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
      empty: {},
      xteDisplayCog: {
        cap: "COG",
        unit: "°",
        kind: "xteDisplay",
        captionName: "Track caption",
        unitName: "Track unit"
      },
      bothGraphics: {
        cap: "W",
        unit: "u",
        kind: ["angleTrueGraphic", "angleApparentGraphic"]
      }
    });

    expect(params.caption_sog.default).toBe("SOG");
    expect(params.unit_sog.default).toBe("kn");
    expect(params.caption_empty.default).toBe("");
    expect(params.caption_xteDisplayCog.displayName).toBe("Track caption");
    expect(params.unit_xteDisplayCog.displayName).toBe("Track unit");
    expect(params.caption_xteDisplayCog.condition).toEqual({ kind: "xteDisplay" });
    expect(params.unit_xteDisplayCog.condition).toEqual({ kind: "xteDisplay" });
    expect(params.caption_bothGraphics.condition).toEqual([
      { kind: "angleTrueGraphic" },
      { kind: "angleApparentGraphic" }
    ]);
    expect(params.unit_bothGraphics.condition).toEqual([
      { kind: "angleTrueGraphic" },
      { kind: "angleApparentGraphic" }
    ]);

    expect(shared.opt("Label", "value")).toEqual({ name: "Label", value: "value" });
  });
});
