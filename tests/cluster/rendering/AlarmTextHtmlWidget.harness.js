const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const rendererHelpers = require("./AlarmTextHtmlWidget.renderers.js");

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
    const pattern = new RegExp(
      escapeRegExp(selector) + "\\s*\\{([\\s\\S]*?)\\}",
      "m",
    );
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
    expect(
      null,
      "missing combined css rule for selectors: " + expectedSelectorList,
    ).toBeTruthy();
    return "";
  }

  function expectDeclaration(ruleBody, declaration) {
    expect(ruleBody).toContain(declaration);
  }

  function createHelpers() {
    const htmlWidgetUtilsModule = loadFresh(
      "shared/widget-kits/html/HtmlWidgetUtils.js",
    );
    const renderModelModule = loadFresh(
      "shared/widget-kits/vessel/AlarmRenderModel.js",
    );
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
          shellStyle:
            model.showStrip === true
              ? "padding:2px 2px 2px 21px;"
              : "padding:2px;",
          accentStyle:
            model.showStrip === true
              ? "left:2px;top:2px;bottom:2px;width:16px;border-radius:16px;background-color:#70F3AF;"
              : "",
          activeBackgroundStyle:
            model.showActiveBackground === true
              ? "background-color:#C73A32;"
              : "",
          activeForegroundStyle:
            model.state === "active" ? "color:#ffffff;" : "",
          idleStripStyle:
            model.showStrip === true
              ? "left:2px;top:2px;bottom:2px;width:16px;border-radius:16px;background-color:#70F3AF;"
              : "",
          showStrip: model.showStrip === true,
          showActiveBackground: model.showActiveBackground === true,
          valueSingleLine: true,
          interactionState: model.interactionState || "passive",
          state: model.state || "idle",
        };
      }),
      resolveLayout: vi.fn(function (args) {
        const model = args && args.model ? args.model : {};
        const shellRect = args && args.shellRect ? args.shellRect : null;
        if (!shellRect) {
          return null;
        }
        const chrome =
          model.showStrip === true
            ? { left: 21, right: 2, top: 2, bottom: 2 }
            : { left: 2, right: 2, top: 2, bottom: 2 };
        const width = Math.max(
          1,
          Math.round(shellRect.width) - chrome.left - chrome.right,
        );
        const height = Math.max(
          1,
          Math.round(shellRect.height) - chrome.top - chrome.bottom,
        );
        const ratio = width / height;
        let mode = "normal";
        if (ratio < 1) {
          mode = "high";
        } else if (ratio > 3) {
          mode = "flat";
        }
        return {
          mode: mode,
          shellRect: {
            width: Math.round(shellRect.width),
            height: Math.round(shellRect.height),
          },
          contentRect: {
            width: width,
            height: height,
            chrome: chrome,
          },
        };
      }),
    };
    const themeResolver = {
      resolveForRoot: vi.fn(function () {
        return {
          colors: {
            alarmWidget: {
              bg: "#C73A32",
              fg: "#ffffff",
              strip: "#70F3AF",
            },
          },
          font: {
            family: "sans-serif",
            weight: 700,
            labelWeight: 600,
          },
        };
      }),
    };

    const componentContext = createComponentContextMock({
      modules: {
        AlarmHtmlFit: { create: () => fit },
        AlarmHtmlFitChrome: loadFresh(
          "shared/widget-kits/vessel/AlarmHtmlFitChrome.js",
        ),
        HtmlWidgetUtils: htmlWidgetUtilsModule,
        AlarmRenderModel: renderModelModule,
        AlarmMarkup: markupModule,
      },
      services: {
        dom: {
          requirePluginRoot(target) {
            return target;
          },
          getNightModeState() {
            return false;
          },
        },
        themeTokens: {
          resolveForRoot: themeResolver.resolveForRoot,
        },
      },
    });

    return {
      htmlUtils: htmlUtils,
      fit: fit,
      rendererSpec: loadFresh(
        "widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js",
      ).create({}, componentContext),
    };
  }

  function makePayload(overrides) {
    const stopAll = vi.fn(() => true);
    const props = Object.assign(
      {
        caption: "ALARM",
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        surfacePolicy: {
          interaction: {
            mode: "dispatch",
          },
          actions: {
            alarm: {
              stopAll: stopAll,
            },
          },
        },
        domain: {
          state: "active",
          alarmText: "ENGINE",
          hasActiveAlarms: true,
          activeCount: 1,
          alarmNames: ["ENGINE"],
        },
      },
      overrides && overrides.props ? overrides.props : {},
    );

    return Object.assign(
      {
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        shellRect: { width: 220, height: 100 },
        revision: 1,
        props: props,
        hostContext: {},
      },
      overrides || {},
    );
  }

module.exports = {
  readCss,
  escapeRegExp,
  normalizeRuleBody,
  readRuleBody,
  normalizeSelectorList,
  readCombinedRuleBody,
  expectDeclaration,
  createHelpers,
  makePayload,
  createRealAlarmRenderer: rendererHelpers.createRealAlarmRenderer,
  createAisRendererWithRealLayout: rendererHelpers.createAisRendererWithRealLayout,
  mountRenderer: rendererHelpers.mountRenderer,
  readStyleFields: rendererHelpers.readStyleFields,
  createAlarmMeasureContext: rendererHelpers.createAlarmMeasureContext,
};
