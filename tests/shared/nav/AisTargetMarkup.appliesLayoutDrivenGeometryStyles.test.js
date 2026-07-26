// @ts-check
const { createHtmlUtils, createMarkup, makeFit, makeModel } = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("applies layout-driven geometry styles for wrapper, accent, identity, metrics, and inline value rows", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;padding:4px 4px 4px 21px;"');
    expect(html).toContain(
      'class="dyni-ais-target-state-accent" style="left:4px;top:4px;bottom:4px;width:14px;background-color:#d9534a;"'
    );
    expect(html).toContain(
      'class="dyni-ais-target-identity" style="grid-template-rows:minmax(0,12px) minmax(0,10px);"'
    );
    expect(html).toContain(
      'class="dyni-ais-target-metrics" style="grid-template-columns:minmax(0,100px) minmax(0,100px);"'
    );
    expect(html).toContain(
      'class="dyni-ais-target-metric dyni-ais-target-metric-cpa" style="grid-template-columns:minmax(0,30px) minmax(0,70px);"'
    );
    expect(html).toContain(
      'class="dyni-ais-target-metric-value-row" style="grid-template-columns:minmax(0,50px) minmax(0,20px);"'
    );
  });
});
