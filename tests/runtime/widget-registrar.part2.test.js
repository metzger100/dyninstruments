// @ts-nocheck
const { loadFresh } = require("../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createComponentContextMock } = require("../helpers/component-context-mock");

describe("runtime/widget-registrar.js", function () {
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
              globalThis.avnav &&
              globalThis.avnav.api &&
              globalThis.avnav.api.formatter &&
              typeof globalThis.avnav.api.formatter[cfg.formatter] === "function"
            ) {
              return globalThis.avnav.api.formatter[cfg.formatter].apply(
                globalThis.avnav.api.formatter,
                [raw].concat(fp)
              );
            }
            if (raw == null || Number.isNaN(raw)) return cfg.default || "---";
            return String(raw);
          }
        },
        canvas: {
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

  function fillTextValues(ctx) {
    return ctx.calls.filter((c) => c.name === "fillText").map((c) => String(c.args[0]));
  }

  function captureTextCalls(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        font: ctx.font
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  it("registers through the captured DyniPlugin.avnavApi when the wrapper global is absent", function () {
    const registerWidget = vi.fn();
    const { context } = setupContext({
      includeGlobalApi: false,
      hostApi: {
        registerWidget
      }
    });

    const componentSpec = {};
    const widgetDef = {
      def: {
        name: "dyni_Captured",
        editableParameters: {}
      }
    };

    context.DyniPlugin.runtime.registerWidget(componentSpec, widgetDef);

    expect(registerWidget).toHaveBeenCalledTimes(1);
    expect(registerWidget.mock.calls[0][0].name).toBe("dyni_Captured");
  });

  it("falls back to storeKey when storeKeys absent", function () {
    const { context, registerWidget, hostActions } = setupContext();

    const componentSpec = {};
    const widgetDef = {
      def: {
        name: "dyni_Fallback",
        description: "fallback",
        storeKey: "nav.gps.speed",
        editableParameters: {}
      }
    };

    context.DyniPlugin.runtime.registerWidget(componentSpec, widgetDef);
    const [registeredDef] = registerWidget.mock.calls[0];

    expect(registeredDef.storeKeys).toEqual({ value: "nav.gps.speed" });
  });

  it("preserves explicit falsy default values from widget definitions", function () {
    const { context, registerWidget, hostActions } = setupContext();

    const componentSpec = {};

    context.DyniPlugin.runtime.registerWidget(componentSpec, {
      def: { name: "dyni_DefaultZero", default: 0, editableParameters: {} }
    });
    context.DyniPlugin.runtime.registerWidget(componentSpec, {
      def: { name: "dyni_DefaultEmpty", default: "", editableParameters: {} }
    });
    context.DyniPlugin.runtime.registerWidget(componentSpec, {
      def: {
        name: "dyni_DefaultFalse",
        default: false,
        editableParameters: {}
      }
    });

    expect(registerWidget.mock.calls[0][0].default).toBe(0);
    expect(registerWidget.mock.calls[1][0].default).toBe("");
    expect(registerWidget.mock.calls[2][0].default).toBe(false);
  });
});
