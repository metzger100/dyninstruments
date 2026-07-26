// @ts-check
const {
  createComponentContextMock,
  createHarness,
  loadFresh,
  makeDualDisplay
} = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout", function () {
  it("packs dual normal text with a theme-driven column gap and mirrored alignment", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "normal", display.left, display.right);

    expect(harness.calls.threeRows).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const leftBlock = harness.calls.threeRows[0];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const rightBlock = harness.calls.threeRows[1];
    const expectedGap = Math.max(1, Math.floor(harness.state.geom.R * 0.05));

    expect(rightBlock.x - (leftBlock.x + leftBlock.w)).toBe(expectedGap);
    expect(leftBlock.align).toBe("right");
    expect(rightBlock.align).toBe("left");
  });
});
