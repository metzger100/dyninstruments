// @ts-check
const { createComponentContextMock, createHarness, createModel, loadFresh } = require("./MapZoomHtmlFit-setup");

describe("MapZoomHtmlFit", function () {
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
      // @ts-ignore -- pre-existing untyped test mock boundary
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
          // @ts-ignore -- pre-existing untyped test mock boundary
          applyFormatter(value) {
            return String(value);
          }
        },
        dom: {
          // @ts-ignore -- pre-existing untyped test mock boundary
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
    // @ts-ignore -- pre-existing untyped test mock boundary
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
