const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("FullCircleRadialEngine", function () {
  function createHarness() {
    const engineMod = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const calls = {
      ring: [],
      ticks: [],
      pointer: [],
      mode: [],
      rebuild: [],
      meta: []
    };
    const theme = {
      colors: {
        pointer: "#ff2b2b",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
      },
      radial: {
        ticks: {
          majorLen: 12,
          majorWidth: 3,
          minorLen: 5,
          minorWidth: 1.5
        },
        pointer: {
          sideFactor: 0.32,
          lengthFactor: 1.9
        },
        ring: {
          arcLineWidth: 2.4,
          widthFactor: 0.35
        },
        labels: {
          insetFactor: 2.1,
          fontFactor: 0.35
        }
      },
      font: {
        weight: 700,
        labelWeight: 650
      }
    };

    const engine = engineMod.create({}, {
      setupCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        return {
          ctx,
          W: Math.round(rect.width),
          H: Math.round(rect.height)
        };
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      resolveTextColor() {
        return "#fff";
      },
      getModule(id) {
        if (id === "CanvasLayerCache") {
          return cacheMod;
        }
        if (id !== "RadialToolkit") {
          throw new Error("unexpected module: " + id);
        }
        return {
          create() {
            return {
              draw: {
                drawRing(ctx, cx, cy, rOuter, opts) {
                  calls.ring.push(opts);
                },
                drawTicks(ctx, cx, cy, rOuter, opts) {
                  calls.ticks.push(opts);
                },
                drawPointerAtRim(ctx, cx, cy, rOuter, angle, opts) {
                  calls.pointer.push(opts);
                },
                drawLabels() {},
                drawRimMarker() {},
                drawAnnularSector() {}
              },
              text: {
                drawDisconnectOverlay() {}
              },
              value: {
                computePad(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.04));
                },
                computeGap(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.03));
                },
                computeMode(ratio, thresholdNormal, thresholdFlat) {
                  if (ratio < thresholdNormal) return "high";
                  if (ratio > thresholdFlat) return "flat";
                  return "normal";
                },
                isFiniteNumber(n) {
                  return typeof n === "number" && isFinite(n);
                }
              },
              angle: {
                degToCanvasRad(deg, cfg, rotationDeg) {
                  const d = Number(deg) + (Number(rotationDeg) || 0);
                  const norm = ((d % 360) + 360) % 360;
                  return ((norm - 90) * Math.PI) / 180;
                }
              },
              theme: {
                resolve() {
                  return theme;
                }
              }
            };
          }
        };
      }
    });

    return { engine, calls, theme };
  }

  it("applies theme defaults to ring/ticks/fixed pointer helpers", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["layer"],
      buildStaticKey() {
        return { marker: "a" };
      },
      rebuildLayer(layerCtx, layerName, state, props, api) {
        api.drawFullCircleRing(layerCtx);
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
      },
      drawFrame(state, props, api) {
        api.drawCachedLayer("layer");
        api.drawFixedPointer(state.ctx, 0);
      }
    });

    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 160, ctx: createMockContext2D() });
    renderer(canvas, {});

    expect(harness.calls.ring[0].lineWidth).toBe(harness.theme.radial.ring.arcLineWidth);
    expect(harness.calls.ticks[0].major).toEqual({
      len: harness.theme.radial.ticks.majorLen,
      width: harness.theme.radial.ticks.majorWidth
    });
    expect(harness.calls.ticks[0].minor).toEqual({
      len: harness.theme.radial.ticks.minorLen,
      width: harness.theme.radial.ticks.minorWidth
    });
    expect(harness.calls.pointer[0].fillStyle).toBe(harness.theme.colors.pointer);
    expect(harness.calls.pointer[0].sideFactor).toBe(harness.theme.radial.pointer.sideFactor);
    expect(harness.calls.pointer[0].lengthFactor).toBe(harness.theme.radial.pointer.lengthFactor);
  });

  it("routes layout mode using ratio thresholds", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 0.7, flat: 2.0 },
      drawMode: {
        high(state) { harness.calls.mode.push(state.mode); },
        normal(state) { harness.calls.mode.push(state.mode); },
        flat(state) { harness.calls.mode.push(state.mode); }
      }
    });

    renderer(createMockCanvas({ rectWidth: 90, rectHeight: 300, ctx: createMockContext2D() }), {});
    renderer(createMockCanvas({ rectWidth: 300, rectHeight: 300, ctx: createMockContext2D() }), {});
    renderer(createMockCanvas({ rectWidth: 500, rectHeight: 120, ctx: createMockContext2D() }), {});

    expect(harness.calls.mode).toEqual(["high", "normal", "flat"]);
  });

  it("rebuilds static layers only when keys or geometry change and preserves layer order", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["back", "front"],
      buildStaticKey(state, props) {
        return { style: props.style || "a" };
      },
      rebuildLayer(layerCtx, layerName, state, props, api) {
        harness.calls.rebuild.push(layerName);
      },
      drawFrame(state, props, api) {
        api.drawCachedLayer("back");
        api.drawCachedLayer("front", { rotationDeg: props.rotationDeg || 0 });
      }
    });

    const ctxA = createMockContext2D();
    const ctxB = createMockContext2D();
    const canvasA = createMockCanvas({ rectWidth: 320, rectHeight: 160, ctx: ctxA });
    const canvasB = createMockCanvas({ rectWidth: 360, rectHeight: 160, ctx: ctxB });

    renderer(canvasA, { style: "a" });
    renderer(canvasA, { style: "a", rotationDeg: 25 });
    renderer(canvasA, { style: "b" });
    renderer(canvasB, { style: "b" });

    expect(harness.calls.rebuild).toEqual([
      "back", "front",
      "back", "front",
      "back", "front"
    ]);

    const drawCallsA = ctxA.calls.filter((entry) => entry.name === "drawImage");
    expect(drawCallsA).toHaveLength(6);
    expect(ctxA.calls.some((entry) => entry.name === "rotate")).toBe(true);

    const drawCallsB = ctxB.calls.filter((entry) => entry.name === "drawImage");
    expect(drawCallsB).toHaveLength(2);
  });

  it("exposes cache metadata helpers for widget-owned sprite state", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      buildStaticKey(state, props) {
        return { variant: props.variant || "x" };
      },
      rebuildLayer(layerCtx, layerName, state, props, api) {
        api.setCacheMeta("labels:" + state.staticKey, { count: 8 });
      },
      drawFrame(state, props, api) {
        const entry = api.getCacheMeta("labels:" + state.staticKey);
        harness.calls.meta.push(entry && entry.count);
      }
    });

    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 160, ctx: createMockContext2D() });
    renderer(canvas, { variant: "x" });
    renderer(canvas, { variant: "x" });

    expect(harness.calls.meta).toEqual([8, 8]);
  });
});
