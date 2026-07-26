// @ts-check
const {
  createHtmlUtils,
  createMarkup,
  expectFlatMetricStructure,
  expectInlineMetricStructure,
  makeFit,
  makeModel,
  parseHtml
} = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("renders all four metrics and identity in all data modes", function () {
    const markup = createMarkup();

    ["flat", "normal", "high"].forEach((mode) => {
      const html = markup.render({
        model: makeModel({
          mode: mode,
          wrapperClasses: [
            "dyni-ais-target-html",
            "dyni-ais-target-mode-" + mode,
            "dyni-ais-target-data",
            "dyni-ais-target-open-dispatch",
            "dyni-ais-target-branch-brg"
          ]
        }),
        fit: makeFit(),
        htmlUtils: createHtmlUtils()
      });
      const root = parseHtml(html);

      expect(root.querySelector(".dyni-ais-target-name")).toBeTruthy();
      expect(root.querySelector(".dyni-ais-target-front")).toBeTruthy();
      if (mode === "flat") {
        ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
          expectFlatMetricStructure(root, id);
        });
      } else {
        ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
          expectInlineMetricStructure(root, id);
        });
      }
    });
  });
});
