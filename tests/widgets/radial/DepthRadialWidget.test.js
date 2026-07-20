const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("DepthRadialWidget", function () {
  /** @param {any} value */
  function toOptionalFiniteNumber(value) {
    if (value == null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  it("builds low-end sectors with alarm and warning order", function () {
    /** @type {any} */
    let captured;
    /** @type {any} */
    let receivedProps;
    /** @type {any} */
    let receivedOptions;
    /** @type {any[]} */
    const requestedModules = [];
    const resolveStandardTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
    const unitFormatter = {
      formatWithToken: vi.fn(function (value, formatter, token, defaultText) {
        return String(value);
      }),
      extractNumericDisplay: vi.fn(function (text, fallback) {
        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    };
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/radial/DepthRadialWidget/DepthRadialWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        SemicircleRadialEngine: {
          create() {
            requestedModules.push("SemicircleRadialEngine");
            return {
              /** @param {any} cfg */
              createRenderer(cfg) {
                captured = cfg;
                return renderCanvas;
              }
            };
          }
        },
        ValueMath: {
          create() {
            requestedModules.push("ValueMath");
            return { toOptionalFiniteNumber, resolveStandardTickSteps };
          }
        },
        DepthDisplayFormatter: {
          create() {
            requestedModules.push("DepthDisplayFormatter");
            return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
          }
        },
        PlaceholderNormalize: {
          create() {
            requestedModules.push("PlaceholderNormalize");
            return {
              /** @param {any} text @param {any} defaultText */
              normalize(text, defaultText) {
                if (text == null) return defaultText == null ? "---" : defaultText;
                const value = String(text).trim();
                return value === "NO DATA" || /^-+$/.test(value)
                  ? defaultText == null
                    ? "---"
                    : defaultText
                  : String(text);
              }
            };
          }
        },
        UnitAwareFormatter: {
          create() {
            requestedModules.push("UnitAwareFormatter");
            return unitFormatter;
          }
        }
      }
    });
    const spec = mod.create({}, componentContext);

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "depthRadialRatioThresholdNormal",
      flat: "depthRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("depthRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardTickSteps).toHaveBeenCalledTimes(2);
    expect(requestedModules).toEqual([
      "SemicircleRadialEngine",
      "ValueMath",
      "DepthDisplayFormatter",
      "PlaceholderNormalize",
      "UnitAwareFormatter"
    ]);

    const display = captured.formatDisplay(3.24, {
      formatter: "formatDistance",
      formatterParameters: ["ft"],
      default: "---"
    });

    expect(display).toEqual({ num: 3.24, text: "3.24" });
    expect(unitFormatter.formatWithToken).toHaveBeenCalledWith(3.24, "formatDistance", "ft", "---");
    expect(unitFormatter.extractNumericDisplay).toHaveBeenCalledWith("3.24", NaN);

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors(
      { depthRadialAlarmFrom: 2, depthRadialWarningFrom: 5 },
      0,
      30,
      {},
      {
        /** @param {any} props @param {any} minV @param {any} maxV @param {any} arc @param {any} options */
        buildLowEndSectors(props, minV, maxV, arc, options) {
          receivedProps = props;
          receivedOptions = options;
          return [
            { a0: 0, a1: 2, color: options.alarmColor },
            { a0: 2, a1: 5, color: options.warningColor }
          ];
        }
      },
      theme
    );

    expect(sectors).toEqual([
      { a0: 0, a1: 2, color: "#654321" },
      { a0: 2, a1: 5, color: "#123456" }
    ]);
    expect(receivedProps).toEqual({ warningFrom: 5, alarmFrom: 2 });
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });

  it("returns placeholder output for null depth values", function () {
    /** @type {any} */
    let captured;
    const unitFormatter = {
      formatWithToken: vi.fn(function (value) {
        return String(value);
      }),
      extractNumericDisplay: vi.fn(function (text, fallback) {
        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    };

    const mod = loadFresh("widgets/radial/DepthRadialWidget/DepthRadialWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        SemicircleRadialEngine: {
          create() {
            return {
              /** @param {any} cfg */
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        },
        ValueMath: {
          create() {
            return {
              toOptionalFiniteNumber,
              resolveStandardTickSteps() {
                return { major: 5, minor: 1 };
              }
            };
          }
        },
        DepthDisplayFormatter: {
          create() {
            return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
          }
        },
        PlaceholderNormalize: {
          create() {
            return {
              /** @param {any} text @param {any} defaultText */
              normalize(text, defaultText) {
                if (text == null) {
                  return defaultText == null ? "---" : defaultText;
                }
                return String(text);
              }
            };
          }
        },
        UnitAwareFormatter: {
          create() {
            return unitFormatter;
          }
        }
      }
    });
    mod.create({}, componentContext);

    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(unitFormatter.formatWithToken).not.toHaveBeenCalled();
    expect(unitFormatter.extractNumericDisplay).not.toHaveBeenCalled();
  });

  it("exposes a no-op translateFunction since the canvas surface owns rendering", function () {
    const mod = loadFresh("widgets/radial/DepthRadialWidget/DepthRadialWidget.js");
    const spec = mod.create(
      {},
      createComponentContextMock({
        modules: {
          SemicircleRadialEngine: {
            create() {
              return {
                createRenderer() {
                  return function () {};
                }
              };
            }
          },
          ValueMath: {
            create() {
              return {
                toOptionalFiniteNumber,
                resolveStandardTickSteps() {
                  return { major: 1, minor: 0.5 };
                }
              };
            }
          },
          DepthDisplayFormatter: {
            /** @param {any} def @param {any} componentContext */
            create(def, componentContext) {
              return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
            }
          },
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {any} text @param {any} defaultText */
                normalize(text, defaultText) {
                  return defaultText == null ? "---" : defaultText;
                }
              };
            }
          },
          UnitAwareFormatter: {
            create() {
              return {
                formatWithToken() {
                  return "";
                },
                extractNumericDisplay() {
                  return NaN;
                }
              };
            }
          }
        }
      })
    );

    expect(spec.translateFunction()).toEqual({});
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("widgets/radial/DepthRadialWidget/DepthRadialWidget.js", context);

    expect(context.DyniComponents.DyniDepthRadialWidget.id).toBe("DepthRadialWidget");
  });
});
