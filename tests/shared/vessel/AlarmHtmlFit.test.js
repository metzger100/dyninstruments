const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmHtmlFit", function () {
  function createMeasureContext() {
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

  function createHarness() {
    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const fitCalls = {
      high: [],
      normal: [],
      flat: []
    };
    const textLayoutApi = {
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
    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        colors: {
          alarmWidget: {
            bg: "#e04040",
            fg: "#ffffff",
            strip: "#4488cc"
          }
        },
        font: {
          family: "sans-serif",
          weight: 700,
          labelWeight: 600
        }
      }))
    };
    const targetEl = document.createElement("div");
    const Helpers = {
      requirePluginRoot(target) {
        return target || null;
      },
      getModule(id) {
        if (id === "HtmlWidgetUtils") {
          return htmlUtilsModule;
        }
        if (id === "TextLayoutEngine") {
          return { create: () => textLayoutApi };
        }
        if (id === "ThemeResolver") {
          return themeApi;
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      fit: loadFresh("shared/widget-kits/vessel/AlarmHtmlFit.js").create({}, Helpers),
      textLayoutApi: textLayoutApi,
      themeApi: themeApi,
      targetEl: targetEl,
      hostContext: {
        __dyniAlarmMeasureCtx: createMeasureContext()
      }
    };
  }

  function makeModel(overrides) {
    return Object.assign({
      state: "active",
      interactionState: "dispatch",
      showStrip: false,
      showActiveBackground: true,
      captionText: "ALARM",
      valueText: "ENGINE, FIRE",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    }, overrides || {});
  }

  it("resolves ratio mode from thresholds", function () {
    const h = createHarness();

    expect(h.fit.compute({
      model: makeModel(),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 90, height: 100 }
    }).mode).toBe("high");

    expect(h.fit.compute({
      model: makeModel(),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 200, height: 100 }
    }).mode).toBe("normal");

    expect(h.fit.compute({
      model: makeModel(),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 400, height: 100 }
    }).mode).toBe("flat");
  });

  it("sources active and idle token styles from ThemeResolver", function () {
    const h = createHarness();
    const active = h.fit.compute({
      model: makeModel({ showActiveBackground: true }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 100 }
    });
    const idle = h.fit.compute({
      model: makeModel({ state: "idle", interactionState: "passive", showStrip: true, showActiveBackground: false }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 100 }
    });

    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
    expect(active.activeBackgroundStyle).toBe("background-color:#e04040;");
    expect(active.activeForegroundStyle).toBe("color:#ffffff;");
    expect(idle.idleStripStyle).toBe("background-color:#4488cc;");
  });

  it("caches identical results on hostContext", function () {
    const h = createHarness();
    const model = makeModel();
    const shellRect = { width: 240, height: 100 };
    const first = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    const second = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    expect(second).toBe(first);
    expect(h.hostContext.__dyniAlarmHtmlFitCache.result).toBe(first);
  });
});
