// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./EditRouteRenderModel-setup");

describe("EditRouteRenderModel", function () {
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
