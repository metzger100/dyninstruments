// @ts-check
const { createComponentContextMock, loadFresh } = require("./MapZoomHtmlFit-setup");

describe("MapZoomHtmlFit", function () {
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
