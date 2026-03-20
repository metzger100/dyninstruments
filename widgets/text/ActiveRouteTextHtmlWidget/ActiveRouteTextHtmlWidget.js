/**
 * Module: ActiveRouteTextHtmlWidget - Interactive HTML renderer for nav active-route kind
 * Documentation: documentation/widgets/active-route.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const OPEN_HANDLER_NAME = "activeRouteOpen";

  const trimText = function (value) {
    return (value == null) ? "" : String(value).trim();
  };

  const escapeHtmlText = function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const formatMetric = function (rawValue, formatter, formatterParameters, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(rawValue, {
      formatter: formatter,
      formatterParameters: formatterParameters,
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  };

  const renderMetricTile = function (metricId, caption, value, unit, escapeHtmlText) {
    return ""
      + '<div class="dyni-active-route-metric dyni-active-route-metric-' + metricId + '">'
      + '<div class="dyni-active-route-metric-caption">' + escapeHtmlText(caption) + "</div>"
      + '<div class="dyni-active-route-metric-value">' + escapeHtmlText(value) + "</div>"
      + '<div class="dyni-active-route-metric-unit">' + escapeHtmlText(unit) + "</div>"
      + "</div>";
  };

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

  function openActiveRoute(hostContext) {
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

    return {
      routeNameText: routeNameText,
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
      canOpenRoute: canDispatchOpenRoute(hostContext)
    };
  }

  function create(def, Helpers) {
    const namedHandlers = function (props, hostContext) {
      return {
        activeRouteOpen: function activeRouteOpenHandler() {
          return openActiveRoute(hostContext);
        }
      };
    };

    const renderHtml = function (props) {
      const model = buildRenderModel(props, Helpers, this);

      const wrapperClasses = ["dyni-active-route-html"];
      if (model.isApproaching) {
        wrapperClasses.push("dyni-active-route-approaching");
      }
      if (model.disconnect) {
        wrapperClasses.push("dyni-active-route-disconnect");
      }
      wrapperClasses.push(model.canOpenRoute ? "dyni-active-route-open-dispatch" : "dyni-active-route-open-passive");

      let metricsHtml = "";
      metricsHtml += renderMetricTile("remain", model.remainCaption, model.remainText, model.remainUnit, escapeHtmlText);
      metricsHtml += renderMetricTile("eta", model.etaCaption, model.etaText, model.etaUnit, escapeHtmlText);
      if (model.isApproaching) {
        metricsHtml += renderMetricTile("next", model.nextCourseCaption, model.nextCourseText, model.nextCourseUnit, escapeHtmlText);
      }

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + ' onclick="catchAll"'
        + ">"
        + '<div class="dyni-active-route-route-name dyni-active-route-open-action ' + (model.canOpenRoute ? "is-dispatch" : "is-passive") + '"'
        + ' onclick="' + OPEN_HANDLER_NAME + '"'
        + '>'
        + escapeHtmlText(model.routeNameText)
        + "</div>"
        + '<div class="dyni-active-route-metrics">' + metricsHtml + "</div>"
        + "</div>";
    };

    const resizeSignature = function (props) {
      const model = buildRenderModel(props, Helpers, this);
      return [
        model.routeNameText.length,
        model.remainText.length,
        model.etaText.length,
        model.isApproaching ? model.nextCourseText.length : 0,
        model.isApproaching ? 1 : 0,
        model.disconnect ? 1 : 0
      ].join("|");
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
      translateFunction: translateFunction
    };
  }

  return { id: "ActiveRouteTextHtmlWidget", create: create };
}));
