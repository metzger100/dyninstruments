const { loadFresh } = require("../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/widget-registrar.js", function () {
  function setupContext() {
    const registerWidget = vi.fn();
    const applyThemePresetToContainer = vi.fn();
    const hostActions = { getCapabilities: vi.fn(), routePoints: {}, routeEditor: {}, ais: {} };

    const context = createScriptContext({
      DyniPlugin: {
        runtime: {
          applyThemePresetToContainer,
          getHostActions() {
            return hostActions;
          }
        },
        state: {},
        config: { shared: {}, clusters: [] }
      },
      avnav: {
        api: {
          registerWidget
        }
      }
    });

    runIifeScript("runtime/editable-defaults.js", context);
    runIifeScript("runtime/widget-registrar.js", context);

    return { context, registerWidget, applyThemePresetToContainer, hostActions };
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
    runIifeScript("config/clusters/vessel.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "vessel").def;
  }

  function makePositionHelpers() {
    const themeTokens = {
      surface: { fg: "#fff" },
      font: { family: "sans-serif", familyMono: "monospace", weight: 730, labelWeight: 610 }
    };
    const textLayoutEngineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
    const modules = {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      RadialTextLayout: loadFresh("shared/widget-kits/radial/RadialTextLayout.js"),
      RadialValueMath: loadFresh("shared/widget-kits/radial/RadialValueMath.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js")
    };

    return {
      setupCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        return { ctx, W: Math.round(rect.width), H: Math.round(rect.height) };
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      resolveTextColor() {
        return "#fff";
      },
      requirePluginRoot(target) {
        return target;
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return {
            resolveForRoot() {
              return themeTokens;
            }
          };
        }
        if (id === "TextLayoutEngine") {
          return textLayoutEngineModule;
        }
        if (id === "PlaceholderNormalize") {
          return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        }
        if (id === "StateScreenLabels") {
          return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        }
        if (id === "StateScreenPrecedence") {
          return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
        }
        if (id === "StateScreenCanvasOverlay") {
          return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js");
        }
        if (modules[id]) {
          return modules[id];
        }
        throw new Error("unexpected module: " + id);
      },
      applyFormatter(raw, props) {
        const cfg = props || {};
        const fpRaw = cfg.formatterParameters;
        const fp = Array.isArray(fpRaw) ? fpRaw : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
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
          return globalThis.avnav.api.formatter[cfg.formatter].apply(globalThis.avnav.api.formatter, [raw].concat(fp));
        }
        if (raw == null || Number.isNaN(raw)) return cfg.default || "---";
        return String(raw);
      }
    };
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

  it("merges component/widget def and composes update functions", function () {
    const { context, registerWidget, hostActions } = setupContext();

    const component = {
      create() {
        return {
          className: "componentClass",
          storeKeys: { x: "nav.x" },
          wantsHideNativeHead: true,
          renderCanvas: vi.fn(),
          updateFunction(values) {
            return Object.assign({}, values, { fromSpec: true });
          }
        };
      }
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
          ratioThresholdNormal: { type: "FLOAT", default: 1.1, internal: true }
        },
        updateFunction(values) {
          return Object.assign({}, values, { fromDef: true });
        }
      }
    };

    context.DyniPlugin.runtime.registerWidget(component, widgetDef, {
      getHostActions() {
        return hostActions;
      }
    });
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

    const updatedEditing = registeredDef.updateFunction({ a: 1, editing: true });
    expect(updatedEditing).toEqual({ a: 1, editing: true, fromSpec: true, fromDef: true, dyniLayoutEditing: true });

    const updatedNotEditing = registeredDef.updateFunction({ a: 1, editing: false });
    expect(updatedNotEditing).toEqual({ a: 1, editing: false, fromSpec: true, fromDef: true, dyniLayoutEditing: false });
    expect(registeredDef.renderCanvas).toBeUndefined();
  });

  it("falls back to storeKey when storeKeys absent", function () {
    const { context, registerWidget, hostActions } = setupContext();

    const component = { create: () => ({}) };
    const widgetDef = {
      def: {
        name: "dyni_Fallback",
        description: "fallback",
        storeKey: "nav.gps.speed",
        editableParameters: {}
      }
    };

    context.DyniPlugin.runtime.registerWidget(component, widgetDef, {
      getHostActions() {
        return hostActions;
      }
    });
    const [registeredDef] = registerWidget.mock.calls[0];

    expect(registeredDef.storeKeys).toEqual({ value: "nav.gps.speed" });
  });

  it("preserves explicit falsy default values from widget definitions", function () {
    const { context, registerWidget, hostActions } = setupContext();

    const component = { create: () => ({}) };

    context.DyniPlugin.runtime.registerWidget(component, {
      def: { name: "dyni_DefaultZero", default: 0, editableParameters: {} }
    }, {
      getHostActions() {
        return hostActions;
      }
    });
    context.DyniPlugin.runtime.registerWidget(component, {
      def: { name: "dyni_DefaultEmpty", default: "", editableParameters: {} }
    }, {
      getHostActions() {
        return hostActions;
      }
    });
    context.DyniPlugin.runtime.registerWidget(component, {
      def: { name: "dyni_DefaultFalse", default: false, editableParameters: {} }
    }, {
      getHostActions() {
        return hostActions;
      }
    });

    expect(registerWidget.mock.calls[0][0].default).toBe(0);
    expect(registerWidget.mock.calls[1][0].default).toBe("");
    expect(registerWidget.mock.calls[2][0].default).toBe(false);
  });

  it("keeps vessel stableDigits absent at registration so dateTime/timeStatus default at render time", function () {
    const { context, registerWidget, hostActions } = setupContext();
    const vesselDef = loadVesselDef();
    const component = { create: () => ({}) };
    const previousAvnav = globalThis.avnav;

    try {
      context.DyniPlugin.runtime.registerWidget(component, { def: vesselDef }, {
        getHostActions() {
          return hostActions;
        }
      });

      const [registeredDef] = registerWidget.mock.calls[0];
      expect(Object.prototype.hasOwnProperty.call(registeredDef, "stableDigits")).toBe(false);

      const rawClock = new Date("2026-02-22T15:00:00Z");
      globalThis.avnav = {
        api: {
          formatter: {
            formatDate(value) { return value === rawClock ? "DATE" : "DATE_BAD"; },
            formatTime(value) { return value === rawClock ? "TIME" : "TIME_BAD"; }
          }
        }
      };

      const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
        .create({}, makePositionHelpers());

      const registeredProps = Object.assign({}, registeredDef, {
        displayVariant: "dateTime",
        value: [rawClock, rawClock],
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      const registeredCtx = createMockContext2D();
      const registeredCanvas = createMockCanvas({ rectWidth: 220, rectHeight: 140, ctx: registeredCtx });
      const registeredCaptured = captureTextCalls(registeredCtx);
      spec.renderCanvas(registeredCanvas, registeredProps);

      expect(fillTextValues(registeredCtx)).toContain("DATE");
      expect(fillTextValues(registeredCtx)).toContain("TIME");
      expect(String(registeredCtx.textAlign)).toBe("center");
      expect(String(registeredCaptured.find((entry) => entry.text === "TIME").font)).toContain("monospace");

      const explicitProps = Object.assign({}, registeredDef, {
        displayVariant: "dateTime",
        stableDigits: false,
        value: [rawClock, rawClock],
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      const explicitCtx = createMockContext2D();
      const explicitCanvas = createMockCanvas({ rectWidth: 220, rectHeight: 140, ctx: explicitCtx });
      const explicitCaptured = captureTextCalls(explicitCtx);
      spec.renderCanvas(explicitCanvas, explicitProps);

      expect(fillTextValues(explicitCtx)).toContain("DATE");
      expect(fillTextValues(explicitCtx)).toContain("TIME");
      expect(String(explicitCtx.textAlign)).toBe("center");
      expect(String(explicitCaptured.find((entry) => entry.text === "TIME").font)).toContain("sans-serif");
    } finally {
      if (typeof previousAvnav === "undefined") delete globalThis.avnav;
      else globalThis.avnav = previousAvnav;
    }
  });

  it("applies static host classes even when the component has no renderCanvas", function () {
    const { context, registerWidget, hostActions } = setupContext();
    const seen = [];
    const component = {
      create() {
        return {
          wantsHideNativeHead: true,
          renderHtml() {
            seen.push(this.hostActions);
            return "<div>ok</div>";
          }
        };
      }
    };

    context.DyniPlugin.runtime.registerWidget(component, {
      def: {
        name: "dyni_HtmlOnly",
        className: "customClass",
        editableParameters: {}
      }
    }, {
      getHostActions() {
        return hostActions;
      }
    });

    const [registeredDef] = registerWidget.mock.calls[0];
    expect(registeredDef.className).toContain("dyniplugin");
    expect(registeredDef.className).toContain("dyni-host-html");
    expect(registeredDef.className).toContain("dyni-hide-native-head");
    expect(registeredDef.className).toContain("customClass");
    expect(registeredDef.renderCanvas).toBeUndefined();

    registeredDef.renderHtml.call({}, {});
    expect(seen).toEqual([hostActions]);
  });

  it("injects hostActions into init, html, and finalize widget contexts", function () {
    const { context, registerWidget, hostActions } = setupContext();
    const seen = {
      init: [],
      html: [],
      finalize: []
    };
    const component = {
      create() {
        return {
          initFunction() {
            seen.init.push(this.hostActions);
          },
          renderHtml() {
            seen.html.push(this.hostActions);
            return "<div>ok</div>";
          },
          finalizeFunction() {
            seen.finalize.push(this.hostActions);
          }
        };
      }
    };

    context.DyniPlugin.runtime.registerWidget(component, {
      def: {
        name: "dyni_HostActions",
        editableParameters: {}
      }
    }, {
      getHostActions() {
        return hostActions;
      }
    });

    const [registeredDef] = registerWidget.mock.calls[0];
    const widgetContext = {};

    registeredDef.initFunction.call(widgetContext, {});
    registeredDef.renderHtml.call(widgetContext, {});
    registeredDef.finalizeFunction.call(widgetContext, {});

    expect(seen.init).toEqual([hostActions]);
    expect(seen.html).toEqual([hostActions]);
    expect(seen.finalize).toEqual([hostActions]);
    expect(registeredDef.renderCanvas).toBeUndefined();
    expect(widgetContext.hostActions).toBe(hostActions);
  });
});
