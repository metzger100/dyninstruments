const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteRenderModel", function () {
  /** @param {any} [options] */
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      opts.applyFormatter ||
      function (/** @type {any} */ value, /** @type {any} */ formatterOptions) {
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

  /** @param {any} props @param {any} [options] */
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

  /** @param {any} [overrides] */
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

  it("builds no-route state-screen model with passive interaction and no metrics", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasRoute: false,
            routeName: "",
            pointCount: 0,
            totalDistance: undefined,
            remainingDistance: undefined,
            rteEta: undefined,
            isActiveRoute: false,
            isLocalRoute: false,
            isServerRoute: false
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 160 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("noRoute");
    expect(model.stateLabel).toBe("No Route");
    expect(model.hasRoute).toBe(false);
    expect(model.nameText).toBe("");
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.interactionState).toBe("passive");
    expect(model.canOpenEditRoute).toBe(false);
    expect(model.isLocalRoute).toBe(false);
    expect(model.isServerRoute).toBe(false);
  });

  it("classifies disconnected state-screen from raw disconnect signal", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: {
            hasRoute: true,
            routeName: "Harbor Run",
            pointCount: 5,
            totalDistance: 1234.5,
            remainingDistance: 321.4,
            rteEta: "2026-03-06T11:45:00Z",
            isActiveRoute: true,
            isLocalRoute: false,
            isServerRoute: true
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 160 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("disconnected");
    expect(model.stateLabel).toBe("GPS Lost");
    expect(model.hasRoute).toBe(false);
    expect(model.interactionState).toBe("passive");
    expect(model.canOpenEditRoute).toBe(false);
    expect(model.visibleMetricIds).toEqual([]);
  });

  it("keeps flat no-route wrapper geometry aligned via inline layout style", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasRoute: false,
            routeName: "",
            pointCount: 0,
            totalDistance: undefined,
            remainingDistance: undefined,
            rteEta: undefined,
            isActiveRoute: false,
            isLocalRoute: false,
            isServerRoute: false
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 620, height: 120 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.wrapperStyle).toContain('grid-template-areas:"name";');
    expect(model.wrapperStyle).toContain("padding:");
    expect(model.metricsStyle).toBe("");
  });

  it("formats route metrics and exposes dispatch click state when capability allows it", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.hasRoute).toBe(true);
    expect(model.canOpenEditRoute).toBe(true);
    expect(model.captureClicks).toBe(true);
    expect(model.metrics.pts.valueText).toBe("5.000");
    expect(model.metrics.pts.labelText).toBe("PTS:");
    expect(model.metrics.dst.labelText).toBe("DST:");
    expect(model.metrics.rte.labelText).toBe("RTE:");
    expect(model.metrics.rteEta.labelText).toBe("ETA:");
    expect(model.metrics.dst.valueText).toBe("DST(nm):1234.5");
    expect(model.metrics.rte.valueText).toBe("DST(nm):321.4");
    expect(model.metrics.rteEta.valueText).toBe("TIME:2026-03-06T11:45:00Z");
    expect(model.metrics.pts.unitText).toBe("");
    expect(model.metrics.rteEta.unitText).toBe("");
    expect(model.metrics.dst.unitText).toBe("nm");
    expect(model.metrics.rte.unitText).toBe("nm");
    expect(model.metrics.pts.hasUnit).toBe(false);
    expect(model.metrics.rteEta.hasUnit).toBe(false);
    expect(model.metrics.dst.hasUnit).toBe(true);
    expect(model.metrics.rte.hasUnit).toBe(true);
  });

  it("keeps RTE and ETA placeholders in non-flat mode for inactive routes", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasRoute: true,
            routeName: "Harbor Run",
            pointCount: 5,
            totalDistance: 1234.5,
            remainingDistance: 321.4,
            rteEta: "2026-03-06T11:45:00Z",
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

    expect(model.mode).toBe("normal");
    expect(model.visibleMetricIds).toEqual(["pts", "dst", "rte", "rteEta"]);
    expect(model.metrics.rte.valueText).toBe("---");
    expect(model.metrics.rte.unitText).toBe("nm");
    expect(model.metrics.rteEta.valueText).toBe("---");
    expect(model.metrics.rteEta.unitText).toBe("");
  });

  it("keeps all 4 metrics visible in flat mode", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 620, height: 120 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.visibleMetricIds).toEqual(["pts", "dst", "rte", "rteEta"]);
    expect(model.flatMetricRows).toBeGreaterThanOrEqual(1);
    expect(model.flatMetricColumns).toBeGreaterThanOrEqual(2);
    expect(model.wrapperStyle).toContain("grid-template-rows:minmax(0,");
    expect(model.metricsStyle).toContain("grid-template-columns:repeat(");
  });

  it("keeps RTE/ETA placeholders in flat mode for inactive routes", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasRoute: true,
            routeName: "Harbor Run",
            pointCount: 5,
            totalDistance: 1234.5,
            remainingDistance: 321.4,
            rteEta: "2026-03-06T11:45:00Z",
            isActiveRoute: false,
            isLocalRoute: false,
            isServerRoute: true
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 620, height: 120 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.visibleMetricIds).toEqual(["pts", "dst", "rte", "rteEta"]);
    expect(model.metrics.rte.valueText).toBe("---");
    expect(model.metrics.rteEta.valueText).toBe("---");
  });
});
