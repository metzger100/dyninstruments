// @ts-check
const { createHtmlUtils, createMarkup, makeFit, makeModel } = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("renders passive mode without catchAll/hotspot/accent", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        captureClicks: false,
        showHotspot: false,
        hasAccent: false,
        wrapperClasses: [
          "dyni-ais-target-html",
          "dyni-ais-target-mode-normal",
          "dyni-ais-target-data",
          "dyni-ais-target-open-passive",
          "dyni-ais-target-branch-tcpa"
        ]
      }),
      fit: makeFit({ accentStyle: "" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-ais-target-open-passive");
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).not.toContain("dyni-ais-target-open-hotspot");
    expect(html).not.toContain("dyni-ais-target-state-accent");
  });
});
