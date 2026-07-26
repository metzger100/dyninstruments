// @ts-check
const { buildModel, createHarness, extractPx } = require("./EditRouteHtmlFit-setup");

describe("EditRouteHtmlFit", function () {
  it("fits source badge text using its own measurement box", function () {
    const h = createHarness();
    const shortBadge = h.fit.compute({
      model: buildModel({ sourceBadgeText: "L" }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });
    const longBadge = h.fit.compute({
      model: buildModel({ sourceBadgeText: "LOCAL-ROUTE-SOURCE-BADGE" }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(extractPx(longBadge.sourceBadgeStyle)).toBeLessThan(extractPx(shortBadge.sourceBadgeStyle));
  });

  it("keeps caption and unit font sizes tied to value font size (~0.8x)", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        mode: "high",
        metrics: {
          dst: {
            labelText: "DST:",
            valueText: "12.3",
            unitText: "nm"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 260 }
    });

    const valuePx = extractPx(out.metrics.dst.valueStyle);
    const labelPx = extractPx(out.metrics.dst.labelStyle);
    const unitPx = extractPx(out.metrics.dst.unitStyle);
    const expectedSecondary = Math.max(1, Math.floor(valuePx * 0.8));

    expect(valuePx).toBeGreaterThan(0);
    expect(labelPx).toBeLessThanOrEqual(expectedSecondary);
    expect(labelPx).toBeGreaterThanOrEqual(Math.max(1, expectedSecondary - 1));
    expect(unitPx).toBeLessThanOrEqual(expectedSecondary);
    expect(unitPx).toBeGreaterThanOrEqual(Math.max(1, expectedSecondary - 1));
  });

  it("shrinks long caption/unit text safely while keeping value fit intact", function () {
    const h = createHarness();
    const shortOut = h.fit.compute({
      model: buildModel({
        metrics: {
          dst: { labelText: "DST:", unitText: "nm", valueText: "12.3" }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });
    const longOut = h.fit.compute({
      model: buildModel({
        metrics: {
          dst: {
            labelText: "REMAINING-DISTANCE-LABEL:",
            valueText: "12.3",
            unitText: "nautical-miles-long-unit"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    const longValuePx = extractPx(longOut.metrics.dst.valueStyle);
    expect(extractPx(longOut.metrics.dst.labelStyle)).toBeLessThanOrEqual(extractPx(shortOut.metrics.dst.labelStyle));
    expect(extractPx(longOut.metrics.dst.unitStyle)).toBeLessThan(extractPx(shortOut.metrics.dst.unitStyle));
    expect(extractPx(longOut.metrics.dst.valueStyle)).toBeGreaterThan(0);
    expect(extractPx(longOut.metrics.dst.valueStyle)).toBeGreaterThanOrEqual(
      Math.max(1, Math.floor(longValuePx * 0.8)) - 1
    );
  });
});
