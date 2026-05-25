const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("VoltageLinearWidget", function () {
  it("suppresses disabled sectors and keeps warning-only behavior", function () {
    let captured;

    const mod = loadFresh(
      "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js",
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
                  const value = String(text).trim();
                  return value === "NO DATA" || /^-+$/.test(value)
                    ? defaultText == null
                      ? "---"
                      : defaultText
                    : String(text);
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
                  applyFormatter,
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
                      applyFormatter(n, {
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
                extractNumberText(text) {
                  const match = String(text).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  return match ? match[0] : "";
                },
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
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

    expect(
      captured.buildSectors(
        {
          voltageLinearWarningEnabled: false,
          voltageLinearAlarmEnabled: false,
        },
        10,
        15,
        { min: 10, max: 15 },
        {},
        {
          colors: { warning: "#123456", alarm: "#654321" },
        },
      ),
    ).toEqual([]);

    expect(
      captured.buildSectors(
        {
          voltageLinearWarningEnabled: true,
          voltageLinearAlarmEnabled: false,
          voltageLinearWarningFrom: 12.8,
        },
        10,
        15,
        { min: 10, max: 15 },
        {},
        {
          colors: { warning: "#123456", alarm: "#654321" },
        },
      ),
    ).toEqual([{ from: 10, to: 12.8, color: "#123456" }]);
  });

  it("returns placeholder output for null voltage values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    loadFresh(
      "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js",
    ).create(
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
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
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
          format: { applyFormatter },
        },
      }),
    );

    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

});
