const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("AlarmHtmlFit", function () {
  function createAisLayout() {
    const responsiveScaleProfile = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMath = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const aisSizing = loadFresh(
      "shared/widget-kits/nav/AisTargetLayoutSizing.js",
    );
    const aisGeometry = loadFresh(
      "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
    );
    const aisMath = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
    return loadFresh("shared/widget-kits/nav/AisTargetLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: layoutRectMath,
          AisTargetLayoutSizing: aisSizing,
          AisTargetLayoutGeometry: aisGeometry,
          AisTargetLayoutMath: aisMath,
        },
      }),
    );
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
      },
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
          const captionWidth = captionText
            ? ctx.measureText(captionText).width
            : 0;
          const totalWidth =
            captionWidth + (captionText ? gap : 0) + valueWidth;
          const fits =
            totalWidth <= maxW + 0.01 &&
            valuePx <= safeMaxH &&
            captionPx <= safeMaxH;
          if (fits) {
            best = {
              sPx: captionPx,
              vPx: valuePx,
              cW: captionWidth,
              vW: valueWidth,
              total: totalWidth,
              gap: gap,
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
          const captionWidth = captionText
            ? ctx.measureText(captionText).width
            : 0;
          best = {
            sPx: 1,
            vPx: 1,
            cW: captionWidth,
            vW: valueWidth,
            total: captionWidth + (captionText ? gap : 0) + valueWidth,
            gap: gap,
          };
        }

        return best;
      }),
    };
  }

  function createHarness(options) {
    const cfg = options || {};
    const htmlUtilsModule = loadFresh(
      "shared/widget-kits/html/HtmlWidgetUtils.js",
    );
    const responsiveScaleProfile = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMath = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const aisLayoutMath = loadFresh(
      "shared/widget-kits/nav/AisTargetLayoutMath.js",
    );
    const aisLayoutSizing = loadFresh(
      "shared/widget-kits/nav/AisTargetLayoutSizing.js",
    );
    const fitCalls = {
      high: [],
      normal: [],
      flat: [],
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
      }),
    };
    const themeTokens = {
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
    const themeApi = {
      resolveForRoot: vi.fn(() => themeTokens),
    };
    const targetEl = document.createElement("div");
    const componentContext = createComponentContextMock({
      modules: {
        HtmlWidgetUtils: htmlUtilsModule,
        AlarmHtmlFitChrome: loadFresh(
          "shared/widget-kits/vessel/AlarmHtmlFitChrome.js",
        ),
        AisTargetLayoutSizing: aisLayoutSizing,
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: layoutRectMath,
        AisTargetLayoutMath: aisLayoutMath,
        TextLayoutEngine: { create: () => textLayoutApi },
      },
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot,
        },
        dom: {
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          },
        },
      },
    });

    return {
      fit: loadFresh("shared/widget-kits/vessel/AlarmHtmlFit.js").create(
        {},
        componentContext,
      ),
      textLayoutApi: textLayoutApi,
      themeApi: themeApi,
      targetEl: targetEl,
      hostContext: {
        __dyniAlarmMeasureCtx: createMeasureContext(),
      },
    };
  }

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
        ratioThresholdFlat: 3.0,
      },
      overrides || {},
    );
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
    const match = String(raw).match(new RegExp("^(-?\\d+(?:\\.\\d+)?)px$"));
    return match ? Number(match[1]) : NaN;
  }

  it("keeps AIS chrome parity at 120x100 where Alarm and AIS mode thresholds diverge", function () {
    const h = createHarness();
    const aisLayout = createAisLayout();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    });
    const shell = { width: 120, height: 100 };
    const alarmFit = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: {
        __dyniAlarmMeasureCtx: createMeasureContext(),
      },
      shellRect: shell,
    });
    const alarmLayout = h.fit.resolveLayout({
      model: model,
      shellRect: shell,
    });
    const ais = aisLayout.computeLayout({
      W: shell.width,
      H: shell.height,
      renderState: "data",
      showTcpaBranch: true,
      hasAccent: true,
    });

    expect(ais.mode).toBe("high");
    expect(alarmLayout.mode).toBe("normal");

    const alarmAccent = parseStyleText(alarmFit.accentStyle);
    const alarmShell = parseStyleText(alarmFit.shellStyle);
    const shellPadding = String(alarmShell.padding || "").split(/\s+/);
    const alarmTopPad =
      shellPadding.length === 4
        ? readPx({ value: shellPadding[0] }, "value")
        : NaN;
    const alarmRightPad =
      shellPadding.length === 4
        ? readPx({ value: shellPadding[1] }, "value")
        : NaN;
    const alarmBottomPad =
      shellPadding.length === 4
        ? readPx({ value: shellPadding[2] }, "value")
        : NaN;
    const alarmLeftPad =
      shellPadding.length === 4
        ? readPx({ value: shellPadding[3] }, "value")
        : NaN;
    const aisBottom =
      ais.effectiveLayoutHeight - ais.accentRect.y - ais.accentRect.h;
    const aisContentRight =
      ais.shellWidth - ais.contentRect.x - ais.contentRect.w;
    const aisContentBottom =
      ais.effectiveLayoutHeight - ais.contentRect.y - ais.contentRect.h;

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

});
