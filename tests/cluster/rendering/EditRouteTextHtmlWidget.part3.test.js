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
          visibleMetricIds: ["pts", "dst", "rte", "rteEta"],
          flatMetricRows: 1,
          metricsStyle: "",
          wrapperStyle: ""
        };
      }),
      markupRender(args) {
        const model = args && args.model ? args.model : {};
        return (
          "" +
          '<div class="dyni-edit-route-html dyni-edit-route-mode-' +
          model.mode +
          '">' +
          '<div class="dyni-edit-route-metrics">' +
          '<div class="dyni-edit-route-metric-row"></div>' +
          "</div>" +
          "</div>"
        );
      }
    });

    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "high" }, { mode: "dispatch" }),
      { shellSize: { width: 180, height: 280 } }
    );

    expect(setup.buildModel).toHaveBeenCalledWith(
      expect.objectContaining({
        shellRect: { width: 180, height: 280 }
      })
    );
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-mode-high");
    expect(mounted.html()).toContain('class="dyni-edit-route-metric-row"');
    expect(mounted.html()).not.toContain('class="dyni-edit-route-metric"');
  });

  it("respects layoutChanged for fit recomputation and layout signature", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(setup.renderer, withSurfacePolicy({ __canOpen: true, __token: "1" }, {}));

    mounted.update(withSurfacePolicy({ __canOpen: true, __token: "2" }, {}), false);
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);

    mounted.update(withSurfacePolicy({ __canOpen: true, __token: "3" }, {}), true);
    expect(setup.fitCompute).toHaveBeenCalledTimes(2);

    const sigA = mounted.committed.layoutSignature({
      props: { __token: "A" },
      shellRect: { width: 320, height: 180 }
    });
    const sigB = mounted.committed.layoutSignature({
      props: { __token: "B" },
      shellRect: { width: 320, height: 180 }
    });
    expect(sigB).not.toBe(sigA);
  });
});
