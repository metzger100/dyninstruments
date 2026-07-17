const { createScriptContext, runIifeScript } = require("../helpers/eval-iife.js");

describe("ClusterWidget global root contract", function () {
  it("resolves the plugin namespace from self when globalThis is unavailable", function () {
    const routeFrame = { __dyniRouteId: "speed/sog" };
    const clusterRoutes = { "speed/sog": { routeId: "speed/sog" } };
    const normalizeRouteFrame = vi.fn(function () {
      return routeFrame;
    });
    const runtime = {
      createHostCommitController: vi.fn(),
      createSurfaceSessionController: vi.fn(),
      routeActivation: {
        DISCARDED_ACTIVATION: {},
        createWidgetController: vi.fn(),
        reportActivationError: vi.fn()
      },
      clusterShellRenderer: {
        normalizeRouteFrame: normalizeRouteFrame,
        renderRouteShell: vi.fn()
      },
      theme: { applyToRoot: vi.fn() },
      surfaces: {}
    };
    const selfRoot = {
      DyniPlugin: {
        runtime: runtime,
        config: { clusterRoutes: { byRouteId: clusterRoutes } }
      }
    };
    const context = createScriptContext();
    context.globalThis = undefined;
    context.self = selfRoot;

    runIifeScript("cluster/ClusterWidget.js", context);
    const component = context.DyniComponents.DyniClusterWidget;
    const widget = component.create(
      { cluster: "speed" },
      {
        components: {
          require: function () {
            return {
              ensureObject: function (value) {
                return value;
              }
            };
          }
        }
      }
    );
    const props = { kind: "sog" };

    expect(widget.translateFunction(props)).toBe(routeFrame);
    expect(normalizeRouteFrame).toHaveBeenCalledWith(props, { cluster: "speed" }, clusterRoutes);
  });
});
