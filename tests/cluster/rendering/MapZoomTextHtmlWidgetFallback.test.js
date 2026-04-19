const { loadFresh } = require("../../helpers/load-umd");

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

    const moduleCache = Object.create(null);
    const Helpers = {
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) return cfg.default;
        return String(value);
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      requirePluginRoot(target) {
        return target || null;
      },
      getNightModeState() {
        return false;
      },
      getModule(id) {
        if (id === "MapZoomHtmlFit") return { create: () => ({ compute: fitCompute }) };
        if (id === "HtmlWidgetUtils") return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        if (id === "PlaceholderNormalize") return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        if (id === "PreparedPayloadModelCache") return loadFresh("shared/widget-kits/html/PreparedPayloadModelCache.js");
        if (id === "StableDigits") return loadFresh("shared/widget-kits/format/StableDigits.js");
        if (id === "StateScreenLabels") return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        if (id === "StateScreenPrecedence") return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
        if (id === "StateScreenInteraction") return loadFresh("shared/widget-kits/state/StateScreenInteraction.js");
        if (id === "StateScreenMarkup") return loadFresh("shared/widget-kits/state/StateScreenMarkup.js");
        if (id === "ThemeResolver") {
          if (!moduleCache[id]) {
            moduleCache[id] = {
              resolveForRoot() {
                return { font: { family: "sans-serif", familyMono: "monospace", weight: 720, labelWeight: 610 } };
              }
            };
          }
          return moduleCache[id];
        }
        throw new Error("unexpected module lookup: " + id);
      }
    };

    return loadFresh("widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js").create({}, Helpers);
  }

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
    mountEl.getBoundingClientRect = vi.fn(() => ({ width: 120, height: 90 }));

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
    const html = mountCommitted(renderer, withSurfacePolicy({
      caption: "ZOOM",
      unit: "",
      zoom: 7.2,
      requiredZoom: 6.5,
      stableDigits: true,
      default: "---"
    }));

    expect(html).toContain("7.2");
    expect(html).toContain("(6.5)");
    expect(html).not.toContain("07.2");
    expect(html).not.toContain("(06.5)");
  });
});
