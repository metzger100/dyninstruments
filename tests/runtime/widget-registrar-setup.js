const { loadFresh } = require("../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const { createComponentContextMock } = require("../helpers/component-context-mock");

// @ts-ignore -- pre-existing untyped test mock boundary
function setupContext(options) {
  const opts = options || {};
  const registerWidget = opts.registerWidget || vi.fn();
  const hostActions = {
    getCapabilities: vi.fn(),
    routePoints: {},
    routeEditor: {},
    ais: {}
  };
  const runtimeHostActions = opts.runtimeHostActions || vi.fn(() => hostActions);
  const includeGlobalApi = opts.includeGlobalApi !== false;
  const capturedApi =
    opts.hostApi ||
    (includeGlobalApi
      ? {
          registerWidget: registerWidget
        }
      : null);

  const context = createScriptContext({
    DyniPlugin: {
      runtime: {
        hostActions: runtimeHostActions
      },
      state: {},
      config: { shared: {}, clusters: [] },
      ...(capturedApi ? { avnavApi: capturedApi } : {})
    },
    avnav: includeGlobalApi
      ? {
          api: {
            registerWidget
          }
        }
      : {}
  });

  runIifeScript("runtime/namespace.js", context);
  runIifeScript("runtime/editable-defaults.js", context);
  runIifeScript("runtime/widget-registrar.js", context);

  return { context, registerWidget, hostActions, runtimeHostActions };
}

function loadVesselDef() {
  const context = createScriptContext({
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });

  runIifeScript("config/shared/kind-defaults.js", context);
  runIifeScript("config/shared/editable-param-utils.js", context);
  runIifeScript("config/shared/vessel-voltage-editables.js", context);
  runIifeScript("config/clusters/vessel.js", context);

  // @ts-ignore -- pre-existing untyped test mock boundary
  return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "vessel").def;
}

function makePositionComponentContext() {
  const themeTokens = {
    surface: { fg: "#fff" },
    font: {
      family: "sans-serif",
      familyMono: "monospace",
      weight: 730,
      labelWeight: 610
    }
  };
  const textLayoutEngineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
  return createComponentContextMock({
    modules: {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      CanvasTextLayout: loadFresh("shared/widget-kits/text/CanvasTextLayout.js"),
      ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      TextLayoutEngine: textLayoutEngineModule,
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js")
    },
    services: {
      format: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        applyFormatter(raw, props) {
          const cfg = props || {};
          const fpRaw = cfg.formatterParameters;
          let fp;
          if (Array.isArray(fpRaw)) {
            fp = fpRaw;
          } else if (typeof fpRaw === "string") {
            fp = fpRaw.split(",");
          } else {
            fp = [];
          }
          if (cfg && typeof cfg.formatter === "function") {
            return cfg.formatter.apply(null, [raw].concat(fp));
          }
          if (
            cfg &&
            typeof cfg.formatter === "string" &&
            // @ts-ignore -- pre-existing untyped test mock boundary
            globalThis.avnav &&
            // @ts-ignore -- pre-existing untyped test mock boundary
            globalThis.avnav.api &&
            // @ts-ignore -- pre-existing untyped test mock boundary
            globalThis.avnav.api.formatter &&
            // @ts-ignore -- pre-existing untyped test mock boundary
            typeof globalThis.avnav.api.formatter[cfg.formatter] === "function"
          ) {
            // @ts-ignore -- pre-existing untyped test mock boundary
            return globalThis.avnav.api.formatter[cfg.formatter].apply(
              // @ts-ignore -- pre-existing untyped test mock boundary
              globalThis.avnav.api.formatter,
              [raw].concat(fp)
            );
          }
          if (raw == null || Number.isNaN(raw)) return cfg.default || "---";
          return String(raw);
        }
      },
      canvas: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        setupCanvas(canvas) {
          const ctx = canvas.getContext("2d");
          const rect = canvas.getBoundingClientRect();
          return {
            ctx,
            W: Math.round(rect.width),
            H: Math.round(rect.height)
          };
        }
      },
      dom: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        requirePluginRoot(target) {
          return target;
        }
      },
      themeTokens: {
        resolveForRoot() {
          return themeTokens;
        }
      }
    }
  });
}

// @ts-ignore -- pre-existing untyped test mock boundary
function fillTextValues(ctx) {
  // @ts-ignore -- pre-existing untyped test mock boundary
  return ctx.calls.filter((c) => c.name === "fillText").map((c) => String(c.args[0]));
}

// @ts-ignore -- pre-existing untyped test mock boundary
function captureTextCalls(ctx) {
  // @ts-ignore -- pre-existing untyped test mock boundary
  const captured = [];
  const originalFillText = ctx.fillText;
  ctx.fillText = function () {
    captured.push({
      text: String(arguments[0]),
      font: ctx.font
    });
    return originalFillText.apply(this, arguments);
  };
  // @ts-ignore -- pre-existing untyped test mock boundary
  return captured;
}

module.exports = {
  captureTextCalls,
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  createScriptContext,
  fillTextValues,
  loadFresh,
  loadVesselDef,
  makePositionComponentContext,
  runIifeScript,
  setupContext
};
