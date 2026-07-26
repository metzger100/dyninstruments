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
});
