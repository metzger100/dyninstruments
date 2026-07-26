// @ts-check
const {
  createComponentContextMock,
  createHarness,
  loadFresh,
  makeDualDisplay
} = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout", function () {
  it("applies full-circle normal layout token overrides deterministically", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const base = createHarness();
    const override = createHarness({
      theme: {
        radial: {
          fullCircle: {
            normal: {
              innerMarginFactor: 0.1,
              minHeightFactor: 0.6,
              dualGapFactor: 0.12
            }
          }
        }
      }
    });
    const display = makeDualDisplay();

    layout.drawDualModeText(base.state, "normal", display.left, display.right);
    layout.drawDualModeText(override.state, "normal", display.left, display.right);

    // @ts-ignore -- pre-existing untyped test mock boundary
    const baseLeft = base.calls.threeRows[0];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const baseRight = base.calls.threeRows[1];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const overrideLeft = override.calls.threeRows[0];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const overrideRight = override.calls.threeRows[1];

    expect(overrideRight.x - (overrideLeft.x + overrideLeft.w)).toBe(
      Math.max(1, Math.floor(override.state.geom.R * 0.12))
    );
    expect(overrideRight.x - (overrideLeft.x + overrideLeft.w)).toBeGreaterThan(
      baseRight.x - (baseLeft.x + baseLeft.w)
    );
    expect(overrideLeft.w).toBeLessThan(baseLeft.w);
    expect(overrideLeft.h).toBeGreaterThan(baseLeft.h);
  });
});
