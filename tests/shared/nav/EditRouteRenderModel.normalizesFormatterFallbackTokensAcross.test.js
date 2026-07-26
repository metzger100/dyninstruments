// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./EditRouteRenderModel-setup");

describe("EditRouteRenderModel", function () {
  it("normalizes formatter fallback tokens to --- across edit-route metrics", function () {
    const renderModel = createRenderModel({
      // @ts-ignore -- pre-existing untyped test mock boundary
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value != null && !Number.isNaN(value)) {
          return "OK";
        }
        if (cfg.formatter === "formatDecimal") {
          return "-----";
        }
        if (cfg.formatter === "formatDistance") {
          return "    -";
        }
        if (cfg.formatter === "formatTime") {
          return "--:--:--";
        }
        if (cfg.formatter === "formatClock") {
          return "--:--";
        }
        return cfg.default;
      }
    });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasRoute: true,
            routeName: "Harbor Run",
            pointCount: undefined,
            totalDistance: undefined,
            remainingDistance: undefined,
            rteEta: undefined,
            isActiveRoute: false,
            isLocalRoute: false,
            isServerRoute: true
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.metrics.pts.valueText).toBe("---");
    expect(model.metrics.dst.valueText).toBe("---");
    expect(model.metrics.rte.valueText).toBe("---");
    expect(model.metrics.rteEta.valueText).toBe("---");
  });

  it("enables stable-digits padding for numeric edit-route metrics when configured", function () {
    const renderModel = createRenderModel({
      // @ts-ignore -- pre-existing untyped test mock boundary
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDecimal") {
          return "7.0";
        }
        if (cfg.formatter === "formatDistance") {
          return "3.4";
        }
        if (cfg.formatter === "formatTime") {
          return "12:34";
        }
        if (cfg.formatter === "formatClock") {
          return "12:34";
        }
        return value == null ? cfg.default : String(value);
      }
    });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ stableDigits: true }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.stableDigitsEnabled).toBe(true);
    expect(model.metrics.pts.valueText).toBe(" 007.0");
    expect(model.metrics.pts.plainValueText).toBe("7.0");
    expect(model.metrics.dst.valueText).toBe(" 03.4");
    expect(model.metrics.dst.plainValueText).toBe("3.4");
    expect(model.metrics.rte.valueText).toBe(" 03.4");
    expect(model.metrics.rte.plainValueText).toBe("3.4");
    expect(model.metrics.rteEta.valueText).toBe(" 12:34");
    expect(model.metrics.rteEta.plainValueText).toBe("12:34");
  });

  it("keeps stable-digits padding intact in compact normal mode", function () {
    const renderModel = createRenderModel({
      // @ts-ignore -- pre-existing untyped test mock boundary
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDecimal") {
          return "7.0";
        }
        if (cfg.formatter === "formatDistance") {
          return "3.4";
        }
        if (cfg.formatter === "formatTime") {
          return "12:34";
        }
        if (cfg.formatter === "formatClock") {
          return "12:34";
        }
        return value == null ? cfg.default : String(value);
      }
    });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ stableDigits: true }), { mode: "dispatch" }),
      shellRect: { width: 220, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("normal");
    expect(model.stableDigitsEnabled).toBe(true);
    expect(model.metrics.pts.valueText).toBe(" 007.0");
    expect(model.metrics.pts.plainValueText).toBe("7.0");
    expect(model.metrics.dst.valueText).toBe(" 03.4");
    expect(model.metrics.dst.plainValueText).toBe("3.4");
    expect(model.metrics.rte.valueText).toBe(" 03.4");
    expect(model.metrics.rte.plainValueText).toBe("3.4");
    expect(model.metrics.rteEta.valueText).toBe(" 12:34");
    expect(model.metrics.rteEta.plainValueText).toBe("12:34");
  });

  it("uses formatClock for ETA when hideSeconds is enabled", function () {
    const renderModel = createRenderModel({
      // @ts-ignore -- pre-existing untyped test mock boundary
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatClock") {
          return "CLOCK:" + String(value);
        }
        if (cfg.formatter === "formatTime") {
          return "TIME:" + String(value);
        }
        if (cfg.formatter === "formatDecimal") {
          return "DEC:" + String(value);
        }
        if (cfg.formatter === "formatDistance") {
          return "DST:" + String(value);
        }
        return value == null ? cfg.default : String(value);
      }
    });
    const rteEta = new Date("2026-03-06T11:45:00Z");
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasRoute: true,
            routeName: "Harbor Run",
            pointCount: 5,
            totalDistance: 1234.5,
            remainingDistance: 321.4,
            rteEta: rteEta,
            hideSeconds: true,
            isActiveRoute: true,
            isLocalRoute: false,
            isServerRoute: true
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.metrics.rteEta.valueText).toBe("CLOCK:" + String(rteEta));
    expect(model.metrics.rteEta.plainValueText).toBe("CLOCK:" + String(rteEta));
  });

  it("forces high mode and applies width-driven vertical shell geometry", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 210, height: 90 },
      isVerticalCommitted: true
    });

    expect(model.mode).toBe("high");
    expect(model.isVerticalCommitted).toBe(true);
    expect(model.effectiveLayoutHeight).toBe(240);
    expect(model.wrapperStyle).not.toContain("aspect-ratio:7/8;");
    expect(model.wrapperStyle).not.toContain("min-height:8em;");
  });

  it("keeps vertical resize signatures stable across host-height drift", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    const verticalA = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 240, height: 120 },
      isVerticalCommitted: true
    });
    const verticalB = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 240, height: 480 },
      isVerticalCommitted: true
    });
    const nonVerticalA = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 240, height: 120 },
      isVerticalCommitted: false
    });
    const nonVerticalB = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 240, height: 480 },
      isVerticalCommitted: false
    });

    expect(verticalA.resizeSignatureParts.join("|")).toBe(verticalB.resizeSignatureParts.join("|"));
    expect(nonVerticalA.resizeSignatureParts.join("|")).not.toBe(nonVerticalB.resizeSignatureParts.join("|"));
  });
});
