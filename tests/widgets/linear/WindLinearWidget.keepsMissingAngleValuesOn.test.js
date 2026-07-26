// @ts-check
const { createComponentContextMock, loadFresh } = require("./WindLinearWidget-setup");

describe("WindLinearWidget", function () {
  it("keeps missing angle values on placeholder path instead of numeric zero formatting", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
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
                // @ts-ignore -- pre-existing untyped test mock boundary
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                // @ts-ignore -- pre-existing untyped test mock boundary
                toOptionalFiniteNumber(value) {
                  if (value == null) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                // @ts-ignore -- pre-existing untyped test mock boundary
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
                // @ts-ignore -- pre-existing untyped test mock boundary
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
            // @ts-ignore -- pre-existing untyped test mock boundary
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );

    [null, undefined, "", "   "].forEach(function (rawAngle) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      const display = captured.formatDisplay(rawAngle, {
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

    // @ts-ignore -- pre-existing untyped test mock boundary
    const valid = captured.formatDisplay("4.2", {
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
