// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteHtmlFitSupport (part 2 - isLineTrimmed / selectMetricValue / resolveMetricPx / measure* / resolveNamePxRatio)", function () {
  function createSupport(moduleOverrides) {
    const componentContext = createComponentContextMock({
      modules: Object.assign({}, moduleOverrides || {})
    });
    return loadFresh("shared/widget-kits/nav/EditRouteHtmlFitSupport.js").create({}, componentContext);
  }

  function createRealHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create({}, createComponentContextMock({}));
  }

  describe("isLineTrimmed", function () {
    it("returns false when lineFit is falsy", function () {
      const support = createSupport();
      expect(support.isLineTrimmed(null, "abc")).toBe(false);
    });

    it("returns false when lineFit has no own text property", function () {
      const support = createSupport();
      expect(support.isLineTrimmed({}, "abc")).toBe(false);
    });

    it("returns false when lineFit.text equals the source text", function () {
      const support = createSupport();
      expect(support.isLineTrimmed({ text: "abc" }, "abc")).toBe(false);
    });

    it("returns true when lineFit.text differs from the source text", function () {
      const support = createSupport();
      expect(support.isLineTrimmed({ text: "abd" }, "abc")).toBe(true);
    });
  });

  describe("selectMetricValue", function () {
    function baseArgs(measureFittedLine) {
      return {
        primaryText: "12345.6",
        plainText: "12.3",
        rect: { w: 50, h: 20 },
        maxPxRatio: 0.5,
        textApi: {},
        tileLayout: { measureFittedLine: measureFittedLine },
        ctx: {},
        valueFamily: "sans-serif",
        valueWeight: 700,
        textFillScale: 1,
        htmlUtils: createRealHtmlUtils()
      };
    }

    it("always returns the primary text when stable digits are disabled", function () {
      const support = createSupport();
      const measureFittedLine = vi.fn(() => ({ text: "trimmed", px: 5 }));
      const args = Object.assign(baseArgs(measureFittedLine), {
        stableDigitsEnabled: false
      });
      const result = support.selectMetricValue(args);
      expect(result.text).toBe("12345.6");
      expect(measureFittedLine).toHaveBeenCalledTimes(1);
    });

    it("returns the primary text when stable digits are enabled but the primary fit is not trimmed", function () {
      const support = createSupport();
      const measureFittedLine = vi.fn((args) => ({
        text: args.text,
        px: 10
      }));
      const args = Object.assign(baseArgs(measureFittedLine), {
        stableDigitsEnabled: true
      });
      const result = support.selectMetricValue(args);
      expect(result.text).toBe("12345.6");
      expect(measureFittedLine).toHaveBeenCalledTimes(1);
    });

    it("switches to the plain text when stable digits are enabled and the primary fit is trimmed", function () {
      const support = createSupport();
      const measureFittedLine = vi.fn((callArgs) => {
        if (callArgs.text === "12345.6") {
          return { text: "XXXXX", px: 5 };
        }
        return { text: callArgs.text, px: 8 };
      });
      const args = Object.assign(baseArgs(measureFittedLine), {
        stableDigitsEnabled: true
      });
      const result = support.selectMetricValue(args);
      expect(result.text).toBe("12.3");
      expect(result.fit.text).toBe("12.3");
      expect(result.fit.px).toBe(8);
      expect(measureFittedLine).toHaveBeenCalledTimes(2);
    });
  });

  describe("resolveMetricPx", function () {
    it("returns the finite px value when present", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      expect(support.resolveMetricPx({ px: 12 }, htmlUtils)).toBe(12);
    });

    it("returns 0 when lineFit has no px", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      expect(support.resolveMetricPx({}, htmlUtils)).toBe(0);
    });

    it("returns 0 when lineFit is null", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      expect(support.resolveMetricPx(null, htmlUtils)).toBe(0);
    });
  });

  describe("measureEditRouteStyle / measureEditRoutePx (bound closures)", function () {
    it("measureEditRouteStyle delegates to htmlMeasureUtils.measureStyle", function () {
      const measureStyle = vi.fn(() => "font-size:9px;");
      const support = createSupport({
        HtmlMeasureUtils: { create: () => ({ measureStyle: measureStyle }) }
      });
      const tileLayout = { measureFittedLine: vi.fn() };
      const args = {
        text: "abc",
        rect: { w: 10, h: 10 },
        tileLayout: tileLayout
      };
      const style = support.measureEditRouteStyle(args);
      expect(style).toBe("font-size:9px;");
      expect(measureStyle).toHaveBeenCalledWith(args, expect.anything(), tileLayout);
    });

    it("measureEditRoutePx delegates to measureLineFit and returns its px", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      const measureFittedLine = vi.fn(() => ({ text: "12.3", px: 14 }));
      const px = support.measureEditRoutePx({
        text: "12.3",
        rect: { w: 50, h: 20 },
        maxPxRatio: 0.5,
        htmlUtils: htmlUtils,
        tileLayout: { measureFittedLine: measureFittedLine },
        textApi: {},
        ctx: {},
        family: "sans-serif",
        weight: 700,
        textFillScale: 1
      });
      expect(px).toBe(14);
    });

    it("measureEditRoutePx returns 0 when measureLineFit yields null", function () {
      const support = createSupport();
      const px = support.measureEditRoutePx({
        text: "",
        rect: { w: 50, h: 20 }
      });
      expect(px).toBe(0);
    });
  });

  describe("resolveNamePxRatio", function () {
    it("resolves the flat ratio", function () {
      const support = createSupport();
      expect(support.resolveNamePxRatio("flat")).toBe(0.5);
    });

    it("resolves the normal ratio", function () {
      const support = createSupport();
      expect(support.resolveNamePxRatio("normal")).toBe(0.66);
    });

    it("resolves the high ratio", function () {
      const support = createSupport();
      expect(support.resolveNamePxRatio("high")).toBe(0.56);
    });

    it("falls back to the normal ratio for an unrecognized mode", function () {
      const support = createSupport();
      expect(support.resolveNamePxRatio("unknown")).toBe(0.66);
    });
  });
});
