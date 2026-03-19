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

  it("renders html surface shell with renderer html content", function () {
    const module = createModule();
    const rendererSpec = {
      renderHtml: vi.fn(() => "<button>ok</button>")
    };

    const html = module.renderSurfaceShell({
      rendererSpec: rendererSpec,
      props: { kind: "activeRouteInteractive" },
      hostContext: { marker: 1 }
    });

    expect(rendererSpec.renderHtml).toHaveBeenCalledWith({ kind: "activeRouteInteractive" });
    expect(html).toBe('<div class="dyni-surface-html"><button>ok</button></div>');
  });

  it("implements strict attach/update/detach/destroy lifecycle", function () {
    const module = createModule();
    const initFunction = vi.fn();
    const controller = module.createSurfaceController({
      rendererSpec: { initFunction: initFunction },
      hostContext: { marker: 2 }
    });
    const shellEl = { id: "shell" };

    controller.attach(makePayload({ value: 1 }, 1, shellEl));
    expect(initFunction).toHaveBeenCalledWith({ value: 1 });

    const updateResult = controller.update(makePayload({ value: 2 }, 2, shellEl));
    expect(updateResult).toEqual({ updated: true, changed: true });

    controller.detach("remount");

    expect(function () {
      controller.update(makePayload({ value: 3 }, 3));
    }).toThrow("requires an attached surface");

    controller.destroy();
    controller.destroy();

    expect(function () {
      controller.attach(makePayload({ value: 4 }, 4));
    }).toThrow("attach() after destroy()");
  });

  it("throws for invalid payload contracts", function () {
    const module = createModule();
    const controller = module.createSurfaceController({});

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
