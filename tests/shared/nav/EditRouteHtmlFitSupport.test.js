const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteHtmlFitSupport (label / value / unit fallbacks, measureLineFit)", function () {
  /** @param {any} [moduleOverrides] */
  function createSupport(moduleOverrides) {
    const componentContext = createComponentContextMock({
      modules: Object.assign({}, moduleOverrides || {})
    });
    return loadFresh("shared/widget-kits/nav/EditRouteHtmlFitSupport.js").create({}, componentContext);
  }

  function createRealHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create({}, createComponentContextMock({}));
  }

  describe("resolveMetricLabel", function () {
    it("uses metrics[id].labelText first", function () {
      const support = createSupport();
      expect(support.resolveMetricLabel({ metrics: { dst: { labelText: "A" } } }, "dst")).toBe("A");
    });

    it("falls back to metrics[id].label", function () {
      const support = createSupport();
      expect(support.resolveMetricLabel({ metrics: { dst: { label: "B" } } }, "dst")).toBe("B");
    });

    it("falls back to model[id + 'LabelText']", function () {
      const support = createSupport();
      expect(support.resolveMetricLabel({ dstLabelText: "C" }, "dst")).toBe("C");
    });

    it("falls back to model[id + 'Label']", function () {
      const support = createSupport();
      expect(support.resolveMetricLabel({ dstLabel: "D" }, "dst")).toBe("D");
    });

    it("returns an empty string when nothing matches", function () {
      const support = createSupport();
      expect(support.resolveMetricLabel({}, "dst")).toBe("");
    });
  });

  describe("resolveMetricValue", function () {
    it("uses metrics[id].valueText first", function () {
      const support = createSupport();
      expect(support.resolveMetricValue({ metrics: { dst: { valueText: "A" } } }, "dst")).toBe("A");
    });

    it("falls back to metrics[id].value", function () {
      const support = createSupport();
      expect(support.resolveMetricValue({ metrics: { dst: { value: "B" } } }, "dst")).toBe("B");
    });

    it("falls back to model[id + 'ValueText']", function () {
      const support = createSupport();
      expect(support.resolveMetricValue({ dstValueText: "C" }, "dst")).toBe("C");
    });

    it("falls back to model[id + 'Value']", function () {
      const support = createSupport();
      expect(support.resolveMetricValue({ dstValue: "D" }, "dst")).toBe("D");
    });

    it("returns an empty string when nothing matches", function () {
      const support = createSupport();
      expect(support.resolveMetricValue({}, "dst")).toBe("");
    });
  });

  describe("resolveMetricPlainValue", function () {
    it("uses metrics[id].plainValueText first", function () {
      const support = createSupport();
      expect(support.resolveMetricPlainValue({ metrics: { dst: { plainValueText: "A" } } }, "dst")).toBe("A");
    });

    it("falls back to metrics[id].plainValue", function () {
      const support = createSupport();
      expect(support.resolveMetricPlainValue({ metrics: { dst: { plainValue: "B" } } }, "dst")).toBe("B");
    });

    it("falls back to model[id + 'PlainValueText']", function () {
      const support = createSupport();
      expect(support.resolveMetricPlainValue({ dstPlainValueText: "C" }, "dst")).toBe("C");
    });

    it("falls back to model[id + 'PlainValue']", function () {
      const support = createSupport();
      expect(support.resolveMetricPlainValue({ dstPlainValue: "D" }, "dst")).toBe("D");
    });

    it("returns an empty string when nothing matches at all", function () {
      const support = createSupport();
      expect(support.resolveMetricPlainValue({}, "dst")).toBe("");
    });

    it("falls through to resolveMetricValue when no plain-value fields exist", function () {
      const support = createSupport();
      expect(support.resolveMetricPlainValue({ dstValueText: "12.3" }, "dst")).toBe("12.3");
    });
  });

  describe("resolveMetricUnit", function () {
    it("uses metrics[id].unitText first", function () {
      const support = createSupport();
      expect(support.resolveMetricUnit({ metrics: { dst: { unitText: "A" } } }, "dst")).toBe("A");
    });

    it("falls back to metrics[id].unit", function () {
      const support = createSupport();
      expect(support.resolveMetricUnit({ metrics: { dst: { unit: "B" } } }, "dst")).toBe("B");
    });

    it("falls back to model[id + 'UnitText']", function () {
      const support = createSupport();
      expect(support.resolveMetricUnit({ dstUnitText: "C" }, "dst")).toBe("C");
    });

    it("falls back to model[id + 'Unit']", function () {
      const support = createSupport();
      expect(support.resolveMetricUnit({ dstUnit: "D" }, "dst")).toBe("D");
    });

    it("returns an empty string when nothing matches", function () {
      const support = createSupport();
      expect(support.resolveMetricUnit({}, "dst")).toBe("");
    });
  });

  describe("measureLineFit", function () {
    it("returns null when text is missing", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      expect(
        support.measureLineFit({
          text: "",
          rect: { w: 10, h: 10 },
          htmlUtils: htmlUtils,
          tileLayout: { measureFittedLine: vi.fn() }
        })
      ).toBeNull();
    });

    it("returns null when rect width is zero", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      expect(
        support.measureLineFit({
          text: "abc",
          rect: { w: 0, h: 10 },
          htmlUtils: htmlUtils,
          tileLayout: { measureFittedLine: vi.fn() }
        })
      ).toBeNull();
    });

    it("returns null when rect height is zero", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      expect(
        support.measureLineFit({
          text: "abc",
          rect: { w: 10, h: 0 },
          htmlUtils: htmlUtils,
          tileLayout: { measureFittedLine: vi.fn() }
        })
      ).toBeNull();
    });

    it("uses an explicit cfg.maxPx verbatim instead of the ratio-based value", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      const measureFittedLine = vi.fn((args) => args);
      support.measureLineFit({
        text: "abc",
        rect: { w: 100, h: 50 },
        maxPx: 20,
        maxPxRatio: 0.5,
        htmlUtils: htmlUtils,
        tileLayout: { measureFittedLine: measureFittedLine },
        textApi: {},
        ctx: {},
        family: "sans-serif",
        weight: 700,
        textFillScale: 1
      });
      expect(measureFittedLine).toHaveBeenCalledWith(expect.objectContaining({ maxPx: 20 }));
    });

    it("computes maxPx from rect.h * maxPxRatio when no explicit maxPx is given", function () {
      const support = createSupport();
      const htmlUtils = createRealHtmlUtils();
      const measureFittedLine = vi.fn((args) => args);
      support.measureLineFit({
        text: "abc",
        rect: { w: 100, h: 50 },
        maxPxRatio: 0.5,
        htmlUtils: htmlUtils,
        tileLayout: { measureFittedLine: measureFittedLine },
        textApi: {},
        ctx: {},
        family: "sans-serif",
        weight: 700,
        textFillScale: 1
      });
      expect(measureFittedLine).toHaveBeenCalledWith(expect.objectContaining({ maxPx: 25 }));
    });
  });
});
