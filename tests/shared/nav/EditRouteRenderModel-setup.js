const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

// @ts-ignore -- pre-existing untyped test mock boundary
function createRenderModel(options) {
  const opts = options || {};
  const applyFormatter =
    opts.applyFormatter ||
    // @ts-ignore -- pre-existing untyped test mock boundary
    function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      const defaultText = Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
      if (value == null || Number.isNaN(value)) {
        return defaultText;
      }

      if (cfg.formatter === "formatDecimal") {
        const precision = Array.isArray(cfg.formatterParameters) ? Number(cfg.formatterParameters[0]) : 0;
        const places = Number.isFinite(precision) ? Math.max(0, Math.floor(precision)) : 0;
        return Number(value).toFixed(places);
      }
      if (cfg.formatter === "formatDistance") {
        const unit = Array.isArray(cfg.formatterParameters) ? String(cfg.formatterParameters[0] || "") : "";
        return "DST(" + unit + "):" + Number(value).toFixed(1);
      }
      if (cfg.formatter === "formatTime") {
        return "TIME:" + String(value);
      }
      if (cfg.formatter === "formatClock") {
        return "CLOCK:" + String(value);
      }
      return String(value);
    };

  const componentContext = createComponentContextMock({
    modules: {
      EditRouteLayout: loadFresh("shared/widget-kits/nav/EditRouteLayout.js"),
      EditRouteLayoutMath: loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js"),
      EditRouteLayoutGeometry: loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js"),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      NavInteractionPolicy: loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js")
    },
    services: {
      format: {
        applyFormatter: applyFormatter
      }
    }
  });

  return loadFresh("shared/widget-kits/nav/EditRouteRenderModel.js").create({}, componentContext);
}

// @ts-ignore -- pre-existing untyped test mock boundary
function withSurfacePolicy(props, options) {
  const opts = options || {};
  return Object.assign({}, props || {}, {
    surfacePolicy: {
      interaction: {
        mode: opts.mode === "passive" ? "passive" : "dispatch"
      },
      containerOrientation: opts.orientation === "vertical" ? "vertical" : "default"
    }
  });
}

// @ts-ignore -- pre-existing untyped test mock boundary
function makeProps(overrides) {
  return Object.assign(
    {
      domain: {
        hasRoute: true,
        routeName: "Harbor Run",
        pointCount: 5,
        totalDistance: 1234.5,
        remainingDistance: 321.4,
        rteEta: "2026-03-06T11:45:00Z",
        isActiveRoute: true,
        isLocalRoute: true,
        isServerRoute: false
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8
      },
      captions: {
        pts: "PTS",
        dst: "DST",
        rte: "RTE",
        rteEta: "ETA"
      },
      units: {
        dst: "nm",
        rte: "nm"
      },
      formatUnits: {
        dst: "nm",
        rte: "nm"
      }
    },
    overrides || {}
  );
}

module.exports = {
  createComponentContextMock,
  createRenderModel,
  loadFresh,
  makeProps,
  withSurfacePolicy
};
