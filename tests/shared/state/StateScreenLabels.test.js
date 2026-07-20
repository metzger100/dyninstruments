const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("StateScreenLabels", function () {
  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/state/StateScreenLabels.js", context);

    expect(context.DyniComponents.DyniStateScreenLabels).toBeTruthy();
    expect(context.DyniComponents.DyniStateScreenLabels.id).toBe("StateScreenLabels");
  });

  it("publishes fixed semantic labels", function () {
    const labels = loadFresh("shared/widget-kits/state/StateScreenLabels.js").create();

    expect(labels.LABELS).toEqual({
      disconnected: "GPS Lost",
      noRoute: "No Route",
      noTarget: "No Waypoint",
      noAis: "No AIS"
    });
  });

  it("publishes six canonical kinds including hidden/data", function () {
    const labels = loadFresh("shared/widget-kits/state/StateScreenLabels.js").create();

    expect(Object.values(labels.KINDS).sort()).toEqual([
      "data",
      "disconnected",
      "hidden",
      "noAis",
      "noRoute",
      "noTarget"
    ]);
  });
});
