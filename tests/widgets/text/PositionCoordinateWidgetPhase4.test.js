const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("PositionCoordinateWidget phase 4", function () {
  /** @type {any} */
  let previousAvnav;

  beforeEach(function () {
    previousAvnav = /** @type {any} */ (globalThis).avnav;
    delete (/** @type {any} */ (globalThis).avnav);
  });

  afterEach(function () {
    if (typeof previousAvnav === "undefined") delete (/** @type {any} */ (globalThis).avnav);
    else /** @type {any} */ (globalThis).avnav = previousAvnav;
  });

  function makeComponentContext() {
    const themeTokens = {
      surface: { fg: "#fff" },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 730,
        labelWeight: 610
      }
    };
    const textLayoutEngineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
    const modules = {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      CanvasTextLayout: loadFresh("shared/widget-kits/text/CanvasTextLayout.js"),
      ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js")
    };
    const applyFormatter = vi.fn(function (raw, props) {
      const fpRaw = props && props.formatterParameters;
      let fp;
      if (Array.isArray(fpRaw)) {
        fp = fpRaw;
      } else if (typeof fpRaw === "string") {
        fp = fpRaw.split(",");
      } else {
        fp = [];
      }
      try {
        if (props && typeof props.formatter === "function") {
          return props.formatter.apply(null, [raw].concat(fp));
        }
        const avnav = /** @type {any} */ (globalThis).avnav;
        if (
          props &&
          typeof props.formatter === "string" &&
          avnav &&
          avnav.api &&
          avnav.api.formatter &&
          typeof avnav.api.formatter[props.formatter] === "function"
        ) {
          return avnav.api.formatter[props.formatter].apply(avnav.api.formatter, [raw].concat(fp));
        }
      } catch (ignore) {
        // intentionally ignored
      }
      if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
      return String(raw);
    });

    return createComponentContextMock({
      modules: {
        ThemeResolver: {
          resolveForRoot() {
            return themeTokens;
          }
        },
        TextLayoutEngine: textLayoutEngineModule,
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        RadialAngleMath: modules.RadialAngleMath,
        RadialTextFitting: modules.RadialTextFitting,
        CanvasTextLayout: modules.CanvasTextLayout,
        ValueMath: modules.ValueMath,
        TextLayoutPrimitives: modules.TextLayoutPrimitives,
        TextLayoutComposite: modules.TextLayoutComposite,
        ResponsiveScaleProfile: modules.ResponsiveScaleProfile
      },
      services: {
        format: { applyFormatter },
        canvas: {
          /** @param {any} canvas */
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return {
              ctx,
              W: Math.round(rect.width),
              H: Math.round(rect.height)
            };
          }
        },
        dom: {
          /** @param {any} target */
          requirePluginRoot(target) {
            return target;
          }
        },
        themeTokens: {
          resolveForRoot() {
            return themeTokens;
          }
        }
      }
    });
  }

  /** @param {any} ctx @returns {string[]} */
  function fillTextValues(ctx) {
    return ctx.calls
      .filter((/** @type {any} */ c) => c.name === "fillText")
      .map((/** @type {any} */ c) => String(c.args[0]));
  }

  /** @param {any} ctx @returns {any[]} */
  function captureTextCalls(ctx) {
    const captured = /** @type {any[]} */ ([]);
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        x: arguments[1],
        y: arguments[2],
        font: ctx.font
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  /** @param {any[]} calls @param {any} text @returns {any} */
  function findTextCall(calls, text) {
    return calls.find((/** @type {any} */ entry) => entry.text === text);
  }

  it("defaults dateTime and timeStatus to mono font and centered alignment", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    /** @type {any} */ (globalThis).avnav = {
      api: {
        formatter: {
          /** @param {any} value */
          formatDate(value) {
            return value === rawClock ? "DATE" : "DATE_BAD";
          },
          /** @param {any} value */
          formatTime(value) {
            return value === rawClock ? "TIME" : "TIME_BAD";
          }
        }
      }
    };

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js").create(
      {},
      makeComponentContext()
    );

    [
      {
        displayVariant: "dateTime",
        value: [rawClock, rawClock],
        expectedTexts: ["DATE", "TIME"],
        fontText: "TIME"
      },
      {
        displayVariant: "timeStatus",
        value: [rawClock, true],
        expectedTexts: ["🟢", "TIME"],
        fontText: "TIME"
      }
    ].forEach(function (item) {
      const ctx = createMockContext2D();
      const captured = captureTextCalls(ctx);
      const canvas = createMockCanvas({ rectWidth: 220, rectHeight: 140, ctx });

      spec.renderCanvas(canvas, {
        value: item.value,
        displayVariant: item.displayVariant,
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      item.expectedTexts.forEach(function (text) {
        expect(fillTextValues(ctx)).toContain(text);
      });
      expect(String(ctx.textAlign)).toBe("center");
      expect(String(findTextCall(captured, item.fontText).font)).toContain("monospace");
    });
  });

  it("keeps dateTime centered and proportional when stableDigits is disabled", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    /** @type {any} */ (globalThis).avnav = {
      api: {
        formatter: {
          /** @param {any} value */
          formatDate(value) {
            return value === rawClock ? "DATE" : "DATE_BAD";
          },
          /** @param {any} value */
          formatTime(value) {
            return value === rawClock ? "TIME" : "TIME_BAD";
          }
        }
      }
    };

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js").create(
      {},
      makeComponentContext()
    );

    const ctx = createMockContext2D();
    const captured = captureTextCalls(ctx);
    const canvas = createMockCanvas({ rectWidth: 220, rectHeight: 140, ctx });

    spec.renderCanvas(canvas, {
      value: [rawClock, rawClock],
      displayVariant: "dateTime",
      stableDigits: false,
      coordinatesTabular: true,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA"
    });

    expect(fillTextValues(ctx)).toContain("DATE");
    expect(fillTextValues(ctx)).toContain("TIME");
    expect(String(ctx.textAlign)).toBe("center");
    expect(String(findTextCall(captured, "TIME").font)).toContain("sans-serif");
  });
});
