/**
 * Module: ActiveRouteTextHtmlWidget - Interactive HTML renderer for nav active-route kind
 * Documentation: documentation/widgets/active-route.md
 * Depends: ActiveRouteHtmlFit
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

  const trimText = function (value) {
    return (value == null) ? "" : String(value).trim();
  };

  const toFiniteNumber = function (value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

  const escapeHtmlText = function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const toStyleAttr = function (style) {
    const text = trimText(style);
    return text ? (' style="' + text + '"') : "";
  };

  const formatMetric = function (rawValue, formatter, formatterParameters, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(rawValue, {
      formatter: formatter,
      formatterParameters: formatterParameters,
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  };

  const renderMetricTile = function (metricId, caption, value, unit, style, escapeHtmlText) {
    const valueStyle = style && typeof style.valueStyle === "string" ? style.valueStyle : "";
    const unitStyle = style && typeof style.unitStyle === "string" ? style.unitStyle : "";
    return ""
      + '<div class="dyni-active-route-metric dyni-active-route-metric-' + metricId + '">'
      + '<div class="dyni-active-route-metric-caption">' + escapeHtmlText(caption) + "</div>"
      + '<div class="dyni-active-route-metric-value-row">'
      + '<span class="dyni-active-route-metric-value"' + toStyleAttr(valueStyle) + ">" + escapeHtmlText(value) + "</span>"
      + '<span class="dyni-active-route-metric-unit"' + toStyleAttr(unitStyle) + ">" + escapeHtmlText(unit) + "</span>"
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

  function resolveShellRectFromTarget(targetEl) {
    if (!targetEl || typeof targetEl.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = targetEl.getBoundingClientRect();
    const width = toFiniteNumber(rect && rect.width);
    const height = toFiniteNumber(rect && rect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return { width: width, height: height };
  }

  function resolveShellRect(hostContext) {
    return resolveShellRectFromTarget(resolveHostElements(hostContext).targetEl);
  }

  function resolveMode(props, hostContext) {
    const p = props || {};
    const normalThresholdRaw = toFiniteNumber(p.ratioThresholdNormal);
    const flatThresholdRaw = toFiniteNumber(p.ratioThresholdFlat);
    const normalThreshold = typeof normalThresholdRaw === "number"
      ? normalThresholdRaw
      : DEFAULT_RATIO_THRESHOLD_NORMAL;
    const flatThreshold = typeof flatThresholdRaw === "number"
      ? flatThresholdRaw
      : DEFAULT_RATIO_THRESHOLD_FLAT;
    const rect = resolveShellRect(hostContext);
    if (!rect) {
      return "normal";
    }
    const ratio = rect.width / rect.height;
    if (ratio < normalThreshold) {
      return "high";
    }
    if (ratio > flatThreshold) {
      return "flat";
    }
    return "normal";
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

  function canDispatchOpenRoute(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const hostActions = ctx && ctx.hostActions ? ctx.hostActions : null;
    if (!hostActions || typeof hostActions.getCapabilities !== "function") {
      return false;
    }
    if (!hostActions.routeEditor || typeof hostActions.routeEditor.openActiveRoute !== "function") {
      return false;
    }
    const capabilities = hostActions.getCapabilities();
    return !!(
      capabilities &&
      capabilities.routeEditor &&
      capabilities.routeEditor.openActiveRoute === "dispatch"
    );
  }

  function openActiveRoute(hostContext, props) {
    const p = props && typeof props === "object" ? props : null;
    if (p && p.editing === true) {
      return false;
    }
    if (!canDispatchOpenRoute(hostContext)) {
      return false;
    }
    return hostContext.hostActions.routeEditor.openActiveRoute() !== false;
  }

  function buildRenderModel(props, Helpers, hostContext) {
    const p = ensureDisplayProps(props);
    const display = p.display;
    const captions = p.captions;
    const units = p.units;
    const isApproaching = display.isApproaching === true;
    const disconnect = p.disconnect === true;
    const defaultText = String(p.default);
    const routeNameText = trimText(p.routeName) || defaultText;

    const remainCaption = trimText(captions.remain);
    const etaCaption = trimText(captions.eta);
    const nextCourseCaption = trimText(captions.nextCourse);
    const remainUnit = trimText(units.remain);
    const etaUnit = trimText(units.eta);
    const nextCourseUnit = trimText(units.nextCourse);

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
    const mode = resolveMode(p, hostContext);
    const isEditing = p.editing === true;
    const dispatchOpenRoute = canDispatchOpenRoute(hostContext);
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

    const namedHandlers = function (props, hostContext) {
      return {
        activeRouteOpen: function activeRouteOpenHandler() {
          return openActiveRoute(hostContext, props);
        }
      };
    };

    const renderHtml = function (props) {
      const model = buildRenderModel(props, Helpers, this);
      const elements = resolveHostElements(this);
      const shellRect = resolveShellRectFromTarget(elements.targetEl);
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
        escapeHtmlText
      );
      metricsHtml += renderMetricTile(
        "eta",
        model.etaCaption,
        model.etaText,
        model.etaUnit,
        metricStyles.eta,
        escapeHtmlText
      );
      if (model.isApproaching) {
        metricsHtml += renderMetricTile(
          "next",
          model.nextCourseCaption,
          model.nextCourseText,
          model.nextCourseUnit,
          metricStyles.next,
          escapeHtmlText
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
        + '<div class="dyni-active-route-route-name"' + toStyleAttr(routeNameStyle) + ">"
        + escapeHtmlText(model.routeNameText)
        + "</div>"
        + '<div class="dyni-active-route-metrics">' + metricsHtml + "</div>"
        + "</div>";
    };

    const resizeSignature = function (props) {
      const model = buildRenderModel(props, Helpers, this);
      const rect = resolveShellRect(this);
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

    return {
      id: "ActiveRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      translateFunction: translateFunction
    };
  }

  return { id: "ActiveRouteTextHtmlWidget", create: create };
}));
