// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

describe("FullCircleRadialEngine", function () {
  it("exposes layout-owned responsive state and cache geometry to callbacks", function () {
    const harness = createHarness();
    // @ts-ignore -- pre-existing untyped test mock boundary
    const states = [];
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      // @ts-ignore -- pre-existing untyped test mock boundary
      buildStaticKey(state) {
        return { mode: state.mode };
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
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
          staticKey: JSON.parse(state.staticKey)
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

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].hasLayout).toBe(true);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].hasResponsive).toBe(true);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].textFillScale).toBeGreaterThan(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].compactGeometryScale).toBeLessThan(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].labelRadiusOffset).toBe(states[0].staticKey.engine.labelInsetVal);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].labelFontPx).toBe(states[0].staticKey.engine.labelPx);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(states[0].fixedPointerDepth).toBeGreaterThan(0);
  });

  it("rebuilds static layers only when keys or geometry change and preserves layer order", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["back", "front"],
      // @ts-ignore -- pre-existing untyped test mock boundary
      buildStaticKey(state, props) {
        return { style: props.style || "a" };
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      rebuildLayer(layerCtx, layerName, state, props, api) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        harness.calls.rebuild.push(layerName);
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
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

    // @ts-ignore -- pre-existing untyped test mock boundary
    const drawCallsA = ctxA.calls.filter((entry) => entry.name === "drawImage");
    expect(drawCallsA).toHaveLength(6);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(ctxA.calls.some((entry) => entry.name === "rotate")).toBe(true);

    // @ts-ignore -- pre-existing untyped test mock boundary
    const drawCallsB = ctxB.calls.filter((entry) => entry.name === "drawImage");
    expect(drawCallsB).toHaveLength(2);
  });
});
