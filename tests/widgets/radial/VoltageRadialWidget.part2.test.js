const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("VoltageRadialWidget", function () {
  it("suppresses disabled sectors by toggle flags before low-end sector building", function () {
    let captured;
    const buildLowEndSectors = vi.fn(() => [
      { a0: 10, a1: 11.6, color: "#654321" },
    ]);

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
          format: {
            applyFormatter(value) {
              return String(value);
            },
          },
        },
      }),
    );

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const valueUtils = { buildLowEndSectors };
    expect(
      captured.buildSectors(
        {
          voltageRadialWarningEnabled: false,
          voltageRadialAlarmEnabled: false,
        },
        10,
        15,
        {},
        valueUtils,
        theme,
      ),
    ).toEqual([]);
    expect(buildLowEndSectors).not.toHaveBeenCalled();

    captured.buildSectors(
      {
        voltageRadialWarningEnabled: false,
        voltageRadialAlarmEnabled: true,
        voltageRadialAlarmFrom: 11.6,
      },
      10,
      15,
      {},
      valueUtils,
      theme,
    );
    expect(buildLowEndSectors).toHaveBeenCalledTimes(1);
    expect(buildLowEndSectors.mock.calls[0][0].warningFrom).toBe(undefined);
    expect(buildLowEndSectors.mock.calls[0][0].alarmFrom).toBe(11.6);

    captured.buildSectors(
      {
        voltageRadialWarningEnabled: true,
        voltageRadialAlarmEnabled: false,
        voltageRadialWarningFrom: 12.2,
      },
      10,
      15,
      {},
      valueUtils,
      theme,
    );
    expect(buildLowEndSectors).toHaveBeenCalledTimes(2);
    expect(buildLowEndSectors.mock.calls[1][0].warningFrom).toBe(12.2);
    expect(buildLowEndSectors.mock.calls[1][0].alarmFrom).toBe(undefined);
  });

  it("does not force fixed-decimal fallback text on raw formatter passthrough", function () {
    let captured;

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
          format: {
            applyFormatter(value) {
              return String(value);
            },
          },
        },
      }),
    );

    expect(captured.formatDisplay(12.34, {})).toEqual({
      num: 12.34,
      text: "12.34",
    });
  });

});
