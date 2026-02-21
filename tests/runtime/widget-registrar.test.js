const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/widget-registrar.js", function () {
  function setupContext() {
    const registerWidget = vi.fn();
    const applyThemePresetToContainer = vi.fn();

    const context = createScriptContext({
      DyniPlugin: {
        runtime: {
          applyThemePresetToContainer,
          defaultsFromEditableParams(editable) {
            const out = {};
            Object.keys(editable || {}).forEach((k) => {
              if (editable[k] && typeof editable[k] === "object" && Object.prototype.hasOwnProperty.call(editable[k], "default")) {
                out[k] = editable[k].default;
              }
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

    return { context, registerWidget, applyThemePresetToContainer };
  }

  it("merges component/widget def and composes update functions", function () {
    const { context, registerWidget, applyThemePresetToContainer } = setupContext();

    const component = {
      create() {
        return {
          className: "componentClass",
          storeKeys: { x: "nav.x" },
          wantsHideNativeHead: true,
          renderCanvas(canvas) {
            canvas.rendered = true;
          },
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
          kind: { type: "SELECT", default: "sog" }
        },
        updateFunction(values) {
          return Object.assign({}, values, { fromDef: true });
        }
      }
    };

    context.DyniPlugin.runtime.registerWidget(component, widgetDef, {});
    expect(registerWidget).toHaveBeenCalledOnce();

    const [registeredDef] = registerWidget.mock.calls[0];
    expect(registeredDef.className).toContain("dyniplugin");
    expect(registeredDef.className).toContain("widgetClass");
    expect(registeredDef.className).toContain("componentClass");
    expect(registeredDef.kind).toBe("sog");
    expect(registeredDef.storeKeys).toEqual({ x: "nav.x" });

    const updated = registeredDef.updateFunction({ a: 1 });
    expect(updated).toEqual({ a: 1, fromSpec: true, fromDef: true });

    const rootEl = {
      _flag: false,
      hasAttribute() { return this._flag; },
      setAttribute() { this._flag = true; }
    };
    const canvas = {
      __dyniMarked: false,
      closest() { return rootEl; }
    };

    registeredDef.renderCanvas(canvas, {});
    expect(canvas.__dyniMarked).toBe(true);
    expect(rootEl._flag).toBe(true);
    expect(applyThemePresetToContainer).toHaveBeenCalledWith(rootEl);
    expect(canvas.rendered).toBe(true);
  });

  it("falls back to storeKey when storeKeys absent", function () {
    const { context, registerWidget } = setupContext();

    const component = { create: () => ({}) };
    const widgetDef = {
      def: {
        name: "dyni_Fallback",
        description: "fallback",
        storeKey: "nav.gps.speed",
        editableParameters: {}
      }
    };

    context.DyniPlugin.runtime.registerWidget(component, widgetDef, {});
    const [registeredDef] = registerWidget.mock.calls[0];

    expect(registeredDef.storeKeys).toEqual({ value: "nav.gps.speed" });
  });

  it("preserves explicit falsy default values from widget definitions", function () {
    const { context, registerWidget } = setupContext();

    const component = { create: () => ({}) };

    context.DyniPlugin.runtime.registerWidget(component, {
      def: { name: "dyni_DefaultZero", default: 0, editableParameters: {} }
    }, {});
    context.DyniPlugin.runtime.registerWidget(component, {
      def: { name: "dyni_DefaultEmpty", default: "", editableParameters: {} }
    }, {});
    context.DyniPlugin.runtime.registerWidget(component, {
      def: { name: "dyni_DefaultFalse", default: false, editableParameters: {} }
    }, {});

    expect(registerWidget.mock.calls[0][0].default).toBe(0);
    expect(registerWidget.mock.calls[1][0].default).toBe("");
    expect(registerWidget.mock.calls[2][0].default).toBe(false);
  });
});
