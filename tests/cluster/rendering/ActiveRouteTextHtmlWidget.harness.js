const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {Record<string, unknown>} ActiveRouteProps
 * @typedef {{ default?: unknown, formatter?: string, formatterParameters?: unknown[] }} FormatterOptions
 * @typedef {{ captionStyle: string, valueStyle: string, unitStyle: string, gapStyle?: string }} FitMetricStyle
 * @typedef {{ routeNameStyle: string, metrics: { remain: FitMetricStyle, rteEta: FitMetricStyle, next: FitMetricStyle } }} FitComputeResult
 * @typedef {{ resolveRatioModeForRect: (options: Record<string, unknown>) => unknown }} HtmlUtils
 * @typedef {{ normalize: (value: string, fallback: unknown) => unknown }} PlaceholderNormalize
 * @typedef {{ normalize: (value: string, options: Record<string, unknown>) => unknown, resolveIntegerWidth: (value: string, minWidth: number) => number }} StableDigitsApi
 * @typedef {{ applyFormatter?: (value: unknown, formatterOptions?: FormatterOptions) => unknown, fitCompute?: () => FitComputeResult }} CreateRendererOptions
 * @typedef {{ mode?: string, openActiveRoute?: () => boolean, orientation?: string, pageId?: string }} SurfaceOptions
 * @typedef {{ __dyniHostCommitState?: { rootEl: HTMLElement, shellEl: HTMLElement } }} HostContext
 * @typedef {{ id: string, createCommittedRenderer: (options: { hostContext: HostContext, mountEl: HTMLElement | null, shadowRoot: null }) => { destroy: () => void, detach: () => void, layoutSignature: (payload: unknown) => string, mount: (mountEl: HTMLElement, payload: unknown) => void, postPatch: (payload: unknown) => void, update: (payload: unknown) => void } }} RendererSpec
 * @typedef {{ hostContext?: HostContext, shellSize?: { height: number, width: number } }} MountOptions
 */

const ORIGINAL_DYNI_PLUGIN = globalThis.DyniPlugin;

