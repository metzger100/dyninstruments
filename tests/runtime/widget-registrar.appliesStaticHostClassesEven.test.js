// @ts-check
const { setupContext } = require("./widget-registrar-setup");

describe("runtime/widget-registrar.js", function () {
  it("applies static host classes even when the component has no renderCanvas", function () {
    const { context, registerWidget, hostActions, runtimeHostActions } = setupContext();
    // @ts-ignore -- pre-existing untyped test mock boundary
    const seen = [];
    const componentSpec = {
      wantsHideNativeHead: true,
      renderHtml() {
        // @ts-ignore -- pre-existing untyped test mock boundary
        seen.push(this.hostActions);
        return "<div>ok</div>";
      }
    };

    context.DyniPlugin.runtime.registerWidget(componentSpec, {
      def: {
        name: "dyni_HtmlOnly",
        className: "customClass",
        editableParameters: {}
      }
    });

    const [registeredDef] = registerWidget.mock.calls[0];
    expect(registeredDef.className).toContain("dyniplugin");
    expect(registeredDef.className).toContain("dyni-host-html");
    expect(registeredDef.className).toContain("dyni-hide-native-head");
    expect(registeredDef.className).toContain("customClass");
    expect(registeredDef.renderCanvas).toBeUndefined();

    registeredDef.renderHtml.call({}, {});
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(seen).toEqual([hostActions]);
    expect(runtimeHostActions).toHaveBeenCalledTimes(1);
  });
});
