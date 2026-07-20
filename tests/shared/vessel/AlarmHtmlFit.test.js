const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("AlarmHtmlFit", function () {
  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      /** @param {any} text */
      measureText(text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        const safePx = Number.isFinite(px) ? px : 12;
        return { width: String(text).length * safePx * 0.56 };
      }
    };
  }

  /** @param {any} [options] */
  function createHarness(options) {
    const cfg = options || {};
    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const aisLayoutMath = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
    const aisLayoutSizing = loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js");
    const fitCalls = {
      high: /** @type {any[]} */ ([]),
      normal: /** @type {any[]} */ ([]),
      flat: /** @type {any[]} */ ([])
    };
    const textLayoutApi = cfg.textLayoutApi || {
      fitThreeRowBlock: vi.fn((args) => {
        fitCalls.high.push(args);
        return { cPx: 11, vPx: 19 };
      }),
      fitValueUnitCaptionRows: vi.fn((args) => {
        fitCalls.normal.push(args);
        return { cPx: 10, vPx: 17 };
      }),
      fitInlineTriplet: vi.fn((args) => {
        fitCalls.flat.push(args);
        return { sPx: 9, vPx: 15 };
      })
    };
    const themeTokens = {
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
    const themeApi = {
      resolveForRoot: vi.fn(() => themeTokens)
    };
    const targetEl = document.createElement("div");
    const componentContext = createComponentContextMock({
      modules: {
        HtmlWidgetUtils: htmlUtilsModule,
        AlarmHtmlFitChrome: loadFresh("shared/widget-kits/vessel/AlarmHtmlFitChrome.js"),
        AisTargetLayoutSizing: aisLayoutSizing,
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: layoutRectMath,
        AisTargetLayoutMath: aisLayoutMath,
        TextLayoutEngine: { create: () => textLayoutApi }
      },
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot
        },
        dom: {
          /** @param {any} target */
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          }
        }
      }
    });

    return {
      fit: loadFresh("shared/widget-kits/vessel/AlarmHtmlFit.js").create({}, componentContext),
      textLayoutApi: textLayoutApi,
      themeApi: themeApi,
      targetEl: targetEl,
      hostContext: {
        __dyniAlarmMeasureCtx: createMeasureContext()
      }
    };
  }

  /** @param {any} [overrides] */
  function makeModel(overrides) {
    return Object.assign(
      {
        state: "active",
        interactionState: "dispatch",
        showStrip: false,
        showActiveBackground: true,
        captionText: "ALARM",
        valueText: "ENGINE, FIRE",
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0
      },
      overrides || {}
    );
  }

  it("resolves ratio mode from thresholds", function () {
    const h = createHarness();

    expect(
      h.fit.compute({
        model: makeModel(),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 90, height: 100 }
      }).mode
    ).toBe("high");

    expect(
      h.fit.compute({
        model: makeModel(),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 200, height: 100 }
      }).mode
    ).toBe("normal");

    expect(
      h.fit.compute({
        model: makeModel(),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 400, height: 100 }
      }).mode
    ).toBe("flat");

    expect(h.textLayoutApi.fitThreeRowBlock).toHaveBeenCalledTimes(1);
    expect(h.textLayoutApi.fitValueUnitCaptionRows).toHaveBeenCalledTimes(1);
    expect(h.textLayoutApi.fitInlineTriplet).toHaveBeenCalledTimes(1);
  });

  it("passes the summary text through unchanged so fit never re-decides the 3+ alarm rule", function () {
    const h = createHarness();
    const model = makeModel({
      valueText: "firstAlarm, secondAlarm +1"
    });

    const result = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 200, height: 100 }
    });

    expect(result.mode).toBe("normal");
    expect(h.textLayoutApi.fitValueUnitCaptionRows).toHaveBeenCalledTimes(1);
    expect(h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0].valueText).toBe("firstAlarm, secondAlarm +1");
  });

  it("sources active and idle token styles from theme tokens", function () {
    const h = createHarness();
    const active = h.fit.compute({
      model: makeModel({ showActiveBackground: true }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 100 }
    });
    const idle = h.fit.compute({
      model: makeModel({
        state: "idle",
        interactionState: "passive",
        showStrip: true,
        showActiveBackground: false
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 100 }
    });

    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
    expect(active.activeBackgroundStyle).toBe("background-color:#d9534a;");
    expect(active.activeForegroundStyle).toBe("color:#ffffff;");
    expect(idle.shellStyle).toContain("padding:");
    expect(idle.accentStyle).toContain("background-color:#2e9e6b;");
    expect(idle.idleStripStyle).toBe(idle.accentStyle);
  });
});
