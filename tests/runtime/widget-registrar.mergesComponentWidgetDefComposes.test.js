// @ts-check
const { setupContext } = require("./widget-registrar-setup");

describe("runtime/widget-registrar.js", function () {
  it("merges component/widget def and composes update functions", function () {
    const { context, registerWidget } = setupContext();

    const componentSpec = {
      className: "componentClass",
      storeKeys: { x: "nav.x" },
      wantsHideNativeHead: true,
      renderCanvas: vi.fn(),
      /** @param {any} values */
      updateFunction(values) {
        return Object.assign({}, values, { fromSpec: true });
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
        /** @param {any} values */
        updateFunction(values) {
          return Object.assign({}, values, { fromDef: true });
        }
      }
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
      editing: true
    });
    expect(updatedEditing).toEqual({
      a: 1,
      editing: true,
      fromSpec: true,
      fromDef: true,
      dyniLayoutEditing: true
    });

    const updatedNotEditing = registeredDef.updateFunction({
      a: 1,
      editing: false
    });
    expect(updatedNotEditing).toEqual({
      a: 1,
      editing: false,
      fromSpec: true,
      fromDef: true,
      dyniLayoutEditing: false
    });
    expect(registeredDef.renderCanvas).toBeUndefined();
  });
});
