const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const rendererHelpers = require("./AlarmTextHtmlWidget.renderers.js");

/**
 * @typedef {{ width: number, height: number }} ShellRect
 * @typedef {{ accentReserve: number, bottom: number, left: number, padX: number, padY: number, right: number, stripBottom: number, stripGap: number, stripLeft: number, stripRadius: number, stripTop: number, stripWidth: number, top: number }} ChromeBox
 * @typedef {{ contentRect: { chrome: ChromeBox, height: number, width: number }, mode: "flat" | "high" | "normal", shellRect: ShellRect }} FitLayout
 * @typedef {{ interactionState?: unknown, showActiveBackground?: unknown, showStrip?: unknown, state?: unknown }} FitModel
 * @typedef {{ fontMetricsEpoch?: unknown, hostContext?: unknown, model?: unknown, rootEl?: unknown, shellRect?: unknown, targetEl?: unknown }} FitComputeArgs
 * @typedef {{ model?: unknown, shellRect?: unknown }} FitChromeResolveArgs
 * @typedef {{ accentStyle: string, activeBackgroundStyle: string, activeForegroundStyle: string, captionPx: number, captionStyle: string, idleStripStyle: string, interactionState: unknown, mode: string, shellStyle: string, showActiveBackground: boolean, showStrip: boolean, state: unknown, valuePx: number, valueSingleLine: boolean, valueStyle: string }} FitComputeResult
 * @typedef {{ interaction: { mode: string }, actions: { alarm: { stopAll: () => unknown } } }} AlarmSurfacePolicy
 * @typedef {{ state: string, alarmText: string, hasActiveAlarms: boolean, activeCount: number, alarmNames: string[] }} AlarmDomain
 * @typedef {{ caption: string, ratioThresholdNormal: number, ratioThresholdFlat: number, surfacePolicy: AlarmSurfacePolicy, domain: AlarmDomain, editing?: boolean }} AlarmProps
 * @typedef {{ rootEl: HTMLElement, shellEl: HTMLElement, shellRect: ShellRect, revision: number, props: AlarmProps, hostContext: Record<string, unknown>, fontMetricsEpoch?: number }} AlarmPayload
 * @typedef {{ fontMetricsEpoch?: number, hostContext?: Record<string, unknown>, props?: Partial<AlarmProps>, revision?: number, rootEl?: HTMLElement, shellEl?: HTMLElement, shellRect?: ShellRect }} MakePayloadOverrides
 * @typedef {{ destroy: () => void, detach: () => void, layoutSignature: (payload: Record<string, unknown>) => string, mount: (mountHostEl: HTMLElement, payload: Record<string, unknown>) => void, postPatch: () => boolean, update: (payload: Record<string, unknown>) => void }} CommittedRenderer
 * @typedef {{ createCommittedRenderer: (context: Record<string, unknown>) => CommittedRenderer, id: string, wantsHideNativeHead?: boolean }} RendererSpec
 * @typedef {{ resolveForRoot: (root?: unknown) => unknown }} ThemeResolverApi
 * @typedef {{ create: () => unknown }} HtmlUtilsModule
 */

