// @ts-check
const { createHtmlUtils, createMarkup, makeFit, makeModel } = require("./AisTargetMarkup-setup");

describe("AisTargetMarkup", function () {
  it("escapes model text and applies inline styles from fit payload", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        nameText: '<img src=x onerror="1">',
        frontText: '"Front"',
        metrics: {
          dst: { captionText: "<DST>", valueText: "<4.2>", unitText: "<nm>" },
          cpa: { captionText: "<DCPA>", valueText: "<0.7>", unitText: "<nm>" },
          tcpa: {
            captionText: "<TCPA>",
            valueText: "<0.5>",
            unitText: "<min>"
          },
          brg: { captionText: "<BRG>", valueText: "<112>", unitText: "<°>" }
        }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;padding:4px 4px 4px 21px;"');
    expect(html).toContain('class="dyni-ais-target-name" style="font-size:13px;"');
    expect(html).toContain('class="dyni-ais-target-front" style="font-size:11px;"');
    expect(html).toContain('class="dyni-ais-target-metric-caption" style="font-size:8px;"');
    expect(html).toContain('class="dyni-ais-target-metric-value-row"');
    expect(html).toContain('class="dyni-ais-target-metric-value-text" style="font-size:12px;"');
    expect(html).toContain('class="dyni-ais-target-metric-unit" style="font-size:9px;"');
    expect(html).toContain("&lt;img src=x onerror=&quot;1&quot;&gt;");
    expect(html).toContain("&quot;Front&quot;");
    expect(html).toContain("&lt;DST&gt;");
    expect(html).toContain("&lt;4.2&gt;");
    expect(html).toContain("&lt;nm&gt;");
    expect(html).not.toContain('<img src=x onerror="1">');
  });
});
