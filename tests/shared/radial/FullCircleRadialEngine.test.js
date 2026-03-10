const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("FullCircleRadialEngine", function () {
  function createHarness() {
    const engineMod = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const fullCircleLayoutMod = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const responsiveScaleProfileMod = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathMod = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
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
          widthFactor: 1.216,
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
    const layoutApi = fullCircleLayoutMod.create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") return responsiveScaleProfileMod;
        if (id === "LayoutRectMath") return layoutRectMathMod;
        throw new Error("unexpected layout module: " + id);
      }
    });

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
        if (id === "FullCircleRadialLayout") {
          return fullCircleLayoutMod;
        }
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfileMod;
        }
        if (id === "LayoutRectMath") {
          return layoutRectMathMod;
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

    return { engine, calls, theme, layoutApi };
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
    expect(harness.calls.pointer[0].depth).toBe(layout.geom.needleDepth);
    expect(harness.calls.pointer[0].widthFactor).toBe(harness.theme.radial.pointer.widthFactor);
    expect(harness.calls.pointer[0].lengthFactor).toBe(harness.theme.radial.pointer.lengthFactor);
  });

  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    function captureState(specOverrides) {
      const harness = createHarness();
      let snapshot = null;
      const renderer = harness.engine.createRenderer(Object.assign({
        ratioProps: { normal: "n", flat: "f" },
        drawFrame(state) {
          snapshot = {
            mode: state.mode,
            labelFontPx: state.labels.fontPx,
            fixedPointerDepth: state.geom.fixedPointerDepth,
            textFillScale: state.textFillScale,
            compactGeometryScale: state.compactGeometryScale
          };
        }
      }, specOverrides || {}));

      renderer(createMockCanvas({ rectWidth: 225, rectHeight: 300, ctx: createMockContext2D() }), {
        n: 0.8,
        f: 2.2
      });

      return snapshot;
    }

    expect(captureState({
      ratioDefaults: { normal: 0.8, flat: 2.2 }
    })).toEqual(captureState());
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

  it("falls back to engine-owned ratio defaults when wind threshold props are absent", function () {
    function captureMode(props) {
      const harness = createHarness();
      let mode = null;
      const renderer = harness.engine.createRenderer({
        ratioProps: { normal: "windNormal", flat: "windFlat" },
        drawFrame(state) {
          mode = state.mode;
        }
      });

      renderer(createMockCanvas({ rectWidth: 225, rectHeight: 300, ctx: createMockContext2D() }), props || {});
      return mode;
    }

    expect(captureMode()).toBe("high");
    expect(captureMode({ windNormal: 0.7, windFlat: 2.0 })).toBe("normal");
  });

  it("exposes layout-owned responsive state and cache geometry to callbacks", function () {
    const harness = createHarness();
    const states = [];
    const renderer = harness.engine.createRenderer({
      cacheLayers: ["face"],
      buildStaticKey(state) {
        return { mode: state.mode };
      },
      rebuildLayer(layerCtx, layerName, state) {
        states.push({
          mode: state.mode,
          hasLayout: !!state.layout,
          hasResponsive: !!state.responsive,
          textFillScale: state.textFillScale,
          compactGeometryScale: state.compactGeometryScale,
          labelRadiusOffset: state.labels.radiusOffset,
          labelFontPx: state.labels.fontPx,
          fixedPointerDepth: state.geom.fixedPointerDepth,
          staticKey: JSON.parse(state.staticKey)
        });
      }
    });

    renderer(createMockCanvas({ rectWidth: 120, rectHeight: 80, ctx: createMockContext2D() }), {});

    expect(states).toHaveLength(1);
    expect(states[0].hasLayout).toBe(true);
    expect(states[0].hasResponsive).toBe(true);
    expect(states[0].textFillScale).toBeGreaterThan(1);
    expect(states[0].compactGeometryScale).toBeLessThan(1);
    expect(states[0].labelRadiusOffset).toBe(states[0].staticKey.engine.labelInsetVal);
    expect(states[0].labelFontPx).toBe(states[0].staticKey.engine.labelPx);
    expect(states[0].fixedPointerDepth).toBeGreaterThan(0);
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
