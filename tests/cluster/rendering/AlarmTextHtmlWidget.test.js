const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

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
          shellStyle: model.showStrip === true ? "padding:2px 2px 2px 13px;" : "padding:2px;",
          accentStyle: model.showStrip === true ? "left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;" : "",
          activeBackgroundStyle: model.showActiveBackground === true ? "background-color:#e04040;" : "",
          activeForegroundStyle: model.state === "active" ? "color:#ffffff;" : "",
          idleStripStyle: model.showStrip === true ? "left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;" : "",
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
          ? { left: 13, right: 2, top: 2, bottom: 2 }
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

    const Helpers = {
      requirePluginRoot(target) {
        return target;
      },
      getModule(id) {
        if (id === "AlarmHtmlFit") {
          return { create: () => fit };
        }
        if (id === "HtmlWidgetUtils") {
          return htmlWidgetUtilsModule;
        }
        if (id === "AlarmRenderModel") {
          return renderModelModule;
        }
        if (id === "AlarmMarkup") {
          return markupModule;
        }
        if (id === "ThemeResolver") {
          return themeResolver;
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      htmlUtils: htmlUtils,
      fit: fit,
      rendererSpec: loadFresh("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js").create({}, Helpers)
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

  it("returns the locked vertical shell sizing", function () {
    const h = createHelpers();

    expect(h.rendererSpec.getVerticalShellSizing()).toEqual({
      kind: "ratio",
      aspectRatio: 2
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
    expect(parts[parts.length - 2]).toBe("205");
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
    expect(css).toContain("width: 0.34em;");
    expect(css).toContain("border-radius: 0.34em;");
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
    expectDeclaration(alarmAccent, "width: 0.34em");
    expectDeclaration(alarmAccent, "border-radius: 0.34em");

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
