// @ts-check
const { createComponentContextMock, loadFresh } = require("./WindLinearWidget-setup");

describe("WindLinearWidget", function () {
  it("keeps missing angle values on placeholder path instead of numeric zero formatting", function () {
    /** @typedef {{ caption: unknown, value: string, unit: unknown }} MetricDisplay */
    /** @typedef {{ formatDisplay: (value: unknown, props: Record<string, unknown>) => { num: number, text: string, secScale: number, left: MetricDisplay, right: MetricDisplay } }} DisplayConfig */
    /** @type {DisplayConfig | undefined} */
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
                /** @param {unknown} value @param {number} lo @param {number} hi @returns {number} */
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                /** @param {unknown} value @returns {number | undefined} */
                toOptionalFiniteNumber(value) {
                  if (value === null || value === undefined) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                /** @param {unknown} value @returns {string} */
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
                /** @param {DisplayConfig} cfg */
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

    if (!captured) {
      throw new Error("Expected the wind-linear display configuration.");
    }
    const displayConfig = captured;

    [null, undefined, "", "   "].forEach(function (rawAngle) {
      const display = displayConfig.formatDisplay(rawAngle, {
        default: "---",
        angleCaption: "AWA",
        speedCaption: "AWS",
        angleUnit: "°",
        speedUnit: "kn",
        speed: 4.2
      });

      expect(Number.isNaN(display.num)).toBe(true);
      expect(display.text).toBe("---");
      expect(display.left.value).toBe("---");
    });

    const valid = displayConfig.formatDisplay("4.2", {
      default: "---",
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      speed: 4.2
    });
    expect(valid.num).toBe(4);
    expect(valid.text).toBe("4");
  });
});
