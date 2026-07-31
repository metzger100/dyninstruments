// @ts-check
const { setupContext } = require("./widget-registrar-setup");

describe("runtime/widget-registrar.js", function () {
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
    const { context, registerWidget } = setupContext();

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
    const { context, registerWidget } = setupContext();

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
