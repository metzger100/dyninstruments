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

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.2;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.8;

  function resolveDisplayMode(props, shellRect, htmlUtils) {
    const p = props || {};
    return htmlUtils.resolveRatioModeForRect({
      ratioThresholdNormal: p.ratioThresholdNormal,
      ratioThresholdFlat: p.ratioThresholdFlat,
      defaultRatioThresholdNormal: DEFAULT_RATIO_THRESHOLD_NORMAL,
      defaultRatioThresholdFlat: DEFAULT_RATIO_THRESHOLD_FLAT,
      defaultMode: "normal",
      shellRect: shellRect
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
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
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

  function formatMetric(rawValue, formatter, formatterParameters, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(rawValue, {
      formatter: formatter,
      formatterParameters: formatterParameters,
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  }

  function buildRenderModel(props, shellRect, Helpers, htmlUtils) {
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

    const mode = resolveDisplayMode(p, shellRect, htmlUtils);
    const isEditing = htmlUtils.isEditingMode(p);
    const canOpenRoute = !isEditing && canDispatchOpenRoute(p);

    return {
      routeNameText: routeNameText,
      mode: mode,
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
      captureClicks: canOpenRoute
    };
  }

  function renderMetricTile(metricId, caption, value, unit, style, htmlUtils) {
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
  }

  function renderMarkup(model, fitStyles, htmlUtils) {
    const routeNameStyle = fitStyles && fitStyles.routeNameStyle ? fitStyles.routeNameStyle : "";
    const metricStyles = fitStyles && fitStyles.metrics ? fitStyles.metrics : Object.create(null);

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
    metricsHtml += renderMetricTile("remain", model.remainCaption, model.remainText, model.remainUnit, metricStyles.remain, htmlUtils);
    metricsHtml += renderMetricTile("eta", model.etaCaption, model.etaText, model.etaUnit, metricStyles.eta, htmlUtils);
    if (model.isApproaching) {
      metricsHtml += renderMetricTile("next", model.nextCourseCaption, model.nextCourseText, model.nextCourseUnit, metricStyles.next, htmlUtils);
    }

    return ""
      + '<div class="' + wrapperClasses.join(" ") + '"'
      + ' data-dyni-action="active-route-open"'
      + '>'
      + '<div class="dyni-active-route-open-hotspot"></div>'
      + '<div class="dyni-active-route-route-name"' + htmlUtils.toStyleAttr(routeNameStyle) + ">"
      + htmlUtils.escapeHtml(model.routeNameText)
      + "</div>"
      + '<div class="dyni-active-route-metrics">' + metricsHtml + "</div>"
      + "</div>";
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("ActiveRouteHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function createCommittedRenderer(rendererContext) {
      const context = rendererContext && typeof rendererContext === "object" ? rendererContext : {};
      const hostContext = context.hostContext || {};

      let mountEl = null;
      let rootEl = null;
      let wrapperEl = null;
      let clickHandler = null;
      let lastFit = { routeNameStyle: "", metrics: Object.create(null) };
      let lastProps = null;

      function bindDispatchListener(model) {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;

        if (!wrapperEl || model.captureClicks !== true) {
          return;
        }

        clickHandler = function onDispatchClick(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          openActiveRoute(lastProps, htmlUtils);
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      function patchDom(payload) {
        const shellRect = payload.shellRect || null;
        const model = buildRenderModel(payload.props, shellRect, Helpers, htmlUtils);
        const fit = payload.layoutChanged || !lastFit
          ? (htmlFit.compute({
            model: model,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect
          }) || { routeNameStyle: "", metrics: Object.create(null) })
          : lastFit;

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, renderMarkup(model, fit, htmlUtils));
        lastFit = fit;
        lastProps = payload.props;

        bindDispatchListener(model);
      }

      function mount(mountHostEl, payload) {
        mountEl = mountHostEl;
        rootEl = mountEl.ownerDocument.createElement("div");
        mountEl.appendChild(rootEl);
        patchDom(payload);
      }

      function update(payload) {
        patchDom(payload);
      }

      function postPatch() {
        return false;
      }

      function detach() {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;
        wrapperEl = null;
        lastProps = null;
        lastFit = { routeNameStyle: "", metrics: Object.create(null) };
        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }
        rootEl = null;
        mountEl = null;
      }

      function destroy() {
        detach();
      }

      function layoutSignature(payload) {
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        const model = buildRenderModel(payload && payload.props ? payload.props : {}, shellRect, Helpers, htmlUtils);
        return [
          model.routeNameText.length,
          model.remainText.length,
          model.etaText.length,
          model.isApproaching ? model.nextCourseText.length : 0,
          model.mode,
          model.isApproaching ? 1 : 0,
          model.disconnect ? 1 : 0,
          shellRect ? Math.round(shellRect.width) : 0,
          shellRect ? Math.round(shellRect.height) : 0
        ].join("|");
      }

      return {
        mount: mount,
        update: update,
        postPatch: postPatch,
        detach: detach,
        destroy: destroy,
        layoutSignature: layoutSignature
      };
    }

    function translateFunction() {
      return {};
    }

    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "ActiveRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "ActiveRouteTextHtmlWidget", create: create };
}));
