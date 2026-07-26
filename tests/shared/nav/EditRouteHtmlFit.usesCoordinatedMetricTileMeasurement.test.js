// @ts-check
const { buildModel, createHarness, extractPx } = require("./EditRouteHtmlFit-setup");

describe("EditRouteHtmlFit", function () {
  it("uses coordinated metric-tile measurement in compact normal mode and keeps stable digits fallback", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        mode: "normal",
        stableDigitsEnabled: true,
        metrics: {
          dst: {
            labelText: "DST:",
            valueText: " " + "0".repeat(120) + ".4",
            plainValueText: "12.4",
            unitText: "nm"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 120, height: 120 }
    });

    expect(h.textTileLayoutSpy.measureMetricTile).toHaveBeenCalled();
    expect(
      // @ts-ignore -- pre-existing untyped test mock boundary
      h.textTileLayoutSpy.measureMetricTile.mock.calls.some((call) => {
        const args = call[0] || {};
        return args.metric && args.metric.id === "dst" && args.rect && args.rect.w > 0 && args.rect.h > 0;
      })
    ).toBe(true);
    expect(out.metricValues.dst).toBe("12.4");
    expect(out.metrics.dst.valueStyle).not.toBe("");
    expect(out.metrics.dst.unitStyle).not.toBe("");
  });

  it("uses full value width for ETA/PTS when no unit exists", function () {
    const h = createHarness();
    ["normal", "high"].forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({
          mode: mode,
          metrics: {
            pts: { labelText: "PTS:", valueText: "123456789012" },
            dst: {
              labelText: "DST:",
              valueText: "123456789012",
              unitText: "nm"
            },
            rte: {
              labelText: "RTE:",
              valueText: "123456789012",
              unitText: "nm"
            },
            rteEta: { labelText: "ETA:", valueText: "123456789012" }
          }
        }),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 320, height: 210 }
      });

      expect(extractPx(out.metrics.rteEta.valueStyle)).toBeGreaterThan(extractPx(out.metrics.dst.valueStyle));
      expect(extractPx(out.metrics.pts.valueStyle)).toBeGreaterThan(extractPx(out.metrics.rte.valueStyle));
      expect(out.metrics.rteEta.unitStyle).toBe("");
      expect(out.metrics.pts.unitStyle).toBe("");
    });
  });
});
