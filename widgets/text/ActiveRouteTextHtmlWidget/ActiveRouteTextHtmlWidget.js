/**
 * Module: ActiveRouteTextHtmlWidget - Interactive HTML renderer for nav active-route kind
 * Documentation: documentation/widgets/active-route.md
 * Depends: ActiveRouteHtmlFit, HtmlWidgetUtils
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const OPEN_HANDLER_NAME = "activeRouteOpen";
  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.2;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.8;

  const formatMetric = function (rawValue, formatter, formatterParameters, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(rawValue, {
      formatter: formatter,
      formatterParameters: formatterParameters,
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  };

  const renderMetricTile = function (metricId, caption, value, unit, style, htmlUtils) {
    const valueStyle = style && typeof style.valueStyle === "string" ? style.valueStyle : "";
    const unitStyle = style && typeof style.unitStyle === "string" ? style.unitStyle : "";
    return ""
      + '<div class="dyni-active-route-metric dyni-active-route-metric-' + metricId + '">'
      + '<div class="dyni-active-route-metric-caption">' + htmlUtils.escapeHtml(caption) + "</div>"
      + '<div class="dyni-active-route-metric-value-row">'
      + '<span class="dyni-active-route-metric-value"' + htmlUtils.toStyleAttr(valueStyle) + ">" + htmlUtils.escapeHtml(value) + "</span>"
      + '<span class="dyni-active-route-metric-unit"' + htmlUtils.toStyleAttr(unitStyle) + ">" + htmlUtils.escapeHtml(unit) + "</span>"
      + "</div>"
      + "</div>";
  };

  function resolveHostElements(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const commitState = ctx && ctx.__dyniHostCommitState ? ctx.__dyniHostCommitState : null;
    const shellEl = commitState && commitState.shellEl ? commitState.shellEl : null;
    const rootEl = commitState && commitState.rootEl ? commitState.rootEl : null;
    return {
      shellEl: shellEl,
      rootEl: rootEl,
      targetEl: shellEl || rootEl
    };
  }

  function resolveShellRectFromTarget(targetEl, hostContext, htmlUtils) {
    return htmlUtils.resolveShellRect(hostContext, targetEl);
  }

  function resolveShellRect(hostContext, htmlUtils) {
    return resolveShellRectFromTarget(resolveHostElements(hostContext).targetEl, hostContext, htmlUtils);
  }

  function resolveMode(props, hostContext, htmlUtils) {
    const p = props || {};
    return htmlUtils.resolveRatioMode({
      ratioThresholdNormal: p.ratioThresholdNormal,
      ratioThresholdFlat: p.ratioThresholdFlat,
      defaultRatioThresholdNormal: DEFAULT_RATIO_THRESHOLD_NORMAL,
      defaultRatioThresholdFlat: DEFAULT_RATIO_THRESHOLD_FLAT,
      hostContext: hostContext
    });
  }

  function ensureDisplayProps(props) {
    const p = props || {};
    if (!p.display || typeof p.display !== "object") {
      throw new Error("ActiveRouteTextHtmlWidget: props.display is required");
    }
    if (!p.captions || typeof p.captions !== "object") {
      throw new Error("ActiveRouteTextHtmlWidget: props.captions is required");
    }
    if (!p.units || typeof p.units !== "object") {
      throw new Error("ActiveRouteTextHtmlWidget: props.units is required");
    }
    if (!Object.prototype.hasOwnProperty.call(p, "default")) {
      throw new Error("ActiveRouteTextHtmlWidget: props.default is required");
    }
    return p;
  }

  function getSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    const policy = p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
    return policy;
  }

  function canDispatchOpenRoute(props) {
    const policy = getSurfacePolicy(props);
    return !!(policy && policy.interaction && policy.interaction.mode === "dispatch");
  }

  function openActiveRoute(props, htmlUtils) {
    const p = props && typeof props === "object" ? props : null;
    if (htmlUtils.isEditingMode(p)) {
      return false;
    }
    const policy = getSurfacePolicy(p);
    if (!policy || !policy.actions || !policy.actions.routeEditor || typeof policy.actions.routeEditor.openActiveRoute !== "function") {
      return false;
    }
    if (!canDispatchOpenRoute(p)) {
      return false;
    }
    return policy.actions.routeEditor.openActiveRoute() !== false;
  }

  function buildRenderModel(props, Helpers, hostContext, htmlUtils) {
    const p = ensureDisplayProps(props);
    const display = p.display;
    const captions = p.captions;
    const units = p.units;
    const isApproaching = display.isApproaching === true;
    const disconnect = p.disconnect === true;
    const defaultText = String(p.default);
    const routeNameText = htmlUtils.trimText(p.routeName) || defaultText;

    const remainCaption = htmlUtils.trimText(captions.remain);
    const etaCaption = htmlUtils.trimText(captions.eta);
    const nextCourseCaption = htmlUtils.trimText(captions.nextCourse);
    const remainUnit = htmlUtils.trimText(units.remain);
    const etaUnit = htmlUtils.trimText(units.eta);
    const nextCourseUnit = htmlUtils.trimText(units.nextCourse);

    const remainText = formatMetric(
      disconnect ? undefined : display.remain,
      "formatDistance",
      [remainUnit],
      defaultText,
      Helpers
    );
    const etaText = formatMetric(
      disconnect ? undefined : display.eta,
      "formatTime",
      [],
      defaultText,
      Helpers
    );
    const nextCourseText = isApproaching
      ? formatMetric(
        disconnect ? undefined : display.nextCourse,
        "formatDirection",
        [],
        defaultText,
        Helpers
      )
      : "";
    const mode = resolveMode(p, hostContext, htmlUtils);
    const isEditing = htmlUtils.isEditingMode(p);
    const dispatchOpenRoute = canDispatchOpenRoute(p);
    const canOpenRoute = !isEditing && dispatchOpenRoute;
    const captureClicks = canOpenRoute;

    return {
      routeNameText: routeNameText,
      mode: mode,
      isEditing: isEditing,
      isApproaching: isApproaching,
      disconnect: disconnect,
      remainCaption: remainCaption,
      etaCaption: etaCaption,
      nextCourseCaption: nextCourseCaption,
      remainUnit: remainUnit,
      etaUnit: etaUnit,
      nextCourseUnit: nextCourseUnit,
      remainText: remainText,
      etaText: etaText,
      nextCourseText: nextCourseText,
      canOpenRoute: canOpenRoute,
      captureClicks: captureClicks
    };
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("ActiveRouteHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    const namedHandlers = function (props) {
      return {
        activeRouteOpen: function activeRouteOpenHandler() {
          return openActiveRoute(props, htmlUtils);
        }
      };
    };

    const renderHtml = function (props) {
      const model = buildRenderModel(props, Helpers, this, htmlUtils);
      const elements = resolveHostElements(this);
      const shellRect = resolveShellRectFromTarget(elements.targetEl, this, htmlUtils);
      const fitStyles = htmlFit.compute({
        model: model,
        hostContext: this,
        targetEl: elements.targetEl,
        shellRect: shellRect
      }) || { routeNameStyle: "", metrics: Object.create(null) };
      const routeNameStyle = fitStyles.routeNameStyle || "";
      const metricStyles = fitStyles.metrics || Object.create(null);

      const wrapperClasses = ["dyni-active-route-html"];
      if (model.isApproaching) {
        wrapperClasses.push("dyni-active-route-approaching");
      }
      if (model.disconnect) {
        wrapperClasses.push("dyni-active-route-disconnect");
      }
      wrapperClasses.push(model.canOpenRoute ? "dyni-active-route-open-dispatch" : "dyni-active-route-open-passive");
      wrapperClasses.push("dyni-active-route-mode-" + model.mode);

      let metricsHtml = "";
      metricsHtml += renderMetricTile(
        "remain",
        model.remainCaption,
        model.remainText,
        model.remainUnit,
        metricStyles.remain,
        htmlUtils
      );
      metricsHtml += renderMetricTile(
        "eta",
        model.etaCaption,
        model.etaText,
        model.etaUnit,
        metricStyles.eta,
        htmlUtils
      );
      if (model.isApproaching) {
        metricsHtml += renderMetricTile(
          "next",
          model.nextCourseCaption,
          model.nextCourseText,
          model.nextCourseUnit,
          metricStyles.next,
          htmlUtils
        );
      }

      const openHotspotHtml = model.canOpenRoute
        ? ('<div class="dyni-active-route-open-hotspot" onclick="' + OPEN_HANDLER_NAME + '"></div>')
        : "";
      const wrapperOnClickAttr = model.captureClicks ? ' onclick="catchAll"' : "";

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + wrapperOnClickAttr
        + ">"
        + openHotspotHtml
        + '<div class="dyni-active-route-route-name"' + htmlUtils.toStyleAttr(routeNameStyle) + ">"
        + htmlUtils.escapeHtml(model.routeNameText)
        + "</div>"
        + '<div class="dyni-active-route-metrics">' + metricsHtml + "</div>"
        + "</div>";
    };

    const resizeSignature = function (props) {
      const model = buildRenderModel(props, Helpers, this, htmlUtils);
      const rect = resolveShellRect(this, htmlUtils);
      return [
        model.routeNameText.length,
        model.remainText.length,
        model.etaText.length,
        model.isApproaching ? model.nextCourseText.length : 0,
        model.mode,
        model.isApproaching ? 1 : 0,
        model.disconnect ? 1 : 0,
        rect ? Math.round(rect.width) : 0,
        rect ? Math.round(rect.height) : 0
      ].join("|");
    };

    const initFunction = function () {
      if (this && typeof this.triggerResize === "function") {
        this.triggerResize();
      }
    };

    const translateFunction = function () {
      return {};
    };

    const getVerticalShellSizing = function () {
      return { kind: "ratio", aspectRatio: 2 };
    };

    return {
      id: "ActiveRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "ActiveRouteTextHtmlWidget", create: create };
}));
