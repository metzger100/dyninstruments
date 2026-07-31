const { loadFresh } = require("../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const { createComponentContextMock } = require("../helpers/component-context-mock");

/**
 * @typedef {{ formatter?: string | ((...args: unknown[]) => unknown), formatterParameters?: string[] | string, default?: unknown }} FormatterOptions
 * @typedef {import("vitest").Mock} TestMock
 * @typedef {{ hostApi?: object, includeGlobalApi?: boolean, registerWidget?: TestMock, runtimeHostActions?: TestMock }} SetupOptions
 * @typedef {{ def?: { cluster?: string } }} ClusterEntry
 * @typedef {{ font: string, text: string }} TextCall
 */

/** @param {SetupOptions} [options] */
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

  const clusters = /** @type {ClusterEntry[]} */ (context.DyniPlugin.config.clusters);
  const vesselCluster = clusters.find(function (cluster) {
    return cluster.def && cluster.def.cluster === "vessel";
  });
  if (!vesselCluster || !vesselCluster.def) {
    throw new Error("vessel definition is missing");
  }
  return vesselCluster.def;
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
        /** @param {unknown} raw @param {FormatterOptions} [props] */
        applyFormatter(raw, props) {
          const cfg = props || {};
          const fpRaw = cfg.formatterParameters;
          /** @type {string[]} */
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
            globalThis.avnav &&
            globalThis.avnav.api &&
            globalThis.avnav.api.formatter &&
            typeof globalThis.avnav.api.formatter[cfg.formatter] === "function"
          ) {
            return globalThis.avnav.api.formatter[cfg.formatter](raw, ...fp);
          }
          if (raw === null || raw === undefined || Number.isNaN(raw)) return cfg.default || "---";
          return String(raw);
        }
      },
      canvas: {
        /** @param {{ getBoundingClientRect: () => DOMRect, getContext: (kind: string) => unknown }} canvas */
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
        /** @param {Element} target */
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

/** @param {DyniTestCanvasContext} ctx */
function fillTextValues(ctx) {
  return ctx.calls
    .filter((/** @param {DyniTestCall} call */ call) => call.name === "fillText")
    .map(/** @param {DyniTestCall} call */ (call) => String(call.args[0]));
}

/** @param {DyniTestCanvasContext} ctx @returns {TextCall[]} */
function captureTextCalls(ctx) {
  const captured = /** @type {TextCall[]} */ ([]);
  const originalFillText = ctx.fillText;
  /** @this {DyniTestCanvasContext} @param {...unknown} args */
  ctx.fillText = function (...args) {
    captured.push({
      text: String(args[0]),
      font: ctx.font
    });
    return originalFillText.call(this, String(args[0]), Number(args[1]), Number(args[2]));
  };
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
