/**
 * Module: EditRouteRenderModel - Pure normalization and display model owner for edit-route HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: EditRouteLayout, HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteRenderModel = factory(); }
}(this, function () {
  "use strict";

  const METRIC_IDS = ["pts", "dst", "rte", "eta"];
  const NO_ROUTE_TEXT = "No Route";
  const SOURCE_BADGE_TEXT = "LOCAL";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function toShellSize(shellRect) {
    const rect = shellRect && typeof shellRect === "object" ? shellRect : null;
    return {
      width: Math.max(1, Math.round(toFiniteNumber(rect && rect.width) || 1)),
      height: Math.max(1, Math.round(toFiniteNumber(rect && rect.height) || 1))
    };
  }

  function resolveDefaultText(props) {
    if (Object.prototype.hasOwnProperty.call(props, "default")) {
      return String(props.default);
    }
    return undefined;
  }

  function normalizeMetricLabel(value, htmlUtils) {
    const text = htmlUtils.trimText(value);
    return text ? text + ":" : "";
  }

  function normalizeMetricUnit(value, htmlUtils) {
    return htmlUtils.trimText(value);
  }

  function toSignatureToken(value) {
    if (value == null) {
      return "";
    }
    return encodeURIComponent(String(value));
  }

  function callFormatter(value, formatter, formatterParameters, defaultText, Helpers) {
    const opts = {
      formatter: formatter,
      formatterParameters: formatterParameters
    };
    if (typeof defaultText !== "undefined") {
      opts.default = defaultText;
    }
    return Helpers.applyFormatter(value, opts);
  }

  function formatMetric(value, formatter, formatterParameters, defaultText, Helpers) {
    const text = String(callFormatter(value, formatter, formatterParameters, defaultText, Helpers));
    if (text.trim()) {
      return text;
    }
    return String(callFormatter(undefined, formatter, formatterParameters, defaultText, Helpers));
  }

  function buildResizeSignatureParts(model) {
    const m = model || {};
    const parts = [
      m.mode || "normal",
      m.hasRoute ? 1 : 0,
      m.isActiveRoute ? 1 : 0,
      m.isLocalRoute ? 1 : 0,
      m.isServerRoute ? 1 : 0,
      m.canOpenEditRoute ? 1 : 0,
      m.isVerticalCommitted ? 1 : 0,
      "N" + toSignatureToken(m.nameText)
    ];

    for (let i = 0; i < m.visibleMetricIds.length; i += 1) {
      const id = m.visibleMetricIds[i];
      const metric = m.metrics && m.metrics[id] ? m.metrics[id] : {};
      parts.push("L" + toSignatureToken(metric.labelText));
      parts.push("V" + toSignatureToken(metric.valueText));
      parts.push("U" + toSignatureToken(metric.unitText));
    }

    if (m.isVerticalCommitted) {
      parts.push(Math.max(1, Math.round(toFiniteNumber(m.shellWidth) || 1)));
      parts.push(Math.max(1, Math.round(toFiniteNumber(m.effectiveLayoutHeight) || 1)));
    } else {
      parts.push(Math.max(1, Math.round(toFiniteNumber(m.shellWidth) || 1)));
      parts.push(Math.max(1, Math.round(toFiniteNumber(m.shellHeight) || 1)));
    }
    return parts;
  }

  function create(def, Helpers) {
    const layoutApi = Helpers.getModule("EditRouteLayout").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const navInteractionPolicy = Helpers.getModule("NavInteractionPolicy").create(def, Helpers);

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layoutConfig = toObject(props.layout);
      const captionsConfig = toObject(props.captions);
      const unitsConfig = toObject(props.units);
      const shellSize = toShellSize(cfg.shellRect);
      const hasRoute = domain.hasRoute === true;
      const isActiveRoute = hasRoute && domain.isActiveRoute === true;
      const isLocalRoute = hasRoute && domain.isLocalRoute === true;
      const isServerRoute = hasRoute && domain.isServerRoute === true;
      const defaultText = resolveDefaultText(props);
      const nameText = hasRoute
        ? htmlUtils.trimText(domain.routeName)
        : NO_ROUTE_TEXT;
      const metricUnits = {
        dst: hasRoute ? normalizeMetricUnit(unitsConfig.dst, htmlUtils) : "",
        rte: hasRoute ? normalizeMetricUnit(unitsConfig.rte, htmlUtils) : ""
      };
      const metricHasUnit = {
        pts: false,
        dst: !!metricUnits.dst,
        rte: !!metricUnits.rte,
        eta: false
      };

      const layout = layoutApi.computeLayout({
        W: shellSize.width,
        H: shellSize.height,
        hasRoute: hasRoute,
        isLocalRoute: isLocalRoute,
        metricHasUnit: metricHasUnit,
        ratioThresholdNormal: layoutConfig.ratioThresholdNormal,
        ratioThresholdFlat: layoutConfig.ratioThresholdFlat,
        isVerticalCommitted: cfg.isVerticalCommitted === true
      });

      const metrics = Object.create(null);
      if (hasRoute) {
        const metricCaptions = {
          pts: normalizeMetricLabel(captionsConfig.pts, htmlUtils),
          dst: normalizeMetricLabel(captionsConfig.dst, htmlUtils),
          rte: normalizeMetricLabel(captionsConfig.rte, htmlUtils),
          eta: normalizeMetricLabel(captionsConfig.eta, htmlUtils)
        };

        metrics.pts = {
          id: "pts",
          labelText: metricCaptions.pts,
          valueText: formatMetric(domain.pointCount, "formatDecimal", [3], defaultText, Helpers),
          unitText: "",
          hasUnit: false
        };
        metrics.dst = {
          id: "dst",
          labelText: metricCaptions.dst,
          valueText: formatMetric(domain.totalDistance, "formatDistance", [metricUnits.dst], defaultText, Helpers),
          unitText: metricUnits.dst,
          hasUnit: metricHasUnit.dst
        };
        metrics.rte = {
          id: "rte",
          labelText: metricCaptions.rte,
          valueText: formatMetric(isActiveRoute ? domain.remainingDistance : undefined, "formatDistance", [metricUnits.rte], defaultText, Helpers),
          unitText: metricUnits.rte,
          hasUnit: metricHasUnit.rte
        };
        metrics.eta = {
          id: "eta",
          labelText: metricCaptions.eta,
          valueText: formatMetric(isActiveRoute ? domain.eta : undefined, "formatTime", [], defaultText, Helpers),
          unitText: "",
          hasUnit: false
        };
      }

      const visibleMetricIds = METRIC_IDS.filter(function (id) {
        return !!(layout.metricVisibility && layout.metricVisibility[id]);
      });
      const dispatch = navInteractionPolicy.canDispatchWhenNotEditing(props);
      const verticalWrapperStyle = layout.verticalShell && typeof layout.verticalShell.wrapperStyle === "string"
        ? layout.verticalShell.wrapperStyle.trim()
        : "";
      const flatWrapperStyle = layout.mode === "flat" && typeof layout.flatWrapperLayoutStyle === "string"
        ? layout.flatWrapperLayoutStyle.trim()
        : "";
      const wrapperStyle = ""
        + (verticalWrapperStyle
          ? (verticalWrapperStyle.endsWith(";") ? verticalWrapperStyle : verticalWrapperStyle + ";")
          : "")
        + (flatWrapperStyle
          ? (flatWrapperStyle.endsWith(";") ? flatWrapperStyle : flatWrapperStyle + ";")
          : "");

      const model = {
        mode: layout.mode,
        hasRoute: hasRoute,
        isActiveRoute: isActiveRoute,
        isLocalRoute: isLocalRoute,
        isServerRoute: isServerRoute,
        canOpenEditRoute: dispatch,
        captureClicks: dispatch,
        isVerticalCommitted: layout.isVerticalCommitted === true,
        shellWidth: shellSize.width,
        shellHeight: shellSize.height,
        effectiveLayoutHeight: layout.verticalShell ? layout.verticalShell.effectiveLayoutHeight : shellSize.height,
        layoutShellHeight: layout.verticalShell ? layout.verticalShell.effectiveLayoutHeight : shellSize.height,
        ratioThresholdNormal: layoutConfig.ratioThresholdNormal,
        ratioThresholdFlat: layoutConfig.ratioThresholdFlat,
        nameText: nameText,
        sourceBadgeText: isLocalRoute ? SOURCE_BADGE_TEXT : "",
        metrics: metrics,
        metricVisibility: layout.metricVisibility || {},
        visibleMetricIds: visibleMetricIds,
        flatMetricRows: layout.flatMetricRows || 0,
        flatMetricColumns: layout.flatMetricColumns || 0,
        metricsStyle: layout.mode === "flat" ? (layout.flatMetricsLayoutStyle || "") : "",
        wrapperStyle: wrapperStyle
      };
      model.resizeSignatureParts = buildResizeSignatureParts(model);
      return model;
    }

    return {
      id: "EditRouteRenderModel",
      buildModel: buildModel,
      buildResizeSignatureParts: buildResizeSignatureParts,
      canOpenEditRoute: function (args) {
        return navInteractionPolicy.canDispatchWhenNotEditing(args && args.props);
      }
    };
  }

  return { id: "EditRouteRenderModel", create: create };
}));
