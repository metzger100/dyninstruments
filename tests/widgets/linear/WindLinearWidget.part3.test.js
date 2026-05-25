const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("WindLinearWidget", function () {
  it("keeps missing angle values on placeholder path instead of numeric zero formatting", function () {
    let captured;

    loadFresh("widgets/linear/WindLinearWidget/WindLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh(
            "shared/widget-kits/format/PlaceholderNormalize.js",
          ),
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
                  if (typeof value === "string" && value.trim() === "")
                    return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                formatAngle180(value) {
                  const n = Number(value);
                  return isFinite(n) ? String(Math.round(n)) : "---";
                },
              };
            },
          },
          LinearGaugeEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                },
              };
            },
          },
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            },
          },
        },
      }),
    );

    [null, undefined, "", "   "].forEach(function (rawAngle) {
      const display = captured.formatDisplay(rawAngle, {
        default: "---",
        angleCaption: "AWA",
        speedCaption: "AWS",
        angleUnit: "°",
        speedUnit: "kn",
        speed: 4.2,
      });

      expect(Number.isNaN(display.num)).toBe(true);
      expect(display.text).toBe("---");
      expect(display.left.value).toBe("---");
    });

    const valid = captured.formatDisplay("4.2", {
      default: "---",
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      speed: 4.2,
    });
    expect(valid.num).toBe(4);
    expect(valid.text).toBe("4");
  });
});
