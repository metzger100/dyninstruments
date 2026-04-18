const { loadFresh } = require("../../helpers/load-umd");

describe("StateScreenLabels", function () {
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
