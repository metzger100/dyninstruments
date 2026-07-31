// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

describe("FullCircleRadialEngine", function () {
  it("exposes layout-owned responsive state and cache geometry to callbacks", function () {
    /** @typedef {{ engine: { labelInsetVal: number, labelPx: number } }} StaticKey */
    /** @typedef {{ compactGeometryScale: number }} Layout */
    /** @typedef {{ fixedPointerDepth: number }} Geometry */
    /** @typedef {{ fontPx: number, radiusOffset: number }} Labels */
    /** @typedef {{ geom: Geometry, labels: Labels, layout: Layout, mode: string, responsive: object, staticKey: string, textFillScale: number }} RenderState */
    /** @typedef {{ compactGeometryScale: number, fixedPointerDepth: number, hasLayout: boolean, hasResponsive: boolean, labelFontPx: number, labelRadiusOffset: number, mode: string, staticKey: StaticKey, textFillScale: number }} StateSnapshot */
    const harness = createHarness();
    const states = /** @type {StateSnapshot[]} */ ([]);
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      /** @param {RenderState} state */
      buildStaticKey(state) {
        return { mode: state.mode };
      },
      /** @param {unknown} layerCtx @param {string} layerName @param {RenderState} state */
      rebuildLayer(layerCtx, layerName, state) {
        states.push({
          mode: state.mode,
          hasLayout: !!state.layout,
          hasResponsive: !!state.responsive,
          textFillScale: state.textFillScale,
          compactGeometryScale: state.layout.compactGeometryScale,
          labelRadiusOffset: state.labels.radiusOffset,
          labelFontPx: state.labels.fontPx,
          fixedPointerDepth: state.geom.fixedPointerDepth,
          staticKey: /** @type {StaticKey} */ (JSON.parse(state.staticKey))
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

    expect(states).toHaveLength(1);
    const snapshot = states[0];
    if (!snapshot) {
      throw new Error("Expected one captured responsive state.");
    }
    expect(snapshot.hasLayout).toBe(true);
    expect(snapshot.hasResponsive).toBe(true);
    expect(snapshot.textFillScale).toBeGreaterThan(1);
    expect(snapshot.compactGeometryScale).toBeLessThan(1);
    expect(snapshot.labelRadiusOffset).toBe(snapshot.staticKey.engine.labelInsetVal);
    expect(snapshot.labelFontPx).toBe(snapshot.staticKey.engine.labelPx);
    expect(snapshot.fixedPointerDepth).toBeGreaterThan(0);
  });

  it("rebuilds static layers only when keys or geometry change and preserves layer order", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["back", "front"],
      /** @param {unknown} state @param {{ style?: string }} props */
      buildStaticKey(state, props) {
        return { style: props.style || "a" };
      },
      /** @param {unknown} layerCtx @param {string} layerName @param {unknown} state @param {unknown} props @param {unknown} api */
      rebuildLayer(layerCtx, layerName, state, props, api) {
        harness.calls.rebuild.push(layerName);
      },
      /** @param {unknown} state @param {{ rotationDeg?: number }} props @param {{ drawCachedLayer: (name: string, options?: { rotationDeg: number }) => void }} api */
      drawFrame(state, props, api) {
        api.drawCachedLayer("back");
        api.drawCachedLayer("front", { rotationDeg: props.rotationDeg || 0 });
      }
    });

    const ctxA = createMockContext2D();
    const ctxB = createMockContext2D();
    const canvasA = createMockCanvas({
      rectWidth: 320,
      rectHeight: 160,
      ctx: ctxA
    });
    const canvasB = createMockCanvas({
      rectWidth: 360,
      rectHeight: 160,
      ctx: ctxB
    });

    renderer(canvasA, { style: "a" });
    renderer(canvasA, { style: "a", rotationDeg: 25 });
    renderer(canvasA, { style: "b" });
    renderer(canvasB, { style: "b" });

    expect(harness.calls.rebuild).toEqual(["back", "front", "back", "front", "back", "front"]);

    const drawCallsA = ctxA.calls.filter((/** @type {DyniTestCall} */ entry) => entry.name === "drawImage");
    expect(drawCallsA).toHaveLength(6);
    expect(ctxA.calls.some((/** @type {DyniTestCall} */ entry) => entry.name === "rotate")).toBe(true);

    const drawCallsB = ctxB.calls.filter((/** @type {DyniTestCall} */ entry) => entry.name === "drawImage");
    expect(drawCallsB).toHaveLength(2);
  });
});
