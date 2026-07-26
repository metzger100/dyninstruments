// @ts-check
const {
  createComponentContextMock,
  createScriptContext,
  loadFresh,
  runIifeScript
} = require("./SpeedRadialWidget-setup");

describe("SpeedRadialWidget", function () {
  it("exposes a no-op translateFunction since the canvas surface owns rendering", function () {
    const mod = loadFresh("widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js");
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
                resolveStandardTickSteps() {
                  return { major: 1, minor: 0.5 };
                },
                formatGaugeDisplay() {
                  return { num: NaN, text: "---" };
                }
              };
            }
          },
          PlaceholderNormalize: {
            create() {
              return {
                // @ts-ignore -- pre-existing untyped test mock boundary
                normalize(text, defaultText) {
                  return defaultText == null ? "---" : defaultText;
                }
              };
            }
          }
        }
      })
    );

    expect(spec.translateFunction()).toEqual({});
  });

  it("defaults the unit to kn and treats missing sector props as empty", function () {
    let captured;
    let receivedFormatterParameters;
    let receivedProps;

    const mod = loadFresh("widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          SemicircleRadialEngine: {
            create() {
              return {
                // @ts-ignore -- pre-existing untyped test mock boundary
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
                resolveStandardTickSteps() {
                  return { major: 1, minor: 0.5 };
                },
                // @ts-ignore -- pre-existing untyped test mock boundary
                formatGaugeDisplay(raw, props, applyFormatter, normalize, defaultFormatter, defaultParameters) {
                  receivedFormatterParameters = defaultParameters;
                  return { num: raw, text: String(raw) };
                }
              };
            }
          },
          PlaceholderNormalize: {
            create() {
              return {
                // @ts-ignore -- pre-existing untyped test mock boundary
                normalize(text) {
                  return text;
                }
              };
            }
          }
        }
      })
    );

    // formatDisplay called without the trailing unit argument (as the
    // engine does whenever a widget instance has no configured unit prop).
    // @ts-ignore -- pre-existing untyped test mock boundary
    captured.formatDisplay(6.44, { formatter: "formatSpeed" });
    expect(receivedFormatterParameters).toEqual(["kn"]);

    // @ts-ignore -- pre-existing untyped test mock boundary
    const sectors = captured.buildSectors(
      undefined,
      0,
      30,
      {},
      {
        // @ts-ignore -- pre-existing untyped test mock boundary
        buildHighEndSectors(props) {
          receivedProps = props;
          return [];
        }
      },
      { colors: { warning: "#123456", alarm: "#654321" } }
    );

    expect(sectors).toEqual([]);
    expect(receivedProps).toEqual({ warningFrom: undefined, alarmFrom: undefined });
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js", context);

    expect(context.DyniComponents.DyniSpeedRadialWidget.id).toBe("SpeedRadialWidget");
  });
});
