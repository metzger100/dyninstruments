const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

// @ts-ignore -- pre-existing untyped test mock boundary
function createHarness(options) {
  const opts = options || {};
  const calls = {
    high: [],
    normal: [],
    flat: [],
    singleLine: []
  };
  const valuePxByText = opts.valuePxByText || Object.create(null);
  const requiredPxByText = opts.requiredPxByText || Object.create(null);
  const singleLineWidthByText = opts.singleLineWidthByText || Object.create(null);

  // @ts-ignore -- pre-existing untyped test mock boundary
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
      responsive: { textFillScale: 1 }
    })),
    fitThreeRowBlock: vi.fn((args) => {
      // @ts-ignore -- pre-existing untyped test mock boundary
      calls.high.push(args);
      return {
        cPx: 10,
        vPx: resolvePx(valuePxByText, args.valueText, 20),
        uPx: 8
      };
    }),
    fitValueUnitCaptionRows: vi.fn((args) => {
      // @ts-ignore -- pre-existing untyped test mock boundary
      calls.normal.push(args);
      return {
        cPx: 10,
        vPx: resolvePx(valuePxByText, args.valueText, 20),
        uPx: 8
      };
    }),
    fitInlineTriplet: vi.fn((args) => {
      // @ts-ignore -- pre-existing untyped test mock boundary
      calls.flat.push(args);
      return { sPx: 10, vPx: resolvePx(valuePxByText, args.valueText, 20) };
    }),
    fitSingleLineBinary: vi.fn((args) => {
      // @ts-ignore -- pre-existing untyped test mock boundary
      calls.singleLine.push(args);
      const px = resolvePx(requiredPxByText, args.text, 7);
      const width = resolvePx(singleLineWidthByText, args.text, px);
      return { px: px, width: width };
    })
  };

  const themeTokens = {
    font: {
      family: "sans-serif",
      familyMono: "monospace",
      weight: 730,
      labelWeight: 610
    }
  };
  const themeApi = {
    resolveForRoot: vi.fn(() => themeTokens)
  };

  const shellEl = { id: "shell-el", nodeType: 1 };
  const hostContext = {
    __dyniHostCommitState: {
      shellEl: shellEl,
      rootEl: null
    },
    __dyniMapZoomMeasureCtx: {
      font: "700 12px sans-serif",
      measureText() {
        return { width: 10 };
      }
    }
  };

  const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
  const componentContext = createComponentContextMock({
    modules: {
      TextLayoutEngine: { create: () => textApi },
      HtmlWidgetUtils: htmlUtilsModule
    },
    services: {
      themeTokens: {
        resolveForRoot: themeApi.resolveForRoot
      },
      dom: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        requirePluginRoot(target) {
          return target || null;
        },
        getNightModeState() {
          return false;
        }
      }
    }
  });

  const fit = loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js").create({}, componentContext);
  return { fit, calls, themeApi, hostContext, shellEl };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createModel(mode, showRequired) {
  return {
    mode: mode,
    caption: "ZOOM",
    zoomText: "12.2",
    unit: "x",
    captionUnitScale: 0.8,
    canDispatch: true,
    showRequired: !!showRequired,
    requiredText: showRequired ? "(10.8)" : ""
  };
}

module.exports = {
  createComponentContextMock,
  createHarness,
  createModel,
  loadFresh
};
