/**
 * Module: AisTargetRenderModel - Pure normalization and display-model owner for AIS target HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: AisTargetLayout, HtmlWidgetUtils, PlaceholderNormalize, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenInteraction
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetRenderModel = factory(); }
}(this, function () {
  "use strict";

  const METRIC_ORDER = ["dst", "cpa", "tcpa", "brg"];
  const DATA_METRIC_VISIBILITY = { dst: true, cpa: true, tcpa: true, brg: true };

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toSafeSizeRect(shellRect, htmlUtils) {
    const rect = shellRect && typeof shellRect === "object" ? shellRect : null;
    return {
      width: Math.max(1, Math.round(htmlUtils.toFiniteNumber(rect && rect.width) || 1)),
      height: Math.max(1, Math.round(htmlUtils.toFiniteNumber(rect && rect.height) || 1))
    };
  }

  function resolveDefaultText(props) {
    if (Object.prototype.hasOwnProperty.call(props, "default")) {
      return String(props.default);
    }
    return undefined;
  }

  function toSignatureLength(value) {
    if (value == null) {
      return 0;
    }
    return String(value).length;
  }

  function toSignatureText(value) {
    return value == null ? "" : String(value);
  }

  function normalizeText(value) {
    return value == null ? "" : String(value);
  }

  function formatWithFormatter(args, Helpers, placeholderNormalize) {
    const cfg = args || {};
    const options = {
      formatter: cfg.formatter,
      formatterParameters: cfg.formatterParameters
    };
    if (typeof cfg.defaultText !== "undefined") {
      options.default = cfg.defaultText;
    }
    const text = String(Helpers.applyFormatter(cfg.value, options));
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
      },
      { kind: "disconnected", when: cfg.disconnect === true },
      { kind: "noAis", when: domain.hasTargetIdentity === false },
      { kind: "data", when: true }
    ]);
  }

  function resolveInteractionState(args, stateScreenInteraction) {
    const cfg = args || {};
    const baseInteraction = cfg.isEditingMode === true
      ? "passive"
      : (cfg.canDispatch ? "dispatch" : "passive");
    return stateScreenInteraction.resolveInteraction({
      kind: cfg.kind,
      baseInteraction: baseInteraction
    });
  }

  function buildResizeSignatureParts(model) {
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
      parts.push("S" + toSignatureLength(m.stateLabel));
      return parts;
    }

    parts.push("N:" + toSignatureText(m.nameText));
    parts.push("R:" + toSignatureText(m.frontText));

    const metricIds = Array.isArray(m.visibleMetricIds) ? m.visibleMetricIds : METRIC_ORDER;
    const metrics = toObject(m.metrics);
    for (let i = 0; i < metricIds.length; i += 1) {
      const metric = toObject(metrics[metricIds[i]]);
      parts.push("C:" + toSignatureText(metric.captionText));
      parts.push("V:" + toSignatureText(metric.valueText));
      parts.push("U:" + toSignatureText(metric.unitText));
    }

    return parts;
  }

  function create(def, Helpers) {
    const layoutApi = Helpers.getModule("AisTargetLayout").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
    const stateScreenLabels = Helpers.getModule("StateScreenLabels").create(def, Helpers);
    const stateScreenPrecedence = Helpers.getModule("StateScreenPrecedence").create(def, Helpers);
    const stateScreenInteraction = Helpers.getModule("StateScreenInteraction").create(def, Helpers);

    function normalizeStableMetricValue(rawText, minWidth, stableDigitsEnabled) {
      if (stableDigitsEnabled !== true) {
        return {
          valueText: rawText,
          fallbackValueText: rawText
        };
      }
      const stable = stableDigits.normalize(rawText, {
        integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
        reserveSignSlot: false
      });
      return {
        valueText: stable.padded,
        fallbackValueText: stable.fallback
      };
    }

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layoutConfig = toObject(props.layout);
      const captions = toObject(props.captions);
      const units = toObject(props.units);
      const shellSize = toSafeSizeRect(cfg.shellRect, htmlUtils);
      const defaultText = resolveDefaultText(props);
      const isEditingMode = htmlUtils.isEditingMode(props);
      const surfacePolicy = props.surfacePolicy && typeof props.surfacePolicy === "object"
        ? props.surfacePolicy
        : null;
      const kind = resolveStateKind({
        domain: domain,
        pageId: surfacePolicy && typeof surfacePolicy.pageId === "string" ? surfacePolicy.pageId : "other",
        isEditingMode: isEditingMode,
        disconnect: props.disconnect === true
      }, stateScreenPrecedence);
      const stableDigitsEnabled = props.stableDigits === true;
      const canDispatch = !!(
        domain.hasDispatchMmsi === true &&
        surfacePolicy && surfacePolicy.interaction && surfacePolicy.interaction.mode === "dispatch"
      );
      const interactionState = resolveInteractionState({
        kind: kind,
        canDispatch: canDispatch,
        isEditingMode: isEditingMode
      }, stateScreenInteraction);

      const showTcpaBranch = kind === "data" && domain.showTcpaBranch === true;
      const hasData = kind === "data";
      const colorRole = (hasData && domain.hasColorRole === true)
        ? normalizeText(domain.colorRole)
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
      const distance = hasData ? htmlUtils.toFiniteNumber(domain.distance) : undefined;
      const cpa = hasData ? htmlUtils.toFiniteNumber(domain.cpa) : undefined;
      const tcpaSeconds = hasData ? htmlUtils.toFiniteNumber(domain.tcpa) : undefined;
      const headingTo = hasData ? htmlUtils.toFiniteNumber(domain.headingTo) : undefined;

      const metrics = {
        dst: {
          id: "dst",
          captionText: normalizeText(captions.dst),
          unitText: normalizeText(units.dst),
          ...normalizeStableMetricValue(formatWithFormatter({
            value: distance,
            formatter: "formatDistance",
            formatterParameters: [units.dst],
            defaultText: defaultText
          }, Helpers, placeholderNormalize), 2, stableDigitsEnabled)
        },
        cpa: {
          id: "cpa",
          captionText: normalizeText(captions.cpa),
          unitText: normalizeText(units.cpa),
          ...normalizeStableMetricValue(formatWithFormatter({
            value: cpa,
            formatter: "formatDistance",
            formatterParameters: [units.cpa],
            defaultText: defaultText
          }, Helpers, placeholderNormalize), 2, stableDigitsEnabled)
        },
        tcpa: {
          id: "tcpa",
          captionText: normalizeText(captions.tcpa),
          unitText: normalizeText(units.tcpa),
          ...normalizeStableMetricValue(formatWithFormatter({
            value: typeof tcpaSeconds === "number" ? (tcpaSeconds / 60) : undefined,
            formatter: "formatDecimal",
            formatterParameters: [3, (typeof tcpaSeconds === "number" && Math.abs(tcpaSeconds) > 60) ? 0 : 2],
            defaultText: defaultText
          }, Helpers, placeholderNormalize), 2, stableDigitsEnabled)
        },
        brg: {
          id: "brg",
          captionText: normalizeText(captions.brg),
          unitText: normalizeText(units.brg),
          ...normalizeStableMetricValue(formatWithFormatter({
            value: headingTo,
            formatter: "formatDirection",
            formatterParameters: [],
            defaultText: defaultText
          }, Helpers, placeholderNormalize), 3, stableDigitsEnabled)
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
        dispatchMmsi: normalizeText(domain.mmsiNormalized),
        nameText: normalizeText(domain.nameOrMmsi),
        frontText: normalizeText(domain.frontText),
        metrics: metrics,
        metricVisibility: metricVisibility,
        visibleMetricIds: visibleMetricIds,
        colorRole: colorRole,
        hasAccent: hasAccent,
        wrapperClasses: wrapperClasses
      };

      model.resizeSignatureParts = buildResizeSignatureParts(model);
      return model;
    }

    return {
      id: "AisTargetRenderModel",
      buildModel: buildModel,
      buildResizeSignatureParts: buildResizeSignatureParts
    };
  }

  return { id: "AisTargetRenderModel", create: create };
}));
