/**
 * @file EditRouteRenderModel - Pure normalization and display model owner for edit-route HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteRenderModel = factory();
  }
}(this, function () {
  "use strict";

  /** @type {DyniEditRouteMetricId[]} */
  const METRIC_IDS = ["pts", "dst", "rte", "rteEta"];
  const SOURCE_BADGE_TEXT = "LOCAL";

  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;
  /** @type {DyniValueMathApi["toFiniteNumber"]} */
  let toFiniteNumber;
  /** @type {DyniValueMathApi["toText"]} */
  let toText;

  /**
   * @param {unknown} shellRect
   * @returns {DyniEditRouteShellSize}
   */
  function toShellSize(shellRect) {
    const rect = shellRect && typeof shellRect === "object"
      ? /** @type {Record<string, unknown>} */ (shellRect)
      : null;
    return {
      width: Math.max(1, Math.round(toFiniteNumber(rect && rect.width) || 1)),
      height: Math.max(1, Math.round(toFiniteNumber(rect && rect.height) || 1))
    };
  }

  /** @param {unknown} value @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function normalizeMetricLabel(value, htmlUtils) {
    const text = htmlUtils.trimText(value);
    return text ? text + ":" : "";
  }

  /** @param {unknown} value @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function normalizeMetricUnit(value, htmlUtils) {
    return htmlUtils.trimText(value);
  }

  /** @param {unknown} value @returns {string} */
  function toSignatureToken(value) {
    if (value == null) {
      return "";
    }
    return encodeURIComponent(String(value));
  }

  /**
   * @param {unknown} value
   * @param {unknown} formatter
   * @param {unknown} formatterParameters
   * @param {unknown} defaultText
   * @param {DyniComponentContext} componentContext
   * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
   * @returns {string}
   */
  function formatRouteMetric(value, formatter, formatterParameters, defaultText, componentContext, placeholderNormalize) {
    /** @type {Parameters<DyniFormatService["applyFormatter"]>[1]} */
    const opts = {
      formatter: formatter,
      formatterParameters: formatterParameters
    };
    if (typeof defaultText !== "undefined") {
      opts.default = defaultText;
    }
    const text = String(componentContext.format.applyFormatter(value, opts));
    return placeholderNormalize.normalize(text, defaultText);
  }

  /**
   * @param {Partial<DyniEditRouteRenderModel> | undefined} model
   * @returns {Array<string | number>}
   */
  function buildEditRouteSignatureParts(model) {
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

    const visibleMetricIds = m.visibleMetricIds || METRIC_IDS;
    for (let i = 0; i < visibleMetricIds.length; i += 1) {
      const id = visibleMetricIds[i];
      const metric = m.metrics && m.metrics[id] ? m.metrics[id] : {};
      parts.push("L" + toSignatureToken(metric.labelText));
      parts.push("V" + toSignatureToken(metric.valueText));
      parts.push("F" + toSignatureToken(metric.plainValueText));
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

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniEditRouteRenderModelApi}
   */
  function create(def, componentContext) {
    const layoutApi = componentContext.components.require("EditRouteLayout");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const navInteractionPolicy = componentContext.components.require("NavInteractionPolicy");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const valueMath = componentContext.components.require("ValueMath");
    toObject = valueMath.toObject;
    toFiniteNumber = valueMath.toFiniteNumber;
    toText = valueMath.toText;
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenInteraction = componentContext.components.require("StateScreenInteraction");

    /**
     * @param {Record<string, unknown>} props
     * @param {Record<string, unknown>} domain
     * @returns {string}
     */
    function resolveStateKind(props, domain) {
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: props.disconnect === true },
        { kind: "noRoute", when: domain.hasRoute !== true },
        { kind: "data", when: true }
      ]);
    }

    /**
     * @param {DyniEditRouteBuildModelArgs | undefined} args
     * @returns {DyniEditRouteRenderModel}
     */
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
      /**
       * @param {string} rawText
       * @param {number} minWidth
       * @returns {DyniEditRouteNormalizedMetricValue}
       */
      function buildMetricValueText(rawText, minWidth) {
        if (!stableDigitsEnabled) {
          return {
            valueText: rawText,
            plainValueText: rawText
          };
        }
        const stable = stableDigits.normalize(rawText, {
          integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
          reserveSignSlot: true
        });
        return {
          valueText: stable.padded,
          plainValueText: stable.plain
        };
      }

      const isActiveRoute = hasRoute && domain.isActiveRoute === true;
      const isLocalRoute = hasRoute && domain.isLocalRoute === true;
      const isServerRoute = hasRoute && domain.isServerRoute === true;
      const defaultText = htmlUtils.resolveDefaultText(props);
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
        rteEta: false
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
          rteEta: normalizeMetricLabel(captionsConfig.rteEta, htmlUtils)
        };

        metrics.pts = {
          id: "pts",
          labelText: metricCaptions.pts,
          ...buildMetricValueText(
            formatRouteMetric(domain.pointCount, "formatDecimal", [3], defaultText, componentContext, placeholderNormalize),
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
        metrics.rteEta = {
          id: "rteEta",
          labelText: metricCaptions.rteEta,
          ...buildMetricValueText(
            formatRouteMetric(
              isActiveRoute ? domain.rteEta : undefined,
              etaFormatter,
              [],
              defaultText,
              componentContext,
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
      const interactionState = toText(stateScreenInteraction.resolveInteraction({
        kind: kind,
        baseInteraction: baseInteraction
      }));
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

      /** @type {DyniEditRouteRenderModel} */
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
        effectiveLayoutHeight: layout.verticalShell && typeof layout.verticalShell.effectiveLayoutHeight === "number"
          ? layout.verticalShell.effectiveLayoutHeight
          : shellSize.height,
        layoutShellHeight: layout.verticalShell && typeof layout.verticalShell.effectiveLayoutHeight === "number"
          ? layout.verticalShell.effectiveLayoutHeight
          : shellSize.height,
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
        wrapperStyle: wrapperStyle,
        resizeSignatureParts: []
      };
      model.resizeSignatureParts = buildEditRouteSignatureParts(model);
      return model;
    }

    return {
      id: "EditRouteRenderModel",
      buildModel: buildModel,
      buildResizeSignatureParts: buildEditRouteSignatureParts,
      /**
       * @param {DyniEditRouteInteractionArgs | undefined} args
       * @returns {boolean}
       */
      canOpenEditRoute: function (args) {
        const cfg = args || {};
        const props = toObject(cfg.props);
        const domain = toObject(props.domain);
        const kind = resolveStateKind(props, domain);
        const baseInteraction = navInteractionPolicy.canDispatchWhenNotEditing(props) ? "dispatch" : "passive";
        return toText(stateScreenInteraction.resolveInteraction({
          kind: kind,
          baseInteraction: baseInteraction
        })) === "dispatch";
      }
    };
  }

  return { id: "EditRouteRenderModel", create: create };
}));
