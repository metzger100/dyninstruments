const { loadFresh } = require("../../helpers/load-umd");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const {
  createCompassCachingHarness,
  makeCompassProps,
} = require("./CompassRadialWidget.caching.harness.js");

describe("CompassRadialWidget", function () {
  it("uses theme pointer color for the fixed lubber marker", function () {
    const harness = createCompassCachingHarness();
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx,
    });

    harness.spec.renderCanvas(canvas, makeCompassProps());
    const layout = harness.computeLayout(480, 110);

    expect(harness.calls.pointer[0].fillStyle).toBe(
      harness.theme.colors.pointer,
    );
    expect(harness.calls.pointer[0].depth).toBe(layout.geom.fixedPointerDepth);
    expect(harness.calls.pointer[0].halfWidth).toBe(
      Math.max(1, Math.floor(layout.geom.pointerSide / 2)),
    );
    expect(harness.calls.rimMarker[0].opts).toEqual({
      len: layout.geom.markerLen,
      width: layout.geom.markerWidth,
      strokeStyle: harness.theme.colors.pointer,
    });
    expect(harness.calls.ring[0].lineWidth).toBe(layout.geom.arcLineWidth);
    expect(harness.calls.ticks[0].major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth,
    });
    expect(harness.calls.ticks[0].minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth,
    });
  });

  it("reuses static cache when heading changes (rotation does not invalidate)", function () {
    const harness = createCompassCachingHarness();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });

    harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 12 }));
    harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 42 }));

    expect(harness.calls.ring).toHaveLength(1);
    expect(harness.calls.ticks).toHaveLength(1);
    expect(harness.calls.pointer).toHaveLength(2);
    expect(harness.calls.rimMarker).toHaveLength(2);
  });

  it("invalidates static cache on geometry/style changes", function () {
    const harness = createCompassCachingHarness();
    const canvasA = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });
    const canvasB = createMockCanvas({
      rectWidth: 520,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });
    const props = makeCompassProps();

    harness.spec.renderCanvas(canvasA, props);
    harness.spec.renderCanvas(canvasA, props);
    expect(harness.calls.ring).toHaveLength(1);

    harness.spec.renderCanvas(canvasB, props);
    expect(harness.calls.ring).toHaveLength(2);

    harness.theme.radial.ring.arcLineWidthFactor = 0.08;
    harness.spec.renderCanvas(canvasB, props);
    expect(harness.calls.ring).toHaveLength(3);
  });

  it("keeps dynamic text redraw active on static cache hits", function () {
    const harness = createCompassCachingHarness();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });
    const props = makeCompassProps();

    harness.spec.renderCanvas(canvas, props);
    const firstTextCount = harness.calls.textDraws;
    harness.spec.renderCanvas(canvas, props);

    expect(harness.calls.ring).toHaveLength(1);
    expect(harness.calls.textDraws).toBeGreaterThan(firstTextCount);
  });

  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createCompassCachingHarness();
    const canvasA = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });
    const canvasB = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(
        harness.spec.renderCanvas(canvasA, makeCompassProps({ heading: 12 })),
      ).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(
        harness.spec.renderCanvas(canvasA, makeCompassProps({ heading: 42 })),
      ).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(
        harness.spec.renderCanvas(canvasB, makeCompassProps({ heading: 42 })),
      ).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(
        harness.spec.renderCanvas(
          canvasA,
          makeCompassProps({ heading: 42, easing: false }),
        ),
      ).toBeUndefined();
    } finally {
      nowSpy.mockRestore();
    }
  });
});
