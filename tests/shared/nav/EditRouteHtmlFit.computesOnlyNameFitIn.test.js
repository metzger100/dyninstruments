// @ts-check
const { buildModel, createHarness, expectStyleFormat } = require("./EditRouteHtmlFit-setup");

describe("EditRouteHtmlFit", function () {
  it("computes only name fit in no-route state", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        hasRoute: false,
        isLocalRoute: false,
        sourceBadgeText: "LOCAL"
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(out).not.toBeNull();
    expectStyleFormat(out.nameTextStyle);
    expect(out.sourceBadgeStyle).toBe("");
    expect(Object.keys(out.metrics)).toEqual([]);
  });

  it("switches to metric fallback text when padded stable-digits value is trimmed", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        mode: "high",
        stableDigitsEnabled: true,
        metrics: {
          dst: {
            labelText: "DST:",
            valueText: " " + "0".repeat(400) + ".0",
            plainValueText: "123.4",
            unitText: "nm"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 120, height: 120 }
    });

    expect(out.metricValues.dst).toBe("123.4");
  });
});
