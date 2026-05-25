const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./XteDisplayWidget.harness.js");
const {
  makeProps,
  fillTextValues,
} = require("./XteDisplayWidget.test-model.js");

describe("XteDisplayWidget", function () {
  it("selects flat/normal/high modes from aspect ratio", function () {
    const harness = createHarness();

    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D(),
      }),
      makeProps(),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 220,
        rectHeight: 220,
        ctx: createMockContext2D(),
      }),
      makeProps(),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 300,
        ctx: createMockContext2D(),
      }),
      makeProps(),
    );

    expect(harness.calls.modeHistory[0]).toBe("flat");
    expect(harness.calls.modeHistory[1]).toBe("normal");
    expect(harness.calls.modeHistory[2]).toBe("high");
  });

  it("passes shared theme weights and colors into static and dynamic highway calls", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeProps());
    const layout = harness.calls.layoutHistory[0];
    const expectedPrimaryDim = Math.max(
      1,
      Math.min(layout.highway.w, layout.highway.h),
    );

    expect(harness.calls.staticDraws[0].colors.pointer).toBe(
      harness.theme.colors.pointer,
    );
    expect(harness.calls.staticDraws[0].colors.alarm).toBe(
      harness.theme.colors.alarm,
    );
    expect(harness.calls.staticDraws[0].colors.roadLine).toBe("#ffffff");
    expect(harness.calls.staticDraws[0].colors.stripeLine).toBe("#ffffff");
    expect(harness.calls.staticDraws[0].primaryDim).toBe(expectedPrimaryDim);
    expect(harness.calls.staticDraws[0].strokeWeight).toBe(1);
    expect(harness.calls.dynamicDraws[0].colors.pointer).toBe(
      harness.theme.colors.pointer,
    );
    expect(harness.calls.dynamicDraws[0].colors.alarm).toBe(
      harness.theme.colors.alarm,
    );
    expect(harness.calls.dynamicDraws[0].primaryDim).toBe(expectedPrimaryDim);
    expect(harness.calls.dynamicDraws[0].strokeWeight).toBe(1);
    expect(harness.calls.dynamicDraws[0].pointerDepthWeight).toBe(1);
  });

  it("applies shared stroke and pointer weights while keeping theme colors", function () {
    const harness = createHarness({
      theme: {
        strokeWeight: 1.7,
        pointerDepthWeight: 1.35,
      },
    });
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeProps());

    expect(harness.calls.staticDraws[0].colors.pointer).toBe(
      harness.theme.colors.pointer,
    );
    expect(harness.calls.staticDraws[0].colors.roadLine).toBe("#ffffff");
    expect(harness.calls.staticDraws[0].colors.stripeLine).toBe("#ffffff");
    expect(harness.calls.staticDraws[0].strokeWeight).toBe(1.7);
    expect(harness.calls.dynamicDraws[0].strokeWeight).toBe(1.7);
    expect(harness.calls.dynamicDraws[0].pointerDepthWeight).toBe(1.35);
  });

  it("forwards invalid shared weights directly to primitives", function () {
    const harness = createHarness({
      theme: {
        strokeWeight: 0,
        pointerDepthWeight: -2,
      },
    });
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeProps());

    expect(harness.calls.staticDraws[0].colors.pointer).toBe(
      harness.theme.colors.pointer,
    );
    expect(harness.calls.staticDraws[0].colors.roadLine).toBe("#ffffff");
    expect(harness.calls.staticDraws[0].colors.stripeLine).toBe("#ffffff");
    expect(harness.calls.staticDraws[0].strokeWeight).toBe(0);
    expect(harness.calls.dynamicDraws[0].strokeWeight).toBe(0);
    expect(harness.calls.dynamicDraws[0].pointerDepthWeight).toBe(-2);
  });

  it("hides waypoint name before core metrics in constrained layouts", function () {
    const harness = createHarness();
    const narrowCtx = createMockContext2D();
    const narrowCanvas = createMockCanvas({
      rectWidth: 160,
      rectHeight: 80,
      ctx: narrowCtx,
    });

    harness.spec.renderCanvas(narrowCanvas, makeProps({ showWpName: true }));

    const fillTexts = narrowCtx.calls.filter(
      (entry) => entry.name === "fillText",
    );
    expect(fillTexts).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(4);
    expect(
      harness.calls.waypointChecks[harness.calls.waypointChecks.length - 1]
        .result,
    ).toBe(false);
  });

  it("reuses header space for metric rows in flat mode when waypoint name is disabled", function () {
    const harness = createHarness();
    const wideCanvasA = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D(),
    });
    const wideCanvasB = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(
      wideCanvasA,
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );
    harness.spec.renderCanvas(
      wideCanvasB,
      makeProps({ showWpName: false, wpName: "Fairway Buoy" }),
    );

    const layoutWithName = harness.calls.layoutHistory[0];
    const layoutWithoutName = harness.calls.layoutHistory[1];

    expect(layoutWithName.mode).toBe("flat");
    expect(layoutWithoutName.mode).toBe("flat");
    expect(layoutWithoutName.metricRects.cog.y).toBeLessThan(
      layoutWithName.metricRects.cog.y,
    );
    expect(layoutWithoutName.metricRects.cog.h).toBeGreaterThan(
      layoutWithName.metricRects.cog.h,
    );
  });

  it("uses equal two-column metric widths in high mode", function () {
    const harness = createHarness();

    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 300,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );

    const layout = harness.calls.layoutHistory[0];
    expect(layout.mode).toBe("high");
    expect(layout.metricRects.cog.w).toBe(layout.metricRects.btw.w);
    expect(layout.metricRects.xte.w).toBe(layout.metricRects.dtw.w);
    expect(layout.metricRects.xte.w).toBe(layout.metricRects.cog.w);
  });

  it("reduces top highway whitespace in flat/normal/high when waypoint name is disabled", function () {
    const harness = createHarness();

    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: false, wpName: "Fairway Buoy" }),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 220,
        rectHeight: 220,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 220,
        rectHeight: 220,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: false, wpName: "Fairway Buoy" }),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 300,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );
    harness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 300,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: false, wpName: "Fairway Buoy" }),
    );

    const flatOn = harness.calls.staticDraws[0].geom;
    const flatOff = harness.calls.staticDraws[1].geom;
    const normalOn = harness.calls.staticDraws[2].geom;
    const normalOff = harness.calls.staticDraws[3].geom;
    const highOn = harness.calls.staticDraws[4].geom;
    const highOff = harness.calls.staticDraws[5].geom;

    expect(flatOff.horizonY).toBeLessThan(flatOn.horizonY);
    expect(normalOff.horizonY).toBeLessThan(normalOn.horizonY);
    expect(highOff.horizonY).toBeLessThan(highOn.horizonY);
  });

  it("uses fixed +/-1 XTE scale for marker normalization", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 300,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.1, easing: false }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 1.0, easing: false }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2, easing: false }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2, easing: false }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2, easing: false }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2, easing: false }));

    expect(harness.calls.dynamicDraws[0].xteNormalized).toBeCloseTo(0.1, 6);
    expect(harness.calls.dynamicDraws[1].xteNormalized).toBeCloseTo(1.0, 6);
    expect(harness.calls.dynamicDraws[2].xteNormalized).toBeCloseTo(0.2, 6);
    expect(harness.calls.dynamicDraws[5].xteNormalized).toBeCloseTo(0.2, 6);
  });

});
