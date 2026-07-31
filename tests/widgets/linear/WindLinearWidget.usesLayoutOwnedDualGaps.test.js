// @ts-check
const { createComponentContextMock, loadFresh } = require("./WindLinearWidget-setup");

describe("WindLinearWidget", function () {
  it("uses layout-owned dual gaps for flat/normal and full-width rows for split high", function () {
    /** @typedef {{ h: number, w: number, x: number, y: number }} Box */
    /** @typedef {{ align?: string, box: Box, caption?: string, textFillScale: number, type: "caption" | "inline" | "value", unit?: string, value?: string }} DrawCall */
    /** @typedef {{ drawMode: Record<string, (state: { layout: { dualRowGap: number, textBottomBox: Box, textTopBox: Box }, textFillScale: number }, props: Record<string, unknown>, display: Record<string, unknown>, api: unknown) => void> }} CapturedConfig */
    /** @type {CapturedConfig | undefined} */
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
                /** @param {unknown} value @param {number} lo @param {number} hi */
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                /** @param {unknown} value */
                toOptionalFiniteNumber(value) {
                  if (value === null || value === undefined) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                /** @param {unknown} value */
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
                /** @param {CapturedConfig} cfg */
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
            /** @param {unknown} value */
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

    /** @param {string} modeName */
    function renderMode(modeName) {
      const calls = /** @type {DrawCall[]} */ ([]);
      const api = {
        text: {},
        textLayout: {
          /** @param {{ textFillScale: number }} innerState @param {unknown} textApi @param {string} caption @param {Box} box @param {number} secScale @param {string} align */
          drawCaptionRow(innerState, textApi, caption, box, secScale, align) {
            calls.push({
              type: "caption",
              textFillScale: innerState.textFillScale,
              caption,
              box,
              align
            });
          },
          /** @param {{ textFillScale: number }} innerState @param {unknown} textApi @param {string} value @param {string} unit @param {Box} box @param {number} secScale @param {string} align */
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
          /** @param {{ textFillScale: number }} innerState @param {unknown} textApi @param {string} caption @param {string} value @param {string} unit @param {Box} box */
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
      if (!captured) {
        throw new Error("Expected the linear renderer configuration.");
      }
      const drawMode = captured.drawMode[modeName];
      if (!drawMode) {
        throw new Error("Expected the requested draw mode.");
      }
      drawMode(state, {}, display, api);
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

    if (
      !flatLeftCaption ||
      !flatRightCaption ||
      !normalLeftCaption ||
      !normalRightCaption ||
      !highTopInline ||
      !highBottomInline
    ) {
      throw new Error("Expected all wind-linear draw rows.");
    }

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
    /** @typedef {{ formatDisplay: (value: number, props: Record<string, unknown>) => { num: number, right: { value: string } } }} FormatCapturedConfig */
    /** @type {FormatCapturedConfig | undefined} */
    let captured;
    const applyFormatter = vi.fn((/** @type {unknown} */ value) => "spd:" + String(value));

    loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
          ValueMath: {
            create() {
              return {
                /** @param {unknown} value @param {number} lo @param {number} hi */
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                /** @param {unknown} value */
                toOptionalFiniteNumber(value) {
                  if (value === null || value === undefined) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                /** @param {unknown} value */
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
                /** @param {FormatCapturedConfig} cfg */
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

    if (!captured) {
      throw new Error("Expected the linear formatter configuration.");
    }
    const formatterConfig = captured;

    [null, undefined, "", "   "].forEach(function (rawSpeed) {
      const display = formatterConfig.formatDisplay(15, {
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

    const valid = formatterConfig.formatDisplay(15, {
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
