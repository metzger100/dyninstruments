const { loadFresh } = require("../../helpers/load-umd");

describe("HtmlSurfaceController", function () {
  function createModule() {
    return loadFresh("cluster/rendering/HtmlSurfaceController.js").create({}, {});
  }

  function makePayload(props, revision, shellEl) {
    return {
      surface: "html",
      rootEl: { id: "root" },
      shellEl: shellEl || { id: "shell" },
      props: props,
      revision: revision
    };
  }

  it("renders html shell and pre-binds named handlers on the same render pass", function () {
    const module = createModule();
    const activeRouteOpen = vi.fn();
    const hostContext = { eventHandler: [] };
    const rendererSpec = {
      renderHtml: vi.fn(() => '<button onclick="activeRouteOpen">ok</button>'),
      namedHandlers: vi.fn(() => ({ activeRouteOpen: activeRouteOpen })),
      resizeSignature: vi.fn(() => "sig-1")
    };

    const html = module.renderSurfaceShell({
      rendererSpec: rendererSpec,
      props: { kind: "activeRoute" },
      hostContext: hostContext
    });

    expect(rendererSpec.namedHandlers).toHaveBeenCalledWith({ kind: "activeRoute" }, hostContext);
    expect(rendererSpec.renderHtml).toHaveBeenCalledWith({ kind: "activeRoute" });
    expect(hostContext.eventHandler.activeRouteOpen).toBe(activeRouteOpen);
    expect(html).toBe('<div class="dyni-surface-html"><button onclick="activeRouteOpen">ok</button></div>');
  });

  it("implements strict html lifecycle with owned handler cleanup and resize signaling", function () {
    const module = createModule();
    const initFunction = vi.fn();
    const triggerResize = vi.fn();
    const namedOpen = vi.fn();
    const namedOpenNext = vi.fn();
    const hostContext = {
      eventHandler: [],
      triggerResize: triggerResize
    };
    hostContext.eventHandler.catchAll = vi.fn();

    const controller = module.createSurfaceController({
      rendererSpec: {
        initFunction: initFunction,
        renderHtml: vi.fn(() => "<div></div>"),
        namedHandlers: vi.fn((props) => {
          return props.mode === "next"
            ? { activeRouteOpenNext: namedOpenNext }
            : { activeRouteOpen: namedOpen };
        }),
        resizeSignature: vi.fn((props) => String(props.sig))
      },
      hostContext: hostContext
    });
    const shellEl = { id: "shell" };
    const attachProps = { mode: "initial", sig: "a" };
    const updateProps = { mode: "next", sig: "b" };

    controller.attach(makePayload(attachProps, 1, shellEl));
    expect(initFunction).toHaveBeenCalledWith(attachProps);
    expect(hostContext.eventHandler.activeRouteOpen).toBe(namedOpen);
    expect(typeof hostContext.eventHandler.catchAll).toBe("function");

    const updateResult = controller.update(makePayload(updateProps, 2, shellEl));
    expect(updateResult).toEqual({ updated: true, changed: true });
    expect(triggerResize).toHaveBeenCalledTimes(1);
    expect(hostContext.eventHandler.activeRouteOpen).toBeUndefined();
    expect(hostContext.eventHandler.activeRouteOpenNext).toBe(namedOpenNext);

    const stableUpdate = controller.update(makePayload(updateProps, 3, shellEl));
    expect(stableUpdate).toEqual({ updated: false, changed: false });
    expect(triggerResize).toHaveBeenCalledTimes(1);

    controller.detach("surface-switch");
    expect(hostContext.eventHandler.activeRouteOpenNext).toBeUndefined();
    expect(typeof hostContext.eventHandler.catchAll).toBe("function");

    expect(function () {
      controller.update(makePayload({ value: 3, sig: "c" }, 4));
    }).toThrow("requires an attached surface");

    controller.destroy();
    controller.destroy();

    expect(function () {
      controller.attach(makePayload({ value: 4, sig: "d" }, 5));
    }).toThrow("attach() after destroy()");
  });

  it("throws for strict renderer contracts and invalid payload", function () {
    const module = createModule();
    const hostContext = { eventHandler: [] };

    expect(function () {
      module.renderSurfaceShell({
        rendererSpec: { renderHtml: vi.fn(() => "<div></div>") },
        props: {},
        hostContext: hostContext
      });
    }).toThrow("rendererSpec.namedHandlers()");

    expect(function () {
      module.renderSurfaceShell({
        rendererSpec: {
          renderHtml: vi.fn(() => "<div></div>"),
          namedHandlers: vi.fn(() => ({ catchAll: vi.fn() })),
          resizeSignature: vi.fn(() => "x")
        },
        props: {},
        hostContext: hostContext
      });
    }).toThrow("must not own 'catchAll'");

    expect(function () {
      module.createSurfaceController({
        rendererSpec: {
          renderHtml: vi.fn(() => "<div></div>"),
          namedHandlers: vi.fn(() => ({ activeRouteOpen: vi.fn() }))
        },
        hostContext: hostContext
      });
    }).toThrow("rendererSpec.resizeSignature()");

    const controller = module.createSurfaceController({
      rendererSpec: {
        renderHtml: vi.fn(() => "<div></div>"),
        namedHandlers: vi.fn(() => ({ activeRouteOpen: vi.fn() })),
        resizeSignature: vi.fn(() => "sig")
      },
      hostContext: hostContext
    });

    expect(function () {
      controller.attach({});
    }).toThrow("payload.revision");

    expect(function () {
      controller.attach({
        surface: "canvas-dom",
        rootEl: { id: "root" },
        shellEl: { id: "shell" },
        props: {},
        revision: 1
      });
    }).toThrow("payload.surface === 'html'");

    controller.attach(makePayload({ value: 1 }, 1));
    expect(function () {
      controller.update({
        surface: "html",
        rootEl: { id: "root" },
        shellEl: { id: "shell-next" },
        props: { value: 2 },
        revision: 2
      });
    }).toThrow("different shellEl");
  });
});
