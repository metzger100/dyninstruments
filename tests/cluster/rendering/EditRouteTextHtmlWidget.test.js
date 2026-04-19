const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel = opts.buildModel || vi.fn(function (args) {
      const props = args && args.props ? args.props : {};
      const canOpen = props.__canOpen === true;
      return {
        kind: props.__kind || "data",
        mode: "normal",
        hasRoute: true,
        isLocalRoute: false,
        isServerRoute: false,
        isActiveRoute: false,
        canOpenEditRoute: canOpen,
        captureClicks: canOpen,
        resizeSignatureParts: ["sig", props.__token || "1"],
        nameText: "Route",
        sourceBadgeText: "",
        metrics: Object.create(null),
        visibleMetricIds: [],
        flatMetricRows: 1,
        metricsStyle: "",
        wrapperStyle: ""
      };
    });
    const fitCompute = opts.fitCompute || vi.fn(() => ({
      nameTextStyle: "font-size:12px;",
      sourceBadgeStyle: "font-size:9px;",
      metrics: Object.create(null)
    }));
    const markupRender = opts.markupRender || vi.fn(function (args) {
      const model = args && args.model ? args.model : {};
      const state = model.canOpenEditRoute ? "dispatch" : "passive";
      return ''
        + '<div class="dyni-edit-route-html dyni-edit-route-open-' + state + '" data-dyni-action="edit-route-open">'
        + (model.canOpenEditRoute ? '<div class="dyni-edit-route-open-hotspot"></div>' : "")
        + "</div>";
    });

    const Helpers = {
      getModule(id) {
        if (id === "EditRouteHtmlFit") {
          return {
            create() {
              return { compute: fitCompute };
            }
          };
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        if (id === "EditRouteRenderModel") {
          return {
            create() {
              return {
                buildModel
              };
            }
          };
        }
        if (id === "EditRouteMarkup") {
          return {
            create() {
              return { render: markupRender };
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js").create({}, Helpers),
      buildModel,
      fitCompute,
      markupRender
    };
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    const openEditRoute = opts.openEditRoute || vi.fn(() => true);

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: opts.pageId || "navpage",
        interaction: { mode },
        containerOrientation: orientation,
        actions: {
          routeEditor: {
            openEditRoute
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

    let revision = 0;

    function payload(nextProps, layoutChanged) {
      revision += 1;
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

    const initial = payload(props, true);
    committed.mount(mountEl, initial);
    committed.postPatch(initial);

    return {
      mountEl,
      committed,
      update(nextProps, layoutChanged) {
        const next = payload(nextProps, layoutChanged === true);
        committed.update(next);
        committed.postPatch(next);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("exposes committed renderer contract", function () {
    const renderer = createRenderer().renderer;

    expect(renderer.id).toBe("EditRouteTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
    expect(renderer.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 7 / 8 });
  });

  it("dispatches route-editor open action only in dispatch state", function () {
    const openEditRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "a" }, { mode: "dispatch", openEditRoute })
    );

    let wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openEditRoute).toHaveBeenCalledTimes(1);

    mounted.update(
      withSurfacePolicy({ __canOpen: false, __token: "b" }, { mode: "dispatch", openEditRoute }),
      true
    );
    wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(openEditRoute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-open-passive");
  });

  it("passes hideSeconds through to the render model", function () {
    const setup = createRenderer();
    mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, hideSeconds: true, __token: "hide-seconds" }, { mode: "dispatch" })
    );

    expect(setup.buildModel).toHaveBeenCalledWith(expect.objectContaining({
      props: expect.objectContaining({
        hideSeconds: true
      })
    }));
  });

  it("orchestrates model/fit/markup with committed vertical facts", function () {
    const setup = createRenderer();
    mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "x" }, { orientation: "vertical" }),
      { shellSize: { width: 240, height: 120 } }
    );

    expect(setup.buildModel).toHaveBeenCalledWith(expect.objectContaining({
      isVerticalCommitted: true,
      shellRect: { width: 240, height: 120 }
    }));
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(setup.markupRender).toHaveBeenCalledTimes(1);
  });

  it("keeps compact normal mode on the normal metric path", function () {
    const setup = createRenderer({
      buildModel: vi.fn(function (args) {
        const props = args && args.props ? args.props : {};
        return {
          kind: "data",
          mode: "normal",
          hasRoute: true,
          isLocalRoute: false,
          isServerRoute: false,
          isActiveRoute: false,
          canOpenEditRoute: true,
          captureClicks: true,
          resizeSignatureParts: ["sig", props.__token || "compact"],
          nameText: "Route",
          sourceBadgeText: "",
          metrics: Object.create(null),
          visibleMetricIds: ["pts", "dst", "rte", "eta"],
          flatMetricRows: 1,
          metricsStyle: "",
          wrapperStyle: ""
        };
      }),
      markupRender(args) {
        const model = args && args.model ? args.model : {};
        return ""
          + '<div class="dyni-edit-route-html dyni-edit-route-mode-' + model.mode + '">'
          + '<div class="dyni-edit-route-metrics">'
          + '<div class="dyni-edit-route-metric"></div>'
          + "</div>"
          + "</div>";
      }
    });

    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "compact" }, { mode: "dispatch" }),
      { shellSize: { width: 220, height: 180 } }
    );

    expect(setup.buildModel).toHaveBeenCalledWith(expect.objectContaining({
      shellRect: { width: 220, height: 180 }
    }));
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-mode-normal");
    expect(mounted.html()).toContain('class="dyni-edit-route-metric"');
    expect(mounted.html()).not.toContain("dyni-edit-route-metric-row");
  });

  it("keeps high mode on the row layout path", function () {
    const setup = createRenderer({
      buildModel: vi.fn(function (args) {
        const props = args && args.props ? args.props : {};
        return {
          kind: "data",
          mode: "high",
          hasRoute: true,
          isLocalRoute: false,
          isServerRoute: false,
          isActiveRoute: false,
          canOpenEditRoute: true,
          captureClicks: true,
          resizeSignatureParts: ["sig", props.__token || "high"],
          nameText: "Route",
          sourceBadgeText: "",
          metrics: Object.create(null),
          visibleMetricIds: ["pts", "dst", "rte", "eta"],
          flatMetricRows: 1,
          metricsStyle: "",
          wrapperStyle: ""
        };
      }),
      markupRender(args) {
        const model = args && args.model ? args.model : {};
        return ""
          + '<div class="dyni-edit-route-html dyni-edit-route-mode-' + model.mode + '">'
          + '<div class="dyni-edit-route-metrics">'
          + '<div class="dyni-edit-route-metric-row"></div>'
          + "</div>"
          + "</div>";
      }
    });

    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "high" }, { mode: "dispatch" }),
      { shellSize: { width: 180, height: 280 } }
    );

    expect(setup.buildModel).toHaveBeenCalledWith(expect.objectContaining({
      shellRect: { width: 180, height: 280 }
    }));
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-mode-high");
    expect(mounted.html()).toContain('class="dyni-edit-route-metric-row"');
    expect(mounted.html()).not.toContain('class="dyni-edit-route-metric"');
  });

  it("respects layoutChanged for fit recomputation and layout signature", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "1" }, {})
    );

    mounted.update(withSurfacePolicy({ __canOpen: true, __token: "2" }, {}), false);
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);

    mounted.update(withSurfacePolicy({ __canOpen: true, __token: "3" }, {}), true);
    expect(setup.fitCompute).toHaveBeenCalledTimes(2);

    const sigA = mounted.committed.layoutSignature({ props: { __token: "A" }, shellRect: { width: 320, height: 180 } });
    const sigB = mounted.committed.layoutSignature({ props: { __token: "B" }, shellRect: { width: 320, height: 180 } });
    expect(sigB).not.toBe(sigA);
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-edit-route-html");
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*7\s*\/\s*8/);
    expect(css).not.toMatch(/min-height.*8em/);
    expect(css).toContain("padding: 0.08em 0.12em;");
    expect(css).toContain("gap: 0.08em;");
    expect(css).toContain("row-gap: 0.04em;");
    expect(css).not.toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(css).toContain("grid-template-rows: minmax(0, 0.34fr) minmax(0, 0.66fr);");
    expect(css).toContain("align-content: stretch;");
    expect(css).toContain("flex: 0 1 auto;");
    expect(css).toContain("flex: 0 0 auto;");
    expect(css).not.toContain("overflow: hidden;");
  });

  it("keeps metric row fractions and shrink guards in css", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toMatch(/\.dyni-html-root \.dyni-edit-route-metric-label \{[\s\S]*?min-height: 0;/);
    expect(css).toMatch(/\.dyni-html-root \.dyni-edit-route-metric-value \{[\s\S]*?min-height: 0;/);
    expect(css).not.toContain("overflow: hidden;");
  });
});
