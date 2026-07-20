// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("MapZoomHtmlFit", function () {
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
        calls.high.push(args);
        return {
          cPx: 10,
          vPx: resolvePx(valuePxByText, args.valueText, 20),
          uPx: 8
        };
      }),
      fitValueUnitCaptionRows: vi.fn((args) => {
        calls.normal.push(args);
        return {
          cPx: 10,
          vPx: resolvePx(valuePxByText, args.valueText, 20),
          uPx: 8
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

  it("shrinks fitted text under tighter geometry and keeps non-trivial output", function () {
    const MODULE_PATH_BY_ID = {
      HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
      TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
      ValueMath: "shared/widget-kits/value/ValueMath.js",
      RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
      TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
      TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
      ResponsiveScaleProfile: "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      CanvasTextLayout: "shared/widget-kits/text/CanvasTextLayout.js",
      RadialTextFitting: "shared/widget-kits/radial/RadialTextFitting.js"
    };
    const moduleCache = Object.create(null);
    const modules = Object.create(null);
    Object.keys(MODULE_PATH_BY_ID).forEach((id) => {
      const relPath = MODULE_PATH_BY_ID[id];
      if (!moduleCache[id]) {
        moduleCache[id] = loadFresh(relPath);
      }
      modules[id] = moduleCache[id];
    });
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
    const componentContext = createComponentContextMock({
      modules: modules,
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot
        },
        format: {
          applyFormatter(value) {
            return String(value);
          }
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          },
          getNightModeState() {
            return false;
          }
        }
      }
    });

    const fit = loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js").create({}, componentContext);
    const model = {
      mode: "normal",
      caption: "ZOOM",
      zoomText: "12.2",
      unit: "x",
      captionUnitScale: 0.8,
      showRequired: false,
      requiredText: ""
    };
    const hostContext = {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    hostContext.__dyniHostCommitState = { rootEl: rootEl, shellEl: null };

    // Spacious geometry
    const spaciousResult = fit.compute({
      model: model,
      hostContext: hostContext,
      shellRect: { width: 320, height: 180 }
    });
    expect(themeApi.resolveForRoot).toHaveBeenCalledWith(rootEl);
    const spaciousValuePx = parseInt(spaciousResult.valueStyle.match(/(\d+)/)[1], 10);

    // Tight geometry (same aspect ratio, smaller)
    const tightResult = fit.compute({
      model: model,
      hostContext: hostContext,
      shellRect: { width: 160, height: 90 }
    });
    const tightValuePx = parseInt(tightResult.valueStyle.match(/(\d+)/)[1], 10);

    // Tight geometry should produce a smaller fitted font size
    expect(tightValuePx).toBeLessThan(spaciousValuePx);
    // Both should still be non-trivial (at least 8px)
    expect(spaciousValuePx).toBeGreaterThanOrEqual(8);
    expect(tightValuePx).toBeGreaterThanOrEqual(8);
  });
});
