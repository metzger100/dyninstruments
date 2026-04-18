const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("CenterDisplayTextWidget", function () {
  function makeHelpers(options) {
    const opts = options || {};
    const themeTokens = {
      surface: {
        fg: "#ffffff"
      },
      font: {
        family: "sans-serif",
        weight: 720,
        labelWeight: 610
      }
    };
    const modules = {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      RadialValueMath: loadFresh("shared/widget-kits/radial/RadialValueMath.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      RadialTextLayout: loadFresh("shared/widget-kits/radial/RadialTextLayout.js"),
      TextLayoutEngine: loadFresh("shared/widget-kits/text/TextLayoutEngine.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      CenterDisplayLayout: loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js"),
      CenterDisplayMath: loadFresh("shared/widget-kits/nav/CenterDisplayMath.js")
    };

    return {
      applyFormatter(value, formatterOptions) {
        if (typeof opts.applyFormatter === "function") {
          return opts.applyFormatter(value, formatterOptions);
        }
        if (formatterOptions.formatter === "formatLonLatsDecimal") {
          if (typeof value !== "number" || !isFinite(value)) {
            return formatterOptions.default;
          }
          return (formatterOptions.formatterParameters[0] === "lat" ? "LAT:" : "LON:") + value.toFixed(3);
        }
        if (formatterOptions.formatter === "formatDirection") {
          if (typeof value !== "number" || !isFinite(value)) {
            return formatterOptions.default;
          }
          return String(Math.round(value));
        }
        if (formatterOptions.formatter === "formatDistance") {
          if (typeof value !== "number" || !isFinite(value)) {
            return formatterOptions.default;
          }
          return value.toFixed(1);
        }
        return value == null ? formatterOptions.default : String(value);
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
        if (id === "PlaceholderNormalize") {
          return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        }
        if (id === "CenterDisplayStateAdapter") {
          return loadFresh("shared/widget-kits/text/CenterDisplayStateAdapter.js");
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

  function makeProps(overrides) {
    const opts = overrides || {};
    return {
      display: {
        position: Object.prototype.hasOwnProperty.call(opts, "position") ? opts.position : { lat: 54.123, lon: 10.456 },
        marker: Object.prototype.hasOwnProperty.call(opts, "marker") ? opts.marker : { course: 92, distance: 12.3 },
        boat: Object.prototype.hasOwnProperty.call(opts, "boat") ? opts.boat : { course: 184, distance: 3.4 },
        measure: {
          activeMeasure: Object.prototype.hasOwnProperty.call(opts, "activeMeasure")
            ? opts.activeMeasure
            : { getPointAtIndex: (index) => index === 0 ? { lat: 54.18, lon: 10.52 } : undefined },
          useRhumbLine: opts.useRhumbLine === true
        }
      },
      captions: {
        position: "CENTER",
        marker: "WP",
        boat: "POS",
        measure: "MEAS"
      },
      units: {
        marker: "nm",
        boat: "nm",
        measure: "nm"
      },
      ratioThresholdNormal: Object.prototype.hasOwnProperty.call(opts, "ratioThresholdNormal") ? opts.ratioThresholdNormal : 1.1,
      ratioThresholdFlat: Object.prototype.hasOwnProperty.call(opts, "ratioThresholdFlat") ? opts.ratioThresholdFlat : 2.4,
      disconnect: opts.disconnect === true,
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

  function findAllTexts(calls, text) {
    return calls.filter((entry) => entry.text === text);
  }

  function findFirstTextPrefix(calls, prefix) {
    return calls.find((entry) => entry.text.indexOf(prefix) === 0);
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

  function captureTextCalls(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        x: arguments[1],
        y: arguments[2],
        textAlign: ctx.textAlign
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  function parseFontPx(font) {
    const match = /(\d+)px/.exec(String(font || ""));
    return match ? Number(match[1]) : 0;
  }

  function computeLayoutSnapshot(width, height, mode, relationCount) {
    const layout = loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js").create({}, makeHelpers());
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return layout.computeLayout({
      contentRect: contentRect,
      mode: mode,
      relationCount: relationCount,
      gap: insets.gap,
      responsive: insets.responsive,
      normalCaptionShare: 0.28,
      flatCenterShare: 0.42,
      highCaptionRatio: 0.24,
      flatCaptionRatio: 0.22
    });
  }

  function expectTextsInsideCanvas(calls, width, height) {
    calls.forEach((entry) => {
      expect(entry.x).toBeGreaterThanOrEqual(0);
      expect(entry.x).toBeLessThanOrEqual(width);
      expect(entry.y).toBeGreaterThanOrEqual(0);
      expect(entry.y).toBeLessThanOrEqual(height);
    });
  }

  it("exposes the center-display renderer contract", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);

    expect(spec.id).toBe("CenterDisplayTextWidget");
    expect(spec.wantsHideNativeHead).toBe(true);
  });

  it("renders high mode with stacked coordinates and ordered relation rows", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 140, rectHeight: 260, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const lon = findFirstText(texts, "LON:10.456");
    const meas = findFirstText(texts, "MEAS");
    const wp = findFirstText(texts, "WP");
    const boat = findFirstText(texts, "POS");

    expect(center).toBeTruthy();
    expect(lat).toBeTruthy();
    expect(lon).toBeTruthy();
    expect(meas).toBeTruthy();
    expect(wp).toBeTruthy();
    expect(boat).toBeTruthy();
    expect(center.y).toBeLessThan(lat.y);
    expect(lat.y).toBeLessThan(lon.y);
    expect(lon.y).toBeLessThan(meas.y);
    expect(meas.y).toBeLessThan(wp.y);
    expect(wp.y).toBeLessThan(boat.y);
  });

  it("renders normal mode with caption left and centered coordinates", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });
    const calls = captureTextCalls(ctx);

    spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const lon = findFirstText(texts, "LON:10.456");
    const wp = findFirstText(texts, "WP");
    const latCall = calls.find((entry) => entry.text.indexOf("LAT:") === 0);
    const lonCall = calls.find((entry) => entry.text.indexOf("LON:") === 0);

    expect(center).toBeTruthy();
    expect(lat).toBeTruthy();
    expect(lon).toBeTruthy();
    expect(wp).toBeTruthy();
    expect(center.x).toBeLessThan(lat.x);
    expect(center.x).toBeLessThan(lon.x);
    expect(latCall).toBeTruthy();
    expect(lonCall).toBeTruthy();
    expect(latCall.textAlign).toBe("center");
    expect(lonCall.textAlign).toBe("center");
    expect(lat.y).toBeLessThan(wp.y);
    expect(lon.y).toBeLessThan(wp.y);
  });

  it("renders flat mode with the center panel on the left and rows on the right", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 520, rectHeight: 100, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const wp = findFirstText(texts, "WP");
    const boat = findFirstText(texts, "POS");

    expect(center.x).toBeLessThan(wp.x);
    expect(lat.x).toBeLessThan(wp.x);
    expect(wp.y).toBeLessThan(boat.y);
  });

  it("centers relation rows while keeping the WP and POS captions attached to their values", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const cases = [
      { width: 140, height: 260, mode: "high" },
      { width: 260, height: 180, mode: "normal" },
      { width: 520, height: 100, mode: "flat" }
    ];

    cases.forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const texts = fillTextCalls(ctx);
      const wp = findFirstText(texts, "WP");
      const pos = findFirstText(texts, "POS");
      const layout = computeLayoutSnapshot(size.width, size.height, size.mode, 2);

      expect(wp).toBeTruthy();
      expect(pos).toBeTruthy();
      expect(wp.x).toBeGreaterThan(layout.rowRects[0].x);
      expect(wp.x).toBeLessThan(layout.rowRects[0].x + (layout.rowRects[0].w / 2));
      expect(pos.x).toBeGreaterThan(layout.rowRects[1].x);
      expect(pos.x).toBeLessThan(layout.rowRects[1].x + (layout.rowRects[1].w / 2));
    });
  });

  it("omits the measure row when no active measure is available", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

    const texts = fillTextCalls(ctx);
    expect(findFirstText(texts, "MEAS")).toBeUndefined();
    expect(findFirstText(texts, "WP")).toBeTruthy();
    expect(findFirstText(texts, "POS")).toBeTruthy();
  });

  it("renders placeholders for missing coordinates and relation values", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({
      position: null,
      marker: {},
      boat: {},
      activeMeasure: undefined
    }));

    const texts = fillTextCalls(ctx);
    expect(findAllTexts(texts, "---").length).toBeGreaterThanOrEqual(2);
    expect(findAllTexts(texts, "--- / ---").length).toBe(2);
  });

  it("normalizes known formatter fallback tokens for coordinates and relation rows", function () {
    const helpers = makeHelpers({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatLonLatsDecimal") {
          return cfg.formatterParameters && cfg.formatterParameters[0] === "lat"
            ? "-----"
            : "--:--";
        }
        if (cfg.formatter === "formatDirection") {
          return "--:--:--";
        }
        if (cfg.formatter === "formatDistance") {
          return "    -";
        }
        return cfg.default;
      }
    });
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({
      activeMeasure: undefined,
      default: "---"
    }));

    const texts = fillTextCalls(ctx).map((entry) => entry.text);
    expect(texts.filter((entry) => entry === "---").length).toBeGreaterThanOrEqual(2);
    expect(texts.filter((entry) => entry === "--- / ---").length).toBe(2);
    expect(texts).not.toContain("-----");
    expect(texts).not.toContain("--:--");
  });

  it("keeps compact nav-page-like sizes inside the canvas while preserving waypoint and boat rows", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const sizes = [
      { width: 120, height: 60 },
      { width: 120, height: 80 },
      { width: 140, height: 90 }
    ];

    sizes.forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const texts = fillTextCalls(ctx);
      expect(findFirstTextPrefix(texts, "C")).toBeTruthy();
      expect(findFirstText(texts, "WP")).toBeTruthy();
      expect(findFirstText(texts, "POS")).toBeTruthy();
      expectTextsInsideCanvas(texts, size.width, size.height);
    });
  });

  it("keeps compact measured layouts inside the canvas when the measure row is present", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 120, rectHeight: 80, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    expect(findFirstText(texts, "MEAS")).toBeTruthy();
    expect(findFirstText(texts, "WP")).toBeTruthy();
    expect(findFirstText(texts, "POS")).toBeTruthy();
    expectTextsInsideCanvas(texts, 120, 80);
  });

  it("keeps compact flat and high layouts inside the canvas while preserving waypoint and boat rows", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const sizes = [
      { width: 220, height: 80 },
      { width: 120, height: 140 }
    ];

    sizes.forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const texts = fillTextCalls(ctx);
      expect(findFirstText(texts, "WP")).toBeTruthy();
      expect(findFirstText(texts, "POS")).toBeTruthy();
      expect(findFirstTextPrefix(texts, "LAT:")).toBeTruthy();
      expect(findFirstTextPrefix(texts, "LON:")).toBeTruthy();
      expectTextsInsideCanvas(texts, size.width, size.height);
    });
  });

  it("keeps coordinate font sizes aligned with relation value rows in normal and flat modes", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const sizes = [
      { width: 260, height: 180 },
      { width: 520, height: 100 }
    ];

    sizes.forEach((size) => {
      const ctx = createMockContext2D();
      const fonts = captureTextFonts(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const latCall = fonts.find((entry) => entry.text === "LAT:54.123");
      const lonCall = fonts.find((entry) => entry.text === "LON:10.456");
      const wpValueCall = fonts.find((entry) => entry.text === "92\u00b0 / 12.3nm");
      const boatValueCall = fonts.find((entry) => entry.text === "184\u00b0 / 3.4nm");

      expect(latCall).toBeTruthy();
      expect(lonCall).toBeTruthy();
      expect(wpValueCall).toBeTruthy();
      expect(boatValueCall).toBeTruthy();
      expect(Math.abs(parseFontPx(latCall.font) - parseFontPx(wpValueCall.font))).toBeLessThanOrEqual(1);
      expect(Math.abs(parseFontPx(lonCall.font) - parseFontPx(boatValueCall.font))).toBeLessThanOrEqual(1);
    });
  });

  it("increases compact text fill on smaller normal widgets without changing the layout mode", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const sizes = {
      compact: { width: 161, height: 80 },
      large: { width: 512, height: 265 }
    };
    const captured = {};

    Object.keys(sizes).forEach((key) => {
      const size = sizes[key];
      const ctx = createMockContext2D();
      const fonts = captureTextFonts(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });
      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));
      captured[key] = fonts;
    });

    const compactLayout = computeLayoutSnapshot(sizes.compact.width, sizes.compact.height, "normal", 2);
    const largeLayout = computeLayoutSnapshot(sizes.large.width, sizes.large.height, "normal", 2);
    const compactLat = captured.compact.find((entry) => entry.text.indexOf("LAT:") === 0);
    const largeLat = captured.large.find((entry) => entry.text.indexOf("LAT:") === 0);
    const compactWpValue = captured.compact.find((entry) => entry.text.indexOf("92") === 0);
    const largeWpValue = captured.large.find((entry) => entry.text.indexOf("92") === 0);

    expect(compactLat).toBeTruthy();
    expect(largeLat).toBeTruthy();
    expect(compactWpValue).toBeTruthy();
    expect(largeWpValue).toBeTruthy();
    expect(parseFontPx(compactLat.font) / compactLayout.center.latRect.h).toBeGreaterThan(
      parseFontPx(largeLat.font) / largeLayout.center.latRect.h
    );
    expect(parseFontPx(compactWpValue.font) / compactLayout.rowRects[0].h).toBeGreaterThan(
      parseFontPx(largeWpValue.font) / largeLayout.rowRects[0].h
    );
  });

  it("renders disconnected state-screen instead of center and relation rows", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js")
      .create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({ disconnect: true }));

    const texts = fillTextCalls(ctx).map((entry) => entry.text);
    expect(texts).toContain("GPS Lost");
    expect(texts).not.toContain("CENTER");
    expect(texts).not.toContain("WP");
    expect(texts).not.toContain("POS");
  });
});
