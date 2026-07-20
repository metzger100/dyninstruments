/**
 * @file ActiveRouteTextHtmlWidget - Interactive HTML renderer for nav active-route kind
 * Documentation: documentation/widgets/active-route.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextHtmlWidget = factory();
  }
})(this, function () {
  "use strict";

  const EMPTY_FIT = {
    routeNameStyle: "",
    metrics: Object.create(null)
  };

  /** @param {DyniActiveRouteDisplayProps} props @param {DyniHtmlWidgetUtilsApi} htmlUtils @param {DyniStateScreenPrecedenceApi} stateScreenPrecedence @returns {string} */
  function resolveStateKind(props, htmlUtils, stateScreenPrecedence) {
    const p = props || {};
    const display = p.display && typeof p.display === "object" ? p.display : {};
    return stateScreenPrecedence.pickFirst([
      { kind: "disconnected", when: display.disconnect === true },
      { kind: "noRoute", when: p.wpServer === false },
      { kind: "noRoute", when: display.routeName === "" },
      { kind: "data", when: true }
    ]);
  }

  /** @param {unknown} props @param {DyniHtmlShellRect | null} shellRect @param {DyniActiveRouteContext} componentContext @param {DyniHtmlWidgetUtilsApi} htmlUtils @param {DyniActiveRouteHtmlFitApi} htmlFit @param {DyniPlaceholderNormalizeApi} placeholderNormalize @param {DyniStableDigitsApi} stableDigits @param {DyniStateScreenLabelsApi} stateScreenLabels @param {DyniStateScreenPrecedenceApi} stateScreenPrecedence @param {DyniStateScreenInteractionApi} stateScreenInteraction @returns {DyniActiveRouteRenderModel} */
  function buildRenderModel(
    props,
    shellRect,
    componentContext,
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
    const defaultText = /** @type {string} */ (p.default);
    const etaFormatter = display.hideSeconds === true ? "formatClock" : "formatTime";
    const stableDigitsEnabled = p.stableDigits === true;
    const mode = htmlFit.resolveDisplayMode(p, shellRect, htmlUtils);
    const isEditing = htmlUtils.isEditingMode(p);
    const canOpenRoute = !isEditing && htmlUtils.canDispatchSurfaceInteraction(p);
    const interactionState = stateScreenInteraction.resolveInteraction({
      kind: kind,
      baseInteraction: canOpenRoute ? "dispatch" : "passive"
    });

    if (kind !== stateScreenLabels.KINDS.DATA) {
      return /** @type {DyniActiveRouteRenderModel} */ (
        /** @type {unknown} */ ({
          kind: kind,
          stateLabel: stateScreenLabels.LABELS[kind] || "",
          mode: mode,
          interactionState: interactionState
        })
      );
    }

    const routeNameText = /** @type {string} */ (display.routeName) || defaultText;
    const remainCaption = /** @type {string} */ (captions.remain);
    const etaCaption = /** @type {string} */ (captions.rteEta);
    const nextCourseCaption = /** @type {string} */ (captions.nextCourse);
    const remainUnit = /** @type {string} */ (units.remain);
    const etaUnit = /** @type {string} */ (units.rteEta);
    const nextCourseUnit = /** @type {string} */ (units.nextCourse);
    const remainFormatUnit = formatUnits.remain;
    const remainRawText = htmlFit.formatActiveRouteMetric(
      display.remain,
      "formatDistance",
      [remainFormatUnit],
      defaultText,
      placeholderNormalize
    );
    const etaRawText = htmlFit.formatActiveRouteMetric(
      display.rteEta,
      etaFormatter,
      [],
      defaultText,
      placeholderNormalize
    );
    const nextCourseRawText = isApproaching
      ? htmlFit.formatActiveRouteMetric(display.nextCourse, "formatDirection", [], defaultText, placeholderNormalize)
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
      remainPlainText: remainStable.plain,
      etaText: etaStable.padded,
      etaPlainText: etaStable.plain,
      nextCourseText: nextStable.padded,
      nextCoursePlainText: nextStable.plain,
      interactionState: interactionState
    };
  }

  /** @param {string} metricId @param {unknown} caption @param {unknown} value @param {unknown} unit @param {DyniActiveRouteMetricStyle | undefined} style @param {DyniHtmlWidgetUtilsApi} htmlUtils @param {unknown} tabular @returns {string} */
  function renderMetricTile(metricId, caption, value, unit, style, htmlUtils, tabular) {
    const captionStyle = style && typeof style.captionStyle === "string" ? style.captionStyle : "";
    const valueStyle = style && typeof style.valueStyle === "string" ? style.valueStyle : "";
    const unitStyle = style && typeof style.unitStyle === "string" ? style.unitStyle : "";
    const gapStyle = style && typeof style.gapStyle === "string" ? style.gapStyle : "";
    const valueClasses = ["dyni-active-route-metric-value"];
    if (tabular) {
      valueClasses.push("dyni-tabular");
    }
    return (
      "" +
      '<div class="dyni-active-route-metric dyni-active-route-metric-' +
      metricId +
      '">' +
      '<div class="dyni-active-route-metric-caption"' +
      htmlUtils.toStyleAttr(captionStyle) +
      ">" +
      htmlUtils.escapeHtml(caption) +
      "</div>" +
      '<div class="dyni-active-route-metric-value-row"' +
      htmlUtils.toStyleAttr(gapStyle) +
      ">" +
      '<span class="' +
      valueClasses.join(" ") +
      '"' +
      htmlUtils.toStyleAttr(valueStyle) +
      ">" +
      htmlUtils.escapeHtml(value) +
      "</span>" +
      '<span class="dyni-active-route-metric-unit"' +
      htmlUtils.toStyleAttr(unitStyle) +
      ">" +
      htmlUtils.escapeHtml(unit) +
      "</span>" +
      "</div>" +
      "</div>"
    );
  }

  /** @param {DyniActiveRouteRenderModel} model @param {DyniActiveRouteMarkupFit} fitStyles @param {DyniHtmlShellRect | null} shellRect @param {DyniActiveRouteThemeTokens} theme @param {DyniHtmlWidgetUtilsApi} htmlUtils @param {DyniStateScreenLabelsApi} stateScreenLabels @param {DyniStateScreenMarkupApi} stateScreenMarkup @returns {string} */
  function renderMarkup(model, fitStyles, shellRect, theme, htmlUtils, stateScreenLabels, stateScreenMarkup) {
    const routeNameStyle = fitStyles && fitStyles.routeNameStyle ? fitStyles.routeNameStyle : "";
    const metricStyles = fitStyles && fitStyles.metrics ? fitStyles.metrics : Object.create(null);

    const wrapperClasses = [
      "dyni-active-route-html",
      model.interactionState === "dispatch" ? "dyni-active-route-open-dispatch" : "dyni-active-route-open-passive",
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
      { id: "rteEta", caption: model.etaCaption, value: model.etaText, unit: model.etaUnit }
    ];
    if (model.isApproaching) {
      metricSpecs.push({
        id: "next",
        caption: model.nextCourseCaption,
        value: model.nextCourseText,
        unit: model.nextCourseUnit
      });
    }
    let metricsHtml = "";
    for (let i = 0; i < metricSpecs.length; i += 1) {
      const metric = metricSpecs[i];
      const value =
        typeof metricValueOverrides[metric.id] === "string" ? metricValueOverrides[metric.id] : metric.value;
      metricsHtml += renderMetricTile(
        metric.id,
        metric.caption,
        value,
        metric.unit,
        metricStyles[metric.id],
        htmlUtils,
        model.stableDigitsEnabled
      );
    }

    return (
      "" +
      '<div class="' +
      wrapperClasses.join(" ") +
      '"' +
      ' data-dyni-action="active-route-open"' +
      ">" +
      '<div class="dyni-active-route-open-hotspot"></div>' +
      '<div class="dyni-active-route-route-name"' +
      htmlUtils.toStyleAttr(routeNameStyle) +
      ">" +
      htmlUtils.escapeHtml(model.routeNameText) +
      "</div>" +
      '<div class="dyni-active-route-metrics">' +
      metricsHtml +
      "</div>" +
      "</div>"
    );
  }

  /** @param {unknown} def @param {DyniActiveRouteContext} componentContext */
  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("ActiveRouteHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const navInteractionPolicy = componentContext.components.require("NavInteractionPolicy");
    const lifecycle = componentContext.components.require("HtmlWidgetLifecycle");
    const preparedPayloadModelCache = componentContext.components.require("PreparedPayloadModelCache");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenInteraction = componentContext.components.require("StateScreenInteraction");
    const stateScreenMarkup = componentContext.components.require("StateScreenMarkup");
    const themeResolver = componentContext.theme.tokens;

    /** @param {Record<string, unknown>} rendererContext */
    function translateFunction(rendererContext) {
      const context = rendererContext && typeof rendererContext === "object" ? rendererContext : {};
      const hostContext = context.hostContext || {};

      /** @type {HTMLElement | null} */
      let mountEl = null;
      /** @type {HTMLElement | null} */
      let rootEl = null;
      /** @type {Element | null} */
      let wrapperEl = null;
      /** @type {((ev: Event) => void) | null} */
      let clickHandler = null;
      let lastFit = EMPTY_FIT;
      /** @type {DyniActiveRouteDisplayProps | null} */
      let lastProps = null;
      /** @param {unknown} props @param {DyniHtmlShellRect | null} shellRect */
      const translate = function (props, shellRect) {
        return buildRenderModel(
          /** @type {DyniActiveRouteDisplayProps} */ (props),
          shellRect,
          componentContext,
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

      /** @param {DyniActiveRouteRenderModel} model */
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
          navInteractionPolicy.openActiveRoute(lastProps);
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      /** @param {DyniHtmlRendererPayload} payload */
      function patchDom(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const model = /** @type {DyniActiveRouteRenderModel} */ (prepared.model);
        const fit = shellRect
          ? htmlFit.compute({
              model: model,
              hostContext: hostContext,
              targetEl: payload.rootEl,
              shellRect: shellRect
            }) || EMPTY_FIT
          : lastFit;

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(
          rootEl,
          renderMarkup(model, fit, shellRect, theme, htmlUtils, stateScreenLabels, stateScreenMarkup)
        );
        lastFit = fit;
        lastProps = /** @type {DyniActiveRouteDisplayProps} */ (prepared.props);

        bindDispatchListener(model);
      }

      const mount = lifecycle.createMountHandler({
        applyMounted(mounted) {
          mountEl = mounted.mountEl;
          rootEl = mounted.rootEl;
        },
        patchDom: patchDom
      });

      /** @param {DyniHtmlRendererPayload} payload */
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

      /** @param {DyniHtmlRendererPayload} payload @returns {string} */
      function layoutSignature(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const model = /** @type {DyniActiveRouteRenderModel} */ (prepared.model);
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

    return {
      id: "ActiveRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: translateFunction,
      translateFunction: translateWidget
    };
  }

  return { id: "ActiveRouteTextHtmlWidget", create: create };
});
