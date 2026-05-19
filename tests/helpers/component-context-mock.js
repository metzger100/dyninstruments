const { loadFresh } = require("./load-umd");

const DEFAULT_MODULE_PATHS = {
  ValueMath: "shared/widget-kits/value/ValueMath.js",
  CanvasTextFitting: "shared/widget-kits/text/CanvasTextFitting.js",
  CanvasTextLayout: "shared/widget-kits/text/CanvasTextLayout.js",
  TextLayoutScaleHelpers: "shared/widget-kits/text/TextLayoutScaleHelpers.js",
  GaugeToolkit: "shared/widget-kits/gauge/GaugeToolkit.js",
  RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
  RadialSectorMath: "shared/widget-kits/radial/RadialSectorMath.js",
  RadialValueMath: "shared/widget-kits/radial/RadialValueMath.js",
  RadialTickMath: "shared/widget-kits/radial/RadialTickMath.js",
  RadialCanvasPrimitives: "shared/widget-kits/radial/RadialCanvasPrimitives.js",
  RadialFrameRenderer: "shared/widget-kits/radial/RadialFrameRenderer.js",
  HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
  StateScreenLabels: "shared/widget-kits/state/StateScreenLabels.js",
  StateScreenTextFit: "shared/widget-kits/state/StateScreenTextFit.js",
  StateScreenMarkup: "shared/widget-kits/state/StateScreenMarkup.js"
};

function createComponentContextMock(options) {
  const opts = options || {};
  const def = opts.def || {};
  const modules = opts.modules || {};
  const services = opts.services || {};
  const instanceCache = Object.create(null);

  const perf = services.perf || {
    startSpan() { return null; },
    endSpan() {}
  };

  const format = services.format || {
    applyFormatter(value, cfg) {
      if (value == null || Number.isNaN(value)) {
        if (cfg && Object.prototype.hasOwnProperty.call(cfg, "default")) {
          return cfg.default;
        }
        return "---";
      }
      return String(value);
    }
  };

  const canvas = services.canvas || {
    setupCanvas() { return null; }
  };

  const dom = services.dom || {
    requirePluginRoot() { return null; },
    getNightModeState() { return false; }
  };

  const hostActionsSnapshot = Object.prototype.hasOwnProperty.call(services, "hostActions")
    ? services.hostActions
    : {};
  const hostActions = typeof hostActionsSnapshot === "function"
    ? hostActionsSnapshot
    : function () {
      return hostActionsSnapshot;
    };

  if (hostActionsSnapshot && typeof hostActionsSnapshot === "object") {
    Object.keys(hostActionsSnapshot).forEach(function (key) {
      hostActions[key] = hostActionsSnapshot[key];
    });
  }

  const themeTokens = services.themeTokens || {
    resolveForRoot() {
      return {
        surface: { fg: "#000", bg: "#fff", border: "#000" },
        font: { family: "sans-serif", familyMono: "monospace", weight: 700, labelWeight: 700 },
        colors: {}
      };
    }
  };

  const context = {
    components: {
      require(id) {
        if (Object.prototype.hasOwnProperty.call(instanceCache, id)) {
          return instanceCache[id];
        }
        if (!Object.prototype.hasOwnProperty.call(modules, id) && Object.prototype.hasOwnProperty.call(DEFAULT_MODULE_PATHS, id)) {
          modules[id] = loadFresh(DEFAULT_MODULE_PATHS[id]);
        }
        if (!Object.prototype.hasOwnProperty.call(modules, id)) {
          throw new Error("component-context-mock: missing module '" + id + "'");
        }
        const entry = modules[id];
        const value = entry && typeof entry.create === "function"
          ? entry.create(def, context)
          : entry;
        instanceCache[id] = value;
        return value;
      }
    },
    theme: {
      tokens: themeTokens
    },
    perf: perf,
    format: format,
    canvas: canvas,
    dom: dom,
    hostActions: hostActions
  };

  return context;
}

module.exports = {
  createComponentContextMock
};
