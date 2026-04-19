const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const fitCompute = opts.fitCompute || vi.fn(function () {
      return {
        nameStyle: "font-size:12px;",
        frontStyle: "font-size:10px;",
        placeholderStyle: "font-size:11px;",
        metrics: {
          dst: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:11px;", unitStyle: "font-size:7px;" },
          cpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:11px;", unitStyle: "font-size:7px;" },
          tcpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:11px;", unitStyle: "font-size:7px;" },
          brg: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:11px;", unitStyle: "font-size:7px;" }
        },
        accentStyle: "background-color:#c33;"
      };
    });

    const Helpers = {
      applyFormatter: opts.applyFormatter || function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        const formatter = cfg.formatter;
        const params = Array.isArray(cfg.formatterParameters) ? cfg.formatterParameters : [];
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
      },
      getModule(id) {
        if (id === "AisTargetHtmlFit") {
          return {
            create() {
              return { compute: fitCompute };
            }
          };
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        if (id === "AisTargetRenderModel") {
          return loadFresh("shared/widget-kits/nav/AisTargetRenderModel.js");
        }
        if (id === "AisTargetMarkup") {
          return loadFresh("shared/widget-kits/nav/AisTargetMarkup.js");
        }
        if (id === "AisTargetLayout") {
          return loadFresh("shared/widget-kits/nav/AisTargetLayout.js");
        }
        if (id === "ResponsiveScaleProfile") {
          return loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        if (id === "AisTargetLayoutGeometry") {
          return loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
        }
        if (id === "AisTargetLayoutMath") {
          return loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
        }
        if (id === "PlaceholderNormalize") {
          return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
        }
        if (id === "StableDigits") {
          return loadFresh("shared/widget-kits/format/StableDigits.js");
        }
        if (id === "StateScreenLabels") {
          return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        }
        if (id === "StateScreenPrecedence") {
          return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
        }
        if (id === "StateScreenInteraction") {
          return loadFresh("shared/widget-kits/state/StateScreenInteraction.js");
        }
        if (id === "StateScreenMarkup") {
          return loadFresh("shared/widget-kits/state/StateScreenMarkup.js");
        }
        if (id === "StateScreenTextFit") {
          return loadFresh("shared/widget-kits/state/StateScreenTextFit.js");
        }
        if (id === "ThemeResolver") {
          return {
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
          };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js").create({}, Helpers),
      fitCompute
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
        headingTo: 112
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8
      },
      captions: {
        dst: "DST",
        cpa: "DCPA",
        tcpa: "TCPA",
        brg: "BRG"
      },
      units: {
        dst: "nm",
        cpa: "nm",
        tcpa: "min",
        brg: "°"
      },
      default: "---"
    };

    const out = Object.assign({}, base, overrides || {});
    out.domain = Object.assign({}, base.domain, overrides && overrides.domain ? overrides.domain : {});
    out.layout = Object.assign({}, base.layout, overrides && overrides.layout ? overrides.layout : {});
    out.captions = Object.assign({}, base.captions, overrides && overrides.captions ? overrides.captions : {});
    out.units = Object.assign({}, base.units, overrides && overrides.units ? overrides.units : {});
    return out;
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const interactionMode = opts.interactionMode === "passive" ? "passive" : "dispatch";
    const containerOrientation = opts.containerOrientation === "vertical" ? "vertical" : "default";
    const showInfo = opts.showInfo || vi.fn(() => true);

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: opts.pageId || "navpage",
        containerOrientation,
        interaction: { mode: interactionMode },
        actions: {
          ais: {
            showInfo
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
        relayoutPass: 0
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
      }
    };
  }

  it("exposes committed renderer contract", function () {
    const renderer = createRenderer().renderer;

    expect(renderer.id).toBe("AisTargetTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
    expect(renderer.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 7 / 8 });
  });

  it("renders dispatch state and dispatches showInfo on click", function () {
    const setup = createRenderer();
    const showInfo = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), {
        interactionMode: "dispatch",
        showInfo
      })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-ais-target-html");
    expect(html).toContain("dyni-ais-target-open-dispatch");
    expect(html).toContain("dyni-ais-target-branch-tcpa");
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).toContain("dyni-ais-target-open-hotspot");

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).toHaveBeenCalledWith("211234560");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
  });

  it("stays passive in edit mode", function () {
    const showInfo = vi.fn(() => true);
    const mounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({ editing: true }), {
        interactionMode: "dispatch",
        showInfo
      })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-ais-target-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).not.toHaveBeenCalled();
  });

  it("renders flat branch and noAis state for gps page", function () {
    const flatMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({ domain: { showTcpaBranch: false, frontText: "Back" } }), {
        interactionMode: "dispatch"
      }),
      { shellSize: { width: 640, height: 120 } }
    );
    const placeholderMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({ domain: { hasTargetIdentity: false } }), {
        pageId: "gpspage",
        interactionMode: "passive"
      })
    );

    expect(flatMounted.html()).toContain("dyni-ais-target-mode-flat");
    expect(flatMounted.html()).toContain("dyni-ais-target-branch-brg");
    expect(flatMounted.html()).toContain("dyni-ais-target-metric-value");
    expect(flatMounted.html()).not.toContain("dyni-ais-target-metric-value-row");

    expect(placeholderMounted.html()).toContain("dyni-state-no-ais");
    expect(placeholderMounted.html()).toContain("No AIS");
  });

  it("renders stableDigits metric values with tabular classes", function () {
    const renderer = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        return String(value);
      }
    }).renderer;
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ stableDigits: true }), {
        interactionMode: "dispatch"
      })
    );

    expect(mounted.html()).toContain("dyni-ais-target-metric-value-text dyni-tabular");
    expect(mounted.html()).toContain("04.2");
    expect(mounted.html()).toContain("00.7");
  });

  it("applies AIS hidden/disconnected precedence exception", function () {
    const hiddenMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({
        disconnect: true,
        domain: { hasTargetIdentity: false, hasDispatchMmsi: false }
      }), {
        pageId: "other",
        interactionMode: "dispatch"
      })
    );
    expect(hiddenMounted.html()).toContain("dyni-state-hidden");
    expect(hiddenMounted.html()).not.toContain("GPS Lost");

    const disconnectedMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({
        disconnect: true,
        domain: { hasTargetIdentity: false, hasDispatchMmsi: false }
      }), {
        pageId: "gpspage",
        interactionMode: "dispatch"
      })
    );
    expect(disconnectedMounted.html()).toContain("dyni-state-disconnected");
    expect(disconnectedMounted.html()).toContain("GPS Lost");
  });

  it("updates layout signatures for branch and interaction changes", function () {
    const renderer = createRenderer().renderer;
    const committed = renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });

    const dispatchTcpa = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { interactionMode: "dispatch" }),
      shellRect: { width: 320, height: 180 }
    });
    const dispatchBrg = committed.layoutSignature({
      props: withSurfacePolicy(makeProps({ domain: { showTcpaBranch: false } }), { interactionMode: "dispatch" }),
      shellRect: { width: 320, height: 180 }
    });
    const passiveTcpa = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { interactionMode: "passive" }),
      shellRect: { width: 320, height: 180 }
    });
    const verticalA = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { containerOrientation: "vertical", interactionMode: "dispatch" }),
      shellRect: { width: 220, height: 120 }
    });
    const verticalB = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { containerOrientation: "vertical", interactionMode: "dispatch" }),
      shellRect: { width: 220, height: 340 }
    });

    expect(dispatchBrg).not.toBe(dispatchTcpa);
    expect(passiveTcpa).not.toBe(dispatchTcpa);
    expect(verticalB).toBe(verticalA);
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-ais-target-html");
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*7\s*\/\s*8/);
    expect(css).not.toMatch(/min-height.*8em/);
  });
});
