const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("SemicircleRadialEngine", function () {
  const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");

  function createValueMath() {
    const valueMod = loadFresh("shared/widget-kits/radial/RadialValueMath.js");
    const baseValueMod = loadFresh("shared/widget-kits/value/ValueMath.js");
    const angleMod = loadFresh("shared/widget-kits/radial/RadialAngleMath.js");
    return valueMod.create({}, createComponentContextMock({
      modules: {
        ValueMath: baseValueMod,
        RadialAngleMath: angleMod
      }
    }));
  }

  function createLayoutModule() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js").create({}, createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        GeometryScale: geometryScale
      }
    }));
  }

  function makeBaseSpec() {
    return {
      rawValueKey: "speed",
      unitDefault: "kn",
      rangeDefaults: { min: 0, max: 30 },
      ratioProps: {
        normal: "speedRadialRatioThresholdNormal",
        flat: "speedRadialRatioThresholdFlat"
      },
      hideTextualMetricsProp: "speedRadialHideTextualMetrics",
      ratioDefaults: { normal: 1.1, flat: 3.5 },
      tickSteps() {
        return { major: 10, minor: 2 };
      },
      formatDisplay(raw) {
        const n = Number(raw);
        return { num: n, text: String(n.toFixed(1)) };
      },
      buildSectors() {
        return [];
      }
    };
  }

  function makeThemeDefaults(overrides) {
    const extra = overrides || {};
    const radial = extra.radial || {};
    return {
      surface: Object.assign({ fg: "#fff" }, extra.surface || {}),
      colors: Object.assign({
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#FA584A",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
      }, extra.colors || {}),
      font: Object.assign({
        family: "sans-serif",
        weight: 710,
        labelWeight: 680
      }, extra.font || {}),
      strokeWeight: extra.strokeWeight != null ? extra.strokeWeight : 1,
      pointerDepthWeight: extra.pointerDepthWeight != null ? extra.pointerDepthWeight : 1,
      pointerSideWeight: extra.pointerSideWeight != null ? extra.pointerSideWeight : 1,
      radial: {
        ticks: Object.assign({
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01
        }, radial.ticks || {}),
        pointer: Object.assign({
          depthFactor: 0.22,
          sideFactor: 0.11
        }, radial.pointer || {}),
        ring: Object.assign({
          arcLineWidthFactor: 0.013,
          widthFactor: 0.18
        }, radial.ring || {}),
        labels: Object.assign({
          insetFactor: 2.2,
          fontFactor: 0.2
        }, radial.labels || {})
      }
    };
  }

  function makeComponentContext(modules) {
    const fallbackAngleMath = loadFresh("shared/widget-kits/radial/RadialAngleMath.js")
      .create({}, createComponentContextMock());

    function withCanonicalThemeTokens(toolkit) {
      if (!toolkit || typeof toolkit.create !== "function") {
        return toolkit;
      }
      return {
        create(def, componentContext) {
          const created = toolkit.create(def, componentContext);
          if (!created || !created.theme || typeof created.theme.resolveForRoot !== "function") {
            return created;
          }
          const originalResolveForRoot = created.theme.resolveForRoot;
          created.theme.resolveForRoot = function (rootEl) {
            const resolved = originalResolveForRoot(rootEl);
            if (!resolved.surface || typeof resolved.surface !== "object") {
              resolved.surface = { fg: "#fff" };
            } else if (!resolved.surface.fg) {
              resolved.surface.fg = "#fff";
            }
            if (!resolved.font || typeof resolved.font !== "object") {
              resolved.font = { family: "sans-serif", weight: 700, labelWeight: 700 };
            } else if (!resolved.font.family) {
              resolved.font.family = "sans-serif";
            }
            return resolved;
          };
          if (!created.angle) {
            created.angle = fallbackAngleMath;
          }
          return created;
        }
      };
    }

    return createComponentContextMock({
      modules: Object.assign({}, modules, {
        CanvasLayerCache: {
          create() {
            return {
              createLayerCache() {
                return {
                  ensureLayer(canvas, _key, rebuild) {
                    rebuild(canvas.getContext("2d"), "base", canvas);
                  },
                  blit() {}
                };
              }
            };
          }
        },
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        RadialToolkit: withCanonicalThemeTokens(modules.RadialToolkit)
      }),
      services: {
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return {
              ctx,
              W: Math.round(rect.width),
              H: Math.round(rect.height)
            };
          }
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          }
        }
      }
    });
  }

  function createRenderOrderHarness(sectorList) {
    const sequence = [];
    const arcRingCalls = [];
    const pointerCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const buildSectorsCalls = [];
    const themeDefaults = makeThemeDefaults();
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });
    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: { resolveForRoot: resolveTheme },
          text: {
            drawDisconnectOverlay() {}
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing(ctx, cx, cy, rOuter, startDeg, endDeg, opts) {
              sequence.push("ring");
              arcRingCalls.push(opts);
            },
            drawAnnularSector(ctx, cx, cy, rOuter, opts) {
              sequence.push("sector");
            },
            drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
              sequence.push("pointer");
              pointerCalls.push(opts);
            },
            drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
              sequence.push("ticks");
              tickCalls.push(opts);
            },
            drawLabels(ctx, cx, cy, rOuter, opts) {
              sequence.push("labels");
              labelCalls.push(opts);
            }
          }
        };
      }
    };
    const textLayoutCalls = [];
    const modules = {
      RadialToolkit: gaugeToolkit,
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText(state, display) {
              textLayoutCalls.push({ state, display });
            }
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer({
        ...makeBaseSpec(),
        buildSectors(props, minV, maxV, arc, valueUtils, theme) {
          buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
          return sectorList;
        }
      });

    return {
      renderer,
      sequence,
      arcRingCalls,
      pointerCalls,
      tickCalls,
      labelCalls,
      buildSectorsCalls,
      textLayoutCalls,
      resolveTheme,
      themeDefaults
    };
  }

  it("resolves theme once and applies tokenized geometry and label metrics from the layout owner", function () {
    const pointerCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const arcRingCalls = [];
    const buildSectorsCalls = [];
    const themeDefaults = makeThemeDefaults();
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });
    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: { resolveForRoot: resolveTheme },
          text: {
            drawDisconnectOverlay() {}
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing(ctx, cx, cy, rOuter, startDeg, endDeg, opts) {
              arcRingCalls.push(opts);
            },
            drawAnnularSector() {},
            drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
              pointerCalls.push(opts);
            },
            drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
              tickCalls.push(opts);
            },
            drawLabels(ctx, cx, cy, rOuter, opts) {
              labelCalls.push(opts);
            }
          }
        };
      }
    };
    const textLayoutCalls = [];
    const modules = {
      RadialToolkit: gaugeToolkit,
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText(state, display) {
              textLayoutCalls.push({ state, display });
            }
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const helpers = makeComponentContext(modules);
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, helpers)
      .createRenderer({
        ...makeBaseSpec(),
        buildSectors(props, minV, maxV, arc, valueUtils, theme) {
          buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
          return [];
        }
      });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    const layoutApi = createLayoutModule();
    const insets = layoutApi.computeInsets(480, 110);
    const expectedLayout = layoutApi.computeLayout({
      W: 480,
      H: 110,
      mode: "flat",
      theme: themeDefaults,
      insets: insets,
      responsive: insets.responsive
    });

    expect(resolveTheme).toHaveBeenCalledTimes(1);
    expect(resolveTheme).toHaveBeenCalledWith(canvas);
    expect(buildSectorsCalls[0].theme).toBe(themeDefaults);
    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    expect(pointerCalls[0].depth).toBe(expectedLayout.geom.pointerDepth);
    expect(pointerCalls[0].halfWidth).toBe(Math.max(1, Math.floor(expectedLayout.geom.pointerSide / 2)));
    expect(arcRingCalls[0].lineWidth).toBe(expectedLayout.geom.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: expectedLayout.geom.majorTickLen,
      width: expectedLayout.geom.majorTickWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: expectedLayout.geom.minorTickLen,
      width: expectedLayout.geom.minorTickWidth
    });
    expect(labelCalls[0].radiusOffset).toBe(expectedLayout.labels.radiusOffset);
    expect(labelCalls[0].fontPx).toBe(expectedLayout.labels.fontPx);
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);
    expect(textLayoutCalls).toHaveLength(1);
    expect(textLayoutCalls[0].state.layout.mode).toBe("flat");
  });

  it("renders with ValueMath on RadialToolkit.value without requiring RadialValueMath methods", function () {
    const pointerCalls = [];
    const tickCalls = [];
    const baseValueMath = loadFresh("shared/widget-kits/value/ValueMath.js")
      .create({}, createComponentContextMock());
    const angleMath = loadFresh("shared/widget-kits/radial/RadialAngleMath.js")
      .create({}, createComponentContextMock());
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults();
              }
            },
            text: {
              drawDisconnectOverlay() {}
            },
            value: baseValueMath,
            angle: angleMath,
            draw: {
              drawArcRing() {},
              drawAnnularSector() {},
              drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
                pointerCalls.push(opts);
              },
              drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
                tickCalls.push(opts);
              },
              drawLabels() {}
            }
          };
        }
      },
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText() {}
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(makeBaseSpec());

    renderer(createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    }), {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    expect(pointerCalls).toHaveLength(1);
    expect(tickCalls).toHaveLength(1);
  });

  it("uses placeholder text for missing input on the default formatDisplay fallback", function () {
    const textLayoutCalls = [];
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults();
              }
            },
            text: {
              drawDisconnectOverlay() {}
            },
            value: createValueMath(),
            draw: {
              drawArcRing() {},
              drawAnnularSector() {},
              drawPointerAtRim() {},
              drawTicksFromAngles() {},
              drawLabels() {}
            }
          };
        }
      },
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText(state, display) {
              textLayoutCalls.push({ state, display });
            }
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer({
        rawValueKey: "speed",
        unitDefault: "kn",
        rangeDefaults: { min: 0, max: 30 },
        ratioProps: {
          normal: "speedRadialRatioThresholdNormal",
          flat: "speedRadialRatioThresholdFlat"
        },
        hideTextualMetricsProp: "speedRadialHideTextualMetrics",
        ratioDefaults: { normal: 1.1, flat: 3.5 },
        tickSteps() {
          return { major: 10, minor: 2 };
        },
        buildSectors() {
          return [];
        }
      });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    [null, undefined, "", "   "].forEach(function (rawSpeed) {
      renderer(canvas, {
        speed: rawSpeed,
        default: "---",
        caption: "SPD",
        unit: "kn"
      });

      expect(textLayoutCalls.length).toBeGreaterThan(0);
      expect(textLayoutCalls[textLayoutCalls.length - 1].display.valueText).toBe("---");
    });

    renderer(canvas, {
      speed: "4.2",
      default: "---",
      caption: "SPD",
      unit: "kn"
    });
    expect(textLayoutCalls.length).toBeGreaterThan(0);
    expect(textLayoutCalls[textLayoutCalls.length - 1].display.valueText).toBe("4.2");
  });

  it("skips the semicircle text draw step when hideTextualMetrics is enabled", function () {
    const harness = createRenderOrderHarness([]);
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    harness.renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn",
      speedRadialHideTextualMetrics: true
    });

    expect(harness.textLayoutCalls).toHaveLength(0);
    expect(harness.sequence).toEqual(["ring", "ticks", "labels", "pointer"]);
  });

  it("draws sectors before the arc ring and keeps the pointer above ticks and labels", function () {
    const harness = createRenderOrderHarness([
      {
        a0: 20,
        a1: 40,
        color: "#e7c66a"
      }
    ]);
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    harness.renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    const sectorIndex = harness.sequence.indexOf("sector");
    const ringIndex = harness.sequence.indexOf("ring");
    const pointerIndex = harness.sequence.indexOf("pointer");
    const ticksIndex = harness.sequence.indexOf("ticks");
    const labelsIndex = harness.sequence.indexOf("labels");

    expect(sectorIndex).toBeGreaterThanOrEqual(0);
    expect(ringIndex).toBeGreaterThan(sectorIndex);
    expect(ticksIndex).toBeGreaterThan(ringIndex);
    expect(labelsIndex).toBeGreaterThan(ringIndex);
    expect(pointerIndex).toBeGreaterThan(ticksIndex);
    expect(pointerIndex).toBeGreaterThan(labelsIndex);
    expect(harness.arcRingCalls).toHaveLength(1);
    expect(harness.pointerCalls).toHaveLength(1);
    expect(harness.tickCalls).toHaveLength(1);
    expect(harness.labelCalls).toHaveLength(1);
  });

  it("still draws the ring, pointer, ticks, and labels when no sectors are returned", function () {
    const harness = createRenderOrderHarness([]);
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    harness.renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    expect(harness.sequence.filter((item) => item === "sector")).toHaveLength(0);
    expect(harness.sequence.filter((item) => item === "ring")).toHaveLength(1);
    expect(harness.sequence.filter((item) => item === "pointer")).toHaveLength(1);
    expect(harness.sequence.filter((item) => item === "ticks")).toHaveLength(1);
    expect(harness.sequence.filter((item) => item === "labels")).toHaveLength(1);
  });

  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    function captureState(specOverrides) {
      let capturedState = null;
      const themeDefaults = makeThemeDefaults();
      const modules = {
        RadialToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return themeDefaults;
                }
              },
              text: {
                drawDisconnectOverlay() {}
              },
              value: createValueMath(),
              draw: {
                drawArcRing() {},
                drawAnnularSector() {},
                drawPointerAtRim() {},
                drawTicksFromAngles() {},
                drawLabels() {}
              }
            };
          }
        },
        SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
        SemicircleRadialTextLayout: {
          create() {
            return {
              createFitCache() {
                return {};
              },
              drawModeText(state) {
                capturedState = {
                  mode: state.layout.mode,
                  labelFontPx: state.layout.labels.fontPx,
                  ringW: state.geom.ringW,
                  pointerDepth: state.geom.pointerDepth,
                  pointerSide: state.geom.pointerSide,
                  textFillScale: state.textFillScale
                };
              }
            };
          }
        },
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        GeometryScale: geometryScale
      };
      const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
        .create({}, makeComponentContext(modules))
        .createRenderer(Object.assign({}, makeBaseSpec(), specOverrides || {}));

      renderer(createMockCanvas({
        rectWidth: 300,
        rectHeight: 300,
        ctx: createMockContext2D()
      }), {
        value: 12.3,
        caption: "SPD",
        unit: "kn",
        speedRadialRatioThresholdNormal: 1.1,
        speedRadialRatioThresholdFlat: 3.5
      });

      return capturedState;
    }

    expect(captureState({
      ratioDefaults: { normal: 1.1, flat: 3.5 }
    })).toEqual(captureState());
  });

  it("matches callback-visible range and layout state with or without wrapper-owned rangeDefaults when config bounds are present", function () {
    function captureState(includeRangeDefaults) {
      let capturedState = null;
      let capturedRange = null;
      const themeDefaults = makeThemeDefaults();
      const modules = {
        RadialToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return themeDefaults;
                }
              },
              text: {
                drawDisconnectOverlay() {}
              },
              value: createValueMath(),
              draw: {
                drawArcRing() {},
                drawAnnularSector() {},
                drawPointerAtRim() {},
                drawTicksFromAngles() {},
                drawLabels() {}
              }
            };
          }
        },
        SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
        SemicircleRadialTextLayout: {
          create() {
            return {
              createFitCache() {
                return {};
              },
              drawModeText(state) {
                capturedState = {
                  mode: state.layout.mode,
                  labelFontPx: state.layout.labels.fontPx,
                  ringW: state.geom.ringW,
                  pointerDepth: state.geom.pointerDepth,
                  pointerSide: state.geom.pointerSide,
                  textFillScale: state.textFillScale
                };
              }
            };
          }
        },
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        GeometryScale: geometryScale
      };
      const spec = makeBaseSpec();
      if (!includeRangeDefaults) {
        delete spec.rangeDefaults;
      }
      spec.buildSectors = function (props, minV, maxV) {
        capturedRange = { min: minV, max: maxV };
        return [];
      };
      const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
        .create({}, makeComponentContext(modules))
        .createRenderer(spec);

      renderer(createMockCanvas({
        rectWidth: 300,
        rectHeight: 300,
        ctx: createMockContext2D()
      }), {
        value: 12.3,
        caption: "SPD",
        unit: "kn",
        minValue: 4,
        maxValue: 44,
        speedRadialRatioThresholdNormal: 1.1,
        speedRadialRatioThresholdFlat: 3.5
      });

      return {
        state: capturedState,
        range: capturedRange
      };
    }

    expect(captureState(true)).toEqual(captureState(false));
  });

  it("falls back to engine-owned range defaults when range props are absent", function () {
    let capturedRange = null;
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults();
              }
            },
            text: {
              drawDisconnectOverlay() {}
            },
            value: createValueMath(),
            draw: {
              drawArcRing() {},
              drawAnnularSector() {},
              drawPointerAtRim() {},
              drawTicksFromAngles() {},
              drawLabels() {}
            }
          };
        }
      },
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText() {}
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const spec = makeBaseSpec();
    delete spec.rangeDefaults;
    spec.buildSectors = function (props, minV, maxV) {
      capturedRange = { min: minV, max: maxV };
      return [];
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(spec);

    renderer(createMockCanvas({
      rectWidth: 300,
      rectHeight: 300,
      ctx: createMockContext2D()
    }), {
      value: 12.3,
      caption: "SPD",
      unit: "kn",
      speedRadialRatioThresholdNormal: 1.1,
      speedRadialRatioThresholdFlat: 3.5
    });

    expect(capturedRange).toEqual({ min: 0, max: 30 });
  });

  it("keeps default radial pointer sizing independent from ring width changes", function () {
    function renderPointer(ringWidthFactor) {
      const pointerCalls = [];
      const gaugeValueMath = createValueMath();
      const themeDefaults = makeThemeDefaults();
      themeDefaults.radial.ring.widthFactor = ringWidthFactor;
      const modules = {
        RadialToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return themeDefaults;
                }
              },
              text: {
                drawDisconnectOverlay() {}
              },
              value: gaugeValueMath,
              draw: {
                drawArcRing() {},
                drawAnnularSector() {},
                drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
                  pointerCalls.push(opts);
                },
                drawTicksFromAngles() {},
                drawLabels() {}
              }
            };
          }
        },
        SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
        SemicircleRadialTextLayout: {
          create() {
            return {
              createFitCache() {
                return {};
              },
              drawModeText() {}
            };
          }
        },
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        GeometryScale: geometryScale
      };
      const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
        .create({}, makeComponentContext(modules))
        .createRenderer(makeBaseSpec());

      renderer(createMockCanvas({
        rectWidth: 480,
        rectHeight: 110,
        ctx: createMockContext2D()
      }), {
        value: 12.3,
        caption: "SPD",
        unit: "kn"
      });

      return pointerCalls[0];
    }

    const thinPointer = renderPointer(0.1);
    const thickPointer = renderPointer(0.24);

    expect(thinPointer.depth).toBe(thickPointer.depth);
    expect(thinPointer.halfWidth).toBe(thickPointer.halfWidth);
    expect(thinPointer.fillStyle).toBe(thickPointer.fillStyle);
  });

  it("delegates text rendering through SemicircleRadialTextLayout and preserves explicit falsy text props", function () {
    const drawModeText = vi.fn();
    const layoutCalls = {
      computeMode: 0,
      computeInsets: 0,
      computeLayout: 0
    };
    const layoutSnapshot = {
      mode: "normal",
      responsive: { textFillScale: 1.15 },
      textFillScale: 1.15,
      geom: {
        cx: 60,
        cy: 60,
        rOuter: 50,
        ringW: 12,
        majorTickLen: 4,
        majorTickWidth: 1,
        minorTickLen: 2,
        minorTickWidth: 1,
        arcLineWidth: 1,
        pointerDepth: 10,
        pointerSide: 5
      },
      labels: {
        radiusOffset: 20,
        fontPx: 12
      },
      flat: { box: { x: 0, y: 0, w: 0, h: 0 }, topBox: { x: 0, y: 0, w: 0, h: 0 }, bottomBox: { x: 0, y: 0, w: 0, h: 0 } },
      high: { bandBox: { x: 0, y: 0, w: 0, h: 0 } },
      normal: { rSafe: 20, yBottom: 52, mhMax: 18, mhMin: 12 }
    };
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults({
                  colors: {
                    pointer: "#ff2b2b"
                  }
                });
              }
            },
            text: {
              drawDisconnectOverlay() {}
            },
            value: createValueMath(),
            draw: {
              drawArcRing() {},
              drawAnnularSector() {},
              drawPointerAtRim() {},
              drawTicksFromAngles() {},
              drawLabels() {}
            }
          };
        }
      },
      SemicircleRadialLayout: {
        create() {
          return {
            computeMode() {
              layoutCalls.computeMode += 1;
              return "normal";
            },
            computeInsets() {
              layoutCalls.computeInsets += 1;
              return { pad: 1, gap: 1, responsive: { textFillScale: 1.15 } };
            },
            computeLayout() {
              layoutCalls.computeLayout += 1;
              return layoutSnapshot;
            }
          };
        }
      },
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText: drawModeText
          };
        }
      }
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(makeBaseSpec());

    renderer(createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: createMockContext2D()
    }), {
      value: 12.3,
      caption: 0,
      unit: ""
    });

    expect(layoutCalls.computeMode).toBe(1);
    expect(layoutCalls.computeInsets).toBe(1);
    expect(layoutCalls.computeLayout).toBe(1);
    expect(drawModeText).toHaveBeenCalledTimes(1);
    expect(drawModeText.mock.calls[0][0].layout).toBe(layoutSnapshot);
    expect(drawModeText.mock.calls[0][0].textFillScale).toBe(1.15);
    expect(drawModeText.mock.calls[0][1]).toEqual({
      caption: "0",
      valueText: "12.3",
      unit: "",
      secScale: 0.3,
      hideTextualMetrics: false
    });
  });

  it("renders disconnected state-screen before gauge drawing", function () {
    const layoutCalls = { computeMode: 0 };
    const drawCalls = { arc: 0, modeText: 0 };
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults({
                  colors: { pointer: "#ff2b2b" },
                  font: { labelWeight: 650 }
                });
              }
            },
            text: {},
            value: createValueMath(),
            draw: {
              drawArcRing() { drawCalls.arc += 1; },
              drawAnnularSector() {},
              drawPointerAtRim() {},
              drawTicksFromAngles() {},
              drawLabels() {}
            }
          };
        }
      },
      SemicircleRadialLayout: {
        create() {
          return {
            computeMode() { layoutCalls.computeMode += 1; return "normal"; },
            computeInsets() { return { responsive: { textFillScale: 1 } }; },
            computeLayout() { throw new Error("layout should not run for disconnected state-screen"); }
          };
        }
      },
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() { return {}; },
            drawModeText() { drawCalls.modeText += 1; }
          };
        }
      }
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(makeBaseSpec());
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 220, rectHeight: 140, ctx: ctx });

    renderer(canvas, { disconnect: true, value: 12.3, caption: "SPD", unit: "kn" });

    expect(layoutCalls.computeMode).toBe(0);
    expect(drawCalls.arc).toBe(0);
    expect(drawCalls.modeText).toBe(0);
    expect(
      ctx.calls
        .filter((entry) => entry.name === "fillText")
        .map((entry) => String(entry.args[0]))
    ).toContain("GPS Lost");
  });
});
