const { loadFresh } = require("../helpers/load-umd");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../helpers/mock-canvas");
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const {
  createComponentContextMock,
} = require("../helpers/component-context-mock");

describe("runtime/widget-registrar.js", function () {
  function setupContext(options) {
    const opts = options || {};
    const registerWidget = opts.registerWidget || vi.fn();
    const hostActions = {
      getCapabilities: vi.fn(),
      routePoints: {},
      routeEditor: {},
      ais: {},
    };
    const runtimeHostActions =
      opts.runtimeHostActions || vi.fn(() => hostActions);
    const includeGlobalApi = opts.includeGlobalApi !== false;
    const capturedApi =
      opts.hostApi ||
      (includeGlobalApi
        ? {
            registerWidget: registerWidget,
          }
        : null);

    const context = createScriptContext({
      DyniPlugin: {
        runtime: {
          hostActions: runtimeHostActions,
        },
        state: {},
        config: { shared: {}, clusters: [] },
        ...(capturedApi ? { avnavApi: capturedApi } : {}),
      },
      avnav: includeGlobalApi
        ? {
            api: {
              registerWidget,
            },
          }
        : {},
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
        config: { shared: {}, clusters: [] },
      },
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/shared/vessel-voltage-editables.js", context);
    runIifeScript("config/clusters/vessel.js", context);

    return context.DyniPlugin.config.clusters.find(
      (c) => c.def && c.def.cluster === "vessel",
    ).def;
  }

  function makePositionComponentContext() {
    const themeTokens = {
      surface: { fg: "#fff" },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 730,
        labelWeight: 610,
      },
    };
    const textLayoutEngineModule = loadFresh(
      "shared/widget-kits/text/TextLayoutEngine.js",
    );
    return createComponentContextMock({
      modules: {
        RadialAngleMath: loadFresh(
          "shared/widget-kits/radial/RadialAngleMath.js",
        ),
        RadialTextFitting: loadFresh(
          "shared/widget-kits/radial/RadialTextFitting.js",
        ),
        CanvasTextLayout: loadFresh(
          "shared/widget-kits/text/CanvasTextLayout.js",
        ),
        ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
        TextLayoutPrimitives: loadFresh(
          "shared/widget-kits/text/TextLayoutPrimitives.js",
        ),
        TextLayoutComposite: loadFresh(
          "shared/widget-kits/text/TextLayoutComposite.js",
        ),
        ResponsiveScaleProfile: loadFresh(
          "shared/widget-kits/layout/ResponsiveScaleProfile.js",
        ),
        TextLayoutEngine: textLayoutEngineModule,
        PlaceholderNormalize: loadFresh(
          "shared/widget-kits/format/PlaceholderNormalize.js",
        ),
        StateScreenLabels: loadFresh(
          "shared/widget-kits/state/StateScreenLabels.js",
        ),
        StateScreenPrecedence: loadFresh(
          "shared/widget-kits/state/StateScreenPrecedence.js",
        ),
        StateScreenCanvasOverlay: loadFresh(
          "shared/widget-kits/state/StateScreenCanvasOverlay.js",
        ),
      },
      services: {
        format: {
          applyFormatter(raw, props) {
            const cfg = props || {};
            const fpRaw = cfg.formatterParameters;
            const fp = Array.isArray(fpRaw)
              ? fpRaw
              : typeof fpRaw === "string"
                ? fpRaw.split(",")
                : [];
            if (cfg && typeof cfg.formatter === "function") {
              return cfg.formatter.apply(null, [raw].concat(fp));
            }
            if (
              cfg &&
              typeof cfg.formatter === "string" &&
              globalThis.avnav &&
              globalThis.avnav.api &&
              globalThis.avnav.api.formatter &&
              typeof globalThis.avnav.api.formatter[cfg.formatter] ===
                "function"
            ) {
              return globalThis.avnav.api.formatter[cfg.formatter].apply(
                globalThis.avnav.api.formatter,
                [raw].concat(fp),
              );
            }
            if (raw == null || Number.isNaN(raw)) return cfg.default || "---";
            return String(raw);
          },
        },
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return {
              ctx,
              W: Math.round(rect.width),
              H: Math.round(rect.height),
            };
          },
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          },
        },
        themeTokens: {
          resolveForRoot() {
            return themeTokens;
          },
        },
      },
    });
  }

  function fillTextValues(ctx) {
    return ctx.calls
      .filter((c) => c.name === "fillText")
      .map((c) => String(c.args[0]));
  }

  function captureTextCalls(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        font: ctx.font,
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  it("merges component/widget def and composes update functions", function () {
    const { context, registerWidget, hostActions } = setupContext();

    const componentSpec = {
      className: "componentClass",
      storeKeys: { x: "nav.x" },
      wantsHideNativeHead: true,
      renderCanvas: vi.fn(),
      updateFunction(values) {
        return Object.assign({}, values, { fromSpec: true });
      },
    };

    const widgetDef = {
      def: {
        name: "dyni_Test",
        description: "test",
        caption: "",
        unit: "",
        default: "---",
        className: "widgetClass",
        cluster: "speed",
        editableParameters: {
          kind: { type: "SELECT", default: "sog" },
          ratioThresholdNormal: { type: "FLOAT", default: 1.1, internal: true },
        },
        updateFunction(values) {
          return Object.assign({}, values, { fromDef: true });
        },
      },
    };

    context.DyniPlugin.runtime.registerWidget(componentSpec, widgetDef);
    expect(registerWidget).toHaveBeenCalledOnce();

    const [registeredDef, registeredEditable] = registerWidget.mock.calls[0];
    expect(registeredDef.className).toContain("dyniplugin");
    expect(registeredDef.className).toContain("dyni-host-html");
    expect(registeredDef.className).toContain("dyni-hide-native-head");
    expect(registeredDef.className).toContain("widgetClass");
    expect(registeredDef.className).toContain("componentClass");
    expect(registeredDef.kind).toBe("sog");
    expect(registeredDef.ratioThresholdNormal).toBe(1.1);
    expect(registeredDef.storeKeys).toEqual({ x: "nav.x" });
    expect(registeredEditable.kind).toEqual({ type: "SELECT", default: "sog" });
    expect(registeredEditable.ratioThresholdNormal).toBeUndefined();

    const updated = registeredDef.updateFunction({ a: 1 });
    expect(updated).toEqual({ a: 1, fromSpec: true, fromDef: true });

    const updatedEditing = registeredDef.updateFunction({
      a: 1,
      editing: true,
    });
    expect(updatedEditing).toEqual({
      a: 1,
      editing: true,
      fromSpec: true,
      fromDef: true,
      dyniLayoutEditing: true,
    });

    const updatedNotEditing = registeredDef.updateFunction({
      a: 1,
      editing: false,
    });
    expect(updatedNotEditing).toEqual({
      a: 1,
      editing: false,
      fromSpec: true,
      fromDef: true,
      dyniLayoutEditing: false,
    });
    expect(registeredDef.renderCanvas).toBeUndefined();
  });

});
