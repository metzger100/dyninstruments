/**
 * Module: AisTargetTextHtmlWidget - Native HTML AIS target summary renderer shell
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: AisTargetHtmlFit, HtmlWidgetUtils, HtmlWidgetLifecycle, AisTargetRenderModel, AisTargetMarkup, ValueMath, componentContext.theme.tokens
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetTextHtmlWidget = factory();
  }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.2;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.8;

  let toObject;

  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("AisTargetHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const lifecycle = componentContext.components.require("HtmlWidgetLifecycle");
    const renderModel = componentContext.components.require("AisTargetRenderModel");
    const markup = componentContext.components.require("AisTargetMarkup");
    const themeResolver = componentContext.theme.tokens;
    toObject = componentContext.components.require("ValueMath").toObject;

    function buildModel(props, shellRect) {
      const p = props || {};
      const layout = toObject(p.layout);
      const surfacePolicy = htmlUtils.resolveSurfacePolicy(p);
      const mode = htmlUtils.resolveRatioModeForRect({
        ratioThresholdNormal: layout.ratioThresholdNormal,
        ratioThresholdFlat: layout.ratioThresholdFlat,
        defaultRatioThresholdNormal: DEFAULT_RATIO_THRESHOLD_NORMAL,
        defaultRatioThresholdFlat: DEFAULT_RATIO_THRESHOLD_FLAT,
        defaultMode: "normal",
        shellRect: shellRect
      });

      return renderModel.buildModel({
        props: p,
        shellRect: shellRect,
        mode: mode,
        isVerticalCommitted: !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical")
      });
    }

    function createCommittedRenderer(rendererContext) {
      const context = rendererContext && typeof rendererContext === "object" ? rendererContext : {};
      const hostContext = context.hostContext || {};

      let mountEl = null;
      let rootEl = null;
      let wrapperEl = null;
      let clickHandler = null;
      let lastProps = null;
      let lastModel = null;
      let lastFit = {
        nameStyle: "",
        frontStyle: "",
        placeholderStyle: "",
        metrics: Object.create(null),
        accentStyle: ""
      };

      function bindDispatchListener(model) {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;

        if (!wrapperEl || model.interactionState !== "dispatch" || !model.dispatchMmsi) {
          return;
        }

        clickHandler = function onDispatchClick(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          const policy = htmlUtils.resolveSurfacePolicy(lastProps);
          const aisActions = policy && policy.actions ? policy.actions.ais : null;
          if (!aisActions || typeof aisActions.showInfo !== "function") {
            return;
          }
          if (!lastModel || lastModel.interactionState !== "dispatch" || !lastModel.dispatchMmsi) {
            return;
          }
          aisActions.showInfo(lastModel.dispatchMmsi);
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      function patchDom(payload) {
      const shellRect = payload.shellRect || null;
      const theme = themeResolver.resolveForRoot(payload.rootEl);
      const model = buildModel(payload.props, shellRect);
        const fit = payload.layoutChanged || !lastFit
          ? (htmlFit.compute({
            model: model,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect
          }) || {
            nameStyle: "",
            frontStyle: "",
            placeholderStyle: "",
            metrics: Object.create(null),
            accentStyle: ""
          })
          : lastFit;

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, markup.render({
          model: model,
          fit: fit,
          htmlUtils: htmlUtils,
          shellRect: shellRect,
          fontFamily: theme.font.family,
          fontWeight: theme.font.labelWeight
        }));
        lastProps = payload.props;
        lastModel = model;
        lastFit = fit;

        bindDispatchListener(model);
      }

      const mount = lifecycle.createMountHandler({
        applyMounted(mounted) {
          mountEl = mounted.mountEl;
          rootEl = mounted.rootEl;
        },
        patchDom: patchDom
      });

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
        lastModel = null;
        lastFit = {
          nameStyle: "",
          frontStyle: "",
          placeholderStyle: "",
          metrics: Object.create(null),
          accentStyle: ""
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

      const layoutSignature = lifecycle.createResizeSignatureHandler(buildModel);

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

    return {
      id: "AisTargetTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      translateFunction: translateFunction
    };
  }

  return { id: "AisTargetTextHtmlWidget", create: create };
}));
