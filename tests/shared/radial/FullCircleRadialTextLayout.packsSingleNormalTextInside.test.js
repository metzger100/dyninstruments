// @ts-check
const {
  createComponentContextMock,
  createHarness,
  loadFresh,
  makeSingleDisplay
} = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout", function () {
  it("packs single normal text inside the layout-owned safe radius and centers the block", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(harness.calls.threeRows).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const block = harness.calls.threeRows[0];
    expect(block.x).toBe(harness.state.geom.cx - Math.floor(block.w / 2));
    expect(block.y).toBe(harness.state.geom.cy - Math.floor(block.h / 2));
    expect(block.w / 2).toBeLessThanOrEqual(harness.state.layout.normal.safeRadius);
    expect(block.h / 2).toBeLessThanOrEqual(harness.state.layout.normal.safeRadius);
  });
});
