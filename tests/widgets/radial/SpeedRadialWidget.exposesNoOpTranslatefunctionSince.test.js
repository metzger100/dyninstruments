// @ts-check
const {
  createComponentContextMock,
  createScriptContext,
  loadFresh,
  runIifeScript
} = require("./SpeedRadialWidget-setup");

/**
 * @typedef {(text: unknown, defaultText: unknown) => unknown} SpeedNormalize
 * @typedef {{ formatter?: unknown, formatterParameters?: unknown, default?: unknown }} SpeedGaugeProps
 * @typedef {(
 *   value: number,
 *   options: { formatter: unknown, formatterParameters: unknown, default: unknown }
 * ) => unknown} SpeedApplyFormatter
 * @typedef {(
 *   raw: unknown,
 *   props: SpeedGaugeProps,
 *   applyFormatter: SpeedApplyFormatter,
 *   normalize: SpeedNormalize,
 *   defaultFormatter: unknown,
 *   defaultParameters: unknown
 * ) => { num: unknown, text: string }} SpeedFormatGaugeDisplay
 * @typedef {{ buildHighEndSectors: (props: unknown) => unknown[] }} SpeedSectorMath
 * @typedef {(raw: unknown, props: SpeedGaugeProps) => { num: unknown, text: unknown }} SpeedFormatDisplay
 * @typedef {(
 *   props: unknown,
 *   minV: number,
 *   maxV: number,
 *   arc: unknown,
 *   valueUtils: SpeedSectorMath,
 *   theme: unknown
 * ) => unknown[]} SpeedBuildSectors
 * @typedef {{ formatDisplay: SpeedFormatDisplay, buildSectors: SpeedBuildSectors }} SpeedCapturedSpec
 */

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
                /** @type {SpeedNormalize} */
                normalize(text, defaultText) {
                  return defaultText === null || defaultText === undefined ? "---" : defaultText;
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
    /** @type {SpeedCapturedSpec | undefined} */
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
                /** @param {SpeedCapturedSpec} cfg */
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
                /** @type {SpeedFormatGaugeDisplay} */
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
                /** @param {unknown} text @returns {unknown} */
                normalize(text) {
                  return text;
                }
              };
            }
          }
        }
      })
    );

    if (!captured) {
      throw new Error("SemicircleRadialEngine renderer configuration was not captured.");
    }

    // formatDisplay called without the trailing unit argument (as the
    // engine does whenever a widget instance has no configured unit prop).
    captured.formatDisplay(6.44, { formatter: "formatSpeed" });
    expect(receivedFormatterParameters).toEqual(["kn"]);

    const sectors = captured.buildSectors(
      undefined,
      0,
      30,
      {},
      {
        /** @param {unknown} props @returns {unknown[]} */
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
