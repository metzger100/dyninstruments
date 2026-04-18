const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const fitCompute = opts.fitCompute || vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: { captionStyle: "font-size:12px;", valueStyle: "font-size:18px;", unitStyle: "font-size:11px;" },
          eta: { captionStyle: "font-size:11px;", valueStyle: "font-size:17px;", unitStyle: "font-size:10px;" },
          next: { captionStyle: "font-size:10px;", valueStyle: "font-size:16px;", unitStyle: "font-size:9px;" }
        }
      };
    });
    const Helpers = {
      applyFormatter: opts.applyFormatter || function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        if (cfg.formatter === "formatDistance") {
          return "DIST:" + String(value);
        }
        if (cfg.formatter === "formatTime") {
          return "TIME:" + String(value);
        }
        if (cfg.formatter === "formatDirection") {
          return "DIR:" + String(value);
        }
        return String(value);
      },
      getModule(id) {
        if (id === "ActiveRouteHtmlFit") {
          return { create: () => ({ compute: fitCompute }) };
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        if (id === "PreparedPayloadModelCache") {
          return loadFresh("shared/widget-kits/html/PreparedPayloadModelCache.js");
        }
        if (id === "PlaceholderNormalize") {
          return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, Helpers),
      fitCompute
    };
  }

  function makeProps(overrides) {
    return Object.assign({
      routeName: "Harbor Run",
      disconnect: false,
      display: {
        remain: 12.4,
        eta: "2026-03-06T11:45:00Z",
        nextCourse: 93,
        isApproaching: true
      },
      captions: {
        remain: "RTE",
        eta: "ETA",
        nextCourse: "NEXT"
      },
      units: {
        remain: "nm",
        eta: "",
        nextCourse: "deg"
      },
      default: "---"
    }, overrides || {});
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const openActiveRoute = opts.openActiveRoute || vi.fn(() => true);
    const pageId = opts.pageId || "navpage";
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId,
        containerOrientation: orientation,
        interaction: { mode },
        actions: {
          routeEditor: {
            openActiveRoute
          }
        }
      }
    });
  }

  function mountCommitted(rendererSpec, props, options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 320, height: 180 };
    const hostContext = opts.hostContext || {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    shellEl.appendChild(mountEl);
    rootEl.appendChild(shellEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

    mountEl.getBoundingClientRect = vi.fn(() => ({
      width: shellSize.width,
      height: shellSize.height
    }));

    const committed = rendererSpec.createCommittedRenderer({
      hostContext,
      mountEl,
      shadowRoot: null
    });

    function buildPayload(nextProps, revision, layoutChanged) {
      return {
        props: nextProps,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect: { width: shellSize.width, height: shellSize.height },
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const initial = buildPayload(props, 1, true);
    committed.mount(mountEl, initial);
    committed.postPatch(initial);

    return {
      hostContext,
      mountEl,
      committed,
      update(nextProps) {
        const payload = buildPayload(nextProps, 2, true);
        committed.update(payload);
        committed.postPatch(payload);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("exposes committed renderer contract", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;

    expect(renderer.id).toBe("ActiveRouteTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
    expect(renderer.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 2 });
  });

  it("renders dispatch markup and dispatches route open on click", function () {
    const setup = createRenderer();
    const openActiveRoute = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", openActiveRoute })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-html");
    expect(html).toContain("dyni-active-route-open-dispatch");
    expect(html).toContain('data-dyni-action="active-route-open"');
    expect(html).toContain("dyni-active-route-open-hotspot");
    expect(html).toContain("DIST:12.4");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.mountEl.querySelector(".dyni-active-route-metric-caption").getAttribute("style")).toBe("font-size:12px;");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).toHaveBeenCalledTimes(1);
  });

  it("keeps passive interaction in edit mode and does not dispatch", function () {
    const openActiveRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ editing: true }), { mode: "dispatch", openActiveRoute })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).not.toHaveBeenCalled();
  });

  it("normalizes known formatter fallback tokens to the configured default", function () {
    const setup = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDistance") {
          return "  -";
        }
        if (cfg.formatter === "formatTime") {
          return "--:--:--";
        }
        if (cfg.formatter === "formatDirection") {
          return "NO DATA";
        }
        return value == null ? cfg.default : String(value);
      }
    });
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch" })
    );

    const valueTexts = Array.from(mounted.mountEl.querySelectorAll(".dyni-active-route-metric-value"))
      .map((el) => el.textContent);
    expect(valueTexts).toEqual(["---", "---", "---"]);
    expect(mounted.html()).not.toContain("--:--:--");
    expect(mounted.html()).not.toContain("NO DATA");
  });

  it("always consults ActiveRouteHtmlFit when a shell rect exists", function () {
    const fitCompute = vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: { captionStyle: "font-size:12px;", valueStyle: "font-size:18px;", unitStyle: "font-size:11px;" },
          eta: { captionStyle: "font-size:11px;", valueStyle: "font-size:17px;", unitStyle: "font-size:10px;" },
          next: { captionStyle: "font-size:10px;", valueStyle: "font-size:16px;", unitStyle: "font-size:9px;" }
        }
      };
    });
    const setup = createRenderer({ fitCompute });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    function payload(revision, layoutChanged) {
      return {
        props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        mountEl: mountEl,
        shadowRoot: null,
        shellRect: { width: 320, height: 180 },
        hostContext: hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const initial = payload(1, true);
    committed.mount(mountEl, initial);
    expect(fitCompute).toHaveBeenCalledTimes(1);

    const stableUpdate = payload(2, false);
    committed.update(stableUpdate);
    expect(fitCompute).toHaveBeenCalledTimes(2);
  });

  it("updates layout signature when ratio-driven mode changes", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });

    const baseSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 220, height: 180 }
    });
    const flatSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 520, height: 120 }
    });

    expect(flatSig).not.toBe(baseSig);
  });

  it("mirrors page/orientation context into shadow-root-visible root", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "editroutepage", orientation: "vertical" })
    );

    const root = mounted.mountEl.querySelector(".dyni-html-root");
    expect(root).toBeTruthy();
    expect(root.getAttribute("data-dyni-page-id")).toBe("editroutepage");
    expect(root.getAttribute("data-dyni-orientation")).toBe("vertical");
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-active-route-html");
    expect(css).not.toContain("#navpage .widgetContainer.vertical");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*2\s*\/\s*1/);
    expect(css).not.toMatch(/min-height.*4\.8em/);
  });

  it("reuses prepared semantic model across layoutSignature and patchDom and invalidates on structural boundaries", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value == null) {
        return cfg.default;
      }
      if (cfg.formatter === "formatDistance") {
        return "DIST:" + String(value);
      }
      if (cfg.formatter === "formatTime") {
        return "TIME:" + String(value);
      }
      if (cfg.formatter === "formatDirection") {
        return "DIR:" + String(value);
      }
      return String(value);
    });
    const setup = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    function buildPayload(props, revision, shellRect, layoutChanged) {
      return {
        props,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect,
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const propsA = withSurfacePolicy(makeProps(), { mode: "dispatch" });
    const initial = buildPayload(propsA, 1, { width: 320, height: 180 }, true);
    committed.layoutSignature(initial);
    committed.mount(mountEl, initial);
    expect(applyFormatter).toHaveBeenCalledTimes(3);

    const revisionChanged = buildPayload(propsA, 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(revisionChanged);
    committed.update(revisionChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    const propsIdentityChanged = buildPayload(withSurfacePolicy(makeProps(), { mode: "dispatch" }), 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(propsIdentityChanged);
    committed.update(propsIdentityChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(9);

    const shellSizeChanged = buildPayload(propsIdentityChanged.props, 2, { width: 321, height: 180 }, true);
    committed.layoutSignature(shellSizeChanged);
    committed.update(shellSizeChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(12);
  });

  it("clears prepared semantic model state on detach and destroy", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value == null ? cfg.default : String(value);
    });
    const setup = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    const payload = {
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      revision: 7,
      rootEl,
      shellEl,
      mountEl,
      shadowRoot: null,
      shellRect: { width: 320, height: 180 },
      hostContext,
      layoutChanged: true,
      relayoutPass: 0
    };

    committed.layoutSignature(payload);
    committed.mount(mountEl, payload);
    expect(applyFormatter).toHaveBeenCalledTimes(3);

    committed.detach("test");
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    committed.mount(mountEl, payload);
    committed.destroy();
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(9);
  });
});
