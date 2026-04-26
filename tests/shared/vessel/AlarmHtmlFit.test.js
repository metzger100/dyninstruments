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

  function createMeasuredTextLayoutApi() {
    return {
      fitThreeRowBlock: vi.fn((args) => {
        return { cPx: 11, vPx: 19 };
      }),
      fitValueUnitCaptionRows: vi.fn((args) => {
        return { cPx: 10, vPx: 17 };
      }),
      fitInlineTriplet: vi.fn((args) => {
        const cfg = args || {};
        const ctx = cfg.ctx;
        const captionText = String(cfg.captionText || "");
        const valueText = String(cfg.valueText || "");
        const family = cfg.family || "sans-serif";
        const valueWeight = cfg.valueWeight || 700;
        const labelWeight = cfg.labelWeight || 700;
        const secScale = Number(cfg.secScale);
        const scale = Number.isFinite(secScale) ? secScale : 0.8;
        const maxW = Math.max(1, Number(cfg.maxW) || 0);
        const maxH = Math.max(1, Number(cfg.maxH) || 0);
        const gap = Math.max(0, Number(cfg.gap) || 0);
        const safeMaxH = Math.max(1, Math.floor(maxH * 0.85));

        let lo = 1;
        let hi = safeMaxH;
        let best = null;

        while (lo <= hi) {
          const valuePx = Math.max(1, Math.floor((lo + hi) / 2));
          const captionPx = Math.max(1, Math.floor(valuePx * scale));
          ctx.font = valueWeight + " " + valuePx + "px " + family;
          const valueWidth = ctx.measureText(valueText).width;
          ctx.font = labelWeight + " " + captionPx + "px " + family;
          const captionWidth = captionText ? ctx.measureText(captionText).width : 0;
          const totalWidth = captionWidth + (captionText ? gap : 0) + valueWidth;
          const fits = totalWidth <= maxW + 0.01 && valuePx <= safeMaxH && captionPx <= safeMaxH;
          if (fits) {
            best = {
              sPx: captionPx,
              vPx: valuePx,
              cW: captionWidth,
              vW: valueWidth,
              total: totalWidth,
              gap: gap
            };
            lo = valuePx + 1;
          } else {
            hi = valuePx - 1;
          }
        }

        if (!best) {
          ctx.font = valueWeight + " 1px " + family;
          const valueWidth = ctx.measureText(valueText).width;
          ctx.font = labelWeight + " 1px " + family;
          const captionWidth = captionText ? ctx.measureText(captionText).width : 0;
          best = {
            sPx: 1,
            vPx: 1,
            cW: captionWidth,
            vW: valueWidth,
            total: captionWidth + (captionText ? gap : 0) + valueWidth,
            gap: gap
          };
        }

        return best;
      })
    };
  }

  function createHarness(options) {
    const cfg = options || {};
    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const fitCalls = {
      high: [],
      normal: [],
      flat: []
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
    const themeApi = {
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

  function computePadX(width, height) {
    return Math.max(2, Math.floor(Math.min(width, height) * 0.03));
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
    expect(idle.shellStyle).toBe("padding:2px 2px 2px 13px;");
    expect(idle.accentStyle).toBe("left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;");
    expect(idle.idleStripStyle).toBe("left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;");
  });

  it("fits against the inner content rect when the idle strip is present", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 100 };
    const padX = computePadX(205, 96);

    const result = h.fit.compute({
      model: makeModel({
        state: "idle",
        interactionState: "passive",
        showStrip: true,
        showActiveBackground: false
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    expect(fitArgs.W).toBe(205 - (padX * 2));
    expect(fitArgs.H).toBe(96);
    expect(result.valuePx).toBe(17);
  });

  it("shares one chrome contract between layout mode resolution and fit sizing", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 100 };
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const layout = h.fit.resolveLayout({
      model: model,
      shellRect: shellRect
    });

    expect(layout).toEqual({
      mode: "normal",
      shellRect: { width: 220, height: 100 },
      contentRect: {
        width: 205,
        height: 96,
        chrome: { left: 13, right: 2, top: 2, bottom: 2 }
      }
    });

    h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    const padX = computePadX(layout.contentRect.width, layout.contentRect.height);
    expect(fitArgs.W).toBe(layout.contentRect.width - (padX * 2));
    expect(fitArgs.H).toBe(layout.contentRect.height);
  });

  it("never fits against raw shell rect dimensions", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 100 };

    h.fit.compute({
      model: makeModel({
        state: "active",
        interactionState: "dispatch",
        showStrip: false,
        showActiveBackground: true
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    expect(fitArgs.W).toBe(216 - (computePadX(216, 96) * 2));
    expect(fitArgs.H).toBe(96);
    expect(fitArgs.W).not.toBe(shellRect.width);
    expect(fitArgs.H).not.toBe(shellRect.height);
  });

  it("leaves padX space on both sides in flat mode by fitting against reduced width", function () {
    const textLayoutApi = createMeasuredTextLayoutApi();
    const h = createHarness({ textLayoutApi: textLayoutApi });
    const shellRect = { width: 800, height: 200 };
    const contentWidth = shellRect.width - 4;
    const contentHeight = shellRect.height - 4;
    const padX = computePadX(contentWidth, contentHeight);

    const result = h.fit.compute({
      model: makeModel({
        showStrip: false,
        captionText: "ALARM",
        valueText: "NONE"
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitArgs = textLayoutApi.fitInlineTriplet.mock.calls[0][0];
    const measureCtx = h.hostContext.__dyniAlarmMeasureCtx;
    measureCtx.font = "600 " + result.captionPx + "px sans-serif";
    const captionWidth = measureCtx.measureText("ALARM").width;
    measureCtx.font = "700 " + result.valuePx + "px sans-serif";
    const valueWidth = measureCtx.measureText("NONE").width;
    const totalWidth = captionWidth + fitArgs.gap + valueWidth;
    const contentEdgeGap = (contentWidth - totalWidth) / 2;

    expect(result.mode).toBe("flat");
    expect(fitArgs.maxW).toBe(contentWidth - (padX * 2));
    expect(totalWidth).toBeLessThanOrEqual(fitArgs.maxW + 0.01);
    expect(contentEdgeGap).toBeGreaterThanOrEqual(padX - 0.01);
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
