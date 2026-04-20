/**
 * Module: MapZoomTextHtmlWidget - Interactive HTML renderer for map zoom kind
 * Documentation: documentation/widgets/map-zoom.md
 * Depends: Helpers.applyFormatter, MapZoomHtmlFit, HtmlWidgetUtils, PlaceholderNormalize, PreparedPayloadModelCache, StableDigits, ThemeResolver, StateScreenLabels, StateScreenPrecedence, StateScreenInteraction, StateScreenMarkup
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

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
    zoomText: "", requiredText: ""
  };

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

  function resolveComposedMode(baseMode, caption, unit) {
    if (!caption) {
      return "flat";
    }
    if (baseMode === "high" && !unit) {
      return "normal";
    }
    return baseMode;
  }

  function getSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
  }

  function canDispatchCheckAutoZoom(props) {
    const policy = getSurfacePolicy(props);
    return !!(policy && policy.interaction && policy.interaction.mode === "dispatch");
  }

  function dispatchCheckAutoZoom(props, htmlUtils) {
    const p = props || {};
    if (htmlUtils.isEditingMode(p)) {
      return false;
    }
    const policy = getSurfacePolicy(p);
    if (!policy || !policy.actions || !policy.actions.map || typeof policy.actions.map.checkAutoZoom !== "function") {
      return false;
    }
    if (!canDispatchCheckAutoZoom(p)) {
      return false;
    }
    return policy.actions.map.checkAutoZoom() !== false;
  }

  function clampCaptionUnitScale(value, htmlUtils) {
    const scale = htmlUtils.toFiniteNumber(value);
    if (typeof scale !== "number") {
      return DEFAULT_CAPTION_UNIT_SCALE;
    }
    return Math.max(MIN_CAPTION_UNIT_SCALE, Math.min(MAX_CAPTION_UNIT_SCALE, scale));
  }

  function formatZoom(value, defaultText, Helpers, placeholderNormalize) {
    const out = placeholderNormalize.normalize(String(Helpers.applyFormatter(value, {
      formatter: "formatDecimalOpt",
      formatterParameters: [2, 1],
      default: defaultText
    })), defaultText);
    return out.trim() ? out : defaultText;
  }

  function ensureProps(props) {
    const p = props || {};
    if (!Object.prototype.hasOwnProperty.call(p, "default")) {
      throw new Error("MapZoomTextHtmlWidget: props.default is required");
    }
    return p;
  }

  function textLength(value) {
    if (value == null) {
      return 0;
    }
    return String(value).length;
  }

  function resolveStateKind(props, stateScreenPrecedence) {
    const p = props || {};
    return stateScreenPrecedence.pickFirst([
      { kind: "disconnected", when: p.disconnect === true },
      { kind: "data", when: true }
    ]);
  }

  function buildModel(props, shellRect, Helpers, htmlUtils, stateScreenLabels, stateScreenPrecedence, stateScreenInteraction, stableDigits) {
    const p = ensureProps(props);
    const defaultText = String(p.default);
    const caption = htmlUtils.trimText(p.caption);
    const unit = htmlUtils.trimText(p.unit);
    const ratioMode = resolveDisplayMode(p, shellRect, htmlUtils);
    const mode = resolveComposedMode(ratioMode, caption, unit);
    const kind = resolveStateKind(p, stateScreenPrecedence);
    const zoomNumber = htmlUtils.toFiniteNumber(p.zoom);
    const requiredZoomNumber = htmlUtils.toFiniteNumber(p.requiredZoom);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(null, Helpers);
    const stableDigitsEnabled = p.stableDigits === true;
    const zoomRawText = formatZoom(zoomNumber, defaultText, Helpers, placeholderNormalize);
    const zoomStable = stableDigitsEnabled
      ? stableDigits.normalize(zoomRawText, {
        integerWidth: stableDigits.resolveIntegerWidth(zoomRawText, 2),
        reserveSignSlot: false
      })
      : { padded: zoomRawText, fallback: zoomRawText };
    const requiredRawText = formatZoom(requiredZoomNumber, defaultText, Helpers, placeholderNormalize);
    const requiredStable = stableDigitsEnabled && typeof requiredZoomNumber === "number"
      ? stableDigits.normalize(requiredRawText, {
        integerWidth: stableDigits.resolveIntegerWidth(requiredRawText, 2),
        reserveSignSlot: false
      })
      : { padded: requiredRawText, fallback: requiredRawText };
    const showRequired = typeof requiredZoomNumber === "number" && requiredZoomNumber !== zoomNumber;
    const isEditing = htmlUtils.isEditingMode(p);
    const canDispatch = !isEditing && canDispatchCheckAutoZoom(p);
    const interactionState = stateScreenInteraction.resolveInteraction({
      kind: kind,
      baseInteraction: canDispatch ? "dispatch" : "passive"
    });
    if (kind !== stateScreenLabels.KINDS.DATA) {
      return {
        kind: kind,
        stateLabel: stateScreenLabels.LABELS[kind] || "",
        mode: mode,
        interactionState: interactionState,
        captionUnitScale: clampCaptionUnitScale(p.captionUnitScale, htmlUtils),
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
      zoomFallbackText: zoomStable.fallback,
      requiredText: showRequired ? "(" + requiredStable.padded + ")" : "",
      requiredFallbackText: showRequired ? "(" + requiredStable.fallback + ")" : "",
      showRequired: showRequired,
      interactionState: interactionState,
      captionUnitScale: clampCaptionUnitScale(p.captionUnitScale, htmlUtils),
      stableDigitsEnabled: stableDigitsEnabled
    };
  }

  function buildTextClasses(baseClass, stableDigitsEnabled) {
    const classes = [baseClass];
    if (stableDigitsEnabled === true) {
      classes.push("dyni-tabular");
    }
    return classes.join(" ");
  }

  function renderMainRows(model, htmlUtils) {
    if (model.mode === "flat") {
      return ""
        + '<div class="dyni-map-zoom-main dyni-map-zoom-main-flat">'
        + '<div class="dyni-map-zoom-inline-row">'
        + '<span class="dyni-map-zoom-caption"' + htmlUtils.toStyleAttr(model.captionStyle) + ">" + htmlUtils.escapeHtml(model.caption) + "</span>"
        + '<span class="' + buildTextClasses("dyni-map-zoom-value", model.stableDigitsEnabled) + '"' + htmlUtils.toStyleAttr(model.valueStyle) + ">" + htmlUtils.escapeHtml(model.zoomText) + "</span>"
        + '<span class="dyni-map-zoom-unit"' + htmlUtils.toStyleAttr(model.unitStyle) + ">" + htmlUtils.escapeHtml(model.unit) + "</span>"
        + "</div>"
        + "</div>";
    }
    if (model.mode === "high") {
      return ""
        + '<div class="dyni-map-zoom-main dyni-map-zoom-main-high">'
        + '<div class="dyni-map-zoom-caption-row">'
        + '<span class="dyni-map-zoom-caption"' + htmlUtils.toStyleAttr(model.captionStyle) + ">" + htmlUtils.escapeHtml(model.caption) + "</span>"
        + "</div>"
        + '<div class="dyni-map-zoom-value-row">'
        + '<span class="' + buildTextClasses("dyni-map-zoom-value", model.stableDigitsEnabled) + '"' + htmlUtils.toStyleAttr(model.valueStyle) + ">" + htmlUtils.escapeHtml(model.zoomText) + "</span>"
        + "</div>"
        + '<div class="dyni-map-zoom-unit-row">'
        + '<span class="dyni-map-zoom-unit"' + htmlUtils.toStyleAttr(model.unitStyle) + ">" + htmlUtils.escapeHtml(model.unit) + "</span>"
        + "</div>"
        + "</div>";
    }
    return ""
      + '<div class="dyni-map-zoom-main dyni-map-zoom-main-normal">'
      + '<div class="dyni-map-zoom-value-row">'
      + '<span class="' + buildTextClasses("dyni-map-zoom-value", model.stableDigitsEnabled) + '"' + htmlUtils.toStyleAttr(model.valueStyle) + ">" + htmlUtils.escapeHtml(model.zoomText) + "</span>"
      + '<span class="dyni-map-zoom-unit"' + htmlUtils.toStyleAttr(model.unitStyle) + ">" + htmlUtils.escapeHtml(model.unit) + "</span>"
      + "</div>"
      + '<div class="dyni-map-zoom-caption-row">'
      + '<span class="dyni-map-zoom-caption"' + htmlUtils.toStyleAttr(model.captionStyle) + ">" + htmlUtils.escapeHtml(model.caption) + "</span>"
      + "</div>"
      + "</div>";
  }

  function renderMarkup(model, shellRect, theme, htmlUtils, stateScreenLabels, stateScreenMarkup) {
    const classes = [
      "dyni-map-zoom-html",
      "dyni-map-zoom-mode-" + model.mode,
      model.interactionState === "dispatch"
        ? "dyni-map-zoom-open-dispatch"
        : "dyni-map-zoom-open-passive"
    ];
    if (model.showRequired) { classes.push("dyni-map-zoom-has-required"); }
    const scaleStyle = '--dyni-map-zoom-sec-scale:' + model.captionUnitScale + ";";
    if (model.kind !== stateScreenLabels.KINDS.DATA) {
      return stateScreenMarkup.renderStateScreen({
        kind: model.kind,
        label: model.stateLabel,
        wrapperClasses: classes,
        extraAttrs: 'data-dyni-action="map-zoom-check-auto" style="' + scaleStyle + '"',
        htmlUtils: htmlUtils,
        shellRect: shellRect,
        fontFamily: theme.font.family, fontWeight: theme.font.labelWeight
      });
    }

    const requiredHtml = model.showRequired
      ? ('<div class="' + buildTextClasses("dyni-map-zoom-required", model.stableDigitsEnabled) + '"' + htmlUtils.toStyleAttr(model.requiredStyle) + ">" + htmlUtils.escapeHtml(model.requiredText) + "</div>")
      : "";
    const styleAttr = ' style="' + scaleStyle + '"';

    return ""
      + '<div class="' + classes.join(" ") + '"' + styleAttr + ' data-dyni-action="map-zoom-check-auto">'
      + '<div class="dyni-map-zoom-open-hotspot"></div>'
      + renderMainRows(model, htmlUtils)
      + requiredHtml
      + "</div>";
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("MapZoomHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
    const preparedPayloadModelCache = Helpers.getModule("PreparedPayloadModelCache").create(def, Helpers);
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
      let lastProps = null;
      let lastFit = EMPTY_FIT;
      const translate = function (props, shellRect) {
        return buildModel(props, shellRect, Helpers, htmlUtils, stateScreenLabels, stateScreenPrecedence, stateScreenInteraction, stableDigits);
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
          dispatchCheckAutoZoom(lastProps, htmlUtils);
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      function patchDom(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const baseModel = prepared.model;
        const fit = shellRect
          ? (htmlFit.compute({
            model: baseModel,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect
          }) || EMPTY_FIT)
          : lastFit;

        const renderModel = {
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
        };

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, renderMarkup(renderModel, shellRect, theme, htmlUtils, stateScreenLabels, stateScreenMarkup));
        lastFit = fit;
        lastProps = prepared.props;

        bindDispatchListener(renderModel);
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

      function layoutSignature(payload) {
        const prepared = preparedPayload.getPreparedPayload(payload);
        const model = prepared.model;
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        return [
          model.kind,
          textLength(model.caption),
          textLength(model.zoomText),
          textLength(model.zoomFallbackText),
          model.stableDigitsEnabled === true ? 1 : 0,
          textLength(model.unit),
          textLength(model.requiredText),
          textLength(model.requiredFallbackText),
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

    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "MapZoomTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: translateFunction,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateWidget
    };
  }

  return { id: "MapZoomTextHtmlWidget", create: create };
}));
