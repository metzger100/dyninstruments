// @ts-check
const {
  createComponentContextMock,
  createHarness,
  loadFresh,
  makeSingleDisplay
} = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout", function () {
  it("boosts compact text occupancy while keeping layout geometry fixed", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const large = createHarness({ textFillScale: 1 });
    const compact = createHarness({ textFillScale: 1.18 });
    const display = makeSingleDisplay();

    layout.drawSingleModeText(large.state, "normal", display);
    layout.drawSingleModeText(compact.state, "normal", display);

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(compact.calls.threeRows[0].sizes.vPx).toBeGreaterThan(large.calls.threeRows[0].sizes.vPx);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(compact.calls.threeRows[0].sizes.cPx).toBeGreaterThan(large.calls.threeRows[0].sizes.cPx);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(compact.calls.threeRows[0].w).toBe(large.calls.threeRows[0].w);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(compact.calls.threeRows[0].h).toBe(large.calls.threeRows[0].h);
  });
});
