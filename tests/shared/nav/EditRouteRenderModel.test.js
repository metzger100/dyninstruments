const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteRenderModel", function () {
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter = opts.applyFormatter || function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      const fallback = Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
      if (value == null || Number.isNaN(value)) {
        return fallback;
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
      return String(value);
    };

    const moduleCache = Object.create(null);
    const Helpers = {
      applyFormatter: applyFormatter,
      getModule(id) {
        if (!moduleCache[id]) {
          if (id === "EditRouteLayout") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/EditRouteLayout.js");
          }
          else if (id === "EditRouteLayoutMath") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js");
          }
          else if (id === "EditRouteLayoutGeometry") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js");
          }
          else if (id === "HtmlWidgetUtils") {
            moduleCache[id] = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
          }
          else if (id === "NavInteractionPolicy") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js");
          }
          else if (id === "ResponsiveScaleProfile") {
            moduleCache[id] = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
          }
          else if (id === "LayoutRectMath") {
            moduleCache[id] = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
          }
          else {
            throw new Error("unexpected module: " + id);
          }
        }
        return moduleCache[id];
      }
    };

    return loadFresh("shared/widget-kits/nav/EditRouteRenderModel.js").create({}, Helpers);
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
    return Object.assign({
      domain: {
        hasRoute: true,
        routeName: "Harbor Run",
        pointCount: 5,
        totalDistance: 1234.5,
        remainingDistance: 321.4,
        eta: "2026-03-06T11:45:00Z",
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
        eta: "ETA"
      },
      units: {
        dst: "nm",
        rte: "nm"
      }
    }, overrides || {});
  }

  it("builds no-route state with No Route label and no metrics", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          hasRoute: false,
          routeName: "",
          pointCount: 0,
          totalDistance: undefined,
          remainingDistance: undefined,
          eta: undefined,
          isActiveRoute: false,
          isLocalRoute: false,
          isServerRoute: false
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 160 },
      isVerticalCommitted: false
    });

    expect(model.hasRoute).toBe(false);
    expect(model.nameText).toBe("No Route");
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.isLocalRoute).toBe(false);
    expect(model.isServerRoute).toBe(false);
  });

  it("keeps flat no-route wrapper geometry aligned via inline layout style", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          hasRoute: false,
          routeName: "",
          pointCount: 0,
          totalDistance: undefined,
          remainingDistance: undefined,
          eta: undefined,
          isActiveRoute: false,
          isLocalRoute: false,
          isServerRoute: false
        }
      }), { mode: "dispatch" }),
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
    expect(model.metrics.eta.labelText).toBe("ETA:");
    expect(model.metrics.dst.valueText).toBe("DST(nm):1234.5");
    expect(model.metrics.rte.valueText).toBe("DST(nm):321.4");
    expect(model.metrics.eta.valueText).toBe("TIME:2026-03-06T11:45:00Z");
    expect(model.metrics.pts.unitText).toBe("");
    expect(model.metrics.eta.unitText).toBe("");
    expect(model.metrics.dst.unitText).toBe("nm");
    expect(model.metrics.rte.unitText).toBe("nm");
    expect(model.metrics.pts.hasUnit).toBe(false);
    expect(model.metrics.eta.hasUnit).toBe(false);
    expect(model.metrics.dst.hasUnit).toBe(true);
    expect(model.metrics.rte.hasUnit).toBe(true);
  });

  it("keeps RTE and ETA placeholders in non-flat mode for inactive routes", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: 1234.5,
          remainingDistance: 321.4,
          eta: "2026-03-06T11:45:00Z",
          isActiveRoute: false,
          isLocalRoute: false,
          isServerRoute: true
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("normal");
    expect(model.visibleMetricIds).toEqual(["pts", "dst", "rte", "eta"]);
    expect(model.metrics.rte.valueText).toBe("---");
    expect(model.metrics.rte.unitText).toBe("nm");
    expect(model.metrics.eta.valueText).toBe("---");
    expect(model.metrics.eta.unitText).toBe("");
  });

  it("keeps all 4 metrics visible in flat mode", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 620, height: 120 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.visibleMetricIds).toEqual(["pts", "dst", "rte", "eta"]);
    expect(model.flatMetricRows).toBeGreaterThanOrEqual(1);
    expect(model.flatMetricColumns).toBeGreaterThanOrEqual(2);
    expect(model.wrapperStyle).toContain("grid-template-rows:minmax(0,");
    expect(model.metricsStyle).toContain("grid-template-columns:repeat(");
  });

  it("keeps RTE/ETA placeholders in flat mode for inactive routes", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: 1234.5,
          remainingDistance: 321.4,
          eta: "2026-03-06T11:45:00Z",
          isActiveRoute: false,
          isLocalRoute: false,
          isServerRoute: true
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 620, height: 120 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.visibleMetricIds).toEqual(["pts", "dst", "rte", "eta"]);
    expect(model.metrics.rte.valueText).toBe("---");
    expect(model.metrics.eta.valueText).toBe("---");
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
      props: withSurfacePolicy(makeProps({
        captions: {
          pts: "POINTS",
          dst: "DIST",
          rte: "LEFT",
          eta: "ARRIVE"
        },
        units: {
          dst: "km",
          rte: "mi"
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.metrics.pts.labelText).toBe("POINTS:");
    expect(model.metrics.dst.labelText).toBe("DIST:");
    expect(model.metrics.rte.labelText).toBe("LEFT:");
    expect(model.metrics.eta.labelText).toBe("ARRIVE:");
    expect(model.metrics.dst.valueText).toBe("DST(km):1234.5");
    expect(model.metrics.rte.valueText).toBe("DST(mi):321.4");
    expect(model.metrics.dst.unitText).toBe("km");
    expect(model.metrics.rte.unitText).toBe("mi");
    expect(model.metrics.pts.hasUnit).toBe(false);
    expect(model.metrics.eta.hasUnit).toBe(false);
  });

  it("does not expose units for ETA/PTS and drops unit slots when DST/RTE units are empty", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        units: {
          dst: "",
          rte: ""
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(model.metrics.pts.hasUnit).toBe(false);
    expect(model.metrics.eta.hasUnit).toBe(false);
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
      props: withSurfacePolicy(makeProps({
        captions: {
          pts: "PTS",
          dst: "DISTANCE",
          rte: "RTE",
          eta: "ETA"
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });
    const unitChanged = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        units: {
          dst: "km",
          rte: "nm"
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 210 },
      isVerticalCommitted: false
    });

    expect(base.resizeSignatureParts.join("|")).not.toBe(captionChanged.resizeSignatureParts.join("|"));
    expect(base.resizeSignatureParts.join("|")).not.toBe(unitChanged.resizeSignatureParts.join("|"));
  });
});