/** @param {string} relativePath */
function readCss(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/** @param {string} text */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {unknown} bodyText */
function normalizeRuleBody(bodyText) {
  return String(bodyText || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .sort()
    .join(";");
}

/** @param {string} cssText @param {string} selector */
function readRuleBody(cssText, selector) {
  const pattern = new RegExp(escapeRegExp(selector) + "\\s*\\{([\\s\\S]*?)\\}", "m");
  const match = String(cssText || "").match(pattern);
  expect(match, "missing css rule for selector: " + selector).toBeTruthy();
  return normalizeRuleBody(match ? match[1] : "");
}

/** @param {string} selectorText */
function normalizeSelectorList(selectorText) {
  return String(selectorText || "")
    .split(",")
    .map((entry) => entry.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

/** @param {string} cssText @param {string[] | string} selectors */
function readCombinedRuleBody(cssText, selectors) {
  const source = String(cssText || "");
  const expectedSelectorList = Array.isArray(selectors) ? selectors.join(",") : String(selectors || "");
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

/** @param {string} ruleBody @param {string} declaration */
function expectDeclaration(ruleBody, declaration) {
  expect(ruleBody).toContain(declaration);
}

function createHelpers() {
  const htmlWidgetUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
  const renderModelModule = loadFresh("shared/widget-kits/vessel/AlarmRenderModel.js");
  const markupModule = loadFresh("shared/widget-kits/vessel/AlarmMarkup.js");
  const htmlUtils = /** @type {ReturnType<HtmlUtilsModule["create"]>} */ (htmlWidgetUtilsModule.create());
  const fit = {
    /** @param {FitComputeArgs} [args] @returns {FitComputeResult} */
    compute: vi.fn(function (args) {
      const model = /** @type {FitModel} */ (args && args.model ? args.model : {});
      return {
        mode: "normal",
        captionPx: 12,
        valuePx: 18,
        captionStyle: "font-size:12px;",
        valueStyle: "font-size:18px;",
        shellStyle: model.showStrip === true ? "padding:2px 2px 2px 21px;" : "padding:2px;",
        accentStyle:
          model.showStrip === true
            ? "left:2px;top:2px;bottom:2px;width:16px;border-radius:16px;background-color:#2e9e6b;"
            : "",
        activeBackgroundStyle: model.showActiveBackground === true ? "background-color:#d9534a;" : "",
        activeForegroundStyle: model.state === "active" ? "color:#ffffff;" : "",
        idleStripStyle:
          model.showStrip === true
            ? "left:2px;top:2px;bottom:2px;width:16px;border-radius:16px;background-color:#2e9e6b;"
            : "",
        showStrip: model.showStrip === true,
        showActiveBackground: model.showActiveBackground === true,
        valueSingleLine: true,
        interactionState: model.interactionState || "passive",
        state: model.state || "idle"
      };
    }),
    /** @param {FitChromeResolveArgs} [args] @returns {FitLayout | null} */
    resolveLayout: vi.fn(function (args) {
      const model = /** @type {FitModel} */ (args && args.model ? args.model : {});
      const shellRect = /** @type {ShellRect | null} */ (args && args.shellRect ? args.shellRect : null);
      if (!shellRect) {
        return null;
      }
      /** @type {ChromeBox} */
      const chromeWithStrip = {
        left: 21,
        right: 2,
        top: 2,
        bottom: 2,
        stripWidth: 16,
        stripGap: 3,
        stripLeft: 2,
        stripTop: 2,
        stripBottom: 2,
        padX: 2,
        padY: 2,
        accentReserve: 21,
        stripRadius: 16
      };
      /** @type {ChromeBox} */
      const chromeWithoutStrip = {
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        stripWidth: 0,
        stripGap: 0,
        stripLeft: 0,
        stripTop: 0,
        stripBottom: 0,
        padX: 2,
        padY: 2,
        accentReserve: 0,
        stripRadius: 0
      };
      const chrome = model.showStrip === true ? chromeWithStrip : chromeWithoutStrip;
      const width = Math.max(1, Math.round(shellRect.width) - chrome.left - chrome.right);
      const height = Math.max(1, Math.round(shellRect.height) - chrome.top - chrome.bottom);
      const ratio = width / height;
      /** @type {FitLayout["mode"]} */
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
    /** @returns {unknown} */
    resolveForRoot: vi.fn(function () {
      return {
        colors: {
          alarmWidget: {
            bg: "#d9534a",
            fg: "#ffffff",
            strip: "#2e9e6b"
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
        /** @param {unknown} target */
        requirePluginRoot(target) {
          return target;
        },
        getNightModeState() {
          return false;
        }
      },
      themeTokens: {
        resolveForRoot: themeResolver.resolveForRoot
      }
    }
  });

  return {
    htmlUtils: htmlUtils,
    fit: fit,
    rendererSpec: /** @type {RendererSpec} */ (
      loadFresh("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js").create({}, componentContext)
    )
  };
}

/** @param {MakePayloadOverrides} [overrides] */
function makePayload(overrides) {
  const stopAll = vi.fn(() => true);
  const props = /** @type {AlarmProps} */ (
    Object.assign(
      {
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
      },
      overrides && overrides.props ? overrides.props : {}
    )
  );

  return /** @type {AlarmPayload} */ (
    Object.assign(
      {
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        shellRect: { width: 220, height: 100 },
        revision: 1,
        props: props,
        hostContext: {}
      },
      overrides || {}
    )
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
  createAlarmMeasureContext: rendererHelpers.createAlarmMeasureContext
};
