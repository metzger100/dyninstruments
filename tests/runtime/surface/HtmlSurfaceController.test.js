const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("runtime/surface/HtmlSurfaceController.js", function () {
  const originalDyniPlugin = globalThis.DyniPlugin;
  const originalDocumentFonts = document.fonts;

  function createModule(options) {
    const opts = options || {};
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/namespace.js", context);
    context.DyniPlugin.runtime.theme = {
      getShadowCssText: opts.getShadowCssText || vi.fn(() => "")
    };
    runIifeScript("runtime/surface/HtmlSurfaceController.js", context);
    return {
      context,
      module: context.DyniPlugin.runtime._createHtmlSurfaceController(),
      theme: context.DyniPlugin.runtime.theme
    };
  }

  function createSurfaceDom(options) {
    const opts = options || {};
    const width = Object.prototype.hasOwnProperty.call(opts, "width") ? opts.width : 320;
    const height = Object.prototype.hasOwnProperty.call(opts, "height") ? opts.height : 180;
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    mountEl.getBoundingClientRect = vi.fn(() => ({ width, height }));
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

  function flushMicrotasks() {
    return Promise.resolve().then(function () {
      return Promise.resolve();
    });
  }

  function setDocumentFonts(fonts) {
    try {
      document.fonts = fonts;
    }
    catch (err) {
      Object.defineProperty(document, "fonts", {
        configurable: true,
        value: fonts
      });
    }
  }

  function createDeferredFonts(status) {
    let resolveReady = null;
    const ready = new Promise(function (resolve) {
      resolveReady = resolve;
    });
    return {
      fonts: {
        status: status || "loading",
        ready: ready
      },
      resolveReady: resolveReady
    };
  }

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete globalThis.DyniPlugin;
    }
    else {
      globalThis.DyniPlugin = originalDyniPlugin;
    }
    if (typeof originalDocumentFonts === "undefined") {
      delete document.fonts;
    }
    else {
      setDocumentFonts(originalDocumentFonts);
    }
  });

  it("implements committed renderer lifecycle including relayout update", function () {
    const runtime = createModule();
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

    const controller = runtime.module.createSurfaceController({
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

  it("preserves width-only shellRect for natural shells with zero committed height", function () {
    const runtime = createModule();
    const hostContext = {};
    const surfaceDom = createSurfaceDom({ width: 320, height: 0 });

    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };

    const controller = runtime.module.createSurfaceController({
      rendererSpec: {
        id: "RoutePointsTextHtmlWidget",
        createCommittedRenderer: vi.fn(() => rendererInstance)
      },
      hostContext
    });

    controller.attach({
      surface: "html",
      rootEl: surfaceDom.rootEl,
      shellEl: surfaceDom.shellEl,
      props: {},
      revision: 1,
      route: {
        shellSizing: {
          kind: "natural"
        }
      }
    });

    expect(rendererInstance.mount).toHaveBeenCalledTimes(1);
    expect(rendererInstance.mount.mock.calls[0][1].shellRect).toEqual({
      width: 320,
      height: 0
    });
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
    const runtime = createModule({ getShadowCssText });
    const surfaceDom = createSurfaceDom();
    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const controller = runtime.module.createSurfaceController({
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

  it("refreshes once from document.fonts.ready using the latest payload and increments the font metrics epoch", async function () {
    const deferredFonts = createDeferredFonts("loading");
    setDocumentFonts(deferredFonts.fonts);

    const runtime = createModule();
    const surfaceDom = createSurfaceDom();
    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const controller = runtime.module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => rendererInstance)
      },
      hostContext: {}
    });

    controller.attach(makePayload(surfaceDom, { sig: "a" }, 1));
    expect(rendererInstance.mount.mock.calls[0][1]).toEqual(expect.objectContaining({
      props: { sig: "a" },
      fontMetricsEpoch: 0
    }));

    controller.update(makePayload(surfaceDom, { sig: "b" }, 2));
    expect(rendererInstance.update).toHaveBeenCalledTimes(1);
    expect(rendererInstance.update.mock.calls[0][0]).toEqual(expect.objectContaining({
      props: { sig: "b" },
      fontMetricsEpoch: 0
    }));

    deferredFonts.resolveReady();
    await deferredFonts.fonts.ready;
    await flushMicrotasks();

    expect(rendererInstance.update).toHaveBeenCalledTimes(2);
    expect(rendererInstance.update.mock.calls[1][0]).toEqual(expect.objectContaining({
      props: { sig: "b" },
      fontMetricsEpoch: 1
    }));
  });

  it("ignores document.fonts.ready after detach and destroy", async function () {
    const detachedFonts = createDeferredFonts("loading");
    setDocumentFonts(detachedFonts.fonts);

    const runtime = createModule();
    const surfaceDom = createSurfaceDom();
    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const controller = runtime.module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => rendererInstance)
      },
      hostContext: {}
    });

    controller.attach(makePayload(surfaceDom, { sig: "detach" }, 1));
    controller.detach("detach");
    detachedFonts.resolveReady();
    await detachedFonts.fonts.ready;
    await flushMicrotasks();
    expect(rendererInstance.update).not.toHaveBeenCalled();

    const destroyedFonts = createDeferredFonts("loading");
    setDocumentFonts(destroyedFonts.fonts);

    const surfaceDom2 = createSurfaceDom();
    const rendererInstance2 = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn()
    };
    const controller2 = runtime.module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => rendererInstance2)
      },
      hostContext: {}
    });

    controller2.attach(makePayload(surfaceDom2, { sig: "destroy" }, 1));
    controller2.destroy();
    destroyedFonts.resolveReady();
    await destroyedFonts.fonts.ready;
    await flushMicrotasks();
    expect(rendererInstance2.update).not.toHaveBeenCalled();
    expect(rendererInstance2.destroy).toHaveBeenCalledTimes(1);
  });

  it("throws for strict renderer contracts and invalid payload", function () {
    const runtime = createModule();
    const surfaceDom = createSurfaceDom();

    expect(function () {
      runtime.module.createSurfaceController({
        rendererSpec: { createCommittedRenderer: vi.fn() },
        hostContext: null
      });
    }).toThrow("requires hostContext object");

    const invalidController = runtime.module.createSurfaceController({
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
    const controller = runtime.module.createSurfaceController({
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
