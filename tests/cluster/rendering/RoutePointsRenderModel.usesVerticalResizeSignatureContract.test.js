// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("uses vertical resize signature contract that excludes shell height", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    const verticalA = renderModel.buildModel({
      props: withSurfacePolicy(props, {
        mode: "dispatch",
        orientation: "vertical"
      }),
      shellRect: { width: 260, height: 120 },
      isVerticalCommitted: true
    });
    const verticalB = renderModel.buildModel({
      props: withSurfacePolicy(props, {
        mode: "dispatch",
        orientation: "vertical"
      }),
      shellRect: { width: 260, height: 400 },
      isVerticalCommitted: true
    });

    const nonVerticalA = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 260, height: 120 },
      isVerticalCommitted: false
    });
    const nonVerticalB = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 260, height: 400 },
      isVerticalCommitted: false
    });

    expect(verticalA.mode).toBe("high");
    expect(verticalA.showOrdinal).toBe(false);
    expect(verticalB.showOrdinal).toBe(false);
    expect(nonVerticalA.showOrdinal).toBe(true);
    expect(verticalA.resizeSignatureParts.join("|")).toBe(verticalB.resizeSignatureParts.join("|"));
    expect(nonVerticalA.resizeSignatureParts.join("|")).not.toBe(nonVerticalB.resizeSignatureParts.join("|"));
  });

  it("changes the resize signature when moved coordinates change the row texts at the same point count", function () {
    const renderModel = createRenderModel();
    const props = makeProps();
    const movedProps = makeProps({
      domain: Object.assign({}, props.domain, {
        route: {
          name: "Harbor Run",
          points: [
            { name: "Start", lat: 54.1, lon: 10.4 },
            { name: "Mid", lat: 54.25, lon: 10.65 },
            { name: "", lat: 54.3, lon: 10.6 }
          ]
        }
      })
    });

    [false, true].forEach(function (isVerticalCommitted) {
      const shellRect = { width: 260, height: 160 };
      const before = renderModel.buildModel({
        props: withSurfacePolicy(props, { mode: "dispatch" }),
        shellRect: shellRect,
        isVerticalCommitted: isVerticalCommitted
      });
      const after = renderModel.buildModel({
        props: withSurfacePolicy(movedProps, { mode: "dispatch" }),
        shellRect: shellRect,
        isVerticalCommitted: isVerticalCommitted
      });

      expect(after.pointCount).toBe(before.pointCount);
      expect(after.points[1].infoText).not.toBe(before.points[1].infoText);
      expect(after.resizeSignatureParts.join("|")).not.toBe(before.resizeSignatureParts.join("|"));
    });
  });
});
