const { loadFresh } = require("../../helpers/load-umd");

describe("CanvasDomSurfaceAdapter", function () {
  function createClassList(el) {
    function list() {
      return String(el.className || "")
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return {
      contains(name) {
        return list().includes(name);
      },
      add(name) {
        const next = list();
        if (!next.includes(name)) {
          next.push(name);
        }
        el.className = next.join(" ");
      }
    };
  }

  function createElement(doc, tagName, className) {
    const el = {
      ownerDocument: doc,
      tagName: String(tagName || "div").toUpperCase(),
      className: className || "",
      classList: null,
      style: {},
      children: [],
      parentElement: null,
      appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) {
          this.children.splice(index, 1);
          child.parentElement = null;
        }
        return child;
      },
      querySelector(selector) {
        if (!selector || selector.charAt(0) !== ".") {
          return null;
        }
        const classNameToFind = selector.slice(1);
        return findByClass(this, classNameToFind);
      }
    };
    el.classList = createClassList(el);
    return el;
  }

  function findByClass(root, className) {
    if (!root) {
      return null;
    }
    if (root.classList && typeof root.classList.contains === "function" && root.classList.contains(className)) {
      return root;
    }
    for (let i = 0; i < root.children.length; i += 1) {
      const found = findByClass(root.children[i], className);
      if (found) {
        return found;
      }
    }
    return null;
  }

  function createDomShell(includeMount) {
    const createdCanvases = [];
    const doc = {
      createElement(tag) {
        const name = String(tag || "").toLowerCase();
        const node = createElement(doc, name || "div", "");
        if (name === "canvas") {
          node.width = 0;
          node.height = 0;
          node.getContext = vi.fn(function () { return {}; });
          node.clientWidth = 320;
          node.clientHeight = 180;
          node.getBoundingClientRect = function () {
            return { width: 320, height: 180, top: 0, left: 0, right: 320, bottom: 180 };
          };
          createdCanvases.push(node);
        }
        return node;
      }
    };

    const shellEl = createElement(doc, "div", "widgetData dyni-shell");
    const surfaceEl = createElement(doc, "div", "dyni-surface-canvas");
    shellEl.appendChild(surfaceEl);

    let mountEl = null;
    if (includeMount !== false) {
      mountEl = createElement(doc, "div", "dyni-surface-canvas-mount");
      surfaceEl.appendChild(mountEl);
    }

    return {
      doc,
      shellEl,
      surfaceEl,
      mountEl,
      createdCanvases
    };
  }

  function createHarness(options) {
    const opts = options || {};
    const dom = createDomShell(opts.includeMount);
    const rootEl = createElement(dom.doc, "div", "widget dyniplugin dyni-host-html");
    const rendererSpec = {
      renderCanvas: vi.fn()
    };
    const themeModule = opts.themeModule || {
      invalidateCanvas: vi.fn(),
      invalidateAll: vi.fn()
    };
    const helpers = {
      getModule(id) {
        if (id === "ThemeResolver") {
          return themeModule;
        }
        throw new Error("unexpected module: " + id);
      }
    };

    const frameQueue = [];
    const canceledFrames = [];
    let frameId = 0;
    function requestAnimationFrameStub(cb) {
      frameId += 1;
      frameQueue.push({ id: frameId, cb: cb });
      return frameId;
    }
    function cancelAnimationFrameStub(id) {
      canceledFrames.push(id);
      for (let i = frameQueue.length - 1; i >= 0; i -= 1) {
        if (frameQueue[i].id === id) {
          frameQueue.splice(i, 1);
        }
      }
    }
    function runNextFrame() {
      const task = frameQueue.shift();
      if (!task) {
        throw new Error("no frame queued");
      }
      task.cb();
      return task.id;
    }

    const observerInstances = [];
    function ResizeObserverStub(callback) {
      this.callback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      observerInstances.push(this);
    }

    const adapter = loadFresh("cluster/rendering/CanvasDomSurfaceAdapter.js").create({}, helpers);
    const controller = adapter.createSurfaceController({
      rendererSpec: opts.rendererSpec || rendererSpec,
      requestAnimationFrame: requestAnimationFrameStub,
      cancelAnimationFrame: cancelAnimationFrameStub,
      ResizeObserver: opts.ResizeObserver || ResizeObserverStub,
      hostContext: opts.hostContext
    });

    function payload(nextProps, nextRevision) {
      return {
        surface: "canvas-dom",
        rootEl: rootEl,
        shellEl: dom.shellEl,
        props: nextProps,
        revision: nextRevision
      };
    }

    return {
      adapter,
      controller,
      dom,
      rootEl,
      payload,
      rendererSpec: opts.rendererSpec || rendererSpec,
      themeModule,
      observerInstances,
      frameQueue,
      canceledFrames,
      runNextFrame
    };
  }

  it("renders a structurally stable shell markup", function () {
    const adapter = loadFresh("cluster/rendering/CanvasDomSurfaceAdapter.js").create({}, {
      getModule() {
        return { invalidateCanvas: vi.fn(), invalidateAll: vi.fn() };
      }
    });

    const first = adapter.renderSurfaceShell();
    const second = adapter.renderSurfaceShell();

    expect(first).toBe('<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>');
    expect(second).toBe(first);
  });

  it("attach creates an internal canvas, binds ResizeObserver, and schedules first paint", function () {
    const h = createHarness({ hostContext: { marker: 1 } });

    h.controller.attach(h.payload({ value: 12 }, 1));

    expect(h.dom.createdCanvases).toHaveLength(1);
    expect(h.dom.mountEl.children).toHaveLength(1);
    expect(h.dom.mountEl.children[0].className).toBe("dyni-surface-canvas-node");
    expect(h.dom.surfaceEl.style.fontSize).toBe("initial");
    expect(h.dom.surfaceEl.style.width).toBe("100%");
    expect(h.dom.mountEl.style.height).toBe("100%");
    expect(h.frameQueue).toHaveLength(1);
    expect(h.observerInstances).toHaveLength(1);
    expect(h.observerInstances[0].observe).toHaveBeenCalledWith(h.dom.surfaceEl);
    expect(h.rendererSpec.renderCanvas).not.toHaveBeenCalled();

    h.runNextFrame();

    expect(h.rendererSpec.renderCanvas).toHaveBeenCalledTimes(1);
    expect(h.rendererSpec.renderCanvas).toHaveBeenCalledWith(h.dom.createdCanvases[0], { value: 12 });
  });

  it("update repaints on changed props and skips repaint for shallow-identical props", function () {
    const h = createHarness();
    h.controller.attach(h.payload({ value: 7, caption: "SPD" }, 1));
    h.runNextFrame();
    h.rendererSpec.renderCanvas.mockClear();

    h.controller.update(h.payload({ value: 8, caption: "SPD" }, 2));
    expect(h.frameQueue).toHaveLength(1);
    h.runNextFrame();
    expect(h.rendererSpec.renderCanvas).toHaveBeenCalledTimes(1);
    expect(h.rendererSpec.renderCanvas).toHaveBeenCalledWith(h.dom.createdCanvases[0], { value: 8, caption: "SPD" });

    h.rendererSpec.renderCanvas.mockClear();
    h.controller.update(h.payload({ value: 8, caption: "SPD" }, 3));
    expect(h.frameQueue).toHaveLength(0);
    expect(h.rendererSpec.renderCanvas).not.toHaveBeenCalled();
  });

  it("invalidateTheme forces repaint without prop changes", function () {
    const h = createHarness();
    h.controller.attach(h.payload({ value: 3 }, 1));
    h.runNextFrame();
    h.rendererSpec.renderCanvas.mockClear();

    expect(h.controller.invalidateTheme("theme-change")).toBe(true);
    expect(h.themeModule.invalidateCanvas).toHaveBeenCalledWith(h.rootEl);
    expect(h.frameQueue).toHaveLength(1);

    h.runNextFrame();

    expect(h.rendererSpec.renderCanvas).toHaveBeenCalledTimes(1);
    expect(h.rendererSpec.renderCanvas).toHaveBeenCalledWith(h.dom.createdCanvases[0], { value: 3 });
  });

  it("detach disconnects observer, cancels pending frames, and clears canvas refs from mount", function () {
    const h = createHarness();
    h.controller.attach(h.payload({ value: 1 }, 1));
    expect(h.frameQueue).toHaveLength(1);

    const pendingFrameId = h.frameQueue[0].id;
    h.controller.detach("surface-switch");

    expect(h.observerInstances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(h.canceledFrames).toContain(pendingFrameId);
    expect(h.frameQueue).toHaveLength(0);
    expect(h.dom.mountEl.children).toHaveLength(0);
  });

  it("throws for strict non-compat contracts", function () {
    const adapter = loadFresh("cluster/rendering/CanvasDomSurfaceAdapter.js").create({}, {
      getModule() {
        return { invalidateCanvas: vi.fn(), invalidateAll: vi.fn() };
      }
    });

    expect(function () {
      adapter.createSurfaceController({
        rendererSpec: {},
        requestAnimationFrame: vi.fn(),
        cancelAnimationFrame: vi.fn(),
        ResizeObserver: function () {}
      });
    }).toThrow("rendererSpec.renderCanvas");

    expect(function () {
      adapter.createSurfaceController({
        rendererSpec: { renderCanvas: vi.fn() },
        requestAnimationFrame: vi.fn(),
        cancelAnimationFrame: vi.fn(),
        ResizeObserver: null
      });
    }).toThrow("ResizeObserver");

    const h = createHarness({ includeMount: false });
    expect(function () {
      h.controller.attach(h.payload({ value: 1 }, 1));
    }).toThrow("dyni-surface-canvas-mount");
  });
});
