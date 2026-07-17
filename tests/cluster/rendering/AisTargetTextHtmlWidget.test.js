const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("AisTargetTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const fitCompute =
      opts.fitCompute ||
      vi.fn(function () {
        return {
          nameStyle: "font-size:12px;",
          frontStyle: "font-size:10px;",
          placeholderStyle: "font-size:11px;",
          metrics: {
            dst: {
              captionStyle: "font-size:8px;",
              valueRowStyle: "",
              valueStyle: "font-size:11px;",
              unitStyle: "font-size:7px;",
            },
            cpa: {
              captionStyle: "font-size:8px;",
              valueRowStyle: "",
              valueStyle: "font-size:11px;",
              unitStyle: "font-size:7px;",
            },
            tcpa: {
              captionStyle: "font-size:8px;",
              valueRowStyle: "",
              valueStyle: "font-size:11px;",
              unitStyle: "font-size:7px;",
            },
            brg: {
              captionStyle: "font-size:8px;",
              valueRowStyle: "",
              valueStyle: "font-size:11px;",
              unitStyle: "font-size:7px;",
            },
          },
          accentStyle: "background-color:#c33;",
        };
      });

    const applyFormatter =
      opts.applyFormatter ||
      function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        const formatter = cfg.formatter;
        const params = Array.isArray(cfg.formatterParameters)
          ? cfg.formatterParameters
          : [];
        if (value == null) {
          return cfg.default;
        }
        if (formatter === "formatDistance") {
          return "DIST:" + String(value) + ":" + String(params[0] || "");
        }
        if (formatter === "formatDirection") {
          return "DIR:" + String(value);
        }
        if (formatter === "formatDecimal") {
          return "DEC:" + String(value) + ":" + params.join(",");
        }
        return String(value);
      };
    const componentContext = createComponentContextMock({
      modules: {
        AisTargetHtmlFit: {
          create() {
            return { compute: fitCompute };
          },
        },
        HtmlWidgetUtils: loadFresh(
          "shared/widget-kits/html/HtmlWidgetUtils.js",
        ),
        AisTargetRenderModel: loadFresh(
          "shared/widget-kits/nav/AisTargetRenderModel.js",
        ),
        UnitAwareFormatter: loadFresh(
          "shared/widget-kits/format/UnitAwareFormatter.js",
        ),
        AisTargetMarkup: loadFresh("shared/widget-kits/nav/AisTargetMarkup.js"),
        AisTargetLayout: loadFresh("shared/widget-kits/nav/AisTargetLayout.js"),
        AisTargetLayoutSizing: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutSizing.js",
        ),
        ResponsiveScaleProfile: loadFresh(
          "shared/widget-kits/layout/ResponsiveScaleProfile.js",
        ),
        LayoutRectMath: loadFresh(
          "shared/widget-kits/layout/LayoutRectMath.js",
        ),
        AisTargetLayoutGeometry: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
        ),
        AisTargetLayoutGeometryStyles: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutGeometryStyles.js",
        ),
        AisTargetLayoutMath: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutMath.js",
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
        "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js",
      ).create({}, componentContext),
      fitCompute,
    };
  }

  function makeProps(overrides) {
    const base = {
      domain: {
        hasTargetIdentity: true,
        hasDispatchMmsi: true,
        mmsiNormalized: "211234560",
        showTcpaBranch: true,
        hasColorRole: true,
        colorRole: "warning",
        nameOrMmsi: "Poseidon",
        frontText: "Front",
        distance: 4.2,
        cpa: 0.7,
        tcpa: 42,
        headingTo: 112,
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8,
      },
      captions: {
        dst: "DST",
        cpa: "DCPA",
        tcpa: "TCPA",
        brg: "BRG",
      },
      units: {
        dst: "nm",
        cpa: "nm",
        tcpa: "min",
        brg: "°",
      },
      formatUnits: {
        dst: "nm",
        cpa: "nm",
      },
      default: "---",
    };

    const out = Object.assign({}, base, overrides || {});
    out.domain = Object.assign(
      {},
      base.domain,
      overrides && overrides.domain ? overrides.domain : {},
    );
    out.layout = Object.assign(
      {},
      base.layout,
      overrides && overrides.layout ? overrides.layout : {},
    );
    out.captions = Object.assign(
      {},
      base.captions,
      overrides && overrides.captions ? overrides.captions : {},
    );
    out.units = Object.assign(
      {},
      base.units,
      overrides && overrides.units ? overrides.units : {},
    );
    return out;
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const interactionMode =
      opts.interactionMode === "passive" ? "passive" : "dispatch";
    const containerOrientation =
      opts.containerOrientation === "vertical" ? "vertical" : "default";
    const showInfo = opts.showInfo || vi.fn(() => true);

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: opts.pageId || "navpage",
        containerOrientation,
        interaction: { mode: interactionMode },
        actions: {
          ais: {
            showInfo,
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
      html() {
        return mountEl.innerHTML;
      },
    };
  }

  function readInlinePx(styleValue) {
    const match = String(styleValue || "").match(/^(\d+)px$/);
    return match ? Number(match[1]) : NaN;
  }

  it("exposes committed renderer contract", function () {
    const renderer = createRenderer().renderer;

    expect(renderer.id).toBe("AisTargetTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });

  it("renders dispatch state and dispatches showInfo on click", function () {
    const setup = createRenderer();
    const showInfo = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), {
        interactionMode: "dispatch",
        showInfo,
      }),
    );

    const html = mounted.html();
    expect(html).toContain("dyni-ais-target-html");
    expect(html).toContain("dyni-ais-target-open-dispatch");
    expect(html).toContain("dyni-ais-target-branch-tcpa");
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).toContain("dyni-ais-target-open-hotspot");

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    wrapper.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(showInfo).toHaveBeenCalledWith("211234560");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
  });

});
