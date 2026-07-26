// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./EditRouteRenderModel-setup");

describe("EditRouteRenderModel", function () {
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
