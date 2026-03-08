const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("ActiveRouteTextWidget", function () {
  function makeHelpers() {
    const themeTokens = {
      colors: {
        warning: "#f0c24b"
      },
      font: {
        weight: 720,
        labelWeight: 610
      }
    };
    const modules = {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      RadialTextLayout: loadFresh("shared/widget-kits/radial/RadialTextLayout.js"),
      RadialValueMath: loadFresh("shared/widget-kits/radial/RadialValueMath.js"),
      TextLayoutEngine: loadFresh("shared/widget-kits/text/TextLayoutEngine.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js")
    };

    return {
      applyFormatter(value, opts) {
        if (opts.formatter === "formatDistance") {
          if (typeof value !== "number" || !isFinite(value)) {
            return opts.default;
          }
          return value.toFixed(1);
        }
        if (opts.formatter === "formatTime") {
          if (!(value instanceof Date)) {
            return opts.default;
          }
          return "11:45:00";
        }
        if (opts.formatter === "formatDirection") {
          if (typeof value !== "number" || !isFinite(value)) {
            return opts.default;
          }
          return String(Math.round(value));
        }
        return value == null ? opts.default : String(value);
      },
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
        return "#ffffff";
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return {
            create() {
              return {
                resolve() {
                  return themeTokens;
                }
              };
            }
          };
        }
        if (modules[id]) {
          return modules[id];
        }
        throw new Error("unexpected module: " + id);
      }
    };
  }

  function makeProps(overrides) {
    const opts = overrides || {};
    return {
      routeName: Object.prototype.hasOwnProperty.call(opts, "routeName") ? opts.routeName : "Harbor Run",
      disconnect: opts.disconnect === true,
      display: {
        remain: Object.prototype.hasOwnProperty.call(opts, "remain") ? opts.remain : 12.3,
        eta: Object.prototype.hasOwnProperty.call(opts, "eta") ? opts.eta : new Date("2026-03-06T11:45:00Z"),
        nextCourse: Object.prototype.hasOwnProperty.call(opts, "nextCourse") ? opts.nextCourse : 87,
        isApproaching: opts.isApproaching === true
      },
      captions: {
        remain: Object.prototype.hasOwnProperty.call(opts, "remainCaption") ? opts.remainCaption : "RTE",
        eta: Object.prototype.hasOwnProperty.call(opts, "etaCaption") ? opts.etaCaption : "ETA",
        nextCourse: Object.prototype.hasOwnProperty.call(opts, "nextCourseCaption") ? opts.nextCourseCaption : "NEXT"
      },
      units: {
        remain: Object.prototype.hasOwnProperty.call(opts, "remainUnit") ? opts.remainUnit : "nm",
        eta: Object.prototype.hasOwnProperty.call(opts, "etaUnit") ? opts.etaUnit : "",
        nextCourse: Object.prototype.hasOwnProperty.call(opts, "nextCourseUnit") ? opts.nextCourseUnit : "°"
      },
      ratioThresholdNormal: Object.prototype.hasOwnProperty.call(opts, "ratioThresholdNormal")
        ? opts.ratioThresholdNormal
        : 1.2,
      ratioThresholdFlat: Object.prototype.hasOwnProperty.call(opts, "ratioThresholdFlat")
        ? opts.ratioThresholdFlat
        : 3.8,
      default: Object.prototype.hasOwnProperty.call(opts, "default") ? opts.default : "---"
    };
  }

  function fillTextCalls(ctx) {
    return ctx.calls
      .filter((entry) => entry.name === "fillText")
      .map((entry) => ({
        text: String(entry.args[0]),
        x: entry.args[1],
        y: entry.args[2]
      }));
  }

  function findFirstText(calls, text) {
    return calls.find((entry) => entry.text === text);
  }

  function captureTextFonts(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        font: ctx.font
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  it("renders non-approach normal mode as a two-column metric layout", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const nameCall = findFirstText(texts, "Harbor Run");
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    expect(nameCall).toBeTruthy();
    expect(remainCall).toBeTruthy();
    expect(etaCall).toBeTruthy();
    expect(findFirstText(texts, "NEXT")).toBeUndefined();
    expect(remainCall.x).toBeLessThan(etaCall.x);
    expect(Math.abs(remainCall.y - etaCall.y)).toBeLessThan(3);
    expect(nameCall.y).toBeLessThan(remainCall.y);
  });

  it("renders non-approach high mode with stacked full-width metrics", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 140, rectHeight: 260, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    expect(findFirstText(texts, "NEXT")).toBeUndefined();
    expect(remainCall).toBeTruthy();
    expect(etaCall).toBeTruthy();
    expect(etaCall.y).toBeGreaterThan(remainCall.y);
    expect(Math.abs(remainCall.x - etaCall.x)).toBeLessThan(3);
  });

  it("renders non-approach flat mode with route name left and metrics right", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 520, rectHeight: 100, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const nameCall = findFirstText(texts, "Harbor Run");
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    expect(findFirstText(texts, "NEXT")).toBeUndefined();
    expect(nameCall.x).toBeLessThan(remainCall.x);
    expect(remainCall.x).toBeLessThan(etaCall.x);
    expect(Math.abs(remainCall.y - etaCall.y)).toBeLessThan(3);
  });

  it("keeps borderline wide default layouts in flat mode", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 400, rectHeight: 100, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const nameCall = findFirstText(texts, "Harbor Run");
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    expect(nameCall.x).toBeLessThan(remainCall.x);
    expect(remainCall.x).toBeLessThan(etaCall.x);
    expect(Math.abs(remainCall.y - etaCall.y)).toBeLessThan(3);
  });

  it("renders approach high mode with NEXT below ETA", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 140, rectHeight: 300, ctx });

    spec.renderCanvas(canvas, makeProps({ isApproaching: true }));

    const texts = fillTextCalls(ctx);
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    const nextCall = findFirstText(texts, "NEXT");
    expect(nextCall).toBeTruthy();
    expect(remainCall.y).toBeLessThan(etaCall.y);
    expect(etaCall.y).toBeLessThan(nextCall.y);
  });

  it("renders approach normal mode with NEXT on a second full-width row", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 280, rectHeight: 200, ctx });

    spec.renderCanvas(canvas, makeProps({ isApproaching: true }));

    const texts = fillTextCalls(ctx);
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    const nextCall = findFirstText(texts, "NEXT");
    expect(nextCall).toBeTruthy();
    expect(remainCall.x).toBeLessThan(etaCall.x);
    expect(nextCall.y).toBeGreaterThan(remainCall.y);
    expect(Math.abs(remainCall.y - etaCall.y)).toBeLessThan(3);
  });

  it("renders approach flat mode with three metric columns and accent fill", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 560, rectHeight: 100, ctx });

    spec.renderCanvas(canvas, makeProps({ isApproaching: true }));

    const texts = fillTextCalls(ctx);
    const remainCall = findFirstText(texts, "RTE");
    const etaCall = findFirstText(texts, "ETA");
    const nextCall = findFirstText(texts, "NEXT");
    expect(nextCall).toBeTruthy();
    expect(remainCall.x).toBeLessThan(etaCall.x);
    expect(etaCall.x).toBeLessThan(nextCall.x);
    expect(ctx.calls.some((entry) => entry.name === "fillRect")).toBe(true);
  });

  it("keeps NEXT visible with placeholder text when approaching but course is missing", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 560, rectHeight: 100, ctx });

    spec.renderCanvas(canvas, makeProps({
      isApproaching: true,
      nextCourse: undefined
    }));

    const texts = fillTextCalls(ctx).map((entry) => entry.text);
    expect(texts).toContain("NEXT");
    expect(texts).toContain("---");
  });

  it("uses the primary font weight for the route name in normal mode", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const fonts = captureTextFonts(ctx);
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps());

    const routeName = fonts.find((entry) => entry.text === "Harbor Run");
    expect(routeName).toBeTruthy();
    expect(routeName.font.startsWith("720 ")).toBe(true);
  });

  it("trims long route names to fit the flat-mode name panel", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D({ charWidth: 10 });
    const canvas = createMockCanvas({ rectWidth: 220, rectHeight: 48, ctx });
    const longName = "Very Long Route Name Alpha Bravo Charlie Delta";

    spec.renderCanvas(canvas, makeProps({ routeName: longName }));

    const textCalls = fillTextCalls(ctx);
    const routeText = textCalls.find((entry) => entry.text.startsWith("Very"));
    expect(routeText).toBeTruthy();
    expect(routeText.text).not.toBe(longName);
  });

  it("shows placeholders and disconnect overlay when disconnected", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({
      routeName: "",
      isApproaching: true,
      nextCourse: undefined,
      disconnect: true
    }));

    const texts = fillTextCalls(ctx).map((entry) => entry.text);
    expect(texts).toContain("---");
    expect(texts).toContain("NEXT");
    expect(texts).toContain("NO DATA");
  });
});
