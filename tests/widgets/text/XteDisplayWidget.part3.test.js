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
  it("uses provided DST unit directly without local fallback", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeProps({ units: { dtw: undefined } }));

    expect(harness.calls.valueRows[2].unit).toBe("");
  });

  it("uses dedicated track and bearing units when provided", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(
      canvas,
      makeProps({
        units: {
          track: "degT",
          brg: "degM",
        },
      }),
    );

    expect(harness.calls.valueRows[0].unit).toBe("degT");
    expect(harness.calls.valueRows[3].unit).toBe("degM");
  });

  it("uses dedicated track/bearing units directly without heading-unit fallback", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(
      canvas,
      makeProps({
        units: {
          track: undefined,
          brg: undefined,
        },
      }),
    );

    expect(harness.calls.valueRows[0].unit).toBe("");
    expect(harness.calls.valueRows[3].unit).toBe("");
  });

  it("normalizes marker placement using formatted distance magnitude", function () {
    const harness = createHarness({ distanceDivisor: 1852 });
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeProps({ xte: 1852 }));

    expect(harness.calls.dynamicDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws[0].overflow).toBe(false);
    expect(harness.calls.dynamicDraws[0].xteNormalized).toBeCloseTo(1.0, 6);
  });

  it("passes stronger compact text-fill scaling to waypoint and metric tiles", function () {
    const compactHarness = createHarness();
    const largeHarness = createHarness();

    compactHarness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 161,
        rectHeight: 80,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );
    largeHarness.spec.renderCanvas(
      createMockCanvas({
        rectWidth: 520,
        rectHeight: 260,
        ctx: createMockContext2D(),
      }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" }),
    );

    expect(compactHarness.calls.modeHistory[0]).toBe("normal");
    expect(largeHarness.calls.modeHistory[0]).toBe("normal");
    expect(compactHarness.calls.waypointTextFillScales[0]).toBeGreaterThan(
      largeHarness.calls.waypointTextFillScales[0],
    );
    expect(compactHarness.calls.metricTextFillScales[0]).toBeGreaterThan(
      largeHarness.calls.metricTextFillScales[0],
    );
  });

  it("keeps XTE side suffix alignment for R/L and preserves an empty slot at zero", function () {
    function renderXteValue(xte) {
      const harness = createHarness();
      harness.spec.renderCanvas(
        createMockCanvas({
          rectWidth: 520,
          rectHeight: 260,
          ctx: createMockContext2D(),
        }),
        makeProps({ stableDigits: true, xte: xte }),
      );
      return harness.calls.valueRows[1].value;
    }

    const rightValue = renderXteValue(0.25);
    const leftValue = renderXteValue(-0.25);
    const zeroValue = renderXteValue(0);

    expect(rightValue.endsWith("R")).toBe(true);
    expect(leftValue.endsWith("L")).toBe(true);
    expect(/[RL]$/.test(zeroValue)).toBe(false);
    expect(rightValue.length).toBe(leftValue.length);
    expect(rightValue.length).toBe(zeroValue.length);
  });

  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createHarness();
    const canvasA = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });
    const canvasB = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D(),
    });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(
        harness.spec.renderCanvas(canvasA, makeProps({ xte: 0.25 })),
      ).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(
        harness.spec.renderCanvas(canvasA, makeProps({ xte: 1.25 })),
      ).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(
        harness.spec.renderCanvas(canvasB, makeProps({ xte: 1.25 })),
      ).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(
        harness.spec.renderCanvas(
          canvasA,
          makeProps({ xte: 1.25, easing: false }),
        ),
      ).toBeUndefined();
    } finally {
      nowSpy.mockRestore();
    }
  });
});
