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

  function resolveCapabilities(hostContext) {
    if (!hostContext || typeof hostContext !== "object" || !hostContext.hostActions) {
      return null;
    }
    const getCapabilities = hostContext.hostActions.getCapabilities;
    if (typeof getCapabilities !== "function") {
      return null;
    }

    const capabilities = getCapabilities.call(hostContext.hostActions);
    if (!capabilities || typeof capabilities !== "object") {
      return null;
    }
    return capabilities;
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

    const capabilities = cfg.capabilities;
    if (capabilities && capabilities.pageId === "gpspage") {
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
    const capabilities = cfg.capabilities;
    const canDispatch = !!(
      domain.hasDispatchMmsi === true &&
      capabilities &&
      capabilities.ais &&
      capabilities.ais.showInfo === "dispatch"
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

    if (m.mode === "flat") {
      parts.push("FR" + Math.max(1, Math.floor(Number(m.flatMetricRows) || 1)));
      parts.push("FC" + Math.max(1, Math.floor(Number(m.flatMetricColumns) || 1)));
    }

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
      const capabilities = resolveCapabilities(cfg.hostContext);
      const renderState = resolveRenderState({
        domain: domain,
        capabilities: capabilities,
        isEditingMode: isEditingMode
      });
      const interactionState = resolveInteractionState({
        domain: domain,
        renderState: renderState,
        capabilities: capabilities,
        isEditingMode: isEditingMode
      });

      const showTcpaBranch = domain.showTcpaBranch === true;
      const layout = layoutApi.computeLayout({
        W: shellSize.width,
        H: shellSize.height,
        mode: cfg.mode,
        renderState: renderState,
        showTcpaBranch: showTcpaBranch,
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

      const hasData = renderState === "data";
      const metricVisibility = hasData
        ? layout.metricVisibility
        : { dst: false, cpa: false, tcpa: false, brg: false };
      const visibleMetricIds = hasData
        ? (Array.isArray(layout.metricOrder) && layout.metricOrder.length ? layout.metricOrder.slice() : METRIC_ORDER.slice())
        : [];
      const colorRole = (hasData && domain.hasColorRole === true)
        ? normalizeText(domain.colorRole)
        : "";
      const hasAccent = colorRole === "warning" || colorRole === "nearest" || colorRole === "tracking" || colorRole === "normal";

      const wrapperClasses = [
        "dyni-ais-target-html",
        "dyni-ais-target-mode-" + layout.mode,
        "dyni-ais-target-" + renderState,
        "dyni-ais-target-open-" + interactionState,
        "dyni-ais-target-branch-" + (showTcpaBranch ? "tcpa" : "brg")
      ];

      if (layout.mode === "flat") {
        wrapperClasses.push("dyni-ais-target-flat-rows-" + (layout.flatMetricRows === 2 ? "2" : "1"));
      }
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
        layout: layout,
        captureClicks: interactionState === "dispatch",
        showHotspot: interactionState === "dispatch",
        dispatchMmsi: normalizeText(domain.mmsiNormalized),
        nameText: normalizeText(domain.nameOrMmsi),
        frontText: normalizeText(domain.frontText),
        frontInitialText: normalizeText(domain.frontInitial),
        placeholderText: PLACEHOLDER_TEXT,
        metrics: metrics,
        metricVisibility: metricVisibility,
        visibleMetricIds: visibleMetricIds,
        flatMetricRows: layout.flatMetricRows,
        flatMetricColumns: layout.flatMetricColumns,
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
          capabilities: cfg.capabilities,
          isEditingMode: cfg.isEditingMode === true
        });
      },
      resolveInteractionState: function (args) {
        const cfg = args || {};
        return resolveInteractionState({
          domain: cfg.domain,
          renderState: cfg.renderState,
          capabilities: cfg.capabilities,
          isEditingMode: cfg.isEditingMode === true
        });
      }
    };
  }

  return { id: "AisTargetRenderModel", create: create };
}));
