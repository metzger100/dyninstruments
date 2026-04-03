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

  const METRIC_IDS = ["pts", "dst", "rtg", "eta"];
  const NO_ROUTE_TEXT = "No Route";
  const SOURCE_BADGE_TEXT = "LOCAL";
  const METRIC_LABELS = Object.freeze({
    pts: "PTS:",
    dst: "DST:",
    rtg: "RTG:",
    eta: "ETA:"
  });

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

  function canOpenEditRoute(args) {
    const cfg = args || {};
    const htmlUtils = cfg.htmlUtils;
    if (!htmlUtils) {
      return false;
    }

    const props = toObject(cfg.props);
    if (htmlUtils.isEditingMode(props)) {
      return false;
    }

    const hostContext = cfg.hostContext && typeof cfg.hostContext === "object" ? cfg.hostContext : null;
    const hostActions = hostContext && hostContext.hostActions ? hostContext.hostActions : null;
    if (!hostActions || typeof hostActions.getCapabilities !== "function") {
      return false;
    }
    if (!hostActions.routeEditor || typeof hostActions.routeEditor.openEditRoute !== "function") {
      return false;
    }

    const capabilities = hostActions.getCapabilities();
    return !!(
      capabilities &&
      capabilities.routeEditor &&
      capabilities.routeEditor.openEditRoute === "dispatch"
    );
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
      m.nameText ? String(m.nameText).length : 0
    ];

    for (let i = 0; i < m.visibleMetricIds.length; i += 1) {
      const id = m.visibleMetricIds[i];
      const metric = m.metrics && m.metrics[id] ? m.metrics[id] : {};
      parts.push(metric.labelText ? String(metric.labelText).length : 0);
      parts.push(metric.valueText ? String(metric.valueText).length : 0);
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

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layoutConfig = toObject(props.layout);
      const shellSize = toShellSize(cfg.shellRect);
      const hasRoute = domain.hasRoute === true;
      const isActiveRoute = hasRoute && domain.isActiveRoute === true;
      const isLocalRoute = hasRoute && domain.isLocalRoute === true;
      const isServerRoute = hasRoute && domain.isServerRoute === true;
      const defaultText = resolveDefaultText(props);
      const nameText = hasRoute
        ? htmlUtils.trimText(domain.routeName)
        : NO_ROUTE_TEXT;

      const layout = layoutApi.computeLayout({
        W: shellSize.width,
        H: shellSize.height,
        hasRoute: hasRoute,
        isLocalRoute: isLocalRoute,
        ratioThresholdNormal: layoutConfig.ratioThresholdNormal,
        ratioThresholdFlat: layoutConfig.ratioThresholdFlat,
        isVerticalCommitted: cfg.isVerticalCommitted === true
      });

      const metrics = Object.create(null);
      if (hasRoute) {
        metrics.pts = {
          id: "pts",
          labelText: METRIC_LABELS.pts,
          valueText: formatMetric(domain.pointCount, "formatDecimal", [3], defaultText, Helpers)
        };
        metrics.dst = {
          id: "dst",
          labelText: METRIC_LABELS.dst,
          valueText: formatMetric(domain.totalDistance, "formatDistance", [], defaultText, Helpers)
        };
        metrics.rtg = {
          id: "rtg",
          labelText: METRIC_LABELS.rtg,
          valueText: formatMetric(isActiveRoute ? domain.remainingDistance : undefined, "formatDistance", [], defaultText, Helpers)
        };
        metrics.eta = {
          id: "eta",
          labelText: METRIC_LABELS.eta,
          valueText: formatMetric(isActiveRoute ? domain.eta : undefined, "formatTime", [], defaultText, Helpers)
        };
      }

      const visibleMetricIds = METRIC_IDS.filter(function (id) {
        return !!(layout.metricVisibility && layout.metricVisibility[id]);
      });
      const dispatch = canOpenEditRoute({
        props: props,
        hostContext: cfg.hostContext,
        htmlUtils: htmlUtils
      });
      const wrapperStyle = layout.verticalShell && typeof layout.verticalShell.wrapperStyle === "string"
        ? layout.verticalShell.wrapperStyle
        : "";

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
        return canOpenEditRoute({
          props: args && args.props,
          hostContext: args && args.hostContext,
          htmlUtils: htmlUtils
        });
      }
    };
  }

  return { id: "EditRouteRenderModel", create: create };
}));
