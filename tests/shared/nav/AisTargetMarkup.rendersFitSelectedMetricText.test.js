// @ts-check
const { createHtmlUtils, createMarkup, makeFit, makeModel, parseHtml } = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("renders the fit-selected metric text when a fallback value is chosen", function () {
    const markup = createMarkup();
    const model = makeModel();
    model.metrics = Object.assign({}, model.metrics, {
      dst: { captionText: "DST", valueText: "04.2", unitText: "nm" }
    });
    const html = markup.render({
      model: model,
      fit: makeFit({
        metrics: {
          dst: { valueText: "4.2" }
        }
      }),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html);

    const valueTextEl = root.querySelector(".dyni-ais-target-metric-dst .dyni-ais-target-metric-value-text");
    if (!valueTextEl) {
      throw new Error("value text element is missing");
    }
    expect(valueTextEl.textContent).toBe("4.2");
  });
});
