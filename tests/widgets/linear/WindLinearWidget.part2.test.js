// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("WindLinearWidget", function () {
  it("uses layout-owned dual gaps for flat/normal and full-width rows for split high", function () {
    let captured;
    loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
          ValueMath: {
            create() {
              return {
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                toOptionalFiniteNumber(value) {
                  if (value == null) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                formatAngle180(value) {
                  const n = Number(value);
                  return isFinite(n) ? String(Math.round(n)) : "---";
                }
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                }
              };
            }
          }
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );

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
            calls.push({
              type: "caption",
              textFillScale: innerState.textFillScale,
              caption,
              box,
              align
            });
          },
          drawValueUnitRow(innerState, textApi, value, unit, box, secScale, align) {
            calls.push({
              type: "value",
              textFillScale: innerState.textFillScale,
              value,
              unit,
              box,
              align
            });
          },
          drawInlineRow(innerState, textApi, caption, value, unit, box) {
            calls.push({
              type: "inline",
              textFillScale: innerState.textFillScale,
              caption,
              value,
              unit,
              box
            });
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

  it("keeps missing speed values on placeholder path instead of numeric zero formatting", function () {
    let captured;
    const applyFormatter = vi.fn((value) => "spd:" + String(value));

    loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
          ValueMath: {
            create() {
              return {
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                toOptionalFiniteNumber(value) {
                  if (value == null) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                formatAngle180(value) {
                  const n = Number(value);
                  return isFinite(n) ? String(Math.round(n)) : "---";
                }
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                }
              };
            }
          }
        },
        services: { format: { applyFormatter } }
      })
    );

    [null, undefined, "", "   "].forEach(function (rawSpeed) {
      const display = captured.formatDisplay(15, {
        speed: rawSpeed,
        default: "---",
        angleCaption: "AWA",
        speedCaption: "AWS",
        angleUnit: "°",
        speedUnit: "kn"
      });

      expect(display.num).toBe(15);
      expect(display.right.value).toBe("---");
    });
    expect(applyFormatter).not.toHaveBeenCalled();

    const valid = captured.formatDisplay(15, {
      speed: "4.2",
      default: "---",
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn"
    });
    expect(valid.right.value).toBe("spd:4.2");
    expect(applyFormatter).toHaveBeenCalledWith(
      4.2,
      expect.objectContaining({
        default: "---"
      })
    );
  });
});
