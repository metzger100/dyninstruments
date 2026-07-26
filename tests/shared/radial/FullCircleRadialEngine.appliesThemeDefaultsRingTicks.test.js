// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

describe("FullCircleRadialEngine", function () {
  it("applies theme defaults to ring/ticks/fixed pointer helpers", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "a" };
      },
      rebuildLayer(
        /** @type {any} */ layerCtx,
        /** @type {any} */ layerName,
        /** @type {any} */ state,
        /** @type {any} */ props,
        /** @type {any} */ api
      ) {
        api.drawFullCircleRing(layerCtx);
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
      },
      drawFrame(/** @type {any} */ state, /** @type {any} */ props, /** @type {any} */ api) {
        api.drawCachedLayer("layer");
        api.drawFixedPointer(state.ctx, 0);
      }
    });

    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 160,
      ctx: createMockContext2D()
    });
    renderer(canvas, {});
    const mode = harness.layoutApi.computeMode(320, 160, 0.8, 2.2);
    const insets = harness.layoutApi.computeInsets(320, 160);
    const layout = harness.layoutApi.computeLayout({
      W: 320,
      H: 160,
      mode: mode,
      theme: harness.theme,
      insets: insets,
      responsive: insets.responsive
    });

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.ring[0].lineWidth).toBe(layout.geom.arcLineWidth);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.ticks[0].major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth
    });
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.ticks[0].minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth
    });
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.pointer[0].fillStyle).toBe(harness.theme.colors.pointer);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.pointer[0].depth).toBe(layout.geom.fixedPointerDepth);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.pointer[0].halfWidth).toBe(Math.max(1, Math.floor(layout.geom.pointerSide / 2)));
  });

  it("scales tick lengths with compact geometry and keeps the cache key aligned", function () {
    const harness = createHarness();
    let capturedState = /** @type {any} */ (null);
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "compact" };
      },
      rebuildLayer(
        /** @type {any} */ layerCtx,
        /** @type {any} */ layerName,
        /** @type {any} */ state,
        /** @type {any} */ props,
        /** @type {any} */ api
      ) {
        capturedState = state;
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 120,
        rectHeight: 80,
        ctx: createMockContext2D()
      }),
      {}
    );

    const expectedMajorLen = capturedState.geom.majorTickLen;
    const expectedMinorLen = capturedState.geom.minorTickLen;

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.ticks[0].major.len).toBe(expectedMajorLen);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.ticks[0].minor.len).toBe(expectedMinorLen);

    const parsedStaticKey = JSON.parse(capturedState.staticKey);
    expect(parsedStaticKey.engine.majorTickLen).toBe(expectedMajorLen);
    expect(parsedStaticKey.engine.minorTickLen).toBe(expectedMinorLen);
  });
});
