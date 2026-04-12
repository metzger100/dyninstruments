const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterSurfacePolicy", function () {
  let originalInnerHeight;

  function createPolicy() {
    return loadFresh("cluster/rendering/ClusterSurfacePolicy.js").create({}, {});
  }

  function makeRouteState(rendererId, props, rendererSpec) {
    return {
      route: { rendererId: rendererId },
      rendererSpec: rendererSpec || {},
      props: props
    };
  }

  function makeHostActions(options) {
    const opts = options || {};
    return {
      getCapabilities: opts.getCapabilities || vi.fn(() => (opts.capabilities || {})),
      routePoints: {
        activate: opts.routePointsActivate || vi.fn(() => true)
      },
      map: {
        checkAutoZoom: opts.mapCheckAutoZoom || vi.fn(() => true)
      },
      routeEditor: {
        openActiveRoute: opts.openActiveRoute || vi.fn(() => true),
        openEditRoute: opts.openEditRoute || vi.fn(() => true)
      },
      ais: {
        showInfo: opts.showInfo || vi.fn(() => true)
      }
    };
  }

  beforeEach(function () {
    originalInnerHeight = globalThis.innerHeight;
  });

  afterEach(function () {
    vi.restoreAllMocks();
    if (typeof originalInnerHeight === "undefined") {
      delete globalThis.innerHeight;
      return;
    }
    globalThis.innerHeight = originalInnerHeight;
  });

  it("preserves props identity and materializes runtime fields as non-enumerable", function () {
    globalThis.innerHeight = 812;
    const policy = createPolicy();
    const props = { cluster: "nav", kind: "activeRoute", mode: "vertical" };
    const routeState = makeRouteState("ActiveRouteTextHtmlWidget", props);
    const hostContext = {
      hostActions: makeHostActions({
        capabilities: {
          pageId: "navpage",
          routeEditor: { openActiveRoute: "dispatch" }
        }
      })
    };

    const routed = policy.resolveRouteStateWithPolicy(routeState, hostContext, { allowNatural: false });

    expect(routed.props).toBe(props);
    expect(routed.props.surfacePolicy.pageId).toBe("navpage");
    expect(routed.props.surfacePolicy.containerOrientation).toBe("vertical");
    expect(routed.props.surfacePolicy.interaction.mode).toBe("dispatch");
    expect(routed.props.viewportHeight).toBe(812);
    expect(Object.keys(props)).toEqual(["cluster", "kind", "mode"]);

    const surfacePolicyDescriptor = Object.getOwnPropertyDescriptor(props, "surfacePolicy");
    expect(surfacePolicyDescriptor.enumerable).toBe(false);
    expect(surfacePolicyDescriptor.configurable).toBe(true);
    expect(surfacePolicyDescriptor.writable).toBe(true);

    const viewportDescriptor = Object.getOwnPropertyDescriptor(props, "viewportHeight");
    expect(viewportDescriptor.enumerable).toBe(false);
    expect(viewportDescriptor.configurable).toBe(true);
    expect(viewportDescriptor.writable).toBe(true);
  });

  it("reuses normalized action wrappers per host context and refreshes on host-action owner change", function () {
    const policy = createPolicy();
    const props = { cluster: "nav", kind: "activeRoute" };
    const routeState = makeRouteState("ActiveRouteTextHtmlWidget", props);
    const openA = vi.fn(() => true);
    const hostContext = {
      hostActions: makeHostActions({
        capabilities: {
          pageId: "navpage",
          routeEditor: { openActiveRoute: "dispatch" }
        },
        openActiveRoute: openA
      })
    };

    const first = policy.resolveRouteStateWithPolicy(routeState, hostContext);
    const firstActions = first.props.surfacePolicy.actions;
    const second = policy.resolveRouteStateWithPolicy(routeState, hostContext);
    const secondActions = second.props.surfacePolicy.actions;

    expect(secondActions).toBe(firstActions);
    expect(secondActions.routeEditor.openActiveRoute).toBe(firstActions.routeEditor.openActiveRoute);
    expect(secondActions.routeEditor.openActiveRoute()).toBe(true);
    expect(openA).toHaveBeenCalledTimes(1);

    const openB = vi.fn(() => false);
    hostContext.hostActions = makeHostActions({
      capabilities: {
        pageId: "navpage",
        routeEditor: { openActiveRoute: "dispatch" }
      },
      openActiveRoute: openB
    });
    const third = policy.resolveRouteStateWithPolicy(routeState, hostContext);
    const thirdActions = third.props.surfacePolicy.actions;

    expect(thirdActions).not.toBe(firstActions);
    expect(thirdActions.routeEditor.openActiveRoute()).toBe(false);
    expect(openB).toHaveBeenCalledTimes(1);
  });

  it("reuses normalized capabilities for unchanged snapshots and misses on capability identity change", function () {
    const policy = createPolicy();
    const props = { cluster: "nav", kind: "activeRoute" };
    const routeState = makeRouteState("ActiveRouteTextHtmlWidget", props);
    let normalizationGetterReads = 0;
    const capabilityA = {};
    Object.defineProperty(capabilityA, "routeEditor", {
      enumerable: true,
      get: function () {
        normalizationGetterReads += 1;
        return { openActiveRoute: "dispatch" };
      }
    });
    const capabilityB = {};
    Object.defineProperty(capabilityB, "routeEditor", {
      enumerable: true,
      get: function () {
        normalizationGetterReads += 1;
        return { openActiveRoute: "passive" };
      }
    });
    const getCapabilities = vi.fn()
      .mockReturnValueOnce(capabilityA)
      .mockReturnValueOnce(capabilityA)
      .mockReturnValueOnce(capabilityB);
    const hostContext = {
      hostActions: makeHostActions({
        getCapabilities: getCapabilities
      })
    };

    const first = policy.resolveRouteStateWithPolicy(routeState, hostContext);
    const firstMode = first.props.surfacePolicy.interaction.mode;
    const second = policy.resolveRouteStateWithPolicy(routeState, hostContext);
    const secondMode = second.props.surfacePolicy.interaction.mode;
    const third = policy.resolveRouteStateWithPolicy(routeState, hostContext);
    const thirdMode = third.props.surfacePolicy.interaction.mode;

    expect(firstMode).toBe("dispatch");
    expect(secondMode).toBe("dispatch");
    expect(thirdMode).toBe("passive");
    expect(getCapabilities).toHaveBeenCalledTimes(3);
    expect(normalizationGetterReads).toBe(2);
  });
});
