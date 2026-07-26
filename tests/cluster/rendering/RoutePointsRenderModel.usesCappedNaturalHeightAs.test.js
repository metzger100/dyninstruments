// @ts-check
const {
  createLayoutApi,
  createRenderModel,
  extractHeight,
  makeProps,
  withSurfacePolicy
} = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("uses capped natural height as the effective vertical layout height input", function () {
    const renderModel = createRenderModel();
    const layoutApi = createLayoutApi();
    const props = makeProps();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, {
        mode: "dispatch",
        orientation: "vertical"
      }),
      shellRect: { width: 260, height: 520 },
      isVerticalCommitted: true,
      viewportHeight: 500
    });

    const expectedHeight = model.naturalHeight.cappedHeight;
    const insets = layoutApi.computeInsets(model.shellWidth, expectedHeight);
    const contentRect = layoutApi.createContentRect(model.shellWidth, expectedHeight, insets);
    const expectedLayout = layoutApi.computeLayout({
      contentRect: contentRect,
      mode: model.mode,
      ratioThresholdNormal: model.ratioThresholdNormal,
      ratioThresholdFlat: model.ratioThresholdFlat,
      isVerticalContainer: true,
      verticalAnchorWidth: model.shellWidth,
      showHeader: model.showHeader,
      pointCount: model.pointCount,
      responsive: insets.responsive,
      trailingGutterPx: model.scrollbarGutterPx
    });

    expect(model.layoutShellHeight).toBe(expectedHeight);
    expect(model.layoutShellHeight).not.toBe(model.shellHeight);
    expect(model.inlineGeometry.wrapper.style).not.toContain("height:");
    expect(extractHeight(model.inlineGeometry.list.style)).toBe(expectedLayout.listRect.h);
  });
});
