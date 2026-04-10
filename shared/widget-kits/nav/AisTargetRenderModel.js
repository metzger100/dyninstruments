/**
 * Module: AisTargetRenderModel - Pure normalization and display-model owner for AIS target HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: AisTargetLayout, HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetRenderModel = factory(); }
}(this, function () {
  "use strict";

  const PLACEHOLDER_TEXT = "No AIS";
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

  function formatWithFormatter(args, Helpers) {
    const cfg = args || {};
    const options = {
      formatter: cfg.formatter,
      formatterParameters: cfg.formatterParameters
    };
    if (typeof cfg.defaultText !== "undefined") {
      options.default = cfg.defaultText;
    }
    return String(Helpers.applyFormatter(cfg.value, options));
  }

  function resolveRenderState(args) {
    const cfg = args || {};
    const domain = toObject(cfg.domain);
    if (domain.hasTargetIdentity === true) {
      return "data";
    }

    if (cfg.isEditingMode === true) {
      return "placeholder";
    }

    if (cfg.pageId === "gpspage") {
      return "placeholder";
    }

    return "hidden";
  }

  function resolveInteractionState(args) {
    const cfg = args || {};
    if (cfg.isEditingMode === true) {
      return "passive";
    }
    if (cfg.renderState !== "data") {
      return "passive";
    }

    const domain = toObject(cfg.domain);
    const canDispatch = !!(
      domain.hasDispatchMmsi === true &&
      cfg.surfaceInteractionMode === "dispatch"
    );

    return canDispatch ? "dispatch" : "passive";
  }

  function buildResizeSignatureParts(model) {
    const m = model || {};
    const parts = [
      m.mode || "normal",
      m.renderState || "hidden",
      m.showTcpaBranch ? "tcpa" : "brg",
      m.interactionState || "passive",
      m.isVerticalCommitted === true ? 1 : 0,
      Math.max(1, Math.round(Number(m.shellWidth) || 1))
    ];

    if (m.isVerticalCommitted === true) {
      parts.push(Math.max(1, Math.round(Number(m.effectiveLayoutHeight) || 1)));
    } else {
      parts.push(Math.max(1, Math.round(Number(m.shellHeight) || 1)));
    }

    if (m.renderState === "placeholder") {
      parts.push("P" + toSignatureLength(m.placeholderText));
      return parts;
    }

    if (m.renderState !== "data") {
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
      const renderState = resolveRenderState({
        domain: domain,
        pageId: surfacePolicy && typeof surfacePolicy.pageId === "string" ? surfacePolicy.pageId : "other",
        isEditingMode: isEditingMode
      });
      const interactionState = resolveInteractionState({
        domain: domain,
        renderState: renderState,
        surfaceInteractionMode: surfacePolicy && surfacePolicy.interaction
          ? surfacePolicy.interaction.mode
          : "passive",
        isEditingMode: isEditingMode
      });

      const showTcpaBranch = domain.showTcpaBranch === true;
      const hasData = renderState === "data";
      const colorRole = (hasData && domain.hasColorRole === true)
        ? normalizeText(domain.colorRole)
        : "";
      const hasAccent = colorRole === "warning" || colorRole === "nearest" || colorRole === "tracking" || colorRole === "normal";
      const layout = layoutApi.computeLayout({
        W: shellSize.width,
        H: shellSize.height,
        mode: cfg.mode,
        renderState: renderState,
        showTcpaBranch: showTcpaBranch,
        hasAccent: hasAccent,
        ratioThresholdNormal: layoutConfig.ratioThresholdNormal,
        ratioThresholdFlat: layoutConfig.ratioThresholdFlat,
        isVerticalCommitted: cfg.isVerticalCommitted === true,
        effectiveLayoutHeight: cfg.effectiveLayoutHeight
      });

      const distance = htmlUtils.toFiniteNumber(domain.distance);
      const cpa = htmlUtils.toFiniteNumber(domain.cpa);
      const tcpaSeconds = htmlUtils.toFiniteNumber(domain.tcpa);
      const headingTo = htmlUtils.toFiniteNumber(domain.headingTo);

      const metrics = {
        dst: {
          id: "dst",
          captionText: normalizeText(captions.dst),
          unitText: normalizeText(units.dst),
          valueText: formatWithFormatter({
            value: distance,
            formatter: "formatDistance",
            formatterParameters: [units.dst],
            defaultText: defaultText
          }, Helpers)
        },
        cpa: {
          id: "cpa",
          captionText: normalizeText(captions.cpa),
          unitText: normalizeText(units.cpa),
          valueText: formatWithFormatter({
            value: cpa,
            formatter: "formatDistance",
            formatterParameters: [units.cpa],
            defaultText: defaultText
          }, Helpers)
        },
        tcpa: {
          id: "tcpa",
          captionText: normalizeText(captions.tcpa),
          unitText: normalizeText(units.tcpa),
          valueText: formatWithFormatter({
            value: typeof tcpaSeconds === "number" ? (tcpaSeconds / 60) : undefined,
            formatter: "formatDecimal",
            formatterParameters: [3, (typeof tcpaSeconds === "number" && Math.abs(tcpaSeconds) > 60) ? 0 : 2],
            defaultText: defaultText
          }, Helpers)
        },
        brg: {
          id: "brg",
          captionText: normalizeText(captions.brg),
          unitText: normalizeText(units.brg),
          valueText: formatWithFormatter({
            value: headingTo,
            formatter: "formatDirection",
            formatterParameters: [],
            defaultText: defaultText
          }, Helpers)
        }
      };

      const metricVisibility = hasData
        ? DATA_METRIC_VISIBILITY
        : { dst: false, cpa: false, tcpa: false, brg: false };
      const visibleMetricIds = hasData ? METRIC_ORDER.slice() : [];

      const wrapperClasses = [
        "dyni-ais-target-html",
        "dyni-ais-target-mode-" + layout.mode,
        "dyni-ais-target-" + renderState,
        "dyni-ais-target-open-" + interactionState,
        "dyni-ais-target-branch-" + (showTcpaBranch ? "tcpa" : "brg")
      ];

      if (hasAccent) {
        wrapperClasses.push("dyni-ais-target-color-" + colorRole);
      }
      if (layout.isVerticalCommitted) {
        wrapperClasses.push("dyni-ais-target-vertical");
      }

      const model = {
        mode: layout.mode,
        renderState: renderState,
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
        dispatchMmsi: normalizeText(domain.mmsiNormalized),
        nameText: normalizeText(domain.nameOrMmsi),
        frontText: normalizeText(domain.frontText),
        placeholderText: PLACEHOLDER_TEXT,
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
      buildResizeSignatureParts: buildResizeSignatureParts,
      resolveRenderState: function (args) {
        const cfg = args || {};
        return resolveRenderState({
          domain: cfg.domain,
          pageId: cfg.pageId,
          isEditingMode: cfg.isEditingMode === true
        });
      },
      resolveInteractionState: function (args) {
        const cfg = args || {};
        return resolveInteractionState({
          domain: cfg.domain,
          renderState: cfg.renderState,
          surfaceInteractionMode: cfg.surfaceInteractionMode,
          isEditingMode: cfg.isEditingMode === true
        });
      }
    };
  }

  return { id: "AisTargetRenderModel", create: create };
}));
