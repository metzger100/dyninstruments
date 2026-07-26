// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./AisTargetRenderModel-setup");

describe("AisTargetRenderModel", function () {
  it("normalizes formatter fallback tokens to --- across AIS metrics", function () {
    const setup = createRenderModel({
      // @ts-ignore -- pre-existing untyped test mock boundary
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDistance") {
          return "    -";
        }
        if (cfg.formatter === "formatDecimal") {
          return "-----";
        }
        if (cfg.formatter === "formatDirection") {
          return "NO DATA";
        }
        return cfg.default;
      }
    });
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), {
        pageId: "navpage",
        mode: "dispatch"
      }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.metrics.dst.valueText).toBe("---");
    expect(model.metrics.cpa.valueText).toBe("---");
    expect(model.metrics.tcpa.valueText).toBe("---");
    expect(model.metrics.brg.valueText).toBe("---");
  });

  it("keeps null and blank AIS metric payload values missing instead of coercing to zero", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            distance: null,
            cpa: "   ",
            tcpa: "",
            headingTo: undefined
          }
        }),
        { pageId: "navpage", mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.metrics.dst.valueText).toBe("---");
    expect(model.metrics.cpa.valueText).toBe("---");
    expect(model.metrics.tcpa.valueText).toBe("---");
    expect(model.metrics.brg.valueText).toBe("---");
    expect(model.metrics.dst.valueText).not.toContain("0");
    expect(model.metrics.cpa.valueText).not.toContain("0");
    expect(model.metrics.tcpa.valueText).not.toContain("0");
    expect(model.metrics.brg.valueText).not.toContain("0");
  });

  it("keeps all four metrics visible for flat, normal, and high data modes without flat-row state classes", function () {
    const setup = createRenderModel();
    ["flat", "normal", "high"].forEach((mode) => {
      const shellRect = mode === "flat" ? { width: 620, height: 120 } : { width: 280, height: 220 };
      const model = setup.renderModel.buildModel({
        props: withSurfacePolicy(makeProps({ domain: { showTcpaBranch: false, tcpa: 0 } }), {
          pageId: "navpage",
          mode: "dispatch"
        }),
        shellRect: shellRect,
        mode: mode,
        isVerticalCommitted: false
      });

      expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
      expect(model.metricVisibility).toEqual({
        dst: true,
        cpa: true,
        tcpa: true,
        brg: true
      });
      expect(model.wrapperClasses.join(" ")).not.toContain("flat-rows");
    });
  });

  it("keeps noAis state on gpspage without target identity", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false
          }
        }),
        { pageId: "gpspage", mode: "dispatch" }
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("noAis");
    expect(model.interactionState).toBe("passive");
    expect(model.captureClicks).toBe(false);
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.stateLabel).toBe("No AIS");
  });

  it("keeps hidden state outside gpspage when no target identity exists", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false
          }
        }),
        { pageId: "navpage", mode: "dispatch" }
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("hidden");
    expect(model.interactionState).toBe("passive");
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.stateLabel).toBe("");
  });
});
