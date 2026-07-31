const fs = require("node:fs");

const path = require("node:path");

const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {Record<string, unknown>} EditRouteProps
 * @typedef {{ buildModel?: (args: { props?: EditRouteProps }) => unknown, fitCompute?: () => unknown, markupRender?: { mock?: { calls: unknown[][] } } & ((args: { model?: Record<string, unknown> & { canOpenEditRoute?: boolean } }) => string) }} RendererOptions
 * @typedef {{ mode?: string, openEditRoute?: () => boolean, orientation?: string, pageId?: string }} SurfaceOptions
 * @typedef {{ __dyniHostCommitState?: { rootEl: HTMLElement, shellEl: HTMLElement } }} HostContext
 * @typedef {{ createCommittedRenderer: (options: { hostContext: HostContext, mountEl: HTMLElement, shadowRoot: null }) => { destroy: () => unknown, detach: () => unknown, layoutSignature: (...args: unknown[]) => unknown, mount: (mountEl: HTMLElement, payload: unknown) => void, postPatch: (payload: unknown) => void, update: (payload: unknown) => void } }} RendererSpec
 */

/** @param {RendererOptions} [options] */
function createRenderer(options) {
  const opts = options || {};
  const buildModel =
    opts.buildModel ||
    vi.fn(function (/** @type {{ props?: EditRouteProps }} */ args) {
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
    vi.fn(function (/** @type {{ model?: Record<string, unknown> & { canOpenEditRoute?: boolean } }} */ args) {
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
    renderer: loadFresh("widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js").create({}, componentContext),
    buildModel,
    fitCompute,
    markupRender
  };
}

/** @param {EditRouteProps} props @param {SurfaceOptions} [options] */
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

/** @param {RendererSpec} rendererSpec @param {EditRouteProps} props @param {{ hostContext?: HostContext, shellSize?: { height: number, width: number } }} [options] */
function mountCommitted(rendererSpec, props, options) {
  const opts = options || {};
  const shellSize = opts.shellSize || { width: 320, height: 180 };
  const hostContext = opts.hostContext || /** @type {HostContext} */ ({});
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
    bottom: shellSize.height,
    width: shellSize.width,
    height: shellSize.height,
    left: 0,
    right: shellSize.width,
    top: 0,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    }
  }));

  const committed = rendererSpec.createCommittedRenderer({
    hostContext,
    mountEl,
    shadowRoot: null
  });

  let revision = 0;

  /** @param {EditRouteProps} nextProps @param {boolean} layoutChanged */
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
    /** @param {EditRouteProps} nextProps @param {boolean} layoutChanged */
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

/** @param {EditRouteProps} props */
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

/** @param {EditRouteProps} props */
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

module.exports = {
  createComponentContextMock,
  createRenderer,
  fs,
  loadFresh,
  mountCommitted,
  path,
  withSurfacePolicy,
  withSurfacePolicyBadOpenEditRoute,
  withSurfacePolicyNoRouteEditor
};
