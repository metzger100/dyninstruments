const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("RegattaTimerPhase", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/vessel/RegattaTimerPhase.js").create();
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/vessel/RegattaTimerPhase.js", context);

    expect(context.DyniComponents.DyniRegattaTimerPhase).toBeTruthy();
    expect(context.DyniComponents.DyniRegattaTimerPhase.id).toBe("RegattaTimerPhase");
  });

  it("passes through the countdown and elapsed phases unchanged", function () {
    const phase = createApi();

    expect(phase.normalize("countdown")).toBe("countdown");
    expect(phase.normalize("elapsed")).toBe("elapsed");
  });

  it("normalizes any other value, including idle/undefined/null/garbage, to idle", function () {
    const phase = createApi();

    expect(phase.normalize("idle")).toBe("idle");
    expect(phase.normalize(undefined)).toBe("idle");
    expect(phase.normalize(null)).toBe("idle");
    expect(phase.normalize("bogus")).toBe("idle");
    expect(phase.normalize(42)).toBe("idle");
  });
});
