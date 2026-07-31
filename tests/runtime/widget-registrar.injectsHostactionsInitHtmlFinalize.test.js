// @ts-check
const { setupContext } = require("./widget-registrar-setup");

/**
 * @typedef {{ getCapabilities: import("vitest").Mock, routePoints: object, routeEditor: object, ais: object }} HostActionsSnapshot
 */

describe("runtime/widget-registrar.js", function () {
  it("injects hostActions into init, html, and finalize widget contexts", function () {
    /** @type {HostActionsSnapshot[]} */
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
    /** @type {{ init: HostActionsSnapshot[], html: HostActionsSnapshot[], finalize: HostActionsSnapshot[] }} */
    const seen = {
      init: [],
      html: [],
      finalize: []
    };
    const componentSpec = {
      /** @this {{ hostActions: HostActionsSnapshot }} */
      initFunction() {
        seen.init.push(this.hostActions);
      },
      /** @this {{ hostActions: HostActionsSnapshot }} */
      renderHtml() {
        seen.html.push(this.hostActions);
        return "<div>ok</div>";
      },
      /** @this {{ hostActions: HostActionsSnapshot }} */
      finalizeFunction() {
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
    /** @type {{ hostActions?: HostActionsSnapshot }} */
    const widgetContext = {};

    registeredDef.initFunction.call(widgetContext, {});
    registeredDef.renderHtml.call(widgetContext, {});
    registeredDef.finalizeFunction.call(widgetContext, {});

    expect(seen.init).toEqual([snapshots[0]]);
    expect(seen.html).toEqual([snapshots[1]]);
    expect(seen.finalize).toEqual([snapshots[2]]);
    expect(hostActionsFn).toHaveBeenCalledTimes(3);
    expect(registeredDef.renderCanvas).toBeUndefined();
    expect(widgetContext.hostActions).toBe(snapshots[2]);
  });
});
