const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("MapZoomTextHtmlWidget fallback rendering", function () {
  function createRenderer() {
    const fitCompute = vi.fn(() => ({
      captionStyle: "font-size:11px;",
      valueStyle: "font-size:20px;",
      unitStyle: "font-size:10px;",
      requiredStyle: "font-size:9px;",
      zoomText: "7.2",
      requiredText: "(6.5)"
    }));

    const componentContext = createComponentContextMock({
      modules: {
        MapZoomHtmlFit: { create: () => ({ compute: fitCompute }) },
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        PreparedPayloadModelCache: loadFresh("shared/widget-kits/html/PreparedPayloadModelCache.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
        StateScreenMarkup: loadFresh("shared/widget-kits/state/StateScreenMarkup.js"),
        StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js")
      },
      services: {
        format: {
          /** @param {any} value @param {Record<string, any>} [formatterOptions] */
          applyFormatter(value, formatterOptions) {
            const cfg = formatterOptions || {};
            if (value == null) return cfg.default;
            return String(value);
          }
        },
        dom: {
          /** @param {any} target */
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          }
        },
        themeTokens: {
          resolveForRoot() {
            return { font: { family: "sans-serif", familyMono: "monospace", weight: 720, labelWeight: 610 } };
          }
        }
      }
    });

    return loadFresh("widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js").create({}, componentContext);
  }

  /** @param {Record<string, any>} [props] */
  function withSurfacePolicy(props) {
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: "navpage",
        containerOrientation: "default",
        interaction: { mode: "dispatch" },
        actions: { map: { checkAutoZoom: vi.fn(() => true) } }
      }
    });
  }

  /** @param {any} rendererSpec @param {Record<string, any>} props */
  function mountCommitted(rendererSpec, props) {
    const hostContext = {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    shellEl.appendChild(mountEl);
    rootEl.appendChild(shellEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };
    mountEl.getBoundingClientRect = vi.fn(() => /** @type {DOMRect} */ ({ width: 120, height: 90 }));

    const committed = rendererSpec.createCommittedRenderer({ hostContext, mountEl, shadowRoot: null });
    const payload = {
      props,
      revision: 1,
      rootEl,
      shellEl,
      mountEl,
      shadowRoot: null,
      shellRect: { width: 120, height: 90 },
      hostContext,
      layoutChanged: true,
      relayoutPass: 0
    };
    committed.mount(mountEl, payload);
    committed.postPatch(payload);
    return mountEl.innerHTML;
  }

  it("renders the fit-selected fallback zoom and required text", function () {
    const renderer = createRenderer();
    const html = mountCommitted(
      renderer,
      withSurfacePolicy({
        caption: "ZOOM",
        unit: "",
        zoom: 7.2,
        requiredZoom: 6.5,
        stableDigits: true,
        default: "---"
      })
    );

    expect(html).toContain("7.2");
    expect(html).toContain("(6.5)");
    expect(html).not.toContain("07.2");
    expect(html).not.toContain("(06.5)");
  });
});
