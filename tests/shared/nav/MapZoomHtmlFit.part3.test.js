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

  it("produces fitted text under tight flat-mode geometry", function () {
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
      mode: "flat",
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

    // Tight flat geometry
    const tightFlatResult = fit.compute({
      model: model,
      hostContext: hostContext,
      shellRect: { width: 220, height: 40 }
    });
    expect(themeApi.resolveForRoot).toHaveBeenCalledWith(rootEl);

    // Fit output should exist with a non-empty value style
    expect(tightFlatResult.valueStyle).toBeTruthy();
    expect(tightFlatResult.valueStyle).toMatch(/font-size:\d+px/);
    const tightFlatValuePx = parseInt(tightFlatResult.valueStyle.match(/(\d+)/)[1], 10);
    expect(tightFlatValuePx).toBeGreaterThanOrEqual(6);
  });

  it("reuses identical fit requests and misses on geometry or semantic changes", function () {
    const h = createHarness();
    const baseModel = createModel("normal", true);
    const stableRect = { width: 220, height: 110 };
    const stableArgs = {
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: stableRect
    };

    const first = h.fit.compute(stableArgs);
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    expect(h.hostContext.__dyniMapZoomHtmlFitCache).toBeTruthy();

    const second = h.fit.compute(stableArgs);
    expect(second).toBe(first);
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);

    const geometryMiss = h.fit.compute({
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: { width: 240, height: 110 }
    });
    expect(geometryMiss).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(6);

    const semanticMiss = h.fit.compute({
      model: Object.assign({}, baseModel, { zoomText: "11.0" }),
      hostContext: h.hostContext,
      shellRect: stableRect
    });
    expect(semanticMiss).not.toBe(geometryMiss);
    expect(h.calls.normal).toHaveLength(3);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(9);
  });

  it("avoids cache collisions when semantic text contains delimiter characters", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 110 };
    const modelA = createModel("normal", true);
    const modelB = createModel("normal", true);
    modelA.caption = "A|B";
    modelA.zoomText = "C";
    modelB.caption = "A";
    modelB.zoomText = "B|C";

    const first = h.fit.compute({
      model: modelA,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    const second = h.fit.compute({
      model: modelB,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    expect(second).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);

    const secondRepeat = h.fit.compute({
      model: modelB,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    expect(secondRepeat).toBe(second);
    expect(h.calls.normal).toHaveLength(2);
  });
});
