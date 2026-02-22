const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/shared/kind-defaults.js", function () {
  it("registers expected cluster kind maps", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);

    const maps = context.DyniPlugin.config.shared.kindMaps;
    expect(maps.COURSE_KIND.hdt.cap).toBe("HDT");
    expect(maps.WIND_KIND.speedTrue.unit).toBe("kn");
    expect(maps.VESSEL_KIND.clock.cap).toBe("TIME");
    expect(maps.VESSEL_KIND.dateTime.cap).toBe("");
    expect(maps.VESSEL_KIND.timeStatus.unit).toBe("");
    expect(maps.VESSEL_KIND.pitch.unit).toBe("°");
    expect(maps.VESSEL_KIND.roll.cap).toBe("ROLL");
  });
});
