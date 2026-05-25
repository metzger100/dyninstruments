const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

function createRealAlarmRenderer() {
  const htmlWidgetUtilsModule = loadFresh(
    "shared/widget-kits/html/HtmlWidgetUtils.js",
  );
  const alarmRenderModelModule = loadFresh(
    "shared/widget-kits/vessel/AlarmRenderModel.js",
  );
  const alarmMarkupModule = loadFresh(
    "shared/widget-kits/vessel/AlarmMarkup.js",
  );
  const alarmFitModule = loadFresh(
    "shared/widget-kits/vessel/AlarmHtmlFit.js",
  );
  const alarmFitChromeModule = loadFresh(
    "shared/widget-kits/vessel/AlarmHtmlFitChrome.js",
  );
  const aisLayoutSizingModule = loadFresh(
    "shared/widget-kits/nav/AisTargetLayoutSizing.js",
  );
  const responsiveScaleProfileModule = loadFresh(
    "shared/widget-kits/layout/ResponsiveScaleProfile.js",
  );
  const layoutRectMathModule = loadFresh(
    "shared/widget-kits/layout/LayoutRectMath.js",
  );
  const aisLayoutMathModule = loadFresh(
    "shared/widget-kits/nav/AisTargetLayoutMath.js",
  );

  const textLayoutApi = {
    fitThreeRowBlock: () => ({ cPx: 11, vPx: 18 }),
    fitValueUnitCaptionRows: () => ({ cPx: 10, vPx: 16 }),
    fitInlineTriplet: () => ({ sPx: 9, vPx: 15 }),
  };
  const themeResolver = {
    resolveForRoot: vi.fn(() => ({
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
    })),
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
      AlarmMarkup: alarmMarkupModule,
    },
    services: {
      dom: {
        requirePluginRoot(target) {
          return target || null;
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

  return loadFresh(
    "widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js",
  ).create({}, componentContext);
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
                  dst: {
                    captionStyle: "font-size:8px;",
                    valueRowStyle: "",
                    valueStyle: "font-size:11px;",
                    unitStyle: "font-size:7px;",
                  },
                  cpa: {
                    captionStyle: "font-size:8px;",
                    valueRowStyle: "",
                    valueStyle: "font-size:11px;",
                    unitStyle: "font-size:7px;",
                  },
                  tcpa: {
                    captionStyle: "font-size:8px;",
                    valueRowStyle: "",
                    valueStyle: "font-size:11px;",
                    unitStyle: "font-size:7px;",
                  },
                  brg: {
                    captionStyle: "font-size:8px;",
                    valueRowStyle: "",
                    valueStyle: "font-size:11px;",
                    unitStyle: "font-size:7px;",
                  },
                },
                accentStyle: "background-color:#c33;",
              };
            },
          };
        },
      },
      HtmlWidgetUtils: loadFresh(
        "shared/widget-kits/html/HtmlWidgetUtils.js",
      ),
      AisTargetRenderModel: loadFresh(
        "shared/widget-kits/nav/AisTargetRenderModel.js",
      ),
      UnitAwareFormatter: loadFresh(
        "shared/widget-kits/format/UnitAwareFormatter.js",
      ),
      AisTargetMarkup: loadFresh("shared/widget-kits/nav/AisTargetMarkup.js"),
      AisTargetLayout: loadFresh("shared/widget-kits/nav/AisTargetLayout.js"),
      AisTargetLayoutSizing: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutSizing.js",
      ),
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      LayoutRectMath: loadFresh(
        "shared/widget-kits/layout/LayoutRectMath.js",
      ),
      AisTargetLayoutGeometry: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
      ),
      AisTargetLayoutMath: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutMath.js",
      ),
      PlaceholderNormalize: loadFresh(
        "shared/widget-kits/format/PlaceholderNormalize.js",
      ),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenLabels: loadFresh(
        "shared/widget-kits/state/StateScreenLabels.js",
      ),
      StateScreenPrecedence: loadFresh(
        "shared/widget-kits/state/StateScreenPrecedence.js",
      ),
      StateScreenInteraction: loadFresh(
        "shared/widget-kits/state/StateScreenInteraction.js",
      ),
      StateScreenMarkup: loadFresh(
        "shared/widget-kits/state/StateScreenMarkup.js",
      ),
      StateScreenTextFit: loadFresh(
        "shared/widget-kits/state/StateScreenTextFit.js",
      ),
    },
    services: {
      format: {
        applyFormatter(value, formatterOptions) {
          const cfg = formatterOptions || {};
          const formatter = cfg.formatter;
          const params = Array.isArray(cfg.formatterParameters)
            ? cfg.formatterParameters
            : [];
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
      },
      dom: {
        requirePluginRoot(target) {
          return target || null;
        },
        getNightModeState() {
          return false;
        },
      },
      themeTokens: {
        resolveForRoot() {
          return {
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 720,
              labelWeight: 610,
            },
          };
        },
      },
    },
  });

  return loadFresh(
    "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.js",
  ).create({}, componentContext);
}

function mountRenderer(rendererSpec, payload) {
  const mountHost = document.createElement("div");
  const committed = rendererSpec.createCommittedRenderer({
    hostContext: payload.hostContext || {},
  });
  committed.mount(mountHost, payload);
  return {
    mountHost: mountHost,
    committed: committed,
  };
}

function readStyleFields(node) {
  const style = node && node.style ? node.style : null;
  return {
    left: style ? style.left : "",
    top: style ? style.top : "",
    bottom: style ? style.bottom : "",
    width: style ? style.width : "",
    borderRadius: style ? style.borderRadius : "",
  };
}

function createAlarmMeasureContext() {
  return {
    font: "700 12px sans-serif",
    measureText(text) {
      const source = String(this.font || "");
      const match = source.match(new RegExp("(\\d+(?:\\.\\d+)?)px"));
      const px = match ? Number(match[1]) : 12;
      const safePx = Number.isFinite(px) ? px : 12;
      return { width: String(text).length * safePx * 0.56 };
    },
  };
}

module.exports = {
  createRealAlarmRenderer,
  createAisRendererWithRealLayout,
  mountRenderer,
  readStyleFields,
  createAlarmMeasureContext,
};
