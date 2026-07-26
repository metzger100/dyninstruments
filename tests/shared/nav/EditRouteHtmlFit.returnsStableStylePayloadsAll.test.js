// @ts-check
const { buildModel, createHarness, expectStyleFormat, extractPx } = require("./EditRouteHtmlFit-setup");

describe("EditRouteHtmlFit", function () {
  it("returns stable style payloads for all visible boxes per mode", function () {
    const h = createHarness();
    const expectedMetricsByMode = {
      flat: ["pts", "dst", "rte", "rteEta"],
      normal: ["pts", "dst", "rte", "rteEta"],
      high: ["pts", "dst", "rte", "rteEta"]
    };

    ["flat", "normal", "high"].forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({ mode: mode }),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 340, height: 190 }
      });
      const expectedIds = expectedMetricsByMode[/** @type {keyof typeof expectedMetricsByMode} */ (mode)];

      expect(out).not.toBeNull();
      expectStyleFormat(out.nameTextStyle);
      expectStyleFormat(out.sourceBadgeStyle);
      expect(Object.keys(out.metrics)).toEqual(expectedIds);
      expectedIds.forEach((/** @type {any} */ id) => {
        expectStyleFormat(out.metrics[id].labelStyle);
        expectStyleFormat(out.metrics[id].valueRowStyle);
        expectStyleFormat(out.metrics[id].valueStyle);
        expectStyleFormat(out.metrics[id].unitStyle);
      });
    });
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
  });

  it("handles missing shellRect or target element without throwing", function () {
    const h = createHarness();
    const model = buildModel();

    expect(
      h.fit.compute({
        model: model,
        targetEl: h.targetEl,
        hostContext: h.hostContext
      })
    ).toBeNull();

    expect(
      h.fit.compute({
        model: model,
        shellRect: { width: 260, height: 170 },
        hostContext: h.hostContext
      })
    ).toBeNull();
  });

  it("scales down long route names instead of truncating content", function () {
    const h = createHarness();
    const shortModel = buildModel({ nameText: "A" });
    const longName = "Extremely Long Route Name That Must Be Reduced To Fit The Name Bar";
    const longModel = buildModel({ nameText: longName });

    const shortOut = h.fit.compute({
      model: shortModel,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });
    const longOut = h.fit.compute({
      model: longModel,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(extractPx(longOut.nameTextStyle)).toBeLessThan(extractPx(shortOut.nameTextStyle));
    expect(longModel.nameText).toBe(longName);
  });
});
