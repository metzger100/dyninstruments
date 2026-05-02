const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmHtmlFit", function () {
  function createAisLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const aisSizing = loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js");
    const aisGeometry = loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
    const aisMath = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
    return loadFresh("shared/widget-kits/nav/AisTargetLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return layoutRectMath;
        }
        if (id === "AisTargetLayoutSizing") {
          return aisSizing;
        }
        if (id === "AisTargetLayoutGeometry") {
          return aisGeometry;
        }
        if (id === "AisTargetLayoutMath") {
          return aisMath;
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

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
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const aisLayoutMath = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
    const aisLayoutSizing = loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js");
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
        if (id === "AlarmHtmlFitChrome") {
          return loadFresh("shared/widget-kits/vessel/AlarmHtmlFitChrome.js");
        }
        if (id === "AisTargetLayoutSizing") {
          return aisLayoutSizing;
        }
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return layoutRectMath;
        }
        if (id === "AisTargetLayoutMath") {
          return aisLayoutMath;
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

  function parseStyleText(styleText) {
    return String(styleText || "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .reduce((acc, entry) => {
        const parts = entry.split(":");
        if (parts.length < 2) {
          return acc;
        }
        const key = parts[0].trim();
        const value = parts.slice(1).join(":").trim();
        acc[key] = value;
        return acc;
      }, Object.create(null));
  }

  function readPx(styleMap, key) {
    const raw = styleMap && styleMap[key] ? styleMap[key] : "";
    const match = String(raw).match(/^(-?\d+(?:\.\d+)?)px$/);
    return match ? Number(match[1]) : NaN;
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
    expect(idle.shellStyle).toContain("padding:");
    expect(idle.accentStyle).toContain("background-color:#66b8ff;");
    expect(idle.idleStripStyle).toBe(idle.accentStyle);
  });

  it("fits against the inner content rect when the idle strip is present", function () {
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
    const padX = computePadX(layout.contentRect.width, layout.contentRect.height);

    const result = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    expect(fitArgs.W).toBe(layout.contentRect.width - (padX * 2));
    expect(fitArgs.H).toBe(layout.contentRect.height);
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

    expect(layout).toBeTruthy();
    expect(layout.mode).toBe("normal");
    expect(layout.shellRect).toEqual({ width: 220, height: 100 });
    expect(layout.contentRect.width).toBeGreaterThan(0);
    expect(layout.contentRect.height).toBeGreaterThan(0);
    expect(layout.contentRect.chrome.left).toBeGreaterThan(layout.contentRect.chrome.right);

    const fit = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const accentStyle = parseStyleText(fit.accentStyle);
    const shellStyle = parseStyleText(fit.shellStyle);
    const stripWidth = readPx(accentStyle, "width");
    const stripRadius = readPx(accentStyle, "border-radius");
    const stripPadding = readPx(accentStyle, "left");
    const shellPadding = String(shellStyle.padding || "").split(/\s+/);
    const shellLeft = shellPadding.length === 4 ? readPx({ value: shellPadding[3] }, "value") : NaN;
    const shellRight = shellPadding.length === 4 ? readPx({ value: shellPadding[1] }, "value") : NaN;
    const stripGap = shellLeft - shellRight - stripWidth;

    expect(stripWidth).toBeGreaterThan(0);
    expect(stripRadius).toBe(stripWidth);
    expect(stripPadding).toBe(shellRight);
    expect(stripGap).toBeGreaterThanOrEqual(1);
    expect(layout.contentRect.chrome.left).toBe(shellLeft);
    expect(layout.contentRect.chrome.right).toBe(shellRight);

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

    const layout = h.fit.resolveLayout({
      model: makeModel({
        state: "active",
        interactionState: "dispatch",
        showStrip: false,
        showActiveBackground: true
      }),
      shellRect: shellRect
    });
    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    expect(fitArgs.W).toBe(layout.contentRect.width - (computePadX(layout.contentRect.width, layout.contentRect.height) * 2));
    expect(fitArgs.H).toBe(layout.contentRect.height);
    expect(fitArgs.W).not.toBe(shellRect.width);
    expect(fitArgs.H).not.toBe(shellRect.height);
  });

  it("leaves padX space on both sides in flat mode by fitting against reduced width", function () {
    const textLayoutApi = createMeasuredTextLayoutApi();
    const h = createHarness({ textLayoutApi: textLayoutApi });
    const shellRect = { width: 800, height: 200 };
    const layout = h.fit.resolveLayout({
      model: makeModel({
        showStrip: false,
        captionText: "ALARM",
        valueText: "NONE"
      }),
      shellRect: shellRect
    });
    const contentWidth = layout.contentRect.width;
    const contentHeight = layout.contentRect.height;
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

  it("derives idle strip chrome from shell width so accent and content reservation stay aligned", function () {
    const h = createHarness();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const narrowRect = { width: 180, height: 100 };
    const wideRect = { width: 320, height: 100 };
    const narrow = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: narrowRect
    });
    const wide = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: wideRect
    });
    const narrowLayout = h.fit.resolveLayout({ model: model, shellRect: narrowRect });
    const wideLayout = h.fit.resolveLayout({ model: model, shellRect: wideRect });

    const narrowAccent = parseStyleText(narrow.accentStyle);
    const wideAccent = parseStyleText(wide.accentStyle);
    const narrowShell = parseStyleText(narrow.shellStyle);
    const wideShell = parseStyleText(wide.shellStyle);
    const narrowShellPadding = String(narrowShell.padding || "").split(/\s+/);
    const wideShellPadding = String(wideShell.padding || "").split(/\s+/);
    const narrowLeft = readPx({ value: narrowShellPadding[3] }, "value");
    const narrowRight = readPx({ value: narrowShellPadding[1] }, "value");
    const wideLeft = readPx({ value: wideShellPadding[3] }, "value");
    const wideRight = readPx({ value: wideShellPadding[1] }, "value");
    const narrowWidth = readPx(narrowAccent, "width");
    const wideWidth = readPx(wideAccent, "width");

    expect(wideWidth).toBeGreaterThan(narrowWidth);
    expect(wideLeft).toBeGreaterThan(narrowLeft);
    expect(narrowLeft - narrowRight).toBeGreaterThan(narrowWidth);
    expect(wideLeft - wideRight).toBeGreaterThan(wideWidth);
    expect(narrowLayout.contentRect.chrome.left).toBe(narrowLeft);
    expect(wideLayout.contentRect.chrome.left).toBe(wideLeft);
    expect(wideLayout.contentRect.width).toBeLessThan(wideRect.width - wideRight * 2);
  });

  it("matches AIS visual chrome geometry for representative shell sizes", function () {
    const h = createHarness();
    const aisLayout = createAisLayout();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const sizes = [
      { width: 180, height: 100 },
      { width: 220, height: 100 },
      { width: 320, height: 100 },
      { width: 220, height: 300 }
    ];

    sizes.forEach((size) => {
      const alarmFit = h.fit.compute({
        model: model,
        targetEl: h.targetEl,
        hostContext: {
          __dyniAlarmMeasureCtx: createMeasureContext()
        },
        shellRect: size
      });
      const alarmLayout = h.fit.resolveLayout({
        model: model,
        shellRect: size
      });
      const ais = aisLayout.computeLayout({
        W: size.width,
        H: size.height,
        renderState: "data",
        showTcpaBranch: true,
        hasAccent: true
      });

      const alarmAccent = parseStyleText(alarmFit.accentStyle);
      const alarmShell = parseStyleText(alarmFit.shellStyle);
      const shellPadding = String(alarmShell.padding || "").split(/\s+/);
      const alarmTopPad = shellPadding.length === 4 ? readPx({ value: shellPadding[0] }, "value") : NaN;
      const alarmRightPad = shellPadding.length === 4 ? readPx({ value: shellPadding[1] }, "value") : NaN;
      const alarmBottomPad = shellPadding.length === 4 ? readPx({ value: shellPadding[2] }, "value") : NaN;
      const alarmLeftPad = shellPadding.length === 4 ? readPx({ value: shellPadding[3] }, "value") : NaN;
      const aisBottom = ais.effectiveLayoutHeight - ais.accentRect.y - ais.accentRect.h;
      const aisContentRight = ais.shellWidth - ais.contentRect.x - ais.contentRect.w;
      const aisContentBottom = ais.effectiveLayoutHeight - ais.contentRect.y - ais.contentRect.h;

      expect(readPx(alarmAccent, "left")).toBe(ais.accentRect.x);
      expect(readPx(alarmAccent, "top")).toBe(ais.accentRect.y);
      expect(readPx(alarmAccent, "bottom")).toBe(aisBottom);
      expect(readPx(alarmAccent, "width")).toBe(ais.accentRect.w);
      expect(readPx(alarmAccent, "border-radius")).toBe(ais.accentRect.w);
      expect(alarmLeftPad).toBe(ais.contentRect.x);
      expect(alarmRightPad).toBe(aisContentRight);
      expect(alarmTopPad).toBe(ais.contentRect.y);
      expect(alarmBottomPad).toBe(aisContentBottom);
      expect(alarmLayout.contentRect.chrome.left).toBe(alarmLeftPad);
      expect(alarmLayout.contentRect.chrome.right).toBe(alarmRightPad);
      expect(alarmLayout.contentRect.chrome.top).toBe(alarmTopPad);
      expect(alarmLayout.contentRect.chrome.bottom).toBe(alarmBottomPad);
    });
  });

  it("keeps AIS chrome parity at 120x100 where Alarm and AIS mode thresholds diverge", function () {
    const h = createHarness();
    const aisLayout = createAisLayout();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    });
    const shell = { width: 120, height: 100 };
    const alarmFit = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: {
        __dyniAlarmMeasureCtx: createMeasureContext()
      },
      shellRect: shell
    });
    const alarmLayout = h.fit.resolveLayout({
      model: model,
      shellRect: shell
    });
    const ais = aisLayout.computeLayout({
      W: shell.width,
      H: shell.height,
      renderState: "data",
      showTcpaBranch: true,
      hasAccent: true
    });

    expect(ais.mode).toBe("high");
    expect(alarmLayout.mode).toBe("normal");

    const alarmAccent = parseStyleText(alarmFit.accentStyle);
    const alarmShell = parseStyleText(alarmFit.shellStyle);
    const shellPadding = String(alarmShell.padding || "").split(/\s+/);
    const alarmTopPad = shellPadding.length === 4 ? readPx({ value: shellPadding[0] }, "value") : NaN;
    const alarmRightPad = shellPadding.length === 4 ? readPx({ value: shellPadding[1] }, "value") : NaN;
    const alarmBottomPad = shellPadding.length === 4 ? readPx({ value: shellPadding[2] }, "value") : NaN;
    const alarmLeftPad = shellPadding.length === 4 ? readPx({ value: shellPadding[3] }, "value") : NaN;
    const aisBottom = ais.effectiveLayoutHeight - ais.accentRect.y - ais.accentRect.h;
    const aisContentRight = ais.shellWidth - ais.contentRect.x - ais.contentRect.w;
    const aisContentBottom = ais.effectiveLayoutHeight - ais.contentRect.y - ais.contentRect.h;

    expect(readPx(alarmAccent, "left")).toBe(ais.accentRect.x);
    expect(readPx(alarmAccent, "top")).toBe(ais.accentRect.y);
    expect(readPx(alarmAccent, "bottom")).toBe(aisBottom);
    expect(readPx(alarmAccent, "width")).toBe(ais.accentRect.w);
    expect(readPx(alarmAccent, "border-radius")).toBe(ais.accentRect.w);
    expect(alarmLeftPad).toBe(ais.contentRect.x);
    expect(alarmRightPad).toBe(aisContentRight);
    expect(alarmTopPad).toBe(ais.contentRect.y);
    expect(alarmBottomPad).toBe(aisContentBottom);
  });

  it("invalidates cache when shell width changes strip chrome while content width stays the same", function () {
    const h = createHarness();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const firstRect = { width: 118, height: 100 };
    const secondRect = { width: 119, height: 100 };
    const first = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: firstRect
    });
    const second = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: secondRect
    });
    const firstLayout = h.fit.resolveLayout({ model: model, shellRect: firstRect });
    const secondLayout = h.fit.resolveLayout({ model: model, shellRect: secondRect });

    expect(firstLayout.contentRect.width).toBe(secondLayout.contentRect.width);

    const firstAccent = parseStyleText(first.accentStyle);
    const secondAccent = parseStyleText(second.accentStyle);
    const firstShell = parseStyleText(first.shellStyle);
    const secondShell = parseStyleText(second.shellStyle);
    const firstPadding = String(firstShell.padding || "").split(/\s+/);
    const secondPadding = String(secondShell.padding || "").split(/\s+/);
    const firstLeft = firstPadding.length === 4 ? readPx({ value: firstPadding[3] }, "value") : NaN;
    const firstRight = firstPadding.length === 4 ? readPx({ value: firstPadding[1] }, "value") : NaN;
    const secondLeft = secondPadding.length === 4 ? readPx({ value: secondPadding[3] }, "value") : NaN;
    const secondRight = secondPadding.length === 4 ? readPx({ value: secondPadding[1] }, "value") : NaN;
    const firstStripWidth = readPx(firstAccent, "width");
    const secondStripWidth = readPx(secondAccent, "width");
    const firstStripGap = firstLeft - firstRight - firstStripWidth;
    const secondStripGap = secondLeft - secondRight - secondStripWidth;

    expect(secondStripWidth).not.toBe(firstStripWidth);
    expect(secondStripWidth).toBe(secondLayout.contentRect.chrome.stripWidth);
    expect(secondLeft).toBe(secondLayout.contentRect.chrome.left);
    expect(secondRight).toBe(secondLayout.contentRect.chrome.right);
    expect(firstStripGap).toBe(firstLayout.contentRect.chrome.stripGap);
    expect(secondStripGap).toBe(secondLayout.contentRect.chrome.stripGap);
  });

  it("recomputes when fontMetricsEpoch changes so cold-load font metrics do not reuse stale fit cache", function () {
    const h = createHarness();
    const model = makeModel();
    const shellRect = { width: 240, height: 100 };
    const first = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect,
      fontMetricsEpoch: 0
    });
    const second = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect,
      fontMetricsEpoch: 0
    });
    const third = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect,
      fontMetricsEpoch: 1
    });

    expect(second).toBe(first);
    expect(third).not.toBe(first);
    expect(h.textLayoutApi.fitValueUnitCaptionRows).toHaveBeenCalledTimes(2);
  });
});
