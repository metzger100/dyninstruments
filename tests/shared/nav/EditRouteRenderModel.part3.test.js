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

  it("stays passive when capability is unsupported or layout editing is active", function () {
    const renderModel = createRenderModel();

    const unsupported = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "passive" }),
      shellRect: { width: 320, height: 220 },
      isVerticalCommitted: false
    });
    const editingMode = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ editing: true }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 220 },
      isVerticalCommitted: false
    });

    expect(unsupported.canOpenEditRoute).toBe(false);
    expect(editingMode.canOpenEditRoute).toBe(false);
  });

  it("uses configured caption and DST/RTE units in formatter inputs", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          captions: {
            pts: "POINTS",
            dst: "DIST",
            rte: "LEFT",
            rteEta: "ARRIVE"
          },
          units: {
            dst: "km",
            rte: "mi"
          },
          formatUnits: {
            dst: "km",
            rte: "mi"
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.metrics.pts.labelText).toBe("POINTS:");
    expect(model.metrics.dst.labelText).toBe("DIST:");
    expect(model.metrics.rte.labelText).toBe("LEFT:");
    expect(model.metrics.rteEta.labelText).toBe("ARRIVE:");
    expect(model.metrics.dst.valueText).toBe("DST(km):1234.5");
    expect(model.metrics.rte.valueText).toBe("DST(mi):321.4");
    expect(model.metrics.dst.unitText).toBe("km");
    expect(model.metrics.rte.unitText).toBe("mi");
    expect(model.metrics.pts.hasUnit).toBe(false);
    expect(model.metrics.rteEta.hasUnit).toBe(false);
  });

  it("does not expose units for ETA/PTS and drops unit slots when DST/RTE units are empty", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          units: {
            dst: "",
            rte: ""
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.metrics.pts.hasUnit).toBe(false);
    expect(model.metrics.rteEta.hasUnit).toBe(false);
    expect(model.metrics.dst.hasUnit).toBe(false);
    expect(model.metrics.rte.hasUnit).toBe(false);
    expect(model.metrics.dst.unitText).toBe("");
    expect(model.metrics.rte.unitText).toBe("");
  });

  it("changes resize signature when caption or unit text changes", function () {
    const renderModel = createRenderModel();
    const base = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });
    const captionChanged = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          captions: {
            pts: "PTS",
            dst: "DISTANCE",
            rte: "RTE",
            rteEta: "ETA"
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });
    const unitChanged = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          units: {
            dst: "km",
            rte: "nm"
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(base.resizeSignatureParts.join("|")).not.toBe(captionChanged.resizeSignatureParts.join("|"));
    expect(base.resizeSignatureParts.join("|")).not.toBe(unitChanged.resizeSignatureParts.join("|"));
  });
});
