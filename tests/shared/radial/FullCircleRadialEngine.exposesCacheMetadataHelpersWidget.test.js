// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

/** @typedef {{ variant?: string }} RendererProps */
/** @typedef {{ staticKey: string }} RendererState */
/** @typedef {{ getCacheMeta(key: string): { count: number } | undefined, setCacheMeta(key: string, metaValue: unknown): unknown }} CacheMetaApi */

describe("FullCircleRadialEngine", function () {
  it("exposes cache metadata helpers for widget-owned sprite state", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      /** @param {RendererState} state @param {RendererProps} props */
      buildStaticKey(state, props) {
        return { variant: props.variant || "x" };
      },
      /** @param {unknown} layerCtx @param {unknown} layerName @param {RendererState} state @param {RendererProps} props @param {CacheMetaApi} api */
      rebuildLayer(layerCtx, layerName, state, props, api) {
        api.setCacheMeta("labels:" + state.staticKey, { count: 8 });
      },
      /** @param {RendererState} state @param {RendererProps} props @param {CacheMetaApi} api */
      drawFrame(state, props, api) {
        const entry = api.getCacheMeta("labels:" + state.staticKey);
        harness.calls.meta.push(entry && entry.count);
      }
    });

    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 160,
      ctx: createMockContext2D()
    });
    renderer(canvas, { variant: "x" });
    renderer(canvas, { variant: "x" });

    expect(harness.calls.meta).toEqual([8, 8]);
  });

  it("renders disconnected state-screen before frame callbacks", function () {
    const harness = createHarness();
    let drawFrameCalls = 0;
    let rebuildCalls = 0;
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      rebuildLayer() {
        rebuildCalls += 1;
      },
      drawFrame() {
        drawFrameCalls += 1;
      }
    });
    const ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 160,
      ctx: ctx
    });

    renderer(canvas, { disconnect: true });

    expect(drawFrameCalls).toBe(0);
    expect(rebuildCalls).toBe(0);
    expect(ctx.calls.filter((entry) => entry.name === "fillText").map((entry) => String(entry.args[0]))).toContain(
      "GPS Lost"
    );
  });
});
