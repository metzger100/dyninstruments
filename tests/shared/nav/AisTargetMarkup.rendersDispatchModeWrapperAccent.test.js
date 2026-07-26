// @ts-check
const {
  createHtmlUtils,
  createMarkup,
  expectInlineMetricStructure,
  makeFit,
  makeModel,
  parseHtml
} = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("renders dispatch-mode wrapper, accent, hotspot, and ordered metric tiles", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html);

    expect(html).toContain(
      'class="dyni-ais-target-html dyni-ais-target-mode-normal dyni-ais-target-data dyni-ais-target-open-dispatch dyni-ais-target-branch-tcpa dyni-ais-target-color-warning"'
    );
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).toContain('class="dyni-ais-target-open-hotspot"');
    expect(html).toContain(
      'class="dyni-ais-target-state-accent" style="left:4px;top:4px;bottom:4px;width:14px;background-color:#d9534a;"'
    );
    expect(root.querySelector(".dyni-ais-target-name")).toBeTruthy();
    expect(root.querySelector(".dyni-ais-target-front")).toBeTruthy();

    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectInlineMetricStructure(root, id);
    });

    const dstIndex = html.indexOf("dyni-ais-target-metric-dst");
    const cpaIndex = html.indexOf("dyni-ais-target-metric-cpa");
    const tcpaIndex = html.indexOf("dyni-ais-target-metric-tcpa");
    const brgIndex = html.indexOf("dyni-ais-target-metric-brg");
    expect(dstIndex).toBeGreaterThan(-1);
    expect(cpaIndex).toBeGreaterThan(dstIndex);
    expect(tcpaIndex).toBeGreaterThan(cpaIndex);
    expect(brgIndex).toBeGreaterThan(tcpaIndex);
  });
});
