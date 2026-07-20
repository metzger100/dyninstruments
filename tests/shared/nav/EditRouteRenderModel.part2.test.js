// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteRenderModel", function () {
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      opts.applyFormatter ||
      function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        const defaultText = Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
        if (value == null || Number.isNaN(value)) {
          return defaultText;
        }

        if (cfg.formatter === "formatDecimal") {
          const precision = Array.isArray(cfg.formatterParameters) ? Number(cfg.formatterParameters[0]) : 0;
          const places = Number.isFinite(precision) ? Math.max(0, Math.floor(precision)) : 0;
          return Number(value).toFixed(places);
        }
        if (cfg.formatter === "formatDistance") {
          const unit = Array.isArray(cfg.formatterParameters) ? String(cfg.formatterParameters[0] || "") : "";
          return "DST(" + unit + "):" + Number(value).toFixed(1);
        }
        if (cfg.formatter === "formatTime") {
          return "TIME:" + String(value);
        }
        if (cfg.formatter === "formatClock") {
          return "CLOCK:" + String(value);
        }
        return String(value);
      };

    const componentContext = createComponentContextMock({
      modules: {
        EditRouteLayout: loadFresh("shared/widget-kits/nav/EditRouteLayout.js"),
        EditRouteLayoutMath: loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js"),
        EditRouteLayoutGeometry: loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js"),
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
        NavInteractionPolicy: loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js"),
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js")
      },
      services: {
        format: {
          applyFormatter: applyFormatter
        }
      }
    });

    return loadFresh("shared/widget-kits/nav/EditRouteRenderModel.js").create({}, componentContext);
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: {
          mode: opts.mode === "passive" ? "passive" : "dispatch"
        },
        containerOrientation: opts.orientation === "vertical" ? "vertical" : "default"
      }
    });
  }

  function makeProps(overrides) {
    return Object.assign(
      {
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: 1234.5,
          remainingDistance: 321.4,
          rteEta: "2026-03-06T11:45:00Z",
          isActiveRoute: true,
          isLocalRoute: true,
          isServerRoute: false
        },
        layout: {
          ratioThresholdNormal: 1.2,
          ratioThresholdFlat: 3.8
        },
        captions: {
          pts: "PTS",
          dst: "DST",
          rte: "RTE",
          rteEta: "ETA"
        },
        units: {
          dst: "nm",
          rte: "nm"
        },
        formatUnits: {
          dst: "nm",
          rte: "nm"
        }
      },
      overrides || {}
    );
  }

  it("normalizes formatter fallback tokens to --- across edit-route metrics", function () {
    const renderModel = createRenderModel({
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
