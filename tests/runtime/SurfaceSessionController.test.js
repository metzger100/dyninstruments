const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/SurfaceSessionController.js", function () {
  function loadFactory(overrides) {
    const context = createScriptContext({
      ...(overrides || {}),
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/PerfSpanHelper.js", context);
    runIifeScript("runtime/SurfaceSessionController.js", context);
    return context.DyniPlugin.runtime.createSurfaceSessionController;
  }

  function createControllerMock(id) {
    return {
      id: id,
      attach: vi.fn(),
      update: vi.fn(),
      detach: vi.fn(),
      destroy: vi.fn()
    };
  }

  function createPayload(surface, shellEl, revision, props) {
    return {
      surface: surface,
      rootEl: { id: "root-" + surface },
      shellEl: shellEl,
      props: props || { value: revision },
      revision: revision
    };
  }

  it("initState returns a clean state shape with no side effects", function () {
    const createSurfaceSessionController = loadFactory();
    const createSurfaceController = vi.fn();
    const controller = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });

    const state = controller.initState();

    expect(createSurfaceController).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      desiredSurface: null,
      mountedSurface: null,
      surfaceRevision: 0,
      activeController: null,
      lastProps: undefined,
      rootEl: null,
      shellEl: null,
      mountedRevision: 0
    });
  });

  it("first attach creates a controller and calls attach", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function (surface) {
      if (surface === "html") {
        return htmlController;
      }
      throw new Error("unexpected surface: " + surface);
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });
    const payload = createPayload("html", { id: "shell-a" }, 1, { kind: "activeRoute" });

    expect(session.reconcileSession(payload)).toBe(true);

    expect(createSurfaceController).toHaveBeenCalledTimes(1);
    expect(createSurfaceController).toHaveBeenCalledWith("html");
    expect(htmlController.attach).toHaveBeenCalledTimes(1);
    expect(htmlController.attach).toHaveBeenCalledWith(payload);
    expect(htmlController.update).not.toHaveBeenCalled();
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(htmlController.destroy).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      desiredSurface: "html",
      mountedSurface: "html",
      surfaceRevision: 1,
      activeController: htmlController,
      lastProps: { kind: "activeRoute" },
      shellEl: payload.shellEl,
      mountedRevision: 1
    });
  });

  it("same surface + same shell calls update only", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function () {
      return htmlController;
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });
    const shell = { id: "shell-stable" };
    const firstPayload = createPayload("html", shell, 1, { value: 10 });
    const secondPayload = createPayload("html", shell, 2, { value: 11 });

    session.reconcileSession(firstPayload);
    session.reconcileSession(secondPayload);

    expect(createSurfaceController).toHaveBeenCalledTimes(1);
    expect(htmlController.attach).toHaveBeenCalledTimes(1);
    expect(htmlController.update).toHaveBeenCalledTimes(1);
    expect(htmlController.update).toHaveBeenCalledWith(secondPayload);
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      mountedSurface: "html",
      surfaceRevision: 2,
      mountedRevision: 2,
      shellEl: shell,
      lastProps: { value: 11 }
    });
  });

  it("same surface + new shell detaches with remount and reattaches", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function () {
      return htmlController;
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });
    const firstPayload = createPayload("html", { id: "shell-a" }, 1, { value: "a" });
    const secondPayload = createPayload("html", { id: "shell-b" }, 2, { value: "b" });

    session.reconcileSession(firstPayload);
    session.reconcileSession(secondPayload);

    expect(createSurfaceController).toHaveBeenCalledTimes(1);
    expect(htmlController.detach).toHaveBeenCalledTimes(1);
    expect(htmlController.detach).toHaveBeenCalledWith("remount");
    expect(htmlController.attach).toHaveBeenCalledTimes(2);
    expect(htmlController.attach).toHaveBeenLastCalledWith(secondPayload);
    expect(htmlController.update).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      mountedSurface: "html",
      shellEl: secondPayload.shellEl,
      surfaceRevision: 2,
      mountedRevision: 2
    });
  });

  it("different surface detaches, destroys old controller, and attaches new controller", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const canvasController = createControllerMock("canvas");
    const createSurfaceController = vi.fn(function (surface) {
      if (surface === "html") {
        return htmlController;
      }
      if (surface === "canvas-dom") {
        return canvasController;
      }
      throw new Error("unexpected surface: " + surface);
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });
    const firstPayload = createPayload("html", { id: "shell-html" }, 1, { value: 10 });
    const secondPayload = createPayload("canvas-dom", { id: "shell-canvas" }, 2, { value: 11 });

    session.reconcileSession(firstPayload);
    session.reconcileSession(secondPayload);

    expect(htmlController.detach).toHaveBeenCalledTimes(1);
    expect(htmlController.detach).toHaveBeenCalledWith("surface-switch");
    expect(htmlController.destroy).toHaveBeenCalledTimes(1);
    expect(canvasController.attach).toHaveBeenCalledTimes(1);
    expect(canvasController.attach).toHaveBeenCalledWith(secondPayload);
    expect(createSurfaceController).toHaveBeenCalledTimes(2);
    expect(createSurfaceController).toHaveBeenNthCalledWith(1, "html");
    expect(createSurfaceController).toHaveBeenNthCalledWith(2, "canvas-dom");
    expect(session.getState()).toMatchObject({
      desiredSurface: "canvas-dom",
      mountedSurface: "canvas-dom",
      activeController: canvasController,
      mountedRevision: 2
    });
  });

  it("rejects stale revisions without lifecycle calls", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function () {
      return htmlController;
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });
    const initialPayload = createPayload("html", { id: "shell" }, 5, { value: 5 });
    const stalePayload = createPayload("html", { id: "shell" }, 4, { value: 4 });

    expect(session.reconcileSession(initialPayload)).toBe(true);
    htmlController.update.mockClear();
    htmlController.detach.mockClear();
    htmlController.destroy.mockClear();
    expect(session.reconcileSession(stalePayload)).toBe(false);

    expect(htmlController.update).not.toHaveBeenCalled();
    expect(htmlController.detach).not.toHaveBeenCalled();
    expect(htmlController.destroy).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({
      mountedSurface: "html",
      mountedRevision: 5,
      surfaceRevision: 5,
      lastProps: { value: 5 }
    });
  });

  it("tracks current revision through isCurrentRevision", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function () {
      return htmlController;
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });

    session.reconcileSession(createPayload("html", { id: "shell" }, 7, { value: 7 }));

    expect(session.isCurrentRevision(7)).toBe(true);
    expect(session.isCurrentRevision(6)).toBe(false);
    expect(session.isCurrentRevision(8)).toBe(false);
  });

  it("emits reconcileSession lifecycle spans when perf hooks are installed", function () {
    const spans = [];
    const createSurfaceSessionController = loadFactory({
      __DYNI_PERF_HOOKS__: {
        startSpan(name, tags) {
          return { name, tags: tags || null };
        },
        endSpan(token, tags) {
          spans.push({
            name: token && token.name,
            tags: {
              ...(token && token.tags ? token.tags : {}),
              ...(tags && typeof tags === "object" ? tags : {})
            }
          });
        }
      }
    });
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function () {
      return htmlController;
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });

    session.reconcileSession(createPayload("html", { id: "shell" }, 1, { value: 1 }));
    session.reconcileSession(createPayload("html", { id: "shell" }, 2, { value: 2 }));

    const reconcileSpans = spans.filter((entry) => entry.name === "SurfaceSessionController.reconcileSession");
    expect(reconcileSpans).toHaveLength(2);
    expect(reconcileSpans[0].tags.surface).toBe("html");
    expect(reconcileSpans[1].tags.revision).toBe(2);
  });

  it("destroy tears down active controller and is idempotent", function () {
    const createSurfaceSessionController = loadFactory();
    const htmlController = createControllerMock("html");
    const createSurfaceController = vi.fn(function () {
      return htmlController;
    });
    const session = createSurfaceSessionController({
      createSurfaceController: createSurfaceController
    });

    session.reconcileSession(createPayload("html", { id: "shell" }, 2, { value: 2 }));
    session.destroy();
    session.destroy();

    expect(htmlController.destroy).toHaveBeenCalledTimes(1);
    expect(session.getState()).toMatchObject({
      desiredSurface: null,
      mountedSurface: null,
      activeController: null,
      rootEl: null,
      shellEl: null,
      mountedRevision: 0,
      surfaceRevision: 0
    });
  });

  it("throws for unsupported surfaces and invalid factory/controller contracts", function () {
    const createSurfaceSessionController = loadFactory();

    expect(function () {
      createSurfaceSessionController({});
    }).toThrow("createSurfaceController");

    const invalidControllerSession = createSurfaceSessionController({
      createSurfaceController: function () {
        return {
          attach: vi.fn(),
          update: vi.fn(),
          detach: vi.fn()
        };
      }
    });

    expect(function () {
      invalidControllerSession.reconcileSession(createPayload("html", { id: "shell" }, 1, {}));
    }).toThrow("must implement destroy()");

    const strictSurfaceSession = createSurfaceSessionController({
      createSurfaceController: function () {
        return createControllerMock("x");
      }
    });

    expect(function () {
      strictSurfaceSession.reconcileSession(createPayload("legacy-html", { id: "shell" }, 1, {}));
    }).toThrow("unsupported surface");
  });
});
