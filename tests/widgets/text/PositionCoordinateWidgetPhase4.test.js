const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("PositionCoordinateWidget phase 4", function () {
  let previousAvnav;

  beforeEach(function () {
    previousAvnav = globalThis.avnav;
    delete globalThis.avnav;
  });

  afterEach(function () {
    if (typeof previousAvnav === "undefined") delete globalThis.avnav;
    else globalThis.avnav = previousAvnav;
  });

  function makeHelpers() {
    const themeTokens = {
      surface: { fg: "#fff" },
      font: { family: "sans-serif", familyMono: "monospace", weight: 730, labelWeight: 610 }
    };
    const textLayoutEngineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
    const modules = {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      RadialTextLayout: loadFresh("shared/widget-kits/radial/RadialTextLayout.js"),
      RadialValueMath: loadFresh("shared/widget-kits/radial/RadialValueMath.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js")
    };
    const applyFormatter = vi.fn(function (raw, props) {
      const fpRaw = props && props.formatterParameters;
      const fp = Array.isArray(fpRaw) ? fpRaw : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
      try {
        if (props && typeof props.formatter === "function") {
          return props.formatter.apply(null, [raw].concat(fp));
        }
        if (
          props &&
          typeof props.formatter === "string" &&
          globalThis.avnav &&
          globalThis.avnav.api &&
          globalThis.avnav.api.formatter &&
          typeof globalThis.avnav.api.formatter[props.formatter] === "function"
        ) {
          return globalThis.avnav.api.formatter[props.formatter].apply(globalThis.avnav.api.formatter, [raw].concat(fp));
        }
      } catch (ignore) {}
      if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
      return String(raw);
    });

    return {
      applyFormatter,
      setupCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        return {
          ctx,
          W: Math.round(rect.width),
          H: Math.round(rect.height)
        };
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      resolveTextColor() {
        return "#fff";
      },
      requirePluginRoot(target) {
        return target;
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return {
            resolveForRoot() {
              return themeTokens;
            }
          };
        }
        if (id === "TextLayoutEngine") {
          return textLayoutEngineModule;
        }
        if (id === "PlaceholderNormalize") {
          return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        }
        if (id === "StateScreenLabels") {
          return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        }
        if (id === "StateScreenPrecedence") {
          return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
        }
        if (id === "StateScreenCanvasOverlay") {
          return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js");
        }
        if (modules[id]) {
          return modules[id];
        }
        throw new Error("unexpected module: " + id);
      }
    };
  }

  function fillTextValues(ctx) {
    return ctx.calls
      .filter((c) => c.name === "fillText")
      .map((c) => String(c.args[0]));
  }

  function captureTextCalls(ctx) {
    const captured = [];
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

  function findTextCall(calls, text) {
    return calls.find((entry) => entry.text === text);
  }

  it("defaults dateTime and timeStatus to mono font and centered alignment", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) { return value === rawClock ? "DATE" : "DATE_BAD"; },
          formatTime(value) { return value === rawClock ? "TIME" : "TIME_BAD"; }
        }
      }
    };

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

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
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) { return value === rawClock ? "DATE" : "DATE_BAD"; },
          formatTime(value) { return value === rawClock ? "TIME" : "TIME_BAD"; }
        }
      }
    };

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

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
