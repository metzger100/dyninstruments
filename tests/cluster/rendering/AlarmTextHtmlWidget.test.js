const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("AlarmTextHtmlWidget", function () {
  function readCss(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeRuleBody(bodyText) {
    return String(bodyText || "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .sort()
      .join(";");
  }

  function readRuleBody(cssText, selector) {
    const pattern = new RegExp(escapeRegExp(selector) + "\\s*\\{([\\s\\S]*?)\\}", "m");
    const match = String(cssText || "").match(pattern);
    expect(match, "missing css rule for selector: " + selector).toBeTruthy();
    return normalizeRuleBody(match[1]);
  }

  function normalizeSelectorList(selectorText) {
    return String(selectorText || "")
      .split(",")
      .map((entry) => entry.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .sort()
      .join(",");
  }

  function readCombinedRuleBody(cssText, selectors) {
    const source = String(cssText || "");
    const expectedSelectorList = Array.isArray(selectors)
      ? selectors.join(",")
      : String(selectors || "");
    const expectedNormalized = normalizeSelectorList(expectedSelectorList);
    const pattern = /([^{}]+)\{([^{}]*)\}/g;
    let match = pattern.exec(source);
    while (match) {
      const normalizedSelectors = normalizeSelectorList(match[1]);
      if (normalizedSelectors === expectedNormalized) {
        return normalizeRuleBody(match[2]);
      }
      match = pattern.exec(source);
    }
    expect(null, "missing combined css rule for selectors: " + expectedSelectorList).toBeTruthy();
    return "";
  }

  function expectDeclaration(ruleBody, declaration) {
    expect(ruleBody).toContain(declaration);
  }

  function createHelpers() {
    const htmlWidgetUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const renderModelModule = loadFresh("shared/widget-kits/vessel/AlarmRenderModel.js");
    const markupModule = loadFresh("shared/widget-kits/vessel/AlarmMarkup.js");
    const htmlUtils = htmlWidgetUtilsModule.create();
    const fit = {
      compute: vi.fn(function (args) {
        const model = args && args.model ? args.model : {};
        return {
          mode: "normal",
          captionPx: 12,
          valuePx: 18,
          captionStyle: "font-size:12px;",
          valueStyle: "font-size:18px;",
          shellStyle: model.showStrip === true ? "padding:2px 2px 2px 21px;" : "padding:2px;",
          accentStyle: model.showStrip === true ? "left:2px;top:2px;bottom:2px;width:16px;border-radius:16px;background-color:#66b8ff;" : "",
          activeBackgroundStyle: model.showActiveBackground === true ? "background-color:#e04040;" : "",
          activeForegroundStyle: model.state === "active" ? "color:#ffffff;" : "",
          idleStripStyle: model.showStrip === true ? "left:2px;top:2px;bottom:2px;width:16px;border-radius:16px;background-color:#66b8ff;" : "",
          showStrip: model.showStrip === true,
          showActiveBackground: model.showActiveBackground === true,
          valueSingleLine: true,
          interactionState: model.interactionState || "passive",
          state: model.state || "idle"
        };
      }),
      resolveLayout: vi.fn(function (args) {
        const model = args && args.model ? args.model : {};
        const shellRect = args && args.shellRect ? args.shellRect : null;
        if (!shellRect) {
          return null;
        }
        const chrome = model.showStrip === true
          ? { left: 21, right: 2, top: 2, bottom: 2 }
          : { left: 2, right: 2, top: 2, bottom: 2 };
        const width = Math.max(1, Math.round(shellRect.width) - chrome.left - chrome.right);
        const height = Math.max(1, Math.round(shellRect.height) - chrome.top - chrome.bottom);
        const ratio = width / height;
        return {
          mode: ratio < 1 ? "high" : (ratio > 3 ? "flat" : "normal"),
          shellRect: {
            width: Math.round(shellRect.width),
            height: Math.round(shellRect.height)
          },
          contentRect: {
            width: width,
            height: height,
            chrome: chrome
          }
        };
      })
    };
    const themeResolver = {
      resolveForRoot: vi.fn(function () {
        return {
          colors: {
            alarmWidget: {
              bg: "#e04040",
              fg: "#ffffff",
              strip: "#66b8ff"
            }
          },
          font: {
            family: "sans-serif",
            weight: 700,
            labelWeight: 600
          }
        };
      })
    };

    const componentContext = createComponentContextMock({
      modules: {
        AlarmHtmlFit: { create: () => fit },
        AlarmHtmlFitChrome: loadFresh("shared/widget-kits/vessel/AlarmHtmlFitChrome.js"),
        HtmlWidgetUtils: htmlWidgetUtilsModule,
        AlarmRenderModel: renderModelModule,
        AlarmMarkup: markupModule
      },
      services: {
        dom: {
          requirePluginRoot(target) { return target; },
          getNightModeState() { return false; }
        },
        themeTokens: {
          resolveForRoot: themeResolver.resolveForRoot
        }
      }
    });

    return {
      htmlUtils: htmlUtils,
      fit: fit,
      rendererSpec: loadFresh("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js").create({}, componentContext)
    };
  }

  function makePayload(overrides) {
    const stopAll = vi.fn(() => true);
    const props = Object.assign({
      caption: "ALARM",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      surfacePolicy: {
        interaction: {
          mode: "dispatch"
        },
        actions: {
          alarm: {
            stopAll: stopAll
          }
        }
      },
      domain: {
        state: "active",
        alarmText: "ENGINE",
        hasActiveAlarms: true,
        activeCount: 1,
        alarmNames: ["ENGINE"]
      }
    }, overrides && overrides.props ? overrides.props : {});

    return Object.assign({
      rootEl: document.createElement("div"),
      shellEl: document.createElement("div"),
      shellRect: { width: 220, height: 100 },
      revision: 1,
      props: props,
      hostContext: {}
    }, overrides || {});
  }

  function createRealAlarmRenderer() {
    const htmlWidgetUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const alarmRenderModelModule = loadFresh("shared/widget-kits/vessel/AlarmRenderModel.js");
    const alarmMarkupModule = loadFresh("shared/widget-kits/vessel/AlarmMarkup.js");
    const alarmFitModule = loadFresh("shared/widget-kits/vessel/AlarmHtmlFit.js");
    const alarmFitChromeModule = loadFresh("shared/widget-kits/vessel/AlarmHtmlFitChrome.js");
    const aisLayoutSizingModule = loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js");
    const responsiveScaleProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathModule = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const aisLayoutMathModule = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");

    const textLayoutApi = {
      fitThreeRowBlock: () => ({ cPx: 11, vPx: 18 }),
      fitValueUnitCaptionRows: () => ({ cPx: 10, vPx: 16 }),
      fitInlineTriplet: () => ({ sPx: 9, vPx: 15 })
    };
    const themeResolver = {
      resolveForRoot: vi.fn(() => ({
        colors: {
          alarmWidget: {
            bg: "#e04040",
            fg: "#ffffff",
            strip: "#66b8ff"
          }
        },
        font: {
          family: "sans-serif",
          weight: 700,
          labelWeight: 600
        }
      }))
    };

    const componentContext = createComponentContextMock({
      modules: {
        AlarmHtmlFit: alarmFitModule,
        AlarmHtmlFitChrome: alarmFitChromeModule,
        AisTargetLayoutSizing: aisLayoutSizingModule,
        ResponsiveScaleProfile: responsiveScaleProfileModule,
        LayoutRectMath: layoutRectMathModule,
        AisTargetLayoutMath: aisLayoutMathModule,
        TextLayoutEngine: { create: () => textLayoutApi },
        HtmlWidgetUtils: htmlWidgetUtilsModule,
        AlarmRenderModel: alarmRenderModelModule,
        AlarmMarkup: alarmMarkupModule
      },
      services: {
        dom: {
          requirePluginRoot(target) { return target || null; },
          getNightModeState() { return false; }
        },
        themeTokens: {
          resolveForRoot: themeResolver.resolveForRoot
        }
      }
    });

    return loadFresh("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js").create({}, componentContext);
  }

  function createAisRendererWithRealLayout() {
    const componentContext = createComponentContextMock({
      modules: {
        AisTargetHtmlFit: {
          create() {
            return {
              compute() {
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
              }
            };
          }
        },
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
        AisTargetRenderModel: loadFresh("shared/widget-kits/nav/AisTargetRenderModel.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
        AisTargetMarkup: loadFresh("shared/widget-kits/nav/AisTargetMarkup.js"),
        AisTargetLayout: loadFresh("shared/widget-kits/nav/AisTargetLayout.js"),
        AisTargetLayoutSizing: loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js"),
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        AisTargetLayoutGeometry: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js"),
        AisTargetLayoutMath: loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
        StateScreenMarkup: loadFresh("shared/widget-kits/state/StateScreenMarkup.js"),
        StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js")
      },
      services: {
        format: {
          applyFormatter(value, formatterOptions) {
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
          }
        },
        dom: {
          requirePluginRoot(target) { return target || null; },
          getNightModeState() { return false; }
        },
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

    return loadFresh("widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js").create({}, componentContext);
  }

  function mountRenderer(rendererSpec, payload) {
    const mountHost = document.createElement("div");
    const committed = rendererSpec.createCommittedRenderer({ hostContext: payload.hostContext || {} });
    committed.mount(mountHost, payload);
    return {
      mountHost: mountHost,
      committed: committed
    };
  }

  function readStyleFields(node) {
    const style = node && node.style ? node.style : null;
    return {
      left: style ? style.left : "",
      top: style ? style.top : "",
      bottom: style ? style.bottom : "",
      width: style ? style.width : "",
      borderRadius: style ? style.borderRadius : ""
    };
  }

  function createAlarmMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText(text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        const safePx = Number.isFinite(px) ? px : 12;
        return { width: String(text).length * safePx * 0.56 };
      }
    };
  }

  it("mounts a committed alarm root and dispatches only when active", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const payload = makePayload();

    committed.mount(mountHost, payload);

    expect(mountHost.querySelector(".dyni-alarm-root")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-html")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-html").classList.contains("dyni-alarm-open-dispatch")).toBe(true);
    expect(mountHost.querySelector(".dyni-alarm-main")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-main-normal")).toBeTruthy();

    mountHost.querySelector(".dyni-alarm-root").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(payload.props.surfacePolicy.actions.alarm.stopAll).toHaveBeenCalledTimes(1);
  });

  it("forwards fontMetricsEpoch into AlarmHtmlFit.compute", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const payload = makePayload({ fontMetricsEpoch: 7 });

    committed.mount(mountHost, payload);

    expect(h.fit.compute).toHaveBeenCalledTimes(1);
    expect(h.fit.compute.mock.calls[0][0]).toEqual(expect.objectContaining({
      fontMetricsEpoch: 7
    }));
  });

  it("removes dispatch handling when the widget becomes passive or editing is active", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const payload = makePayload();
    const passivePayload = makePayload({
      props: {
        editing: true,
        surfacePolicy: {
          interaction: {
            mode: "passive"
          },
          actions: {
            alarm: {
              stopAll: payload.props.surfacePolicy.actions.alarm.stopAll
            }
          }
        },
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: []
        }
      }
    });
    const stopAll = payload.props.surfacePolicy.actions.alarm.stopAll;

    committed.mount(mountHost, payload);
    committed.update(passivePayload);

    expect(mountHost.querySelector(".dyni-alarm-html").classList.contains("dyni-alarm-open-passive")).toBe(true);
    expect(mountHost.querySelector(".dyni-alarm-open-hotspot")).toBeFalsy();

    mountHost.querySelector(".dyni-alarm-root").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(stopAll).toHaveBeenCalledTimes(0);
  });

  it("keeps the active alarm shell passive when the surface policy is passive", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const stopAll = vi.fn(() => true);
    const payload = makePayload({
      props: {
        surfacePolicy: {
          interaction: {
            mode: "passive"
          },
          actions: {
            alarm: {
              stopAll: stopAll
            }
          }
        },
        domain: {
          state: "active",
          alarmText: "ENGINE",
          hasActiveAlarms: true,
          activeCount: 1,
          alarmNames: ["ENGINE"]
        }
      }
    });

    committed.mount(mountHost, payload);
    mountHost.querySelector(".dyni-alarm-root").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(stopAll).not.toHaveBeenCalled();
    expect(mountHost.querySelector(".dyni-alarm-html")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-html").classList.contains("dyni-alarm-state-active")).toBe(true);
    expect(mountHost.querySelector(".dyni-alarm-html").classList.contains("dyni-alarm-open-passive")).toBe(true);
  });

  it("renders the idle accent and main content wrapper when the alarm is idle", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const payload = makePayload({
      props: {
        surfacePolicy: {
          interaction: {
            mode: "passive"
          },
          actions: {
            alarm: {
              stopAll: vi.fn(() => true)
            }
          }
        },
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: []
        }
      }
    });

    committed.mount(mountHost, payload);

    expect(mountHost.querySelector(".dyni-alarm-state-accent")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-main")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-main-normal")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-html").classList.contains("dyni-alarm-open-passive")).toBe(true);
  });

  it("emits the same accent inline geometry as AIS at identical shell sizes", function () {
    const alarmRenderer = createRealAlarmRenderer();
    const aisRenderer = createAisRendererWithRealLayout();
    const sizes = [
      { width: 120, height: 100 },
      { width: 180, height: 100 },
      { width: 220, height: 100 },
      { width: 320, height: 100 },
      { width: 220, height: 300 }
    ];

    sizes.forEach((size) => {
      const aisNormalThreshold = size.width === 120 && size.height === 100 ? 1.21 : 1.2;
      const alarmMount = mountRenderer(alarmRenderer, {
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        shellRect: { width: size.width, height: size.height },
        revision: 1,
        props: {
          caption: "ALARM",
          ratioThresholdNormal: 1.0,
          ratioThresholdFlat: 3.0,
          surfacePolicy: {
            interaction: { mode: "passive" },
            actions: { alarm: { stopAll: vi.fn(() => true) } }
          },
          domain: {
            state: "idle",
            alarmText: "NONE",
            hasActiveAlarms: false,
            activeCount: 0,
            alarmNames: []
          }
        },
        hostContext: {
          __dyniAlarmMeasureCtx: createAlarmMeasureContext()
        }
      });
      const aisMount = mountRenderer(aisRenderer, {
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        shellRect: { width: size.width, height: size.height },
        revision: 1,
        props: {
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
            ratioThresholdNormal: aisNormalThreshold,
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
          formatUnits: {
            dst: "nm",
            cpa: "nm"
          },
          default: "---",
          surfacePolicy: {
            pageId: "navpage",
            containerOrientation: "default",
            interaction: { mode: "dispatch" },
            actions: {
              ais: {
                showInfo: vi.fn(() => true)
              }
            }
          }
        },
        hostContext: {}
      });

      const alarmAccent = alarmMount.mountHost.querySelector(".dyni-alarm-state-accent");
      const aisAccent = aisMount.mountHost.querySelector(".dyni-ais-target-state-accent");
      expect(alarmAccent).toBeTruthy();
      expect(aisAccent).toBeTruthy();
      expect(readStyleFields(alarmAccent)).toEqual(readStyleFields(aisAccent));
    });
  });

  it("uses fit-owned inner geometry for layout signatures", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const payload = makePayload({
      props: {
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: []
        }
      }
    });

    const signature = committed.layoutSignature(payload);
    const parts = signature.split("|");

    expect(h.fit.resolveLayout).toHaveBeenCalledWith({
      model: expect.objectContaining({ showStrip: true }),
      shellRect: payload.shellRect
    });
    expect(parts[parts.length - 2]).toBe("197");
    expect(parts[parts.length - 1]).toBe("96");
    expect(signature).not.toContain("|220|100");
  });

  it("uses the committed HTML widget css contract", function () {
    const css = readCss("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css");

    expect(css).toContain(".dyni-html-root .dyni-alarm-html");
    expect(css).toContain(".dyni-html-root .dyni-alarm-root");
    expect(css).toContain(".dyni-html-root .dyni-alarm-html.dyni-alarm-open-dispatch");
    expect(css).toContain(".dyni-html-root .dyni-alarm-html.dyni-alarm-open-passive");
    expect(css).toContain(".dyni-html-root .dyni-alarm-state-accent");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main-flat");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main-normal");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main-high");
    expect(css).toContain(".dyni-html-root .dyni-alarm-inline-row");
    expect(css).toContain(".dyni-html-root .dyni-alarm-caption-row");
    expect(css).toContain(".dyni-html-root .dyni-alarm-value-row");
    expect(css).toContain("font-weight: var(--dyni-theme-font-label-weight, 700);");
    expect(css).toContain("font-weight: var(--dyni-theme-font-weight, 700);");
    expect(css).toContain("inset: 0 auto 0 0;");
    expect(css).toContain("z-index: 0;");
    expect(css).toContain("gap: 0.16em;");
    expect(css).not.toMatch(/\.dyni-html-root\s+\.dyni-alarm-main-flat[\s\S]*?\{[\s\S]*?width:\s*100%/);
    expect(css).not.toMatch(/\.dyni-html-root\s+\.dyni-alarm-main-flat[\s\S]*?\{[\s\S]*?height:\s*100%/);
    expect(css).not.toContain("text-overflow: ellipsis;");
    expect(css).not.toContain("dyni-alarm-shell");
    expect(css).not.toContain("dyni-alarm-strip");
    expect(css).not.toContain("dyni-alarm-hotspot");
    expect(css).not.toContain("dyni-alarm-body");
    expect(css).not.toContain("dyni-alarm-caption-block");
    expect(css).not.toContain("dyni-alarm-value-block");
  });

  it("keeps AIS shell parity for accent, hotspot, and layering contract", function () {
    const alarmCss = readCss("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css");
    const aisCss = readCss("widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css");

    const alarmShell = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-html");
    const aisShell = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-html");
    expectDeclaration(alarmShell, "position: relative");
    expectDeclaration(alarmShell, "width: 100%");
    expectDeclaration(alarmShell, "height: 100%");
    expectDeclaration(alarmShell, "min-width: 0");
    expectDeclaration(alarmShell, "min-height: 0");
    expectDeclaration(alarmShell, "box-sizing: border-box");
    expectDeclaration(alarmShell, "display: grid");
    expectDeclaration(alarmShell, "color: inherit");
    expectDeclaration(aisShell, "position: relative");
    expectDeclaration(aisShell, "width: 100%");
    expectDeclaration(aisShell, "height: 100%");
    expectDeclaration(aisShell, "min-width: 0");
    expectDeclaration(aisShell, "min-height: 0");
    expectDeclaration(aisShell, "box-sizing: border-box");
    expectDeclaration(aisShell, "display: grid");
    expectDeclaration(aisShell, "color: inherit");

    const alarmAccent = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-state-accent");
    const aisAccent = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-state-accent");
    const alarmHotspot = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-open-hotspot");
    const aisHotspot = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-open-hotspot");
    expect(alarmAccent).toBe(aisAccent);
    expect(alarmHotspot).toBe(aisHotspot);
    expectDeclaration(alarmAccent, "inset: 0 auto 0 0");

    const alarmMain = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main");
    const aisIdentity = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-identity");
    expectDeclaration(alarmAccent, "z-index: 0");
    expectDeclaration(alarmMain, "z-index: 1");
    expectDeclaration(alarmHotspot, "z-index: 2");
    expectDeclaration(aisAccent, "z-index: 0");
    expectDeclaration(aisIdentity, "z-index: 1");
    expectDeclaration(aisHotspot, "z-index: 2");
  });

  it("keeps MapZoom inner layout parity for main/rows and typography", function () {
    const alarmCss = readCss("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css");
    const mapZoomCss = readCss("widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css");
    const alarmMain = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main");
    const mapZoomMain = readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main");
    const alarmMainModes = readCombinedRuleBody(alarmCss, [
      ".dyni-html-root .dyni-alarm-main-flat",
      ".dyni-html-root .dyni-alarm-main-normal",
      ".dyni-html-root .dyni-alarm-main-high"
    ]);
    const mapZoomMainModes = readCombinedRuleBody(mapZoomCss, [
      ".dyni-html-root .dyni-map-zoom-main-flat",
      ".dyni-html-root .dyni-map-zoom-main-normal",
      ".dyni-html-root .dyni-map-zoom-main-high"
    ]);
    const alarmMainModesWithoutPadding = alarmMainModes
      .split(";")
      .filter((entry) => entry !== "padding: 0 0.12em")
      .join(";");

    expect(alarmMainModes).toContain("padding: 0 0.12em");
    expect(alarmMainModesWithoutPadding).toBe(mapZoomMainModes);
    expect(readCombinedRuleBody(alarmCss, [
      ".dyni-html-root .dyni-alarm-inline-row",
      ".dyni-html-root .dyni-alarm-caption-row",
      ".dyni-html-root .dyni-alarm-value-row"
    ])).toBe(
      readCombinedRuleBody(mapZoomCss, [
        ".dyni-html-root .dyni-map-zoom-inline-row",
        ".dyni-html-root .dyni-map-zoom-value-row",
        ".dyni-html-root .dyni-map-zoom-caption-row",
        ".dyni-html-root .dyni-map-zoom-unit-row"
      ])
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-flat .dyni-alarm-inline-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-flat .dyni-map-zoom-inline-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-normal .dyni-alarm-value-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-normal .dyni-map-zoom-value-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-normal .dyni-alarm-caption-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-normal .dyni-map-zoom-caption-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-high .dyni-alarm-caption-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-high .dyni-map-zoom-caption-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-high .dyni-alarm-value-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-high .dyni-map-zoom-value-row")
    );

    const alarmCaption = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-caption");
    const mapZoomCaption = readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-caption");
    const alarmValue = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-value");
    const mapZoomValue = readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-value");
    expect(alarmCaption).toBe(mapZoomCaption);
    expect(alarmValue).toBe(mapZoomValue);
    expect(alarmCss).not.toContain("text-overflow: ellipsis;");
  });
});
