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
          },
          defaultsFromEditableParams(editable) {
            const out = {};
            Object.keys(editable || {}).forEach((k) => {
              if (editable[k] && typeof editable[k] === "object" && Object.prototype.hasOwnProperty.call(editable[k], "default")) {
                out[k] = editable[k].default;
              }
            });
            return out;
          },
          editableParamsForRegistration(editable) {
            const out = {};
            Object.keys(editable || {}).forEach((k) => {
              const spec = editable[k];
              if (spec && typeof spec === "object" && spec.internal === true) {
                return;
              }
              out[k] = spec;
            });
            return out;
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

    runIifeScript("runtime/widget-registrar.js", context);

    return { context, registerWidget, applyThemePresetToContainer, hostActions };
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
