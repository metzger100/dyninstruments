/**
 * Module: ActiveRouteTextHtmlWidget - Interactive HTML renderer for nav active-route kind
 * Documentation: documentation/widgets/active-route.md
 * Depends: ActiveRouteHtmlFit, HtmlWidgetUtils, PreparedPayloadModelCache, PlaceholderNormalize, StableDigits, ThemeResolver, StateScreenLabels, StateScreenPrecedence, StateScreenInteraction, StateScreenMarkup
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const EMPTY_FIT = {
    routeNameStyle: "",
    metrics: Object.create(null)
  };

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

  function resolveStateKind(props, htmlUtils, stateScreenPrecedence) {
    const p = props || {};
    const display = p.display && typeof p.display === "object" ? p.display : {};
    return stateScreenPrecedence.pickFirst([
      { kind: "disconnected", when: display.disconnect === true },
      { kind: "noRoute", when: p.wpServer === false },
      { kind: "noRoute", when: htmlUtils.trimText(display.routeName) === "" },
      { kind: "data", when: true }
    ]);
  }

  function buildRenderModel(
    props,
    shellRect,
    Helpers,
    htmlUtils,
    htmlFit,
    placeholderNormalize,
    stableDigits,
    stateScreenLabels,
    stateScreenPrecedence,
    stateScreenInteraction
  ) {
    const p = htmlFit.ensureDisplayProps(props);
    const display = p.display;
    const captions = p.captions;
    const units = p.units;
    const formatUnits = p.formatUnits && typeof p.formatUnits === "object" ? p.formatUnits : {};
    const isApproaching = display.isApproaching === true;
    const kind = resolveStateKind(p, htmlUtils, stateScreenPrecedence);
    const defaultText = String(p.default);
    const etaFormatter = display.hideSeconds === true ? "formatClock" : "formatTime";
    const stableDigitsEnabled = p.stableDigits === true;
    const mode = htmlFit.resolveDisplayMode(p, shellRect, htmlUtils);
    const isEditing = htmlUtils.isEditingMode(p);
    const canOpenRoute = !isEditing && canDispatchOpenRoute(p);
    const interactionState = stateScreenInteraction.resolveInteraction({
      kind: kind,
      baseInteraction: canOpenRoute ? "dispatch" : "passive"
    });

    if (kind !== stateScreenLabels.KINDS.DATA) {
      return {
        kind: kind,
        stateLabel: stateScreenLabels.LABELS[kind] || "",
        mode: mode,
        interactionState: interactionState
      };
    }

    const routeNameText = htmlUtils.trimText(display.routeName) || defaultText;
    const remainCaption = htmlUtils.trimText(captions.remain);
    const etaCaption = htmlUtils.trimText(captions.eta);
    const nextCourseCaption = htmlUtils.trimText(captions.nextCourse);
    const remainUnit = htmlUtils.trimText(units.remain);
    const etaUnit = htmlUtils.trimText(units.eta);
    const nextCourseUnit = htmlUtils.trimText(units.nextCourse);
    const remainFormatUnit = formatUnits.remain;
    const remainRawText = htmlFit.formatMetric(
      display.remain,
      "formatDistance",
      [remainFormatUnit],
      defaultText,
      Helpers,
      placeholderNormalize
    );
    const etaRawText = htmlFit.formatMetric(
      display.eta,
      etaFormatter,
      [],
      defaultText,
      Helpers,
      placeholderNormalize
    );
    const nextCourseRawText = isApproaching
      ? htmlFit.formatMetric(
        display.nextCourse,
        "formatDirection",
        [],
        defaultText,
        Helpers,
        placeholderNormalize
      )
      : "";
    const remainStable = htmlFit.normalizeStableValue(remainRawText, stableDigitsEnabled, stableDigits, 2);
    const etaStable = htmlFit.normalizeStableValue(etaRawText, stableDigitsEnabled, stableDigits, 2);
    const nextStable = htmlFit.normalizeStableValue(nextCourseRawText, stableDigitsEnabled, stableDigits, 3);

    return {
      kind: kind,
      stateLabel: "",
      routeNameText: routeNameText,
      mode: mode,
      isApproaching: isApproaching,
      remainCaption: remainCaption,
      etaCaption: etaCaption,
      nextCourseCaption: nextCourseCaption,
      remainUnit: remainUnit,
      etaUnit: etaUnit,
      nextCourseUnit: nextCourseUnit,
      stableDigitsEnabled: stableDigitsEnabled,
      remainText: remainStable.padded,
      remainFallbackText: remainStable.fallback,
      etaText: etaStable.padded,
      etaFallbackText: etaStable.fallback,
      nextCourseText: nextStable.padded,
      nextCourseFallbackText: nextStable.fallback,
      interactionState: interactionState
    };
  }

  function renderMetricTile(metricId, caption, value, unit, style, htmlUtils, tabular) {
    const captionStyle = style && typeof style.captionStyle === "string" ? style.captionStyle : "";
    const valueStyle = style && typeof style.valueStyle === "string" ? style.valueStyle : "";
    const unitStyle = style && typeof style.unitStyle === "string" ? style.unitStyle : "";
    const valueClasses = ["dyni-active-route-metric-value"];
    if (tabular) {
      valueClasses.push("dyni-tabular");
    }
    return ""
      + '<div class="dyni-active-route-metric dyni-active-route-metric-' + metricId + '">'
      + '<div class="dyni-active-route-metric-caption"' + htmlUtils.toStyleAttr(captionStyle) + ">" + htmlUtils.escapeHtml(caption) + "</div>"
      + '<div class="dyni-active-route-metric-value-row">'
      + '<span class="' + valueClasses.join(" ") + '"' + htmlUtils.toStyleAttr(valueStyle) + ">" + htmlUtils.escapeHtml(value) + "</span>"
      + '<span class="dyni-active-route-metric-unit"' + htmlUtils.toStyleAttr(unitStyle) + ">" + htmlUtils.escapeHtml(unit) + "</span>"
      + "</div>"
      + "</div>";
  }

  function renderMarkup(model, fitStyles, shellRect, theme, htmlUtils, stateScreenLabels, stateScreenMarkup) {
    const routeNameStyle = fitStyles && fitStyles.routeNameStyle ? fitStyles.routeNameStyle : "";
    const metricStyles = fitStyles && fitStyles.metrics ? fitStyles.metrics : Object.create(null);

    const wrapperClasses = [
      "dyni-active-route-html",
      model.interactionState === "dispatch"
        ? "dyni-active-route-open-dispatch"
        : "dyni-active-route-open-passive",
      "dyni-active-route-mode-" + model.mode
    ];
    if (model.kind !== stateScreenLabels.KINDS.DATA) {
      return stateScreenMarkup.renderStateScreen({
        kind: model.kind,
        label: model.stateLabel,
        wrapperClasses: wrapperClasses,
        extraAttrs: 'data-dyni-action="active-route-open"',
        htmlUtils: htmlUtils,
        shellRect: shellRect,
        fontFamily: theme.font.family,
        fontWeight: theme.font.labelWeight
      });
    }
    if (model.isApproaching) {
      wrapperClasses.push("dyni-active-route-approaching");
    }

    const metricValueOverrides = fitStyles && fitStyles.metricValues ? fitStyles.metricValues : Object.create(null);
    const metricSpecs = [
      { id: "remain", caption: model.remainCaption, value: model.remainText, unit: model.remainUnit },
      { id: "eta", caption: model.etaCaption, value: model.etaText, unit: model.etaUnit }
    ];
    if (model.isApproaching) {
      metricSpecs.push({ id: "next", caption: model.nextCourseCaption, value: model.nextCourseText, unit: model.nextCourseUnit });
    }
    let metricsHtml = "";
    for (let i = 0; i < metricSpecs.length; i += 1) {
      const metric = metricSpecs[i];
      const value = typeof metricValueOverrides[metric.id] === "string" ? metricValueOverrides[metric.id] : metric.value;
      metricsHtml += renderMetricTile(metric.id, metric.caption, value, metric.unit, metricStyles[metric.id], htmlUtils, model.stableDigitsEnabled);
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
    const preparedPayloadModelCache = Helpers.getModule("PreparedPayloadModelCache").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
    const stateScreenLabels = Helpers.getModule("StateScreenLabels").create(def, Helpers);
    const stateScreenPrecedence = Helpers.getModule("StateScreenPrecedence").create(def, Helpers);
    const stateScreenInteraction = Helpers.getModule("StateScreenInteraction").create(def, Helpers);
    const stateScreenMarkup = Helpers.getModule("StateScreenMarkup").create(def, Helpers);
    const themeResolver = Helpers.getModule("ThemeResolver");

    function translateFunction(rendererContext) {
      const context = rendererContext && typeof rendererContext === "object" ? rendererContext : {};
      const hostContext = context.hostContext || {};

      let mountEl = null;
      let rootEl = null;
      let wrapperEl = null;
      let clickHandler = null;
      let lastFit = EMPTY_FIT;
      let lastProps = null;
      const translate = function (props, shellRect) {
        return buildRenderModel(
        props,
        shellRect,
        Helpers,
        htmlUtils,
        htmlFit,
        placeholderNormalize,
        stableDigits,
        stateScreenLabels,
          stateScreenPrecedence,
          stateScreenInteraction
        );
      };

      const preparedPayload = preparedPayloadModelCache.createPreparedPayloadCache(translate);

      function bindDispatchListener(model) {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;

        if (!wrapperEl || model.interactionState !== "dispatch") {
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
        const prepared = preparedPayload.getPreparedPayload(payload);
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const model = prepared.model;
        const fit = shellRect
          ? (htmlFit.compute({
            model: model,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect
          }) || EMPTY_FIT)
          : lastFit;

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, renderMarkup(model, fit, shellRect, theme, htmlUtils, stateScreenLabels, stateScreenMarkup));
        lastFit = fit;
        lastProps = prepared.props;

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
        preparedPayload.clear();
        lastFit = EMPTY_FIT;
        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }
        rootEl = null;
        mountEl = null;
      }

      function destroy() {
        preparedPayload.clear();
        detach();
      }

      function layoutSignature(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const model = prepared.model;
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        return [
          model.kind,
          htmlFit.textLength(model.routeNameText),
          htmlFit.textLength(model.remainText),
          htmlFit.textLength(model.etaText),
          model.isApproaching ? htmlFit.textLength(model.nextCourseText) : 0,
          model.mode,
          model.isApproaching ? 1 : 0,
          model.interactionState === "dispatch" ? 1 : 0,
          htmlFit.textLength(model.stateLabel),
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

    function translateWidget() {
      return {};
    }

    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "ActiveRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: translateFunction,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateWidget
    };
  }

  return { id: "ActiveRouteTextHtmlWidget", create: create };
}));
