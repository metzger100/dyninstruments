// @ts-nocheck
const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel =
      opts.buildModel ||
      vi.fn(function (args) {
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
    const fitCompute =
      opts.fitCompute ||
      vi.fn(() => ({
        nameTextStyle: "font-size:12px;",
        sourceBadgeStyle: "font-size:9px;",
        metrics: Object.create(null)
      }));
    const markupRender =
      opts.markupRender ||
      vi.fn(function (args) {
        const model = args && args.model ? args.model : {};
        const state = model.canOpenEditRoute ? "dispatch" : "passive";
        return (
          "" +
          '<div class="dyni-edit-route-html dyni-edit-route-open-' +
          state +
          '" data-dyni-action="edit-route-open">' +
          (model.canOpenEditRoute ? '<div class="dyni-edit-route-open-hotspot"></div>' : "") +
          "</div>"
        );
      });

    const componentContext = createComponentContextMock({
      modules: {
        EditRouteHtmlFit: {
          create() {
            return { compute: fitCompute };
          }
        },
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
        EditRouteRenderModel: {
          create() {
            return { buildModel };
          }
        },
        EditRouteMarkup: {
          create() {
            return { render: markupRender };
          }
        }
      },
      services: {
        themeTokens: {
          resolveForRoot() {
            return {
              font: {
                family: "sans-serif",
                familyMono: "monospace",
                weight: 720,
                labelWeight: 610
              }
            };
          }
        }
      }
    });

    return {
      renderer: loadFresh("widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js").create(
        {},
        componentContext
      ),
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

  function withSurfacePolicyNoRouteEditor(props) {
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: "navpage",
        interaction: { mode: "dispatch" },
        containerOrientation: "default",
        actions: {}
      }
    });
  }

  function withSurfacePolicyBadOpenEditRoute(props) {
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: "navpage",
        interaction: { mode: "dispatch" },
        containerOrientation: "default",
        actions: {
          routeEditor: { openEditRoute: "not-a-function" }
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

  it("exposes an empty translateFunction map", function () {
    const setup = createRenderer();
    expect(setup.renderer.translateFunction()).toEqual({});
  });

  it("detach unbinds the dispatch listener and removes committed root; destroy delegates to detach", function () {
    const openEditRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "detach" }, { mode: "dispatch", openEditRoute })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openEditRoute).toHaveBeenCalledTimes(1);

    mounted.committed.detach();
    expect(mounted.mountEl.innerHTML).toBe("");

    // The listener was explicitly removed on detach, so the stale wrapper
    // reference must no longer invoke the dispatch action.
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openEditRoute).toHaveBeenCalledTimes(1);

    // destroy() delegates to detach() and must tolerate an already-detached state.
    expect(() => mounted.committed.destroy()).not.toThrow();
    expect(mounted.mountEl.innerHTML).toBe("");
  });

  it("skips route-editor dispatch when surfacePolicy is absent at click time", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(setup.renderer, {
      __canOpen: true,
      __token: "no-policy"
    });

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
    expect(mounted.html()).toContain("dyni-edit-route-open-dispatch");
  });

  it("skips route-editor dispatch when actions has no routeEditor entry", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicyNoRouteEditor({
        __canOpen: true,
        __token: "no-route-editor"
      })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
  });

  it("skips route-editor dispatch when openEditRoute is not a function", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicyBadOpenEditRoute({
        __canOpen: true,
        __token: "bad-fn"
      })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
  });

  it("tolerates a non-object rendererContext by defaulting hostContext", function () {
    const setup = createRenderer();
    const mountEl = document.createElement("div");
    const committed = setup.renderer.createCommittedRenderer(null);

    committed.mount(mountEl, {
      props: withSurfacePolicy({ __canOpen: true, __token: "ctx" }, { mode: "dispatch" }),
      shellRect: { width: 300, height: 150 },
      layoutChanged: true
    });

    expect(mountEl.innerHTML).toContain("dyni-edit-route-html");
  });

  it("falls back to a null shell rect when payload omits shellRect", function () {
    const setup = createRenderer();
    const mountEl = document.createElement("div");
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {}
    });

    committed.mount(mountEl, {
      props: withSurfacePolicy({ __canOpen: true, __token: "no-rect" }, { mode: "dispatch" }),
      layoutChanged: true
    });

    expect(setup.fitCompute).toHaveBeenCalledWith(expect.objectContaining({ shellRect: null }));
  });

  it("falls back to a default fit object when htmlFit.compute returns falsy", function () {
    const setup = createRenderer({ fitCompute: vi.fn(() => null) });
    mountCommitted(setup.renderer, withSurfacePolicy({ __canOpen: true, __token: "falsy-fit" }, { mode: "dispatch" }));

    const calls = setup.markupRender.mock.calls;
    const lastArgs = calls[calls.length - 1][0];
    expect(lastArgs.fit.nameTextStyle).toBe("");
    expect(lastArgs.fit.sourceBadgeStyle).toBe("");
  });
});
