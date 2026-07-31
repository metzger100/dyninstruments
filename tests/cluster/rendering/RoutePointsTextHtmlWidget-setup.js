const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {Record<string, unknown>} RoutePointsProps
 * @typedef {{ buildModel?: (args: { props?: RoutePointsProps }) => unknown, computeNaturalHeight?: () => unknown, fitCompute?: (args: { model?: { points?: unknown[] } }) => unknown, maybeReveal?: () => boolean, measureListScrollbarGutter?: () => number }} RendererOptions
 * @typedef {{ actions?: unknown, activate?: (index: number) => boolean, mode?: string, orientation?: string, pageId?: string }} SurfaceOptions
 * @typedef {{ __dyniHostCommitState?: { rootEl: HTMLElement, shellEl: HTMLElement } }} HostContext
 * @typedef {{ createCommittedRenderer: (options: { hostContext: HostContext, mountEl: HTMLElement, shadowRoot: null }) => { destroy: () => unknown, detach: () => unknown, mount: (mountEl: HTMLElement, payload: unknown) => void, postPatch: (payload?: unknown) => unknown, update: (payload: unknown) => void } }} RendererSpec
 */

/** @param {RendererOptions} [options] */
function createRenderer(options) {
  const opts = options || {};
  const buildModel =
    opts.buildModel ||
    vi.fn(function (/** @type {{ props?: RoutePointsProps }} */ args) {
      const props = args && args.props ? args.props : {};
      const interactionState = props.__interactionState || (props.__canActivate === true ? "dispatch" : "passive");
      const points = Array.isArray(props.__points)
        ? props.__points
        : [
            {
              index: 0,
              ordinalText: "1",
              nameText: "WP1",
              infoText: "I",
              selected: false
            }
          ];
      return {
        mode: props.__mode || "normal",
        kind: props.__kind || "data",
        stateLabel: props.__stateLabel || "",
        interactionState,
        stableDigitsEnabled: props.__stableDigits === true,
        showHeader: true,
        showOrdinal: true,
        hasRoute: (props.__kind || "data") === "data",
        routeNameText: props.__routeNameText || "Route",
        metaText: "1 WP",
        points,
        isActiveRoute: false,
        canActivateRoutePoint: interactionState === "dispatch",
        hasValidSelection: props.__hasValidSelection === true,
        selectedIndex: Number.isInteger(props.__selectedIndex) ? props.__selectedIndex : -1,
        activeWaypointKey: props.__activeKey || null,
        resizeSignatureParts: ["sig", props.__token || "1"],
        inlineGeometry: {
          wrapper: { style: "" },
          list: { style: "", contentStyle: "" },
          header: { style: "", routeNameStyle: "", metaStyle: "" },
          rows: points.map(function () {
            return {
              rowStyle: "",
              ordinalStyle: "",
              middleStyle: "",
              nameStyle: "",
              infoStyle: "",
              markerStyle: "",
              markerDotStyle: ""
            };
          })
        }
      };
    });
  const fitCompute =
    opts.fitCompute ||
    vi.fn(function (/** @type {{ model?: { points?: unknown[] } }} */ args) {
      const model = args && args.model ? args.model : { points: [] };
      const points = model.points || [];
      return {
        headerFit: { routeNameStyle: "", metaStyle: "" },
        rowFits: points.map(function () {
          return { ordinalStyle: "", nameStyle: "", infoStyle: "" };
        }),
        emptyStyle: ""
      };
    });
  const maybeReveal = opts.maybeReveal || vi.fn(() => true);
  const measureListScrollbarGutter = opts.measureListScrollbarGutter || vi.fn(() => 0);
  const computeNaturalHeight = opts.computeNaturalHeight || vi.fn(() => ({ cappedHeight: 240 }));

  const componentContext = createComponentContextMock({
    modules: {
      RoutePointsHtmlFit: {
        create() {
          return { compute: fitCompute };
        }
      },
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      RoutePointsRenderModel: {
        create() {
          return { buildModel };
        }
      },
      RoutePointsMarkup: loadFresh("shared/widget-kits/nav/RoutePointsMarkup.js"),
      RoutePointsDomEffects: {
        create() {
          return {
            measureListScrollbarGutter,
            maybeRevealActiveRow: maybeReveal,
            scheduleSelectedRowVisibility: maybeReveal
          };
        }
      },
      RoutePointsLayout: {
        create() {
          return { computeNaturalHeight };
        }
      },
      StateScreenMarkup: loadFresh("shared/widget-kits/state/StateScreenMarkup.js"),
      StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js")
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
    renderer: loadFresh("widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js").create(
      {},
      componentContext
    ),
    buildModel,
    fitCompute,
    maybeReveal,
    measureListScrollbarGutter,
    computeNaturalHeight
  };
}

/** @param {RoutePointsProps} props @param {SurfaceOptions} [options] */
function withSurfacePolicy(props, options) {
  const opts = options || {};
  const mode = opts.mode === "passive" ? "passive" : "dispatch";
  const activate = opts.activate || vi.fn(() => true);
  const orientation = opts.orientation === "vertical" ? "vertical" : "default";
  const actions = opts.actions !== undefined ? opts.actions : { routePoints: { activate } };

  return Object.assign({}, props || {}, {
    surfacePolicy: {
      pageId: opts.pageId || "navpage",
      interaction: { mode },
      containerOrientation: orientation,
      actions: actions
    }
  });
}

/** @param {RendererSpec} rendererSpec @param {RoutePointsProps} props @param {{ hostContext?: HostContext, shellSize?: { height: number, width: number } }} [options] */
function mountCommitted(rendererSpec, props, options) {
  const opts = options || {};
  const shellSize = opts.shellSize || { width: 300, height: 160 };
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

  /** @param {RoutePointsProps} nextProps @param {boolean} layoutChanged */
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
  const postPatchResult = committed.postPatch(initial);

  return {
    mountEl,
    committed,
    postPatchResult,
    /** @param {RoutePointsProps} nextProps @param {boolean} [layoutChanged] */
    update(nextProps, layoutChanged) {
      const next = payload(nextProps, layoutChanged === true);
      committed.update(next);
      return committed.postPatch(next);
    },
    html() {
      return mountEl.innerHTML;
    }
  };
}

function dispatchPoints() {
  return [
    {
      index: 0,
      ordinalText: "1",
      nameText: "WP1",
      infoText: "I",
      selected: false,
      pointSnapshot: { idx: 0, name: "WP1", lat: 54.1, lon: 10.1 }
    },
    {
      index: 3,
      ordinalText: "4",
      nameText: "WP4",
      infoText: "I",
      selected: true,
      pointSnapshot: { idx: 3, name: "WP4", lat: 54.4, lon: 10.4 }
    }
  ];
}

const fs = require("node:fs");

const path = require("node:path");

module.exports = {
  createComponentContextMock,
  createRenderer,
  dispatchPoints,
  fs,
  loadFresh,
  mountCommitted,
  path,
  withSurfacePolicy
};
