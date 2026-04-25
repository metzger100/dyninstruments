const { loadFresh } = require("../../helpers/load-umd");

describe("WindLinearWidget", function () {
  it("configures centered180 dual wind display and mirrored layline sectors", function () {
    let captured;
    const applyFormatter = vi.fn((value, spec) => "spd:" + String(value) + ":" + spec.formatterParameters[0]);

    const mod = loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js");
    mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "StableDigits") return loadFresh("shared/widget-kits/format/StableDigits.js");
        if (id === "PlaceholderNormalize") return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                formatAngle180(value, leadingZero) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  let wrapped = ((n + 180) % 360 + 360) % 360 - 180;
                  if (wrapped === 180) wrapped = -180;
                  const abs = Math.abs(Math.round(wrapped));
                  const base = leadingZero ? String(abs).padStart(3, "0") : String(abs);
                  return wrapped < 0 ? "-" + base : base;
                }
              };
            }
          };
        }
        if (id !== "LinearGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        };
      }
    });

    expect(captured.axisMode).toBe("centered180");
    expect(captured.hideTextualMetricsProp).toBe("windLinearHideTextualMetrics");
    expect(captured.ratioProps).toEqual({
      normal: "windLinearRatioThresholdNormal",
      flat: "windLinearRatioThresholdFlat"
    });
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps()).toEqual({ major: 30, minor: 10 });

    const display = captured.formatDisplay(-32, {
      speed: 6.1,
      angleCaption: "TWA",
      speedCaption: "TWS",
      angleUnit: "°",
      speedUnit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"],
      leadingZero: true,
      captionUnitScale: 0.8
    });

    expect(display.num).toBe(-32);
    expect(display.text).toBe("-032");
    expect(display.left.caption).toBe("TWA");
    expect(display.right.caption).toBe("TWS");
    expect(display.left.unit).toBe("°");
    expect(display.right.unit).toBe("kn");
    expect(display.right.value).toBe("spd:6.1:kn");
    expect(applyFormatter).toHaveBeenCalledWith(6.1, expect.objectContaining({
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }));

    const wrapped = captured.formatDisplay(337, {
      speed: 6.1,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"],
      leadingZero: true,
      captionUnitScale: 0.8
    });
    expect(wrapped.text).toBe("-023");
    expect(wrapped.num).toBe(-23);

    const sectors = captured.buildSectors({
      windLinearLayEnabled: true,
      windLinearLayMin: 25,
      windLinearLayMax: 45
    }, -180, 180, { min: -180, max: 180 }, {
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, Number(v)));
      }
    }, {
      colors: {
        laylinePort: "#ff7a76",
        laylineStb: "#82b683"
      }
    });

    expect(sectors).toEqual([
      { from: -45, to: -25, color: "#ff7a76" },
      { from: 25, to: 45, color: "#82b683" }
    ]);

    expect(captured.buildSectors({
      windLinearLayEnabled: false,
      windLinearLayMin: 25,
      windLinearLayMax: 45
    }, -180, 180, { min: -180, max: 180 }, {
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, Number(v)));
      }
    }, {
      colors: {
        laylinePort: "#ff7a76",
        laylineStb: "#82b683"
      }
    })).toEqual([]);
  });

  it("renders dual-value text across flat, normal, and high modes", function () {
    let captured;
    loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js").create({}, {
      applyFormatter(value) {
        return String(value);
      },
      getModule(id) {
        if (id === "StableDigits") return loadFresh("shared/widget-kits/format/StableDigits.js");
        if (id === "PlaceholderNormalize") return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                formatAngle180(value) {
                  const n = Number(value);
                  return isFinite(n) ? String(Math.round(n)) : "---";
                }
              };
            }
          };
        }
        if (id !== "LinearGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        };
      }
    });

    expect(captured.layout).toEqual({
      normalVariant: "stacked",
      highVariant: "split"
    });

    const calls = {
      caption: 0,
      value: 0,
      inline: 0
    };
    const api = {
      text: {},
      textLayout: {
        drawCaptionRow() {
          calls.caption += 1;
        },
        drawValueUnitRow() {
          calls.value += 1;
        },
        drawInlineRow() {
          calls.inline += 1;
        }
      }
    };
    const state = {
      layout: {
        dualRowGap: 8,
        textTopBox: { x: 0, y: 0, w: 280, h: 60 },
        textBottomBox: { x: 0, y: 160, w: 280, h: 66 }
      }
    };
    const display = {
      secScale: 0.8,
      parsed: {
        left: { caption: "AWA", value: "23", unit: "°" },
        right: { caption: "AWS", value: "5.5", unit: "kn" }
      },
      rowBoxes: {
        captionBox: { x: 0, y: 0, w: 280, h: 30 },
        valueBox: { x: 0, y: 30, w: 280, h: 40 },
        top: null,
        bottom: null
      }
    };

    captured.drawMode.flat(state, {}, display, api);
    captured.drawMode.high(state, {}, display, api);
    captured.drawMode.normal(state, {}, display, api);

    expect(calls.caption).toBe(4);
    expect(calls.value).toBe(4);
    expect(calls.inline).toBe(2);
  });

  it("uses layout-owned dual gaps for flat/normal and full-width rows for split high", function () {
    let captured;
    loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js").create({}, {
      applyFormatter(value) {
        return String(value);
      },
      getModule(id) {
        if (id === "StableDigits") return loadFresh("shared/widget-kits/format/StableDigits.js");
        if (id === "PlaceholderNormalize") return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                formatAngle180(value) {
                  const n = Number(value);
                  return isFinite(n) ? String(Math.round(n)) : "---";
                }
              };
            }
          };
        }
        if (id !== "LinearGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        };
      }
    });

    const state = {
      textFillScale: 1.18,
      layout: {
        dualRowGap: 1,
        textTopBox: { x: 0, y: 0, w: 20, h: 18 },
        textBottomBox: { x: 0, y: 28, w: 20, h: 18 }
      }
    };
    const display = {
      secScale: 0.8,
      parsed: {
        left: { caption: "AWA", value: "23", unit: "°" },
        right: { caption: "AWS", value: "5.5", unit: "kn" }
      },
      rowBoxes: {
        captionBox: { x: 0, y: 0, w: 20, h: 8 },
        valueBox: { x: 0, y: 8, w: 20, h: 10 },
        top: null,
        bottom: null
      }
    };

    function renderMode(modeName) {
      const calls = [];
      const api = {
        text: {},
        textLayout: {
          drawCaptionRow(innerState, textApi, caption, box, secScale, align) {
            calls.push({ type: "caption", textFillScale: innerState.textFillScale, caption, box, align });
          },
          drawValueUnitRow(innerState, textApi, value, unit, box, secScale, align) {
            calls.push({ type: "value", textFillScale: innerState.textFillScale, value, unit, box, align });
          },
          drawInlineRow(innerState, textApi, caption, value, unit, box) {
            calls.push({ type: "inline", textFillScale: innerState.textFillScale, caption, value, unit, box });
          }
        }
      };
      captured.drawMode[modeName](state, {}, display, api);
      return calls;
    }

    const flatCalls = renderMode("flat");
    const normalCalls = renderMode("normal");
    const highCalls = renderMode("high");
    const flatLeftCaption = flatCalls.find((entry) => entry.type === "caption" && entry.caption === "AWA");
    const flatRightCaption = flatCalls.find((entry) => entry.type === "caption" && entry.caption === "AWS");
    const normalLeftCaption = normalCalls.find((entry) => entry.type === "caption" && entry.caption === "AWA");
    const normalRightCaption = normalCalls.find((entry) => entry.type === "caption" && entry.caption === "AWS");
    const highTopInline = highCalls.find((entry) => entry.type === "inline" && entry.caption === "AWA");
    const highBottomInline = highCalls.find((entry) => entry.type === "inline" && entry.caption === "AWS");

    expect(flatLeftCaption.box.w).toBe(9);
    expect(flatRightCaption.box.x - (flatLeftCaption.box.x + flatLeftCaption.box.w)).toBe(1);
    expect(normalRightCaption.box.x - (normalLeftCaption.box.x + normalLeftCaption.box.w)).toBe(1);
    expect(highTopInline.box).toEqual(state.layout.textTopBox);
    expect(highBottomInline.box).toEqual(state.layout.textBottomBox);
    expect(flatLeftCaption.textFillScale).toBe(1.18);
    expect(normalLeftCaption.textFillScale).toBe(1.18);
    expect(highTopInline.textFillScale).toBe(1.18);
    expect(flatCalls.some((entry) => entry.type === "inline")).toBe(false);
    expect(normalCalls.some((entry) => entry.type === "inline")).toBe(false);
    expect(highCalls.filter((entry) => entry.type === "inline")).toHaveLength(2);
  });
});
