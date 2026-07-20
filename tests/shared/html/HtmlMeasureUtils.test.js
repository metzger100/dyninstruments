const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("HtmlMeasureUtils", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/html/HtmlMeasureUtils.js").create({}, createComponentContextMock());
  }

  it("parses px font values and exposes approximate measure context", function () {
    const api = createApi();
    const approx = api.createApproximateMeasureContext();

    expect(api.parseFontPx("700 14px sans-serif")).toBe(14);
    expect(api.parseFontPx("invalid")).toBe(12);
    expect(api.APPROX_CHAR_WIDTH_RATIO).toBe(0.56);

    approx.font = "700 20px sans-serif";
    expect(approx.measureText("abcd").width).toBeCloseTo(44.8, 10);
  });

  it("resolves owner document and caches resolved measure contexts", function () {
    const api = createApi();
    const context2d = {
      measureText() {
        return { width: 0 };
      }
    };
    const ownerDocument = {
      /** @param {any} tag */
      createElement(tag) {
        expect(tag).toBe("canvas");
        return {
          /** @param {any} type */
          getContext(type) {
            expect(type).toBe("2d");
            return context2d;
          }
        };
      }
    };
    const targetEl = { ownerDocument: ownerDocument };
    const hostContext = {};

    expect(api.resolveOwnerDocument(targetEl)).toBe(ownerDocument);
    const first = api.resolveMeasureContext(hostContext, targetEl);
    const second = api.resolveMeasureContext(hostContext, targetEl);
    expect(first).toBe(context2d);
    expect(second).toBe(context2d);
  });

  it("measures fitted px with optional maxPx override and style conversion", function () {
    const api = createApi();
    const htmlUtils = {
      toFiniteNumber: (/** @type {any} */ value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      }
    };
    const textApi = { setFont: vi.fn() };
    const ctx = {
      /** @param {any} text */
      measureText(text) {
        return { width: String(text).length * 10 };
      }
    };
    const tileLayout = {
      measureFittedLine: vi.fn().mockReturnValueOnce({ px: 22, text: "AB" }).mockReturnValueOnce({ px: 18, text: "CD" })
    };

    const measuredByRatio = api.measurePx(
      {
        rect: { w: 120, h: 40 },
        text: "AB",
        maxPxRatio: 0.5,
        textApi: textApi,
        ctx: ctx,
        family: "sans-serif",
        weight: 700
      },
      htmlUtils,
      tileLayout
    );
    const measuredByMaxPx = api.measurePx(
      {
        rect: { w: 120, h: 40 },
        text: "CD",
        maxPx: 15,
        maxPxRatio: 0.9,
        textApi: textApi,
        ctx: ctx,
        family: "sans-serif",
        weight: 700
      },
      htmlUtils,
      tileLayout
    );

    expect(tileLayout.measureFittedLine.mock.calls[0][0].maxPx).toBe(20);
    expect(tileLayout.measureFittedLine.mock.calls[1][0].maxPx).toBe(15);
    expect(measuredByRatio).toEqual({ px: 22, text: "AB", width: 20 });
    expect(measuredByMaxPx).toEqual({ px: 18, text: "CD", width: 20 });
    expect(
      api.measureStyle(
        {
          rect: { w: 120, h: 40 },
          text: "CD",
          maxPxRatio: 0.9,
          textApi: textApi,
          ctx: ctx,
          family: "sans-serif",
          weight: 700
        },
        htmlUtils,
        {
          measureFittedLine() {
            return { px: 12, text: "CD" };
          }
        }
      )
    ).toBe("font-size:12px;");
  });

  it("handles empty fit inputs and resolves per-host fit cache", function () {
    const api = createApi();
    const htmlUtils = { toFiniteNumber: () => undefined };

    expect(api.measurePx({ rect: { w: 0, h: 0 }, text: "x" }, htmlUtils, {})).toBe(0);
    expect(api.measurePx({ rect: { w: 10, h: 10 }, text: "" }, htmlUtils, {})).toBe(0);

    const hostContext = {};
    const first = api.resolveFitCache(hostContext, "__cacheKey");
    const second = api.resolveFitCache(hostContext, "__cacheKey");
    expect(first).toEqual({ signature: "", result: null });
    expect(second).toBe(first);

    expect(api.resolveFitCache(null, "__cacheKey")).toBe(null);
    expect(api.resolveFitCache({}, "")).toBe(null);
  });
});