/** @param {CreateRendererOptions} [options] */
function createRenderer(options) {
  const opts = options || {};
  const fitCompute =
    opts.fitCompute ||
    vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: {
            captionStyle: "font-size:12px;",
            valueStyle: "font-size:18px;",
            unitStyle: "font-size:11px;",
            gapStyle: "gap:4px;"
          },
          rteEta: {
            captionStyle: "font-size:11px;",
            valueStyle: "font-size:17px;",
            unitStyle: "font-size:10px;",
            gapStyle: "gap:4px;"
          },
          next: {
            captionStyle: "font-size:10px;",
            valueStyle: "font-size:16px;",
            unitStyle: "font-size:9px;",
            gapStyle: "gap:4px;"
          }
        }
      };
    });
  const applyFormatter =
    opts.applyFormatter ||
    /** @param {unknown} value @param {FormatterOptions} [formatterOptions] */
    function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value === null || value === undefined) {
        return cfg.default;
      }
      if (cfg.formatter === "formatDistance") {
        return "DIST:" + String(value);
      }
      if (cfg.formatter === "formatTime") {
        return "TIME:" + String(value);
      }
      if (cfg.formatter === "formatClock") {
        return "CLOCK:" + String(value);
      }
      if (cfg.formatter === "formatDirection") {
        return "DIR:" + String(value);
      }
      return String(value);
    };
  const htmlFitStub = {
    /** @param {ActiveRouteProps} props */
    ensureDisplayProps(props) {
      return props;
    },
    /** @param {ActiveRouteProps} props @param {unknown} shellRect @param {HtmlUtils} htmlUtils */
    resolveDisplayMode(props, shellRect, htmlUtils) {
      return htmlUtils.resolveRatioModeForRect({
        shellRect: shellRect,
        ratioThresholdNormal: props.ratioThresholdNormal,
        ratioThresholdFlat: props.ratioThresholdFlat,
        defaultRatioThresholdNormal: 1.2,
        defaultRatioThresholdFlat: 3.8,
        defaultMode: "normal"
      });
    },
    /** @param {unknown} rawValue @param {unknown} formatter @param {unknown[]} formatterParameters @param {unknown} defaultText @param {PlaceholderNormalize} placeholderNormalize */
    formatActiveRouteMetric(rawValue, formatter, formatterParameters, defaultText, placeholderNormalize) {
      const out = String(
        applyFormatter(rawValue, {
          formatter: /** @type {string} */ (formatter),
          formatterParameters: formatterParameters,
          default: defaultText
        })
      );
      return placeholderNormalize.normalize(out, defaultText);
    },
    /** @param {unknown} value */
    textLength(value) {
      return value === null || value === undefined ? 0 : String(value).length;
    },
    /** @param {string} rawText @param {boolean} stableDigitsEnabled @param {StableDigitsApi} stableDigits @param {number} minWidth */
    normalizeStableValue(rawText, stableDigitsEnabled, stableDigits, minWidth) {
      if (!stableDigitsEnabled) {
        return { padded: rawText, plain: rawText };
      }
      return stableDigits.normalize(rawText, {
        integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
        reserveSignSlot: true
      });
    }
  };
  const componentContext = createComponentContextMock({
    modules: {
      ActiveRouteHtmlFit: {
        create: () => Object.assign({ compute: fitCompute }, htmlFitStub)
      },
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      PreparedPayloadModelCache: loadFresh("shared/widget-kits/html/PreparedPayloadModelCache.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
      StateScreenMarkup: loadFresh("shared/widget-kits/state/StateScreenMarkup.js"),
      StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js")
    },
    services: {
      format: { applyFormatter },
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
    renderer: /** @type {RendererSpec} */ (
      loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, componentContext)
    ),
    fitCompute
  };
}

afterEach(function () {
  if (typeof ORIGINAL_DYNI_PLUGIN === "undefined") {
    delete globalThis.DyniPlugin;
  } else {
    globalThis.DyniPlugin = ORIGINAL_DYNI_PLUGIN;
  }
});

/** @param {ActiveRouteProps} [overrides] */
function makeProps(overrides) {
  const opts = overrides || {};
  const base = {
    display: {
      remain: 12.4,
      rteEta: "2026-03-06T11:45:00Z",
      nextCourse: 93,
      isApproaching: true,
      routeName: "Harbor Run",
      disconnect: false,
      hideSeconds: false
    },
    captions: {
      remain: "RTE",
      rteEta: "ETA",
      nextCourse: "NEXT"
    },
    units: {
      remain: "nm",
      rteEta: "",
      nextCourse: "deg"
    },
    formatUnits: {
      remain: "nm"
    },
    default: "---"
  };
  const out =
    /** @type {ActiveRouteProps & { display: Record<string, unknown>, captions: Record<string, unknown>, units: Record<string, unknown>, formatUnits: Record<string, unknown> }} */ (
      Object.assign({}, base, opts)
    );
  out.display = Object.assign({}, base.display, /** @type {Record<string, unknown>} */ (opts.display) || {});
  out.captions = Object.assign({}, base.captions, /** @type {Record<string, unknown>} */ (opts.captions) || {});
  out.units = Object.assign({}, base.units, /** @type {Record<string, unknown>} */ (opts.units) || {});
  out.formatUnits = Object.assign(
    {},
    base.formatUnits,
    /** @type {Record<string, unknown>} */ (opts.formatUnits) || {}
  );
  if (Object.prototype.hasOwnProperty.call(opts, "routeName")) out.display.routeName = opts.routeName;
  if (Object.prototype.hasOwnProperty.call(opts, "disconnect")) out.display.disconnect = opts.disconnect;
  if (Object.prototype.hasOwnProperty.call(opts, "hideSeconds")) out.display.hideSeconds = opts.hideSeconds;
  return out;
}

/** @param {ActiveRouteProps} props @param {SurfaceOptions} [options] */
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

function createSurfaceDom() {
  const rootEl = document.createElement("div");
  rootEl.className = "widget dyniplugin dyni-host-html";
  const shellEl = document.createElement("div");
  shellEl.className = "widgetData dyni-shell";
  const mountEl = document.createElement("div");
  mountEl.className = "dyni-surface-html-mount";
  shellEl.appendChild(mountEl);
  rootEl.appendChild(shellEl);
  mountEl.getBoundingClientRect = vi.fn(() => ({
    bottom: 180,
    width: 320,
    height: 180,
    left: 0,
    right: 320,
    top: 0,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    }
  }));
  return {
    rootEl,
    shellEl,
    mountEl
  };
}

/** @param {RendererSpec} rendererSpec @param {ActiveRouteProps} props @param {MountOptions} [options] */
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

  /** @param {ActiveRouteProps} nextProps @param {number} revision @param {boolean} layoutChanged */
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
    /** @param {ActiveRouteProps} nextProps */
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

module.exports = {
  ORIGINAL_DYNI_PLUGIN,
  createRenderer,
  makeProps,
  withSurfacePolicy,
  createSurfaceDom,
  mountCommitted
};
