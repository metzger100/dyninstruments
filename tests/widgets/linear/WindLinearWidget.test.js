const { loadFresh } = require("../../helpers/load-umd");

describe("WindLinearWidget", function () {
  it("configures centered180 dual wind display and mirrored layline sectors", function () {
    let captured;
    const applyFormatter = vi.fn((value, spec) => "spd:" + String(value) + ":" + spec.formatterParameters[0]);

    const mod = loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js");
    mod.create({}, {
      applyFormatter,
      getModule(id) {
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
                  const abs = Math.abs(Math.round(n));
                  const base = leadingZero ? String(abs).padStart(3, "0") : String(abs);
                  return n < 0 ? "-" + base : base;
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
        inlineBox: { x: 0, y: 0, w: 280, h: 60 }
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
        valueBox: { x: 0, y: 30, w: 280, h: 40 }
      }
    };

    captured.drawMode.flat(state, {}, display, api);
    captured.drawMode.high(state, {}, display, api);
    captured.drawMode.normal(state, {}, display, api);

    expect(calls.caption).toBe(4);
    expect(calls.value).toBe(4);
    expect(calls.inline).toBe(2);
  });
});
