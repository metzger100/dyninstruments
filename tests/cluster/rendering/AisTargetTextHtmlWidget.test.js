const fs = require("fs");
const path = require("path");
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
      applyFormatter: opts.applyFormatter || function (value, options) {
        const cfg = options || {};
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
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js").create({}, Helpers),
      fitCompute: fitCompute
    };
  }

  function createHostContext(options) {
    const opts = options || {};
    const shellRect = opts.shellRect || { width: 320, height: 180 };
    const vertical = opts.vertical === true;
    const showInfo = opts.showInfo || vi.fn(() => true);
    const hostContext = {
      hostActions: {
        ais: {
          showInfo: showInfo
        },
        getCapabilities: vi.fn(() => ({
          pageId: opts.pageId || "navpage",
          ais: { showInfo: opts.capability || "dispatch" }
        }))
      }
    };

    if (opts.withCommitState === false) {
      return hostContext;
    }

    hostContext.__dyniHostCommitState = {
      shellEl: {
        getBoundingClientRect: vi.fn(() => shellRect),
        closest: vi.fn((selector) => {
          if (selector === ".widgetContainer.vertical" && vertical) {
            return {};
          }
          return null;
        })
      },
      rootEl: null
    };
    return hostContext;
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

  it("renders dispatch state with catchAll + hotspot and dispatches showInfo", function () {
    const setup = createRenderer();
    const hostContext = createHostContext({ capability: "dispatch" });
    const props = makeProps();
    const html = setup.renderer.renderHtml.call(hostContext, props);

    expect(html).toContain("dyni-ais-target-html");
    expect(html).toContain("dyni-ais-target-data");
    expect(html).toContain("dyni-ais-target-open-dispatch");
    expect(html).toContain("dyni-ais-target-branch-tcpa");
    expect(html).toContain('onclick="catchAll"');
    expect(html).toContain('class="dyni-ais-target-open-hotspot" onclick="aisTargetShowInfo"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-dst"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-cpa"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-tcpa"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-brg"');
    expect(html).toContain('class="dyni-ais-target-metric-value-row"');
    expect(html).toContain('class="dyni-ais-target-metric-value-text"');
    expect(html).not.toContain('class="dyni-ais-target-metric-value"');
    expect(html).toContain("grid-template-areas:");
    expect(html).toContain('class="dyni-ais-target-identity" style="grid-template-rows:');
    expect(html).toContain('class="dyni-ais-target-metrics" style="grid-template-columns:');
    expect(html).toContain('class="dyni-ais-target-metric-value-row" style="grid-template-columns:');

    const handlers = setup.renderer.namedHandlers(props, hostContext);
    expect(Object.keys(handlers)).toEqual(["aisTargetShowInfo"]);
    expect(handlers.aisTargetShowInfo()).toBe(true);
    expect(hostContext.hostActions.ais.showInfo).toHaveBeenCalledWith("211234560");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
  });

  it("stays passive in layout editing mode and does not register handlers", function () {
    const hostContext = createHostContext({ capability: "dispatch" });
    const renderer = createRenderer().renderer;
    const props = makeProps({ editing: true });
    const html = renderer.renderHtml.call(hostContext, props);

    expect(html).toContain("dyni-ais-target-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-ais-target-open-hotspot");

    const handlers = renderer.namedHandlers(props, hostContext);
    expect(handlers).toEqual({});
    expect(hostContext.hostActions.ais.showInfo).not.toHaveBeenCalled();
  });

  it("renders flat mode with name/front and all four metrics", function () {
    const renderer = createRenderer().renderer;
    const hostContext = createHostContext({ shellRect: { width: 640, height: 120 } });
    const props = makeProps({
      domain: {
        showTcpaBranch: false,
        frontText: "Back"
      }
    });
    const html = renderer.renderHtml.call(hostContext, props);

    expect(html).toContain("dyni-ais-target-mode-flat");
    expect(html).toContain("dyni-ais-target-branch-brg");
    expect(html).toContain("dyni-ais-target-name");
    expect(html).toContain('class="dyni-ais-target-front"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-dst"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-cpa"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-tcpa"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-brg"');
    expect(html).toContain('class="dyni-ais-target-metric-value"');
    expect(html).not.toContain('class="dyni-ais-target-metric-value-row"');
    expect(html).not.toContain("dyni-ais-target-front-initial");
  });

  it("updates resize signature when branch or interaction state changes", function () {
    const renderer = createRenderer().renderer;
    const propsTcpa = makeProps();
    const propsBrg = makeProps({ domain: { showTcpaBranch: false, tcpa: 0 } });

    const dispatchHost = createHostContext({ capability: "dispatch" });
    const passiveHost = createHostContext({ capability: "passive" });

    const sigDispatchTcpa = renderer.resizeSignature.call(dispatchHost, propsTcpa);
    const sigDispatchTcpaSame = renderer.resizeSignature.call(dispatchHost, makeProps());
    const sigDispatchBrg = renderer.resizeSignature.call(dispatchHost, propsBrg);
    const sigPassiveTcpa = renderer.resizeSignature.call(passiveHost, propsTcpa);

    expect(sigDispatchTcpaSame).toBe(sigDispatchTcpa);
    expect(sigDispatchBrg).not.toBe(sigDispatchTcpa);
    expect(sigPassiveTcpa).not.toBe(sigDispatchTcpa);
  });

  it("keeps vertical resize signature stable across host height changes and forces high mode", function () {
    const renderer = createRenderer().renderer;
    const props = makeProps();

    const verticalA = createHostContext({ vertical: true, shellRect: { width: 220, height: 120 } });
    const verticalB = createHostContext({ vertical: true, shellRect: { width: 220, height: 340 } });
    const nonVerticalA = createHostContext({ vertical: false, shellRect: { width: 220, height: 120 } });
    const nonVerticalB = createHostContext({ vertical: false, shellRect: { width: 220, height: 340 } });

    const sigVerticalA = renderer.resizeSignature.call(verticalA, props);
    const sigVerticalB = renderer.resizeSignature.call(verticalB, props);
    const sigNonVerticalA = renderer.resizeSignature.call(nonVerticalA, props);
    const sigNonVerticalB = renderer.resizeSignature.call(nonVerticalB, props);
    const htmlVertical = renderer.renderHtml.call(verticalA, props);

    expect(sigVerticalB).toBe(sigVerticalA);
    expect(sigNonVerticalB).not.toBe(sigNonVerticalA);
    expect(htmlVertical).toContain("dyni-ais-target-vertical");
    expect(htmlVertical).toContain("dyni-ais-target-mode-high");
  });

  it("tolerates first render without committed host state and requests corrective rerender", function () {
    const setup = createRenderer();
    const hostContext = createHostContext({ withCommitState: false, capability: "passive" });
    const html = setup.renderer.renderHtml.call(hostContext, makeProps({ domain: { hasTargetIdentity: false } }));
    const triggerResize = vi.fn();

    setup.renderer.initFunction.call({ triggerResize: triggerResize });

    expect(html).toContain("dyni-ais-target-hidden");
    expect(triggerResize).toHaveBeenCalledTimes(1);
    expect(setup.fitCompute).toHaveBeenCalledWith(expect.objectContaining({
      targetEl: null,
      shellRect: null
    }));
  });

  it("keeps css selectors for state, mode, inline metric structure, and vertical contracts", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-ais-target-mode-flat");
    expect(css).toContain(".dyni-ais-target-mode-flat .dyni-ais-target-metrics");
    expect(css).toContain(".dyni-ais-target-mode-normal .dyni-ais-target-metric");
    expect(css).toContain(".dyni-ais-target-mode-high .dyni-ais-target-metrics");
    expect(css).toContain(".dyni-ais-target-metric-value");
    expect(css).toContain("grid-template-rows: minmax(0, auto) minmax(0, auto) minmax(0, auto);");
    expect(css).toContain("grid-template-columns: minmax(0, auto) minmax(0, 1fr);");
    expect(css).not.toContain("dyni-ais-target-flat-rows-2");
    expect(css).not.toContain("padding-left: calc(0.18em + 0.34em);");
    expect(css).toContain("dyni-ais-target-metric-value-row");
    expect(css).toContain("dyni-ais-target-metric-value-text");
    expect(css).toContain(".dyni-ais-target-open-hotspot");
    expect(css).toContain(".dyni-ais-target-open-dispatch");
    expect(css).toContain(".dyni-ais-target-open-passive");
    expect(css).toContain(".dyni-ais-target-state-accent");
    expect(css).toContain("width: 0.34em;");
    expect(css).toContain("border-radius: 0.34em;");
    expect(css).toContain(".dyni-ais-target-placeholder-text");
    expect(css).toContain(".widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-ais-target-html");
    expect(css).toContain("aspect-ratio: 7 / 8;");
    expect(css).toContain("min-height: 8em;");
  });
});
