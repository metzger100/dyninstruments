const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("CanvasLayerCache", function () {
  function createCache(spec) {
    const mod = loadFresh("shared/widget-kits/gauge/CanvasLayerCache.js");
    return mod.create({}, {}).createLayerCache(spec);
  }

  function createSizedCanvas(bufferW, bufferH, rectW, rectH) {
    const canvas = createMockCanvas({
      rectWidth: rectW,
      rectHeight: rectH,
      ctx: createMockContext2D()
    });
    canvas.width = bufferW;
    canvas.height = bufferH;
    return canvas;
  }

  function drawImageCalls(ctx) {
    return ctx.calls.filter(function (entry) {
      return entry.name === "drawImage";
    });
  }

  it("rebuilds on first ensure, skips same key, and rebuilds on key change", function () {
    const cache = createCache();
    const canvas = createSizedCanvas(640, 360, 320, 180);
    const rebuilt = [];

    const rebuild = function (layerCtx, layerName, layerCanvas) {
      rebuilt.push({ layerName: layerName, width: layerCanvas.width, height: layerCanvas.height, layerCtx: layerCtx });
    };

    cache.ensureLayer(canvas, { marker: "a" }, rebuild);
    cache.ensureLayer(canvas, { marker: "a" }, rebuild);
    cache.ensureLayer(canvas, { marker: "b" }, rebuild);

    expect(rebuilt).toHaveLength(2);
    expect(rebuilt[0].layerName).toBe("layer");
    expect(rebuilt[0].width).toBe(640);
    expect(rebuilt[0].height).toBe(360);
  });

  it("blits cached layers onto target context with draw-size scaling", function () {
    const cache = createCache();
    const canvas = createSizedCanvas(600, 300, 300, 150);
    const targetCtx = createMockContext2D();

    cache.ensureLayer(canvas, "k1", function () {});
    cache.blit(targetCtx);

    const calls = drawImageCalls(targetCtx);
    expect(calls).toHaveLength(1);
    expect(calls[0].args.slice(1)).toEqual([0, 0, 600, 300, 0, 0, 300, 150]);
  });

  it("forces rebuild after invalidate even when key is unchanged", function () {
    const cache = createCache();
    const canvas = createSizedCanvas(320, 180, 320, 180);
    let rebuildCount = 0;

    const rebuild = function () {
      rebuildCount += 1;
    };

    cache.ensureLayer(canvas, "k1", rebuild);
    cache.ensureLayer(canvas, "k1", rebuild);
    cache.invalidate();
    cache.ensureLayer(canvas, "k1", rebuild);

    expect(rebuildCount).toBe(2);
  });

  it("supports multi-layer rebuild and preserves layer blit order", function () {
    const cache = createCache({ layers: ["back", "front"] });
    const canvas = createSizedCanvas(500, 250, 250, 125);
    const targetCtx = createMockContext2D();
    const rebuilt = [];
    const byName = {};

    const rebuild = function (layerCtx, layerName, layerCanvas) {
      rebuilt.push(layerName);
      byName[layerName] = layerCanvas;
    };

    cache.ensureLayer(canvas, "k1", rebuild);
    cache.ensureLayer(canvas, "k1", rebuild);
    cache.ensureLayer(canvas, "k2", rebuild);
    cache.blit(targetCtx);

    expect(rebuilt).toEqual(["back", "front", "back", "front"]);
    const calls = drawImageCalls(targetCtx);
    expect(calls).toHaveLength(2);
    expect(calls[0].args[0]).toBe(byName.back);
    expect(calls[1].args[0]).toBe(byName.front);
  });

  it("rebuilds when layer buffer size changes even with the same key", function () {
    const cache = createCache();
    const canvas = createSizedCanvas(400, 200, 200, 100);
    const sizes = [];

    const rebuild = function (layerCtx, layerName, layerCanvas) {
      sizes.push([layerCanvas.width, layerCanvas.height]);
    };

    cache.ensureLayer(canvas, "same-key", rebuild);
    canvas.width = 800;
    canvas.height = 400;
    cache.ensureLayer(canvas, "same-key", rebuild);

    expect(sizes).toEqual([[400, 200], [800, 400]]);
  });
});
