const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

  const ORIGINAL_DYNI_PLUGIN = globalThis.DyniPlugin;

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
              gapStyle: "gap:4px;",
            },
            rteEta: {
              captionStyle: "font-size:11px;",
              valueStyle: "font-size:17px;",
              unitStyle: "font-size:10px;",
              gapStyle: "gap:4px;",
            },
            next: {
              captionStyle: "font-size:10px;",
              valueStyle: "font-size:16px;",
              unitStyle: "font-size:9px;",
              gapStyle: "gap:4px;",
            },
          },
        };
      });
    const htmlFitStub = {
      ensureDisplayProps(props) {
        return props;
      },
      resolveDisplayMode(props, shellRect, htmlUtils) {
        return htmlUtils.resolveRatioModeForRect({
          shellRect: shellRect,
          ratioThresholdNormal: props.ratioThresholdNormal,
          ratioThresholdFlat: props.ratioThresholdFlat,
          defaultRatioThresholdNormal: 1.2,
          defaultRatioThresholdFlat: 3.8,
          defaultMode: "normal",
        });
      },
      formatActiveRouteMetric(
        rawValue,
        formatter,
        formatterParameters,
        defaultText,
        placeholderNormalize,
      ) {
        const out = String(
          applyFormatter(rawValue, {
            formatter: formatter,
            formatterParameters: formatterParameters,
            default: defaultText,
          }),
        );
        return placeholderNormalize.normalize(out, defaultText);
      },
      textLength(value) {
        return value == null ? 0 : String(value).length;
      },
      normalizeStableValue(
        rawText,
        stableDigitsEnabled,
        stableDigits,
        minWidth,
      ) {
        if (!stableDigitsEnabled) {
          return { padded: rawText, plain: rawText };
        }
        return stableDigits.normalize(rawText, {
          integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
          reserveSignSlot: true,
        });
      },
    };
    const applyFormatter =
      opts.applyFormatter ||
      function (value, formatterOptions) {
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
        if (cfg.formatter === "formatClock") {
          return "CLOCK:" + String(value);
        }
        if (cfg.formatter === "formatDirection") {
          return "DIR:" + String(value);
        }
        return String(value);
      };
    const componentContext = createComponentContextMock({
      modules: {
        ActiveRouteHtmlFit: {
          create: () => Object.assign({ compute: fitCompute }, htmlFitStub),
        },
        HtmlWidgetUtils: loadFresh(
          "shared/widget-kits/html/HtmlWidgetUtils.js",
        ),
        PreparedPayloadModelCache: loadFresh(
          "shared/widget-kits/html/PreparedPayloadModelCache.js",
        ),
        PlaceholderNormalize: loadFresh(
          "shared/widget-kits/format/PlaceholderNormalize.js",
        ),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        StateScreenLabels: loadFresh(
          "shared/widget-kits/state/StateScreenLabels.js",
        ),
        StateScreenPrecedence: loadFresh(
          "shared/widget-kits/state/StateScreenPrecedence.js",
        ),
        StateScreenInteraction: loadFresh(
          "shared/widget-kits/state/StateScreenInteraction.js",
        ),
        StateScreenMarkup: loadFresh(
          "shared/widget-kits/state/StateScreenMarkup.js",
        ),
        StateScreenTextFit: loadFresh(
          "shared/widget-kits/state/StateScreenTextFit.js",
        ),
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
                labelWeight: 610,
              },
            };
          },
        },
      },
    });

    return {
      renderer: loadFresh(
        "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js",
      ).create({}, componentContext),
      fitCompute,
    };
  }

  afterEach(function () {
    if (typeof ORIGINAL_DYNI_PLUGIN === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = ORIGINAL_DYNI_PLUGIN;
    }
  });

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
        hideSeconds: false,
      },
      captions: {
        remain: "RTE",
        rteEta: "ETA",
        nextCourse: "NEXT",
      },
      units: {
        remain: "nm",
        rteEta: "",
        nextCourse: "deg",
      },
      formatUnits: {
        remain: "nm",
      },
      default: "---",
    };
    const out = Object.assign({}, base, opts);
    out.display = Object.assign({}, base.display, opts.display || {});
    out.captions = Object.assign({}, base.captions, opts.captions || {});
    out.units = Object.assign({}, base.units, opts.units || {});
    out.formatUnits = Object.assign(
      {},
      base.formatUnits,
      opts.formatUnits || {},
    );
    if (Object.prototype.hasOwnProperty.call(opts, "routeName"))
      out.display.routeName = opts.routeName;
    if (Object.prototype.hasOwnProperty.call(opts, "disconnect"))
      out.display.disconnect = opts.disconnect;
    if (Object.prototype.hasOwnProperty.call(opts, "hideSeconds"))
      out.display.hideSeconds = opts.hideSeconds;
    return out;
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const openActiveRoute = opts.openActiveRoute || vi.fn(() => true);
    const pageId = opts.pageId || "navpage";
    const orientation =
      opts.orientation === "vertical" ? "vertical" : "default";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId,
        containerOrientation: orientation,
        interaction: { mode },
        actions: {
          routeEditor: {
            openActiveRoute,
          },
        },
      },
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
      width: 320,
      height: 180,
    }));
    return {
      rootEl,
      shellEl,
      mountEl,
    };
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
        relayoutPass: 0,
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
      },
    };
  }

module.exports = {
  ORIGINAL_DYNI_PLUGIN,
  createRenderer,
  makeProps,
  withSurfacePolicy,
  createSurfaceDom,
  mountCommitted,
};
