/**
 * Module: AisTargetRenderModel - Pure normalization and display-model owner for AIS target HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: AisTargetLayout, HtmlWidgetUtils, ValueMath, PlaceholderNormalize, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenInteraction, UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetRenderModel = factory(); }
}(this, function () {
  "use strict";

  const METRIC_ORDER = ["dst", "cpa", "tcpa", "brg"];
  const DATA_METRIC_VISIBILITY = { dst: true, cpa: true, tcpa: true, brg: true };

  let toObject;
  let toText;
  let textLength;

  function toSafeSizeRect(shellRect, htmlUtils) {
    const rect = shellRect && typeof shellRect === "object" ? shellRect : null;
    return {
      width: Math.max(1, Math.round(htmlUtils.toFiniteNumber(rect && rect.width) || 1)),
      height: Math.max(1, Math.round(htmlUtils.toFiniteNumber(rect && rect.height) || 1))
    };
  }

  function formatWithFormatter(args, componentContext, placeholderNormalize) {
    const cfg = args || {};
    const options = {
      formatter: cfg.formatter,
      formatterParameters: cfg.formatterParameters
    };
    if (typeof cfg.defaultText !== "undefined") {
      options.default = cfg.defaultText;
    }
    const text = String(componentContext.format.applyFormatter(cfg.value, options));
    return placeholderNormalize.normalize(text, cfg.defaultText);
  }

  function resolveStateKind(args, stateScreenPrecedence) {
    const cfg = args || {};
    const domain = toObject(cfg.domain);
    return stateScreenPrecedence.pickFirst([
      {
        kind: "hidden",
        when: domain.hasTargetIdentity === false
          && cfg.isEditingMode !== true
          && cfg.pageId !== "gpspage"
          && cfg.isVerticalContainer !== true
      },
      { kind: "disconnected", when: cfg.disconnect === true },
      { kind: "noAis", when: domain.hasTargetIdentity === false },
      { kind: "data", when: true }
    ]);
  }

  function resolveAisInteractionState(args, stateScreenInteraction) {
    const cfg = args || {};
    const baseInteraction = cfg.isEditingMode === true
      ? "passive"
      : (cfg.canDispatch ? "dispatch" : "passive");
    return stateScreenInteraction.resolveInteraction({
      kind: cfg.kind,
      baseInteraction: baseInteraction
    });
  }

  function buildAisTargetSignatureParts(model) {
    const m = model || {};
    const parts = [
      m.mode || "normal",
      m.kind || "hidden",
      m.showTcpaBranch ? "tcpa" : "brg",
      m.interactionState || "passive",
      m.stableDigitsEnabled === true ? 1 : 0,
      m.isVerticalCommitted === true ? 1 : 0,
      Math.max(1, Math.round(Number(m.shellWidth) || 1))
    ];

    if (m.isVerticalCommitted === true) {
      parts.push(Math.max(1, Math.round(Number(m.effectiveLayoutHeight) || 1)));
    } else {
      parts.push(Math.max(1, Math.round(Number(m.shellHeight) || 1)));
    }

    if (m.kind !== "data") {
      parts.push("S" + textLength(m.stateLabel));
      return parts;
    }

    parts.push("N:" + toText(m.nameText));
    parts.push("R:" + toText(m.frontText));

    const metricIds = Array.isArray(m.visibleMetricIds) ? m.visibleMetricIds : METRIC_ORDER;
    const metrics = toObject(m.metrics);
    for (let i = 0; i < metricIds.length; i += 1) {
      const metric = toObject(metrics[metricIds[i]]);
      parts.push("C:" + toText(metric.captionText));
      parts.push("V:" + toText(metric.valueText));
      parts.push("U:" + toText(metric.unitText));
    }

    return parts;
  }

  function create(def, componentContext) {
    const layoutApi = componentContext.components.require("AisTargetLayout");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenInteraction = componentContext.components.require("StateScreenInteraction");
    const valueMath = componentContext.components.require("ValueMath");
    toObject = valueMath.toObject;
    toText = valueMath.toText;
    textLength = valueMath.textLength;
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    function normalizeStableMetricValue(rawText, minWidth, stableDigitsEnabled) {
      if (stableDigitsEnabled !== true) {
        return {
          valueText: rawText,
          plainValueText: rawText
        };
      }
      const stable = stableDigits.normalize(rawText, {
        integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
        reserveSignSlot: false
      });
      return {
        valueText: stable.padded,
        plainValueText: stable.plain
      };
    }

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layoutConfig = toObject(props.layout);
      const captions = toObject(props.captions);
      const units = toObject(props.units);
      const formatTokens = toObject(props.formatUnits);
      const shellSize = toSafeSizeRect(cfg.shellRect, htmlUtils);
      const defaultText = htmlUtils.resolveDefaultText(props);
      const isEditingMode = htmlUtils.isEditingMode(props);
      const surfacePolicy = props.surfacePolicy && typeof props.surfacePolicy === "object"
        ? props.surfacePolicy
        : null;
      const kind = resolveStateKind({
        domain: domain,
        pageId: surfacePolicy && typeof surfacePolicy.pageId === "string" ? surfacePolicy.pageId : "other",
        isVerticalContainer: surfacePolicy && surfacePolicy.containerOrientation === "vertical",
        isEditingMode: isEditingMode,
        disconnect: props.disconnect === true
      }, stateScreenPrecedence);
      const stableDigitsEnabled = props.stableDigits === true;
      const canDispatch = domain.hasDispatchMmsi === true && htmlUtils.canDispatchSurfaceInteraction(props);
      const interactionState = resolveAisInteractionState({
        kind: kind,
        canDispatch: canDispatch,
        isEditingMode: isEditingMode
      }, stateScreenInteraction);

      const showTcpaBranch = kind === "data" && domain.showTcpaBranch === true;
      const hasData = kind === "data";
      const colorRole = (hasData && domain.hasColorRole === true)
        ? toText(domain.colorRole)
        : "";
      const hasAccent = colorRole === "warning" || colorRole === "nearest" || colorRole === "tracking" || colorRole === "normal";
      const layout = layoutApi.computeLayout({
        W: shellSize.width,
        H: shellSize.height,
        mode: cfg.mode,
        renderState: hasData ? "data" : "placeholder",
        showTcpaBranch: showTcpaBranch,
        hasAccent: hasAccent,
        ratioThresholdNormal: layoutConfig.ratioThresholdNormal,
        ratioThresholdFlat: layoutConfig.ratioThresholdFlat,
        isVerticalCommitted: cfg.isVerticalCommitted === true,
        effectiveLayoutHeight: cfg.effectiveLayoutHeight
      });
      const distance = hasData ? toOptionalFiniteNumber(domain.distance) : undefined;
      const cpa = hasData ? toOptionalFiniteNumber(domain.cpa) : undefined;
      const tcpaSeconds = hasData ? toOptionalFiniteNumber(domain.tcpa) : undefined;
      const headingTo = hasData ? toOptionalFiniteNumber(domain.headingTo) : undefined;

      const metrics = {
        dst: {
          id: "dst",
          captionText: toText(captions.dst),
          unitText: toText(units.dst),
          ...normalizeStableMetricValue(
            unitFormatter.formatDistance(distance, formatTokens.dst, defaultText),
            2,
            stableDigitsEnabled
          )
        },
        cpa: {
          id: "cpa",
          captionText: toText(captions.cpa),
          unitText: toText(units.cpa),
          ...normalizeStableMetricValue(
            unitFormatter.formatDistance(cpa, formatTokens.cpa, defaultText),
            2,
            stableDigitsEnabled
          )
        },
        tcpa: {
          id: "tcpa",
          captionText: toText(captions.tcpa),
          unitText: toText(units.tcpa),
          ...normalizeStableMetricValue(formatWithFormatter({
            value: typeof tcpaSeconds === "number" ? (tcpaSeconds / 60) : undefined,
            formatter: "formatDecimal",
            formatterParameters: [3, (typeof tcpaSeconds === "number" && Math.abs(tcpaSeconds) > 60) ? 0 : 2],
            defaultText: defaultText
          }, componentContext, placeholderNormalize), 2, stableDigitsEnabled)
        },
        brg: {
          id: "brg",
          captionText: toText(captions.brg),
          unitText: toText(units.brg),
          ...normalizeStableMetricValue(formatWithFormatter({
            value: headingTo,
            formatter: "formatDirection",
            formatterParameters: [],
            defaultText: defaultText
          }, componentContext, placeholderNormalize), 3, stableDigitsEnabled)
        }
      };

      const metricVisibility = hasData
        ? DATA_METRIC_VISIBILITY
        : { dst: false, cpa: false, tcpa: false, brg: false };
      const visibleMetricIds = hasData ? METRIC_ORDER.slice() : [];

      const wrapperClasses = [
        "dyni-ais-target-html",
        "dyni-ais-target-mode-" + layout.mode,
        "dyni-ais-target-open-" + interactionState,
        "dyni-ais-target-branch-" + (showTcpaBranch ? "tcpa" : "brg")
      ];
      if (hasData) {
        wrapperClasses.push("dyni-ais-target-data");
      }

      if (hasAccent) {
        wrapperClasses.push("dyni-ais-target-color-" + colorRole);
      }
      if (layout.isVerticalCommitted) {
        wrapperClasses.push("dyni-ais-target-vertical");
      }

      const model = {
        kind: kind,
        stateLabel: kind === "data" ? "" : (stateScreenLabels.LABELS[kind] || ""),
        mode: layout.mode,
        interactionState: interactionState,
        showTcpaBranch: showTcpaBranch,
        shellWidth: shellSize.width,
        shellHeight: shellSize.height,
        isVerticalCommitted: layout.isVerticalCommitted === true,
        effectiveLayoutHeight: layout.effectiveLayoutHeight,
        wrapperStyle: layout.wrapperStyle,
        inlineGeometry: layout.inlineGeometry || {},
        layout: layout,
        captureClicks: interactionState === "dispatch",
        showHotspot: interactionState === "dispatch",
        stableDigitsEnabled: stableDigitsEnabled,
        dispatchMmsi: toText(domain.mmsiNormalized),
        nameText: toText(domain.nameOrMmsi),
        frontText: toText(domain.frontText),
        metrics: metrics,
        metricVisibility: metricVisibility,
        visibleMetricIds: visibleMetricIds,
        colorRole: colorRole,
        hasAccent: hasAccent,
        wrapperClasses: wrapperClasses
      };

      model.resizeSignatureParts = buildAisTargetSignatureParts(model);
      return model;
    }

    return {
      id: "AisTargetRenderModel",
      buildModel: buildModel,
      buildResizeSignatureParts: buildAisTargetSignatureParts
    };
  }

  return { id: "AisTargetRenderModel", create: create };
}));
