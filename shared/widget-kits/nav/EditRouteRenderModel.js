/**
 * Module: EditRouteRenderModel - Pure normalization and display model owner for edit-route HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: EditRouteLayout, HtmlWidgetUtils, NavInteractionPolicy, PlaceholderNormalize, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenInteraction, UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteRenderModel = factory(); }
}(this, function () {
  "use strict";

  const METRIC_IDS = ["pts", "dst", "rte", "eta"];
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

  function formatMetric(value, formatter, formatterParameters, defaultText, Helpers, placeholderNormalize) {
    const text = String(callFormatter(value, formatter, formatterParameters, defaultText, Helpers));
    return placeholderNormalize.normalize(text, defaultText);
  }

  function buildResizeSignatureParts(model) {
    const m = model || {};
    const parts = [
      m.kind || "data",
      m.mode || "normal",
      m.interactionState || "passive",
      m.isActiveRoute ? 1 : 0,
      m.isLocalRoute ? 1 : 0,
      m.isServerRoute ? 1 : 0,
      m.isVerticalCommitted ? 1 : 0,
      "S" + toSignatureToken(m.stateLabel)
    ];

    if (m.kind !== "data") {
      if (m.isVerticalCommitted) {
        parts.push(Math.max(1, Math.round(toFiniteNumber(m.shellWidth) || 1)));
        parts.push(Math.max(1, Math.round(toFiniteNumber(m.effectiveLayoutHeight) || 1)));
      } else {
        parts.push(Math.max(1, Math.round(toFiniteNumber(m.shellWidth) || 1)));
        parts.push(Math.max(1, Math.round(toFiniteNumber(m.shellHeight) || 1)));
      }
      return parts;
    }

    parts.push("N" + toSignatureToken(m.nameText));

    for (let i = 0; i < m.visibleMetricIds.length; i += 1) {
      const id = m.visibleMetricIds[i];
      const metric = m.metrics && m.metrics[id] ? m.metrics[id] : {};
      parts.push("L" + toSignatureToken(metric.labelText));
      parts.push("V" + toSignatureToken(metric.valueText));
      parts.push("F" + toSignatureToken(metric.fallbackValueText));
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
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
    const unitFormatter = Helpers.getModule("UnitAwareFormatter").create(def, Helpers);
    const stateScreenLabels = Helpers.getModule("StateScreenLabels").create(def, Helpers);
    const stateScreenPrecedence = Helpers.getModule("StateScreenPrecedence").create(def, Helpers);
    const stateScreenInteraction = Helpers.getModule("StateScreenInteraction").create(def, Helpers);

    function resolveStateKind(props, domain) {
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: props.disconnect === true },
        { kind: "noRoute", when: domain.hasRoute !== true },
        { kind: "data", when: true }
      ]);
    }

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layoutConfig = toObject(props.layout);
      const captionsConfig = toObject(props.captions);
      const unitsConfig = toObject(props.units);
      const formatTokens = toObject(props.formatUnits);
      const shellSize = toShellSize(cfg.shellRect);
      const kind = resolveStateKind(props, domain);
      const hasRoute = kind === "data" && domain.hasRoute === true;
      const stableDigitsEnabled = props.stableDigits === true;
      function buildMetricValueText(rawText, minWidth) {
        if (!stableDigitsEnabled) {
          return {
            valueText: rawText,
            fallbackValueText: rawText
          };
        }
        const stable = stableDigits.normalize(rawText, {
          integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
          reserveSignSlot: true
        });
        return {
          valueText: stable.padded,
          fallbackValueText: stable.fallback
        };
      }

      const isActiveRoute = hasRoute && domain.isActiveRoute === true;
      const isLocalRoute = hasRoute && domain.isLocalRoute === true;
      const isServerRoute = hasRoute && domain.isServerRoute === true;
      const defaultText = resolveDefaultText(props);
      const etaFormatter = domain.hideSeconds === true ? "formatClock" : "formatTime";
      const nameText = hasRoute
        ? htmlUtils.trimText(domain.routeName)
        : "";
      const stateLabel = kind === "data" ? "" : (stateScreenLabels.LABELS[kind] || "");
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
          ...buildMetricValueText(
            formatMetric(domain.pointCount, "formatDecimal", [3], defaultText, Helpers, placeholderNormalize),
            3
          ),
          unitText: "",
          hasUnit: false
        };
        metrics.dst = {
          id: "dst",
          labelText: metricCaptions.dst,
          ...buildMetricValueText(
            unitFormatter.formatDistance(domain.totalDistance, formatTokens.dst, defaultText),
            2
          ),
          unitText: metricUnits.dst,
          hasUnit: metricHasUnit.dst
        };
        metrics.rte = {
          id: "rte",
          labelText: metricCaptions.rte,
          ...buildMetricValueText(
            unitFormatter.formatDistance(isActiveRoute ? domain.remainingDistance : undefined, formatTokens.rte, defaultText),
            2
          ),
          unitText: metricUnits.rte,
          hasUnit: metricHasUnit.rte
        };
        metrics.eta = {
          id: "eta",
          labelText: metricCaptions.eta,
          ...buildMetricValueText(
            formatMetric(
              isActiveRoute ? domain.eta : undefined,
              etaFormatter,
              [],
              defaultText,
              Helpers,
              placeholderNormalize
            ),
            2
          ),
          unitText: "",
          hasUnit: false
        };
      }

      const visibleMetricIds = METRIC_IDS.filter(function (id) {
        return !!(layout.metricVisibility && layout.metricVisibility[id]);
      });
      const baseInteraction = navInteractionPolicy.canDispatchWhenNotEditing(props) ? "dispatch" : "passive";
      const interactionState = stateScreenInteraction.resolveInteraction({
        kind: kind,
        baseInteraction: baseInteraction
      });
      const canOpenEditRoute = interactionState === "dispatch";
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
        kind: kind,
        stateLabel: stateLabel,
        mode: layout.mode,
        hasRoute: hasRoute,
        isActiveRoute: isActiveRoute,
        isLocalRoute: isLocalRoute,
        isServerRoute: isServerRoute,
        stableDigitsEnabled: stableDigitsEnabled,
        interactionState: interactionState,
        canOpenEditRoute: canOpenEditRoute,
        captureClicks: canOpenEditRoute,
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
        const cfg = args || {};
        const props = toObject(cfg.props);
        const domain = toObject(props.domain);
        const kind = resolveStateKind(props, domain);
        const baseInteraction = navInteractionPolicy.canDispatchWhenNotEditing(props) ? "dispatch" : "passive";
        return stateScreenInteraction.resolveInteraction({
          kind: kind,
          baseInteraction: baseInteraction
        }) === "dispatch";
      }
    };
  }

  return { id: "EditRouteRenderModel", create: create };
}));
