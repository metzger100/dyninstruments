/**
 * @file MapZoomTextHtmlWidget - Interactive HTML renderer for map zoom kind
 * Documentation: documentation/widgets/map-zoom.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomTextHtmlWidget = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {DyniComponentContext & { theme: { tokens: DyniMapZoomThemeResolver } }} DyniMapZoomWidgetContext */
  /** @typedef {{ props: DyniWidgetValues, shellRect?: DyniHtmlShellRect | null, rootEl?: HTMLElement | null }} DyniMapZoomWidgetPayload */

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const DEFAULT_CAPTION_UNIT_SCALE = 0.8;
  const MIN_CAPTION_UNIT_SCALE = 0.5;
  const MAX_CAPTION_UNIT_SCALE = 1.5;
  const EMPTY_FIT = {
    captionStyle: "",
    valueStyle: "",
    unitStyle: "",
    requiredStyle: "",
    zoomText: "",
    requiredText: ""
  };

  /** @param {DyniWidgetValues} props @param {DyniHtmlShellRect | null} shellRect @param {DyniHtmlWidgetUtilsApi} htmlUtils */
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

  /** @param {string} baseMode @param {string} caption @param {string} unit */
  function resolveComposedMode(baseMode, caption, unit) {
    if (!caption) {
      return "flat";
    }
    if (baseMode === "high" && !unit) {
      return "normal";
    }
    return baseMode;
  }

  /** @param {unknown} props @param {DyniHtmlWidgetUtilsApi} htmlUtils */
  function dispatchCheckAutoZoom(props, htmlUtils) {
    const p = props || {};
    if (htmlUtils.isEditingMode(p)) {
      return false;
    }
    const policy = htmlUtils.resolveSurfacePolicy(p);
    const actions =
      policy && policy.actions ? /** @type {{ map?: { checkAutoZoom?: () => boolean } }} */ (policy.actions) : null;
    if (!actions || !actions.map || typeof actions.map.checkAutoZoom !== "function") {
      return false;
    }
    if (!htmlUtils.canDispatchSurfaceInteraction(p)) {
      return false;
    }
    return actions.map.checkAutoZoom() !== false;
  }

  /** @param {unknown} value @param {DyniValueMathApi["toOptionalFiniteNumber"]} toOptionalFiniteNumber */
  function clampCaptionUnitScale(value, toOptionalFiniteNumber) {
    const scale = toOptionalFiniteNumber(value);
    if (typeof scale !== "number") {
      return DEFAULT_CAPTION_UNIT_SCALE;
    }
    return Math.max(MIN_CAPTION_UNIT_SCALE, Math.min(MAX_CAPTION_UNIT_SCALE, scale));
  }

  /** @param {unknown} value @param {string} defaultText @param {DyniComponentContext} componentContext @param {DyniPlaceholderNormalizeApi} placeholderNormalize */
  function formatZoom(value, defaultText, componentContext, placeholderNormalize) {
    const out = placeholderNormalize.normalize(
      String(
        componentContext.format.applyFormatter(value, {
          formatter: "formatDecimalOpt",
          formatterParameters: [2, 1],
          default: defaultText
        })
      ),
      defaultText
    );
    return out.trim() ? out : defaultText;
  }

  /** @param {unknown} props @returns {DyniWidgetValues} */
  function ensureProps(props) {
    const p = /** @type {DyniWidgetValues} */ (props && typeof props === "object" ? props : {});
    if (!Object.prototype.hasOwnProperty.call(p, "default")) {
      throw new Error("MapZoomTextHtmlWidget: props.default is required");
    }
    return p;
  }

  /** @param {DyniWidgetValues} props @param {DyniStateScreenPrecedenceApi} stateScreenPrecedence */
  function resolveStateKind(props, stateScreenPrecedence) {
    const p = props || {};
    return stateScreenPrecedence.pickFirst([
      { kind: "disconnected", when: p.disconnect === true },
      { kind: "data", when: true }
    ]);
  }

  /** @param {unknown} props @param {unknown} shellRect @param {DyniComponentContext} componentContext @param {DyniHtmlWidgetUtilsApi} htmlUtils @param {DyniStateScreenLabelsApi} stateScreenLabels @param {DyniStateScreenPrecedenceApi} stateScreenPrecedence @param {DyniStateScreenInteractionApi} stateScreenInteraction @param {DyniStableDigitsApi} stableDigits @param {DyniValueMathApi["toOptionalFiniteNumber"]} toOptionalFiniteNumber @returns {DyniMapZoomRenderModel} */
  function buildModel(
    props,
    shellRect,
    componentContext,
    htmlUtils,
    stateScreenLabels,
    stateScreenPrecedence,
    stateScreenInteraction,
    stableDigits,
    toOptionalFiniteNumber
  ) {
    const p = ensureProps(props);
    const rect = shellRect && typeof shellRect === "object" ? /** @type {DyniHtmlShellRect} */ (shellRect) : null;
    const defaultText = /** @type {string} */ (p.default);
    const caption = /** @type {string} */ (p.caption);
    const unit = /** @type {string} */ (p.unit);
    const ratioMode = resolveDisplayMode(p, rect, htmlUtils);
    const mode = resolveComposedMode(ratioMode, caption, unit);
    const kind = resolveStateKind(p, stateScreenPrecedence);
    // MapMapper's "zoom" route (cluster/mappers/MapMapper.js) already guarantees
    // zoom/requiredZoom as number|undefined via toolkit.num; trust that boundary
    // instead of re-normalizing here (see mapper-prop-renormalization).
    const zoomNumber = /** @type {number | undefined} */ (p.zoom);
    const requiredZoomNumber = /** @type {number | undefined} */ (p.requiredZoom);
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigitsEnabled = p.stableDigits === true;
    const zoomRawText = formatZoom(zoomNumber, defaultText, componentContext, placeholderNormalize);
    const zoomStable = stableDigitsEnabled
      ? stableDigits.normalize(zoomRawText, {
          integerWidth: stableDigits.resolveIntegerWidth(zoomRawText, 2),
          reserveSignSlot: false
        })
      : { padded: zoomRawText, plain: zoomRawText };
    const requiredRawText = formatZoom(requiredZoomNumber, defaultText, componentContext, placeholderNormalize);
    const requiredStable =
      stableDigitsEnabled && typeof requiredZoomNumber === "number"
        ? stableDigits.normalize(requiredRawText, {
            integerWidth: stableDigits.resolveIntegerWidth(requiredRawText, 2),
            reserveSignSlot: false
          })
        : { padded: requiredRawText, plain: requiredRawText };
    const showRequired = typeof requiredZoomNumber === "number" && requiredZoomNumber !== zoomNumber;
    const isEditing = htmlUtils.isEditingMode(p);
    const canDispatch = !isEditing && htmlUtils.canDispatchSurfaceInteraction(p);
    const interactionState = /** @type {string} */ (
      stateScreenInteraction.resolveInteraction({
        kind: kind,
        baseInteraction: canDispatch ? "dispatch" : "passive"
      })
    );
    if (kind !== stateScreenLabels.KINDS.DATA) {
      return {
        kind: kind,
        stateLabel: String(stateScreenLabels.LABELS[kind] || ""),
        mode: mode,
        interactionState: interactionState,
        captionUnitScale: clampCaptionUnitScale(p.captionUnitScale, toOptionalFiniteNumber),
        stableDigitsEnabled: stableDigitsEnabled
      };
    }

    return {
      kind: kind,
      stateLabel: "",
      mode: mode,
      caption: caption,
      unit: unit,
      zoomText: zoomStable.padded,
      zoomPlainText: zoomStable.plain,
      requiredText: showRequired ? "(" + requiredStable.padded + ")" : "",
      requiredPlainText: showRequired ? "(" + requiredStable.plain + ")" : "",
      showRequired: showRequired,
      interactionState: interactionState,
      captionUnitScale: clampCaptionUnitScale(p.captionUnitScale, toOptionalFiniteNumber),
      stableDigitsEnabled: stableDigitsEnabled
    };
  }

  /** @param {unknown} def @param {DyniMapZoomWidgetContext} componentContext */
  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("MapZoomHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const lifecycle = componentContext.components.require("HtmlWidgetLifecycle");
    const markup = componentContext.components.require("MapZoomMarkup");
    const stableDigits = componentContext.components.require("StableDigits");
    const preparedPayloadModelCache = componentContext.components.require("PreparedPayloadModelCache");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenInteraction = componentContext.components.require("StateScreenInteraction");
    const themeResolver = componentContext.theme.tokens;
    const valueMath = componentContext.components.require("ValueMath");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    const textLength = valueMath.textLength;

    /** @param {unknown} rendererContext */
    function translateFunction(rendererContext) {
      const context = /** @type {Record<string, unknown>} */ (
        rendererContext && typeof rendererContext === "object" ? rendererContext : {}
      );
      const hostContext = context.hostContext || {};

      /** @type {HTMLElement | null} */
      let mountEl = null;
      /** @type {HTMLElement | null} */
      let rootEl = null;
      /** @type {Element | null} */
      let wrapperEl = null;
      /** @type {((ev: Event) => void) | null} */
      let clickHandler = null;
      /** @type {DyniWidgetValues | null} */
      let lastProps = null;
      /** @type {DyniMapZoomHtmlFitResult} */
      let lastFit = EMPTY_FIT;
      /** @param {unknown} props @param {unknown} shellRect */
      const translate = function (props, shellRect) {
        return buildModel(
          props,
          shellRect,
          componentContext,
          htmlUtils,
          stateScreenLabels,
          stateScreenPrecedence,
          stateScreenInteraction,
          stableDigits,
          toOptionalFiniteNumber
        );
      };

      const preparedPayload = preparedPayloadModelCache.createPreparedPayloadCache(translate);

      /** @param {DyniMapZoomRenderModel} model */
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
          dispatchCheckAutoZoom(lastProps, htmlUtils);
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      /** @param {DyniMapZoomWidgetPayload} payload */
      function patchDom(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const baseModel = /** @type {DyniMapZoomRenderModel} */ (prepared.model);
        const fit = shellRect
          ? htmlFit.compute({
              model: /** @type {DyniMapZoomFitModel} */ (baseModel),
              hostContext: hostContext,
              targetEl: payload.rootEl,
              shellRect: shellRect
            }) || EMPTY_FIT
          : lastFit;

        const renderModel = /** @type {DyniMapZoomRenderModel} */ ({
          mode: baseModel.mode,
          kind: baseModel.kind,
          stateLabel: baseModel.stateLabel,
          interactionState: baseModel.interactionState,
          caption: baseModel.caption,
          unit: baseModel.unit,
          zoomText: fit.zoomText || baseModel.zoomText,
          requiredText: fit.requiredText || baseModel.requiredText,
          showRequired: baseModel.showRequired,
          captionUnitScale: baseModel.captionUnitScale,
          stableDigitsEnabled: baseModel.stableDigitsEnabled === true,
          captionStyle: fit.captionStyle,
          valueStyle: fit.valueStyle,
          unitStyle: fit.unitStyle,
          requiredStyle: fit.requiredStyle
        });

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(
          rootEl,
          markup.render({
            model: renderModel,
            shellRect: shellRect,
            theme: theme,
            htmlUtils: htmlUtils
          })
        );
        lastFit = fit;
        lastProps = /** @type {DyniWidgetValues} */ (prepared.props);

        bindDispatchListener(renderModel);
      }

      const mount = lifecycle.createMountHandler({
        applyMounted(mounted) {
          mountEl = mounted.mountEl;
          rootEl = mounted.rootEl;
        },
        patchDom: patchDom
      });

      /** @param {DyniMapZoomWidgetPayload} payload */
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
        lastFit = {
          captionStyle: "",
          valueStyle: "",
          unitStyle: "",
          requiredStyle: "",
          zoomText: "",
          requiredText: ""
        };
        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }
        rootEl = null;
        mountEl = null;
      }

      function destroy() {
        detach();
      }

      /** @param {DyniMapZoomWidgetPayload} payload */
      function layoutSignature(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const model = /** @type {DyniMapZoomRenderModel} */ (prepared.model);
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        return [
          model.kind,
          textLength(model.caption),
          textLength(model.zoomText),
          textLength(model.zoomPlainText),
          model.stableDigitsEnabled === true ? 1 : 0,
          textLength(model.unit),
          textLength(model.requiredText),
          textLength(model.requiredPlainText),
          model.mode,
          model.captionUnitScale,
          model.showRequired ? 1 : 0,
          model.interactionState === "dispatch" ? 1 : 0,
          textLength(model.stateLabel),
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
      id: "MapZoomTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: translateFunction,
      translateFunction: translateWidget
    };
  }

  return { id: "MapZoomTextHtmlWidget", create: create };
});
