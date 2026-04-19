const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("SemicircleRadialEngine", function () {
  function createValueMath() {
    const valueMod = loadFresh("shared/widget-kits/radial/RadialValueMath.js");
    const angleMod = loadFresh("shared/widget-kits/radial/RadialAngleMath.js");
    return valueMod.create({}, {
      getModule(id) {
        if (id !== "RadialAngleMath") throw new Error("unexpected module: " + id);
        return angleMod;
      }
    });
  }

  function createLayoutModule() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
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

  function makeHelpers(modules) {
    function withCanonicalThemeTokens(toolkit) {
      if (!toolkit || typeof toolkit.create !== "function") {
        return toolkit;
      }
      return {
        create(def, Helpers) {
          const created = toolkit.create(def, Helpers);
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
          return created;
        }
      };
    }

    return {
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
      requirePluginRoot(target) {
        return target;
      },
      getModule(id) {
        if (id === "StableDigits") return loadFresh("shared/widget-kits/format/StableDigits.js");
        if (id === "PlaceholderNormalize") return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        if (id === "StateScreenLabels") return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        if (id === "StateScreenPrecedence") return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
        if (id === "StateScreenCanvasOverlay") return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js");
        if (id === "SpringEasing") return loadFresh("shared/widget-kits/anim/SpringEasing.js");
        if (modules[id]) {
          if (id === "RadialToolkit") {
            return withCanonicalThemeTokens(modules[id]);
          }
          return modules[id];
        }
        throw new Error("unexpected module: " + id);
      }
    };
  }

  it("resolves theme once and applies tokenized geometry and label metrics from the layout owner", function () {
    const pointerCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const arcRingCalls = [];
    const buildSectorsCalls = [];
    const themeDefaults = {
      surface: {
        fg: "#fff"
      },
      colors: {
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#ff7a76",
        laylineStb: "#82b683",
        laylinePort: "#ff7a76"
      },
      radial: {
        ticks: {
          majorLen: 13,
          majorWidth: 4,
          minorLen: 7,
          minorWidth: 2
        },
        pointer: {
          widthFactor: 1.02,
          lengthFactor: 1.7
        },
        ring: {
          arcLineWidth: 2.5,
          widthFactor: 0.18
        },
        labels: {
          insetFactor: 2.2,
          fontFactor: 0.2
        }
      },
      font: {
        family: "sans-serif",
        weight: 710,
        labelWeight: 680
      }
    };
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
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
    };
    const helpers = makeHelpers(modules);
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
    expect(pointerCalls[0].widthFactor).toBe(themeDefaults.radial.pointer.widthFactor);
    expect(pointerCalls[0].lengthFactor).toBe(themeDefaults.radial.pointer.lengthFactor);
    expect(arcRingCalls[0].lineWidth).toBe(themeDefaults.radial.ring.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: themeDefaults.radial.ticks.majorLen,
      width: themeDefaults.radial.ticks.majorWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: themeDefaults.radial.ticks.minorLen,
      width: themeDefaults.radial.ticks.minorWidth
    });
    expect(labelCalls[0].radiusOffset).toBe(expectedLayout.labels.radiusOffset);
    expect(labelCalls[0].fontPx).toBe(expectedLayout.labels.fontPx);
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);
    expect(textLayoutCalls).toHaveLength(1);
    expect(textLayoutCalls[0].state.layout.mode).toBe("flat");
  });

  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    function captureState(specOverrides) {
      let capturedState = null;
      const themeDefaults = {
        colors: {
          pointer: "#ff2b2b",
          warning: "#e7c66a",
          alarm: "#ff7a76",
          laylineStb: "#82b683",
          laylinePort: "#ff7a76"
        },
        radial: {
          ticks: {
            majorLen: 13,
            majorWidth: 4,
            minorLen: 7,
            minorWidth: 2
          },
          pointer: {
            widthFactor: 1.02,
            lengthFactor: 1.7
          },
          ring: {
            arcLineWidth: 2.5,
            widthFactor: 0.18
          },
          labels: {
            insetFactor: 2.2,
            fontFactor: 0.2
          }
        },
        font: {
          weight: 710,
          labelWeight: 680
        }
      };
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
                  needleDepth: state.geom.needleDepth,
                  textFillScale: state.textFillScale
                };
              }
            };
          }
        },
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
      };
      const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
        .create({}, makeHelpers(modules))
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
      const themeDefaults = {
        colors: {
          pointer: "#ff2b2b",
          warning: "#e7c66a",
          alarm: "#ff7a76",
          laylineStb: "#82b683",
          laylinePort: "#ff7a76"
        },
        radial: {
          ticks: {
            majorLen: 13,
            majorWidth: 4,
            minorLen: 7,
            minorWidth: 2
          },
          pointer: {
            widthFactor: 1.02,
            lengthFactor: 1.7
          },
          ring: {
            arcLineWidth: 2.5,
            widthFactor: 0.18
          },
          labels: {
            insetFactor: 2.2,
            fontFactor: 0.2
          }
        },
        font: {
          weight: 710,
          labelWeight: 680
        }
      };
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
                  needleDepth: state.geom.needleDepth,
                  textFillScale: state.textFillScale
                };
              }
            };
          }
        },
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
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
        .create({}, makeHelpers(modules))
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
                return {
                  colors: {
                    pointer: "#ff2b2b",
                    warning: "#e7c66a",
                    alarm: "#ff7a76",
                    laylineStb: "#82b683",
                    laylinePort: "#ff7a76"
                  },
                  radial: {
                    ticks: {
                      majorLen: 13,
                      majorWidth: 4,
                      minorLen: 7,
                      minorWidth: 2
                    },
                    pointer: {
                      widthFactor: 1.02,
                      lengthFactor: 1.7
                    },
                    ring: {
                      arcLineWidth: 2.5,
                      widthFactor: 0.18
                    },
                    labels: {
                      insetFactor: 2.2,
                      fontFactor: 0.2
                    }
                  },
                  font: {
                    weight: 710,
                    labelWeight: 680
                  }
                };
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
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
    };
    const spec = makeBaseSpec();
    delete spec.rangeDefaults;
    spec.buildSectors = function (props, minV, maxV) {
      capturedRange = { min: minV, max: maxV };
      return [];
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeHelpers(modules))
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
      const modules = {
        RadialToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return {
                    colors: {
                      pointer: "#ff2b2b",
                      warning: "#e7c66a",
                      alarm: "#ff7a76",
                      laylineStb: "#82b683",
                      laylinePort: "#ff7a76"
                    },
                    radial: {
                      ticks: {
                        majorLen: 13,
                        majorWidth: 4,
                        minorLen: 7,
                        minorWidth: 2
                      },
                      pointer: {
                        widthFactor: 1.02,
                        lengthFactor: 1.7
                      },
                      ring: {
                        arcLineWidth: 2.5,
                        widthFactor: ringWidthFactor
                      },
                      labels: {
                        insetFactor: 2.2,
                        fontFactor: 0.2
                      }
                    },
                    font: {
                      weight: 710,
                      labelWeight: 680
                    }
                  };
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
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
      };
      const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
        .create({}, makeHelpers(modules))
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
    expect(thinPointer.widthFactor).toBe(thickPointer.widthFactor);
    expect(thinPointer.lengthFactor).toBe(thickPointer.lengthFactor);
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
        needleDepth: 10
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
                return {
                  colors: {
                    pointer: "#ff2b2b"
                  },
                  radial: {
                    ticks: {
                      majorLen: 13,
                      majorWidth: 4,
                      minorLen: 7,
                      minorWidth: 2
                    },
                    pointer: {
                      widthFactor: 1.02,
                      lengthFactor: 1.7
                    },
                    ring: {
                      arcLineWidth: 2.5,
                      widthFactor: 0.18
                    },
                    labels: {
                      insetFactor: 2.2,
                      fontFactor: 0.2
                    }
                  },
                  font: {
                    weight: 710,
                    labelWeight: 680
                  }
                };
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
      .create({}, makeHelpers(modules))
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
      secScale: 0.3
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
                return {
                  surface: { fg: "#fff" },
                  colors: { pointer: "#ff2b2b" },
                  radial: {
                    ticks: { majorLen: 10, majorWidth: 2, minorLen: 5, minorWidth: 1 },
                    pointer: { widthFactor: 1, lengthFactor: 1.4 },
                    ring: { arcLineWidth: 2 }
                  },
                  font: { family: "sans-serif", weight: 700, labelWeight: 650 }
                };
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
      .create({}, makeHelpers(modules))
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
