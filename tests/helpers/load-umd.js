const path = require("node:path");

const DEFAULT_MODULE_PATHS = {
  ValueMath: "shared/widget-kits/value/ValueMath.js",
  CanvasTextFitting: "shared/widget-kits/text/CanvasTextFitting.js",
  CanvasTextLayout: "shared/widget-kits/text/CanvasTextLayout.js",
  TextLayoutScaleHelpers: "shared/widget-kits/text/TextLayoutScaleHelpers.js",
  TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
  TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
  TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
  ResponsiveScaleProfile: "shared/widget-kits/layout/ResponsiveScaleProfile.js",
  GaugeToolkit: "shared/widget-kits/gauge/GaugeToolkit.js",
  RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
  RadialTickMath: "shared/widget-kits/radial/RadialTickMath.js",
  RadialCanvasPrimitives: "shared/widget-kits/radial/RadialCanvasPrimitives.js",
  RadialFrameRenderer: "shared/widget-kits/radial/RadialFrameRenderer.js",
  FullCircleRadialMeasure: "shared/widget-kits/radial/FullCircleRadialMeasure.js",
  FullCircleRadialDrawing: "shared/widget-kits/radial/FullCircleRadialDrawing.js",
  HtmlDomPatchUtils: "shared/widget-kits/html/HtmlDomPatchUtils.js",
  HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
  StateScreenLabels: "shared/widget-kits/state/StateScreenLabels.js",
  StateScreenTextFit: "shared/widget-kits/state/StateScreenTextFit.js",
  StateScreenMarkup: "shared/widget-kits/state/StateScreenMarkup.js"
};

/** @param {any} def @returns {any} */
function createDefaultContext(def) {
  const modules = /** @type {Record<string, any>} */ (Object.create(null));
  const context = {
    components: {
      /** @param {string} id @returns {any} */
      require(id) {
        if (!modules[id]) {
          const key = /** @type {keyof typeof DEFAULT_MODULE_PATHS} */ (id);
          if (!DEFAULT_MODULE_PATHS[key]) {
            throw new Error("load-umd default context: missing module '" + id + "'");
          }
          const mod = loadFresh(DEFAULT_MODULE_PATHS[key]);
          modules[id] = typeof mod.create === "function" ? mod.create(def, context) : mod;
        }
        return modules[id];
      }
    },
    theme: {
      tokens: {
        resolveForRoot() {
          return {
            surface: { fg: "#000", bg: "#fff", border: "#000" },
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 700,
              labelWeight: 700
            },
            colors: {}
          };
        }
      }
    }
  };
  return context;
}

/** @param {any} mod @returns {any} */
function wrapCreate(mod) {
  if (!mod || typeof mod.create !== "function" || mod.__dyniTestCreateWrapped === true) {
    return mod;
  }
  const originalCreate = mod.create;
  mod.create = /** @param {any} def @param {any} [componentContext] @returns {any} */ function (def, componentContext) {
    return originalCreate.call(mod, def, componentContext || createDefaultContext(def || {}));
  };
  Object.defineProperty(mod, "__dyniTestCreateWrapped", { value: true });
  return mod;
}

/** @param {string} relPath @returns {any} */
function loadFresh(relPath) {
  const abs = path.resolve(process.cwd(), relPath);
  const id = require.resolve(abs);
  delete require.cache[id];
  return wrapCreate(require(id));
}

module.exports = {
  loadFresh
};
