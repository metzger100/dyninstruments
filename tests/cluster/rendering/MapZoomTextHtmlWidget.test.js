const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("MapZoomTextHtmlWidget", function () {
  const MODULE_PATH_BY_ID = {
    HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
    MapZoomHtmlFit: "shared/widget-kits/nav/MapZoomHtmlFit.js",
    StableDigits: "shared/widget-kits/format/StableDigits.js",
    ThemeResolver: "shared/theme/ThemeResolver.js",
    TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
    RadialValueMath: "shared/widget-kits/radial/RadialValueMath.js",
    RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
    TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
    TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
    ResponsiveScaleProfile: "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    RadialTextLayout: "shared/widget-kits/radial/RadialTextLayout.js",
    RadialTextFitting: "shared/widget-kits/radial/RadialTextFitting.js",
    PlaceholderNormalize: "shared/widget-kits/format/PlaceholderNormalize.js",
    PreparedPayloadModelCache: "shared/widget-kits/html/PreparedPayloadModelCache.js",
    StateScreenLabels: "shared/widget-kits/state/StateScreenLabels.js",
    StateScreenPrecedence: "shared/widget-kits/state/StateScreenPrecedence.js",
    StateScreenInteraction: "shared/widget-kits/state/StateScreenInteraction.js",
    StateScreenMarkup: "shared/widget-kits/state/StateScreenMarkup.js"
  };

  function createRenderer(options) {
    const opts = options || {};
    const moduleCache = Object.create(null);
    const Helpers = {
      applyFormatter: opts.applyFormatter || function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        if (cfg.formatter === "formatDecimalOpt") {
          return "Z:" + String(value);
        }
        return String(value);
      },
      resolveFontFamily: opts.resolveFontFamily || function () {
        return "sans-serif";
      },
      requirePluginRoot: opts.requirePluginRoot || function () {
        if (!arguments[0] || typeof arguments[0].closest !== "function") {
          return null;
        }
        return arguments[0].closest(".widget, .DirectWidget");
      },
      getNightModeState: opts.getNightModeState || function () {
        return false;
      },
      getModule: opts.getModule || function (id) {
        const relPath = MODULE_PATH_BY_ID[id];
        if (!relPath) {
          throw new Error("unexpected module lookup: " + id);
        }
        if (!moduleCache[id]) {
          moduleCache[id] = loadFresh(relPath);
        }
        return moduleCache[id];
      }
    };

    return loadFresh("widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js").create({}, Helpers);
  }

  function makeProps(overrides) {
    return Object.assign({
      caption: "ZOOM",
      unit: "",
      zoom: 12.2,
      requiredZoom: 11.9,
      default: "---"
    }, overrides || {});
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const checkAutoZoom = opts.checkAutoZoom || vi.fn(() => true);
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    const pageId = opts.pageId || "navpage";

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId,
        containerOrientation: orientation,
        interaction: { mode },
        actions: {
          map: {
            checkAutoZoom
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

    function payload(nextProps, revision, layoutChanged) {
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

    const initial = payload(props, 1, true);
    committed.mount(mountEl, initial);
    committed.postPatch(initial);

    return {
      mountEl,
      committed,
      update(nextProps, layoutChanged) {
        const next = payload(nextProps, 2, layoutChanged === true);
        committed.update(next);
        committed.postPatch(next);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("exposes committed renderer contract", function () {
    const renderer = createRenderer();

    expect(renderer.id).toBe("MapZoomTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
    expect(renderer.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 2 });
  });

  it("renders dispatch markup and dispatches map check action on click", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", checkAutoZoom })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-map-zoom-html");
    expect(html).toContain("dyni-map-zoom-open-dispatch");
    expect(html).toContain('data-dyni-action="map-zoom-check-auto"');
    expect(html).toContain("dyni-map-zoom-open-hotspot");

    const wrapper = mounted.mountEl.querySelector(".dyni-map-zoom-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(checkAutoZoom).toHaveBeenCalledTimes(1);
  });

  it("stays passive when editing mode is active", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ editing: true }), { mode: "dispatch", checkAutoZoom })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-map-zoom-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-map-zoom-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

  it("renders disconnected state-screen and disables dispatch", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), { mode: "dispatch", checkAutoZoom })
    );

    expect(mounted.html()).toContain("dyni-state-disconnected");
    expect(mounted.html()).toContain("GPS Lost");
    expect(mounted.html()).toContain("dyni-map-zoom-open-passive");
    expect(mounted.html()).not.toContain("dyni-map-zoom-open-hotspot");

    const wrapper = mounted.mountEl.querySelector(".dyni-map-zoom-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

  it("normalizes placeholder formatter output to the shared default token", function () {
    const renderer = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDecimalOpt") {
          return "NO DATA";
        }
        return value == null ? cfg.default : String(value);
      }
    });
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ zoom: 12.2, requiredZoom: 11.9 }), { mode: "dispatch" })
    );

    expect(mounted.html()).toContain("---");
    expect(mounted.html()).not.toContain("NO DATA");
  });

  it("renders stable digits with tabular value classes and padded numbers", function () {
    const renderer = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        return String(value);
      }
    });
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ stableDigits: true, zoom: 7.2, requiredZoom: 6.5 }), { mode: "dispatch" })
    );

    expect(mounted.html()).toContain("dyni-map-zoom-value dyni-tabular");
    expect(mounted.html()).toContain("dyni-map-zoom-required dyni-tabular");
    expect(mounted.html()).toContain("07.2");
    expect(mounted.html()).toContain("(06.5)");
  });

  it("always consults MapZoomHtmlFit when a shell rect exists", function () {
    const fitCompute = vi.fn(function () {
      return {
        captionStyle: "font-size:12px;",
        valueStyle: "font-size:20px;",
        unitStyle: "font-size:10px;",
        requiredStyle: "font-size:8px;"
      };
    });
    const moduleCache = Object.create(null);
    const renderer = createRenderer({
      getModule(id) {
        if (id === "MapZoomHtmlFit") {
          return { create: () => ({ compute: fitCompute }) };
        }
        const relPath = MODULE_PATH_BY_ID[id];
        if (!relPath) {
          throw new Error("unexpected module lookup: " + id);
        }
        if (!moduleCache[id]) {
          moduleCache[id] = loadFresh(relPath);
        }
        return moduleCache[id];
      }
    });
    const hostContext = {};
    const committed = renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

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

  it("resolves ratio modes and required row correctly", function () {
    const renderer = createRenderer();
    const highMounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ unit: "x" }), { mode: "dispatch" }),
      { shellSize: { width: 90, height: 200 } }
    );
    const flatMounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ unit: "x" }), { mode: "dispatch" }),
      { shellSize: { width: 460, height: 100 } }
    );
    const requiredMounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ zoom: 12.2, requiredZoom: 0, captionUnitScale: 1.1 }), { mode: "dispatch" })
    );

    expect(highMounted.html()).toContain("dyni-map-zoom-mode-high");
    expect(flatMounted.html()).toContain("dyni-map-zoom-mode-flat");
    expect(requiredMounted.html()).toContain('class="dyni-map-zoom-required"');
    expect(requiredMounted.html()).toContain("(Z:0)");
    expect(requiredMounted.html()).toContain("--dyni-map-zoom-sec-scale:1.1;");
  });

  it("escapes content and fails closed without default", function () {
    const renderer = createRenderer({
      applyFormatter: function () {
        return '<span class="unsafe">x</span>';
      }
    });
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({
        caption: "<ZOOM>",
        unit: '"deg"',
        zoom: 12.1,
        requiredZoom: 11.7
      }), { mode: "dispatch" })
    );

    const html = mounted.html();
    expect(html).toContain("&lt;ZOOM&gt;");
    expect(html).toContain('"deg"');
    expect(html).toContain('&lt;span class="unsafe"&gt;x&lt;/span&gt;');

    const committed = renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });
    const mountEl = document.createElement("div");
    expect(function () {
      committed.mount(mountEl, {
        props: { caption: "ZOOM" },
        revision: 1,
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        mountEl,
        shadowRoot: null,
        shellRect: { width: 320, height: 180 },
        hostContext: {},
        layoutChanged: true,
        relayoutPass: 0
      });
    }).toThrow("props.default is required");
  });

  it("updates layout signature when layout-relevant data changes", function () {
    const renderer = createRenderer();
    const committed = renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });

    const base = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 300, height: 100 }
    });
    const captionChanged = committed.layoutSignature({
      props: withSurfacePolicy(makeProps({ caption: "ZOOM EXT" }), { mode: "dispatch" }),
      shellRect: { width: 300, height: 100 }
    });
    const stableDigitsChanged = committed.layoutSignature({
      props: withSurfacePolicy(makeProps({ stableDigits: true, zoom: 12.2, requiredZoom: 11.9 }), { mode: "dispatch" }),
      shellRect: { width: 300, height: 100 }
    });
    const shapeChanged = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 90, height: 200 }
    });

    expect(captionChanged).not.toBe(base);
    expect(stableDigitsChanged).not.toBe(base);
    expect(shapeChanged).not.toBe(base);
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-map-zoom-html");
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
      if (cfg.formatter === "formatDecimalOpt") {
        return "Z:" + String(value);
      }
      return String(value);
    });
    const renderer = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

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
    expect(applyFormatter).toHaveBeenCalledTimes(2);

    const revisionChanged = buildPayload(propsA, 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(revisionChanged);
    committed.update(revisionChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(4);

    const propsIdentityChanged = buildPayload(withSurfacePolicy(makeProps(), { mode: "dispatch" }), 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(propsIdentityChanged);
    committed.update(propsIdentityChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    const shellSizeChanged = buildPayload(propsIdentityChanged.props, 2, { width: 321, height: 180 }, true);
    committed.layoutSignature(shellSizeChanged);
    committed.update(shellSizeChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(8);
  });

  it("clears prepared semantic model state on detach and destroy", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value == null ? cfg.default : String(value);
    });
    const renderer = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

    const payload = {
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      revision: 5,
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
    expect(applyFormatter).toHaveBeenCalledTimes(2);

    committed.detach("test");
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(4);

    committed.mount(mountEl, payload);
    committed.destroy();
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(6);
  });
});
