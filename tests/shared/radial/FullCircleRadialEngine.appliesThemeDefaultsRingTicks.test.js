// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

/** @typedef {{ lineWidth: number }} RingCallOptions */
/** @typedef {{ len: number, width: number }} TickBandOptions */
/** @typedef {{ major: TickBandOptions, minor: TickBandOptions }} TicksCallOptions */
/** @typedef {{ fillStyle: string, depth: number, halfWidth: number }} PointerCallOptions */
/**
 * @typedef {{
 *   drawFullCircleRing(targetCtx?: CanvasRenderingContext2D): void,
 *   drawFullCircleTicks(targetCtx?: CanvasRenderingContext2D, opts?: Record<string, unknown>): void,
 *   drawFixedPointer(targetCtx?: CanvasRenderingContext2D, angleDeg?: unknown, opts?: Record<string, unknown>): void,
 *   drawCachedLayer(layerName: unknown, opts?: Record<string, unknown>): void,
 *   getCacheMeta(key: unknown): unknown,
 *   setCacheMeta(key: unknown, metaValue: unknown): unknown
 * }} RadialRenderApi
 */
/**
 * @typedef {{
 *   ctx: CanvasRenderingContext2D,
 *   geom: { majorTickLen: number, minorTickLen: number, [key: string]: unknown },
 *   staticKey: string,
 *   [key: string]: unknown
 * }} RadialEngineState
 */

describe("FullCircleRadialEngine", function () {
  it("applies theme defaults to ring/ticks/fixed pointer helpers", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "a" };
      },
      rebuildLayer(
        /** @type {CanvasRenderingContext2D} */ layerCtx,
        /** @type {string} */ layerName,
        /** @type {RadialEngineState} */ state,
        /** @type {Record<string, unknown>} */ props,
        /** @type {RadialRenderApi} */ api
      ) {
        api.drawFullCircleRing(layerCtx);
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
      },
      drawFrame(
        /** @type {RadialEngineState} */ state,
        /** @type {Record<string, unknown>} */ props,
        /** @type {RadialRenderApi} */ api
      ) {
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

    const ringCall = /** @type {RingCallOptions} */ (harness.calls.ring[0]);
    const ticksCall = /** @type {TicksCallOptions} */ (harness.calls.ticks[0]);
    const pointerCall = /** @type {PointerCallOptions} */ (harness.calls.pointer[0]);

    expect(ringCall.lineWidth).toBe(layout.geom.arcLineWidth);
    expect(ticksCall.major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth
    });
    expect(ticksCall.minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth
    });
    expect(pointerCall.fillStyle).toBe(harness.theme.colors.pointer);
    expect(pointerCall.depth).toBe(layout.geom.fixedPointerDepth);
    expect(pointerCall.halfWidth).toBe(Math.max(1, Math.floor(layout.geom.pointerSide / 2)));
  });

  it("scales tick lengths with compact geometry and keeps the cache key aligned", function () {
    const harness = createHarness();
    let capturedState = /** @type {RadialEngineState | null} */ (null);
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "compact" };
      },
      rebuildLayer(
        /** @type {CanvasRenderingContext2D} */ layerCtx,
        /** @type {string} */ layerName,
        /** @type {RadialEngineState} */ state,
        /** @type {Record<string, unknown>} */ props,
        /** @type {RadialRenderApi} */ api
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

    if (!capturedState) {
      throw new Error("expected rebuildLayer to capture the engine state");
    }
    const expectedMajorLen = capturedState.geom.majorTickLen;
    const expectedMinorLen = capturedState.geom.minorTickLen;
    const ticksCall = /** @type {TicksCallOptions} */ (harness.calls.ticks[0]);

    expect(ticksCall.major.len).toBe(expectedMajorLen);
    expect(ticksCall.minor.len).toBe(expectedMinorLen);

    const parsedStaticKey = JSON.parse(capturedState.staticKey);
    expect(parsedStaticKey.engine.majorTickLen).toBe(expectedMajorLen);
    expect(parsedStaticKey.engine.minorTickLen).toBe(expectedMinorLen);
  });
});
