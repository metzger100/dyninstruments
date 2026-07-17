const { loadFresh } = require("../helpers/load-umd");
const { flushPromises } = require("../helpers/async");
const { createComponentContextMock } = require("../helpers/component-context-mock");

function createDeferred() {
  let resolve = null;
  const promise = new Promise(function (res) {
    resolve = res;
  });
  return {
    promise: promise,
    resolve: resolve
  };
}

function createHostCommitControllerMock(instanceId) {
  let renderRevision = 0;
  let lastProps = null;
  const state = {
    instanceId: instanceId,
    renderRevision: 0,
    lastProps: null
  };

  return {
    initState: vi.fn(function () {
      return Object.assign({}, state);
    }),
    recordRender: vi.fn(function (props) {
      renderRevision += 1;
      lastProps = props;
      state.renderRevision = renderRevision;
      state.lastProps = lastProps;
      return renderRevision;
    }),
    getState: vi.fn(function () {
      return Object.assign({}, state);
    }),
    scheduleCommit: vi.fn(function (callbacks) {
      if (callbacks && typeof callbacks.onCommit === "function") {
        callbacks.onCommit({
          instanceId: state.instanceId,
          revision: state.renderRevision,
          props: state.lastProps,
          rootEl: { id: "root-" + String(state.renderRevision) },
          shellEl: { id: "shell-" + String(state.renderRevision) },
          state: Object.assign({}, state)
        });
      }
      return true;
    }),
    cleanup: vi.fn()
  };
}

function createSurfaceSessionControllerMock() {
  const state = {
    activeController: null,
    shellEl: null
  };

  return {
    initState: vi.fn(),
    recordCommittedRevision: vi.fn(),
    detachForShellReplacement: vi.fn(function () {
      state.shellEl = null;
    }),
    reconcileSession: vi.fn(function (payload) {
      state.activeController = state.activeController || { id: "surface-session-controller" };
      state.shellEl = payload && Object.prototype.hasOwnProperty.call(payload, "shellEl")
        ? payload.shellEl
        : state.shellEl;
      return true;
    }),
    destroy: vi.fn(),
    getState: vi.fn(function () {
      return {
        activeController: state.activeController,
        shellEl: state.shellEl
      };
    }),
    __state: state
  };
}

function createActivationControllerMock(resultFactory) {
  return {
    activateCommittedRoute: vi.fn(resultFactory || function () {
      return {};
    }),
    invalidateMemoState: vi.fn(),
    destroy: vi.fn()
  };
}

function createRuntimeHarness(options) {
  const opts = options || {};
  const routeMeta = opts.routeMeta || null;
  const routeId = opts.routeId || "speed/sog";
  const clusterRoutes = opts.clusterRoutes || {
    byRouteId: routeMeta ? { [routeId]: routeMeta } : {}
  };
  const hostCommitController = opts.hostCommitController || createHostCommitControllerMock("dyni-host-42");
  const surfaceSessionController = opts.surfaceSessionController || createSurfaceSessionControllerMock();
  const activationController = opts.activationController || createActivationControllerMock(opts.activationResultFactory);
  const shellRenderer = {
    normalizeRouteFrame: vi.fn(function (rawProps, def, routes) {
      const cluster = rawProps && rawProps.cluster ? rawProps.cluster : def.cluster;
      const kind = rawProps && rawProps.kind ? rawProps.kind : "";
      return {
        cluster: cluster,
        kind: kind,
        __dyniRouteId: cluster + "/" + kind,
        __dyniRawProps: rawProps
      };
    }),
    renderRouteShell: vi.fn(function () {
      return opts.shellHtml || "<div class=\"dyni-shell\">shell</div>";
    })
  };
  const runtime = {
    createHostCommitController: vi.fn(function () {
      return hostCommitController;
    }),
    createSurfaceSessionController: vi.fn(function () {
      return surfaceSessionController;
    }),
    routeActivation: {
      DISCARDED_ACTIVATION: Object.freeze({ discarded: true }),
      reportActivationError: vi.fn(),
      createWidgetController: vi.fn(function () {
        return activationController;
      })
    },
    clusterShellRenderer: shellRenderer,
    theme: {
      applyToRoot: vi.fn()
    },
    surfaces: {
      createController: vi.fn(),
      materializeSurfacePolicyProps: vi.fn()
    },
  };

  globalThis.DyniPlugin = {
    runtime: runtime,
    config: {
      clusterRoutes: clusterRoutes
    }
  };

  return {
    runtime: runtime,
    hostCommitController: hostCommitController,
    surfaceSessionController: surfaceSessionController,
    activationController: activationController,
    shellRenderer: shellRenderer,
    clusterRoutes: clusterRoutes
  };
}

function createClusterWidget(def) {
  return loadFresh("cluster/ClusterWidget.js").create(def, createComponentContextMock());
}

  const originalDyniPlugin = globalThis.DyniPlugin;

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = originalDyniPlugin;
    }
  });

module.exports = {
  originalDyniPlugin,
  createDeferred,
  createHostCommitControllerMock,
  createSurfaceSessionControllerMock,
  createActivationControllerMock,
  createRuntimeHarness,
  createClusterWidget,
};

globalThis.createDeferred = createDeferred;
globalThis.createHostCommitControllerMock = createHostCommitControllerMock;
globalThis.createSurfaceSessionControllerMock = createSurfaceSessionControllerMock;
globalThis.createActivationControllerMock = createActivationControllerMock;
globalThis.createRuntimeHarness = createRuntimeHarness;
globalThis.createClusterWidget = createClusterWidget;
globalThis.flushPromises = flushPromises;
