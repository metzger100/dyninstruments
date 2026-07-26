// @ts-check
const { setupContext } = require("./widget-registrar-setup");

describe("runtime/widget-registrar.js", function () {
  it("injects hostActions into init, html, and finalize widget contexts", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    const snapshots = [];
    const runtimeHostActions = vi.fn(() => {
      const snapshot = {
        getCapabilities: vi.fn(),
        routePoints: {},
        routeEditor: {},
        ais: {}
      };
      snapshots.push(snapshot);
      return snapshot;
    });
    const { context, registerWidget, runtimeHostActions: hostActionsFn } = setupContext({ runtimeHostActions });
    const seen = {
      init: [],
      html: [],
      finalize: []
    };
    const componentSpec = {
      initFunction() {
        // @ts-ignore -- pre-existing untyped test mock boundary
        seen.init.push(this.hostActions);
      },
      renderHtml() {
        // @ts-ignore -- pre-existing untyped test mock boundary
        seen.html.push(this.hostActions);
        return "<div>ok</div>";
      },
      finalizeFunction() {
        // @ts-ignore -- pre-existing untyped test mock boundary
        seen.finalize.push(this.hostActions);
      }
    };

    context.DyniPlugin.runtime.registerWidget(componentSpec, {
      def: {
        name: "dyni_HostActions",
        editableParameters: {}
      }
    });

    const [registeredDef] = registerWidget.mock.calls[0];
    const widgetContext = {};

    registeredDef.initFunction.call(widgetContext, {});
    registeredDef.renderHtml.call(widgetContext, {});
    registeredDef.finalizeFunction.call(widgetContext, {});

    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(seen.init).toEqual([snapshots[0]]);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(seen.html).toEqual([snapshots[1]]);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(seen.finalize).toEqual([snapshots[2]]);
    expect(hostActionsFn).toHaveBeenCalledTimes(3);
    expect(registeredDef.renderCanvas).toBeUndefined();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(widgetContext.hostActions).toBe(snapshots[2]);
  });
});
