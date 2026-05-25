const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("MapZoomTextHtmlWidget", function () {
  const MODULE_PATH_BY_ID = {
    HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
    MapZoomHtmlFit: "shared/widget-kits/nav/MapZoomHtmlFit.js",
    StableDigits: "shared/widget-kits/format/StableDigits.js",
    TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
    ValueMath: "shared/widget-kits/value/ValueMath.js",
    RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
    TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
    TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
    ResponsiveScaleProfile:
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    CanvasTextLayout: "shared/widget-kits/text/CanvasTextLayout.js",
    RadialTextFitting: "shared/widget-kits/radial/RadialTextFitting.js",
    PlaceholderNormalize: "shared/widget-kits/format/PlaceholderNormalize.js",
    PreparedPayloadModelCache:
      "shared/widget-kits/html/PreparedPayloadModelCache.js",
    StateScreenLabels: "shared/widget-kits/state/StateScreenLabels.js",
    StateScreenPrecedence: "shared/widget-kits/state/StateScreenPrecedence.js",
    StateScreenInteraction:
      "shared/widget-kits/state/StateScreenInteraction.js",
    StateScreenTextFit: "shared/widget-kits/state/StateScreenTextFit.js",
    StateScreenMarkup: "shared/widget-kits/state/StateScreenMarkup.js",
  };

  function createRenderer(options) {
    const opts = options || {};
    const moduleCache = Object.create(null);
    const applyFormatter =
      opts.applyFormatter ||
      function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        if (cfg.formatter === "formatDecimalOpt") {
          return "Z:" + String(value);
        }
        return String(value);
      };
    const requirePluginRoot =
      opts.requirePluginRoot ||
      function () {
        if (!arguments[0] || typeof arguments[0].closest !== "function") {
          return null;
        }
        return arguments[0].closest(".widget, .DirectWidget");
      };
    const getNightModeState =
      opts.getNightModeState ||
      function () {
        return false;
      };
    const loadDep =
      opts.loadDep ||
      function (id) {
        const relPath = MODULE_PATH_BY_ID[id];
        if (!relPath) {
          throw new Error("unexpected module lookup: " + id);
        }
        if (!moduleCache[id]) {
          moduleCache[id] = loadFresh(relPath);
        }
        return moduleCache[id];
      };
    const modules = Object.create(null);
    Object.keys(MODULE_PATH_BY_ID).forEach(function (id) {
      modules[id] = loadDep(id);
    });
    const componentContext = createComponentContextMock({
      modules,
      services: {
        format: { applyFormatter },
        dom: { requirePluginRoot, getNightModeState },
        themeTokens: {
          resolveForRoot() {
            return {
              surface: { fg: "#fff", bg: "#000", border: "#666" },
              font: {
                family: "sans-serif",
                familyMono: "monospace",
                weight: 700,
                labelWeight: 700,
              },
              colors: {},
            };
          },
        },
      },
    });
    return loadFresh(
      "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js",
    ).create({}, componentContext);
  }

  function makeProps(overrides) {
    return Object.assign(
      {
        caption: "ZOOM",
        unit: "",
        zoom: 12.2,
        requiredZoom: 11.9,
        default: "---",
      },
      overrides || {},
    );
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const checkAutoZoom = opts.checkAutoZoom || vi.fn(() => true);
    const orientation =
      opts.orientation === "vertical" ? "vertical" : "default";
    const pageId = opts.pageId || "navpage";

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId,
        containerOrientation: orientation,
        interaction: { mode },
        actions: {
          map: {
            checkAutoZoom,
          },
        },
      },
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
      height: shellSize.height,
    }));

    const committed = rendererSpec.createCommittedRenderer({
      hostContext,
      mountEl,
      shadowRoot: null,
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
        relayoutPass: 0,
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
      },
    };
  }

  it("exposes committed renderer contract", function () {
    const renderer = createRenderer();

    expect(renderer.id).toBe("MapZoomTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });

  it("renders dispatch markup and dispatches map check action on click", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", checkAutoZoom }),
    );

    const html = mounted.html();
    expect(html).toContain("dyni-map-zoom-html");
    expect(html).toContain("dyni-map-zoom-open-dispatch");
    expect(html).toContain('data-dyni-action="map-zoom-check-auto"');
    expect(html).toContain("dyni-map-zoom-open-hotspot");

    const wrapper = mounted.mountEl.querySelector(".dyni-map-zoom-html");
    wrapper.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(checkAutoZoom).toHaveBeenCalledTimes(1);
  });

  it("stays passive when editing mode is active", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ editing: true }), {
        mode: "dispatch",
        checkAutoZoom,
      }),
    );

    const html = mounted.html();
    expect(html).toContain("dyni-map-zoom-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-map-zoom-html");
    wrapper.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

  it("renders disconnected state-screen and disables dispatch", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), {
        mode: "dispatch",
        checkAutoZoom,
      }),
    );

    expect(mounted.html()).toContain("dyni-state-disconnected");
    expect(mounted.html()).toContain("GPS Lost");
    expect(mounted.html()).toContain("dyni-map-zoom-open-passive");
    expect(mounted.html()).not.toContain("dyni-map-zoom-open-hotspot");

    const wrapper = mounted.mountEl.querySelector(".dyni-map-zoom-html");
    wrapper.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

});
