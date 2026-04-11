const { loadFresh } = require("../../helpers/load-umd");

describe("HtmlSurfaceController", function () {
  const originalDyniPlugin = globalThis.DyniPlugin;

  function createModule() {
    return loadFresh("cluster/rendering/HtmlSurfaceController.js").create({}, {
      getModule(id) {
        if (id === "PerfSpanHelper") {
          return loadFresh("shared/widget-kits/perf/PerfSpanHelper.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function createSurfaceDom() {
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    mountEl.getBoundingClientRect = vi.fn(() => ({ width: 320, height: 180 }));
    shellEl.appendChild(mountEl);
    rootEl.appendChild(shellEl);
    return { rootEl, shellEl, mountEl };
  }

  function getBaseContractStyles(shadowRoot) {
    return shadowRoot.querySelectorAll('style[data-dyni-shadow-base="html-surface-box-contract"]');
  }

  function makePayload(surfaceDom, props, revision) {
    return {
      surface: "html",
      rootEl: surfaceDom.rootEl,
      shellEl: surfaceDom.shellEl,
      props: props || {},
      revision
    };
  }

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = originalDyniPlugin;
    }
  });

  it("renders html shell with mount host", function () {
    const module = createModule();
    const rendererSpec = {
      createCommittedRenderer: vi.fn()
    };

    const html = module.renderSurfaceShell({
      rendererSpec,
      props: { kind: "activeRoute" },
      hostContext: {}
    });

    expect(html).toBe('<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>');
    expect(rendererSpec.createCommittedRenderer).not.toHaveBeenCalled();
  });

  it("implements committed renderer lifecycle including relayout update", function () {
    const module = createModule();
    const hostContext = {};
    const surfaceDom = createSurfaceDom();

    const rendererInstance = {
      mount: vi.fn(function (mountTarget) {
        const marker = document.createElement("div");
        marker.className = "dyni-shadow-marker";
        mountTarget.appendChild(marker);
      }),
      update: vi.fn(),
      postPatch: vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({ relayout: true })
        .mockReturnValue(false),
      detach: vi.fn(),
      destroy: vi.fn(),
      layoutSignature: vi.fn(function (payload) {
        return payload && payload.props ? payload.props.sig : "none";
      })
    };

    const rendererSpec = {
      id: "spec-id",
      createCommittedRenderer: vi.fn(function () {
        return rendererInstance;
      })
    };

    const controller = module.createSurfaceController({
      rendererSpec,
      hostContext
    });

    controller.attach(makePayload(surfaceDom, { sig: "a" }, 1));

    expect(rendererSpec.createCommittedRenderer).toHaveBeenCalledWith(expect.objectContaining({
      hostContext,
      mountEl: surfaceDom.mountEl,
      shadowRoot: expect.any(Object)
    }));
    expect(rendererInstance.mount).toHaveBeenCalledTimes(1);
    expect(rendererInstance.mount.mock.calls[0][0]).toBe(surfaceDom.mountEl.shadowRoot);
    expect(rendererInstance.mount.mock.calls[0][1]).toEqual(expect.objectContaining({
      props: { sig: "a" },
      layoutChanged: true,
      relayoutPass: 0
    }));
    expect(getBaseContractStyles(surfaceDom.mountEl.shadowRoot)).toHaveLength(1);
    expect(surfaceDom.mountEl.innerHTML).toBe("");
    expect(surfaceDom.mountEl.shadowRoot.querySelector(".dyni-shadow-marker")).toBeTruthy();

    const stableUpdate = controller.update(makePayload(surfaceDom, { sig: "a" }, 2));
    expect(stableUpdate).toEqual({ updated: true, changed: true, layoutChanged: false });
    expect(rendererInstance.update).toHaveBeenCalledTimes(2);
    expect(rendererInstance.update.mock.calls[0][0]).toEqual(expect.objectContaining({
      layoutChanged: false,
      relayoutPass: 0
    }));
    expect(rendererInstance.update.mock.calls[1][0]).toEqual(expect.objectContaining({
      layoutChanged: true,
      relayoutPass: 1
    }));

    const changedUpdate = controller.update(makePayload(surfaceDom, { sig: "b" }, 3));
    expect(changedUpdate).toEqual({ updated: true, changed: true, layoutChanged: true });

    controller.detach("surface-switch");
    expect(rendererInstance.detach).toHaveBeenCalledWith("surface-switch");
    expect(surfaceDom.mountEl.shadowRoot.innerHTML).toBe("");

    expect(function () {
      controller.update(makePayload(surfaceDom, { sig: "c" }, 4));
    }).toThrow("requires an attached surface");

    controller.attach(makePayload(surfaceDom, { sig: "d" }, 5));
    controller.destroy();
    expect(rendererInstance.destroy).toHaveBeenCalledTimes(1);

    expect(function () {
      controller.attach(makePayload(surfaceDom, { sig: "e" }, 6));
    }).toThrow("attach() after destroy()");
  });

  it("injects base surface box contract once per attach and keeps widget shadow css injection", function () {
    const getShadowCssText = vi.fn((url) => {
      if (url === "/css/a.css") {
        return ".a { color: red; }";
      }
      if (url === "/css/b.css") {
        return ".b { color: blue; }";
      }
      return "";
    });
    globalThis.DyniPlugin = {
      runtime: {
        _theme: {
          getShadowCssText
        }
      }
    };

    const module = createModule();
    const surfaceDom = createSurfaceDom();
    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const controller = module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => rendererInstance)
      },
      hostContext: {},
      shadowCssUrls: ["/css/a.css", "/css/b.css", "/css/a.css"]
    });

    controller.attach(makePayload(surfaceDom, {}, 1));

    const shadowRoot = surfaceDom.mountEl.shadowRoot;
    const baseStyle = getBaseContractStyles(shadowRoot);
    expect(baseStyle).toHaveLength(1);
    expect(baseStyle[0].textContent).toContain(":host");
    expect(baseStyle[0].textContent).toContain(".dyni-html-root");
    expect(shadowRoot.querySelectorAll('style[data-dyni-shadow-css="/css/a.css"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('style[data-dyni-shadow-css="/css/b.css"]')).toHaveLength(1);
    expect(getShadowCssText).toHaveBeenCalledTimes(2);

    controller.update(makePayload(surfaceDom, {}, 2));
    expect(getBaseContractStyles(shadowRoot)).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('style[data-dyni-shadow-css="/css/a.css"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('style[data-dyni-shadow-css="/css/b.css"]')).toHaveLength(1);
    expect(getShadowCssText).toHaveBeenCalledTimes(2);

    controller.detach("detach");
    expect(shadowRoot.innerHTML).toBe("");

    controller.attach(makePayload(surfaceDom, {}, 3));
    expect(getBaseContractStyles(shadowRoot)).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('style[data-dyni-shadow-css="/css/a.css"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('style[data-dyni-shadow-css="/css/b.css"]')).toHaveLength(1);
    expect(getShadowCssText).toHaveBeenCalledTimes(4);
  });

  it("throws for strict renderer contracts and invalid payload", function () {
    const module = createModule();
    const surfaceDom = createSurfaceDom();

    expect(function () {
      module.renderSurfaceShell({ rendererSpec: {}, props: {}, hostContext: {} });
    }).toThrow("rendererSpec.createCommittedRenderer()");

    expect(function () {
      module.createSurfaceController({
        rendererSpec: { createCommittedRenderer: vi.fn() },
        hostContext: null
      });
    }).toThrow("requires hostContext object");

    const invalidController = module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => ({
          mount: vi.fn(),
          update: vi.fn(),
          postPatch: vi.fn(),
          detach: vi.fn()
        }))
      },
      hostContext: {}
    });

    expect(function () {
      invalidController.attach(makePayload(surfaceDom, {}, 1));
    }).toThrow("must implement destroy()");

    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn(),
      layoutSignature: vi.fn(() => "sig")
    };
    const controller = module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => rendererInstance)
      },
      hostContext: {}
    });

    expect(function () {
      controller.attach({});
    }).toThrow("payload.revision");

    controller.attach(makePayload(surfaceDom, {}, 1));
    expect(function () {
      controller.update({
        surface: "html",
        rootEl: surfaceDom.rootEl,
        shellEl: document.createElement("div"),
        props: {},
        revision: 2
      });
    }).toThrow("different shellEl");
  });
});
