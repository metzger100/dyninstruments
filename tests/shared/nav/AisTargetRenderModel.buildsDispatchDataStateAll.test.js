// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./AisTargetRenderModel-setup");

describe("AisTargetRenderModel", function () {
  it("builds dispatch data state with all metrics and formatter output", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), {
        pageId: "navpage",
        mode: "dispatch"
      }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("data");
    expect(model.interactionState).toBe("dispatch");
    expect(model.captureClicks).toBe(true);
    expect(model.showHotspot).toBe(true);
    expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(model.metricVisibility).toEqual({
      dst: true,
      cpa: true,
      tcpa: true,
      brg: true
    });
    expect(model.wrapperClasses).toContain("dyni-ais-target-open-dispatch");
    expect(model.wrapperClasses).toContain("dyni-ais-target-branch-tcpa");
    expect(model.wrapperClasses).toContain("dyni-ais-target-color-warning");
    expect(model.inlineGeometry.wrapperStyle).toContain("grid-template-areas");
    expect(model.inlineGeometry.metricStyles.cpa.valueRowStyle).toContain("grid-template-columns:");
    expect(model.layout.accentRect).toBeTruthy();
    expect(model.layout.insets.accentReserve).toBeGreaterThan(0);
    expect(model.layout.accentRect.w).toBeGreaterThanOrEqual(14);
    expect(model.layout.insets.identityGap).toBeGreaterThanOrEqual(model.layout.insets.metricGridGap);
    expect(Math.abs(model.layout.nameRect.h - model.layout.frontRect.h)).toBeLessThanOrEqual(1);
    expect(model.layout.metricBoxes.dst.unitRect.w / model.layout.metricBoxes.dst.valueRect.w).toBeGreaterThan(0.24);
    expect(Object.prototype.hasOwnProperty.call(model, "frontInitialText")).toBe(false);
    expect(model.metrics.dst.valueText).toBe("formatDistance|4.2|nm");
    expect(model.metrics.cpa.valueText).toBe("formatDistance|0.7|nm");
    expect(model.metrics.tcpa.valueText).toBe("formatDecimal|0.5|3,2");
    expect(model.metrics.brg.valueText).toBe("formatDirection|112|");
    expect(setup.applyFormatter).toHaveBeenCalledWith(
      0.5,
      expect.objectContaining({
        formatter: "formatDecimal",
        formatterParameters: [3, 2]
      })
    );
  });

  it("pads metric values and exposes plain values when stableDigits is enabled", function () {
    const setup = createRenderModel({
      /** @param {any} value @param {any} formatterOptions */
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null || Number.isNaN(value)) {
          return Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
        }
        return String(value);
      }
    });
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ stableDigits: true }), {
        pageId: "navpage",
        mode: "dispatch"
      }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.stableDigitsEnabled).toBe(true);
    expect(model.metrics.dst.valueText).toBe("04.2");
    expect(model.metrics.dst.plainValueText).toBe("4.2");
    expect(model.metrics.cpa.valueText).toBe("00.7");
    expect(model.metrics.cpa.plainValueText).toBe("0.7");
    expect(model.metrics.brg.valueText).toBe("112");
    expect(model.metrics.brg.plainValueText).toBe("112");
  });

  it("keeps full identity text and all four metrics in flat BRG branch mode", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            showTcpaBranch: false,
            tcpa: 0,
            nameOrMmsi: "Athena",
            frontText: "Back"
          }
        }),
        { pageId: "navpage", mode: "dispatch" }
      ),
      shellRect: { width: 620, height: 120 },
      mode: "flat",
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(model.metricVisibility).toEqual({
      dst: true,
      cpa: true,
      tcpa: true,
      brg: true
    });
    expect(model.nameText).toBe("Athena");
    expect(model.frontText).toBe("Back");
    expect(model.wrapperClasses).toContain("dyni-ais-target-branch-brg");
    expect(model.wrapperClasses.join(" ")).not.toContain("flat-rows");
  });
});
