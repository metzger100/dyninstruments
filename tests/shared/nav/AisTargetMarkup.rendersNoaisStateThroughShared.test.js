// @ts-check
const { createHtmlUtils, createMarkup, makeFit, makeModel } = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("renders noAis state through shared state-screen markup", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        kind: "noAis",
        stateLabel: "No AIS",
        captureClicks: false,
        showHotspot: false,
        hasAccent: false,
        wrapperClasses: [
          "dyni-ais-target-html",
          "dyni-ais-target-mode-normal",
          "dyni-ais-target-open-passive",
          "dyni-ais-target-branch-tcpa"
        ],
        visibleMetricIds: []
      }),
      fit: makeFit({ accentStyle: "" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-state-no-ais");
    expect(html).toContain("dyni-state-screen-body");
    expect(html).toContain(">No AIS<");
    expect(html).not.toContain("dyni-ais-target-identity");
    expect(html).not.toContain("dyni-ais-target-metrics");
  });
});
