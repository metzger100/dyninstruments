const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("MapZoomHtmlFit", function () {
  function createHarness(options) {
    const opts = options || {};
    const calls = {
      high: [],
      normal: [],
      flat: [],
      singleLine: [],
    };
    const valuePxByText = opts.valuePxByText || Object.create(null);
    const requiredPxByText = opts.requiredPxByText || Object.create(null);
    const singleLineWidthByText =
      opts.singleLineWidthByText || Object.create(null);

    function resolvePx(map, text, fallback) {
      const key = String(text);
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return map[key];
      }
      return fallback;
    }

    const textApi = {
      computeResponsiveInsets: vi.fn(() => ({
        padX: 0,
        innerY: 0,
        gapBase: 2,
        responsive: { textFillScale: 1 },
      })),
      fitThreeRowBlock: vi.fn((args) => {
        calls.high.push(args);
        return {
          cPx: 10,
          vPx: resolvePx(valuePxByText, args.valueText, 20),
          uPx: 8,
        };
      }),
      fitValueUnitCaptionRows: vi.fn((args) => {
        calls.normal.push(args);
        return {
          cPx: 10,
          vPx: resolvePx(valuePxByText, args.valueText, 20),
          uPx: 8,
        };
      }),
      fitInlineTriplet: vi.fn((args) => {
        calls.flat.push(args);
        return { sPx: 10, vPx: resolvePx(valuePxByText, args.valueText, 20) };
      }),
      fitSingleLineBinary: vi.fn((args) => {
        calls.singleLine.push(args);
        const px = resolvePx(requiredPxByText, args.text, 7);
        const width = resolvePx(singleLineWidthByText, args.text, px);
        return { px: px, width: width };
      }),
    };

    const themeTokens = {
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 730,
        labelWeight: 610,
      },
    };
    const themeApi = {
      resolveForRoot: vi.fn(() => themeTokens),
    };

    const shellEl = { id: "shell-el", nodeType: 1 };
    const hostContext = {
      __dyniHostCommitState: {
        shellEl: shellEl,
        rootEl: null,
      },
      __dyniMapZoomMeasureCtx: {
        font: "700 12px sans-serif",
        measureText() {
          return { width: 10 };
        },
      },
    };

    const htmlUtilsModule = loadFresh(
      "shared/widget-kits/html/HtmlWidgetUtils.js",
    );
    const componentContext = createComponentContextMock({
      modules: {
        TextLayoutEngine: { create: () => textApi },
        HtmlWidgetUtils: htmlUtilsModule,
      },
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot,
        },
        dom: {
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          },
        },
      },
    });

    const fit = loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js").create(
      {},
      componentContext,
    );
    return { fit, calls, themeApi, hostContext, shellEl };
  }

  function createModel(mode, showRequired) {
    return {
      mode: mode,
      caption: "ZOOM",
      zoomText: "12.2",
      unit: "x",
      captionUnitScale: 0.8,
      canDispatch: true,
      showRequired: !!showRequired,
      requiredText: showRequired ? "(10.8)" : "",
    };
  }

  it("uses theme token weights for normal mode and required-row fitting", function () {
    const h = createHarness();

    h.fit.compute({
      model: createModel("normal", true),
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 110 },
    });

    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.shellEl);
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.normal[0].valueWeight).toBe(730);
    expect(h.calls.normal[0].labelWeight).toBe(610);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    expect(h.calls.singleLine.some((call) => call.weight === 610)).toBe(true);
  });

  it("uses theme token weights for high and flat fitting paths", function () {
    const h = createHarness();

    h.fit.compute({
      model: createModel("high", false),
      hostContext: h.hostContext,
      shellRect: { width: 120, height: 220 },
    });
    h.fit.compute({
      model: createModel("flat", false),
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 90 },
    });

    expect(h.calls.high).toHaveLength(1);
    expect(h.calls.high[0].valueWeight).toBe(730);
    expect(h.calls.high[0].labelWeight).toBe(610);
    expect(h.calls.flat).toHaveLength(1);
    expect(h.calls.flat[0].valueWeight).toBe(730);
    expect(h.calls.flat[0].labelWeight).toBe(610);
  });

  it("uses mono family and invalidates the fit cache when stableDigits toggles", function () {
    const h = createHarness();
    const stableRect = { width: 220, height: 110 };
    const baseModel = Object.assign(createModel("normal", true), {
      stableDigitsEnabled: false,
      zoomPlainText: "12.2",
      requiredPlainText: "(10.8)",
    });

    const first = h.fit.compute({
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: stableRect,
    });
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.normal[0].family).toBe("sans-serif");
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    expect(h.calls.singleLine[0].family).toBe("sans-serif");

    const second = h.fit.compute({
      model: Object.assign({}, baseModel, { stableDigitsEnabled: true }),
      hostContext: h.hostContext,
      shellRect: stableRect,
    });
    expect(second).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);
    expect(h.calls.normal[1].family).toBe("sans-serif");
    expect(h.calls.normal[1].useMono).toBe(true);
    expect(h.calls.normal[1].monoFamily).toBe("monospace");
  });

  it("falls back to unpadded zoom and required text when the padded fit is tighter", function () {
    const h = createHarness({
      valuePxByText: {
        "07.2": 8,
        7.2: 12,
      },
      singleLineWidthByText: {
        "07.2": 1000,
        7.2: 10,
        "(06.5)": 1000,
        "(6.5)": 10,
      },
      requiredPxByText: {
        "(06.5)": 7,
        "(6.5)": 11,
      },
    });

    const out = h.fit.compute({
      model: Object.assign(createModel("normal", true), {
        stableDigitsEnabled: true,
        zoomText: "07.2",
        zoomPlainText: "7.2",
        requiredText: "(06.5)",
        requiredPlainText: "(6.5)",
      }),
      hostContext: h.hostContext,
      shellRect: { width: 180, height: 100 },
    });

    expect(out.zoomText).toBe("7.2");
    expect(out.requiredText).toBe("(6.5)");
    expect(h.calls.normal).toHaveLength(2);
    expect(h.calls.normal[0].valueText).toBe("07.2");
    expect(h.calls.normal[1].valueText).toBe("7.2");
    expect(h.calls.singleLine[0].text).toBe("07.2");
    expect(h.calls.singleLine.some((call) => call.text === "07.2")).toBe(true);
    expect(h.calls.singleLine.some((call) => call.text === "(06.5)")).toBe(
      true,
    );
    expect(h.calls.singleLine.some((call) => call.text === "(6.5)")).toBe(true);
  });

});
