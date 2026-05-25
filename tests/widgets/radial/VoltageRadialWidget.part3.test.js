const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("VoltageRadialWidget", function () {
  it("returns placeholder output for null voltage values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    const mod = loadFresh(
      "widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js",
    );
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                normalize(text, defaultText) {
                  if (text == null) {
                    return defaultText == null ? "---" : defaultText;
                  }
                  return String(text);
                },
              };
            },
          },
          ValueMath: {
            create() {
              return {
                formatGaugeDisplay(
                  raw,
                  props,
                  apply,
                  normalize,
                  defaultFormatter,
                  defaultParameters,
                ) {
                  const p = props || {};
                  const defaultText = Object.prototype.hasOwnProperty.call(
                    p,
                    "default",
                  )
                    ? p.default
                    : normalize(undefined, undefined);
                  if (raw == null) {
                    return { num: NaN, text: defaultText };
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n)) {
                    return { num: NaN, text: defaultText };
                  }
                  const formatter = Object.prototype.hasOwnProperty.call(
                    p,
                    "formatter",
                  )
                    ? p.formatter
                    : defaultFormatter;
                  const formatterParameters =
                    Object.prototype.hasOwnProperty.call(
                      p,
                      "formatterParameters",
                    )
                      ? p.formatterParameters
                      : defaultParameters;
                  const formatted = normalize(
                    String(
                      apply(n, {
                        formatter: formatter,
                        formatterParameters: formatterParameters,
                        default: defaultText,
                      }),
                    ),
                    defaultText,
                  );
                  const match = String(formatted).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  const num = match ? Number(match[0]) : NaN;
                  return Number.isFinite(num)
                    ? { num: num, text: match[0] }
                    : { num: NaN, text: defaultText };
                },
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
                },
              };
            },
          },
          SemicircleRadialEngine: {
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
          format: { applyFormatter },
        },
      }),
    );

    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });
});
