/**
 * Module: AisTargetTextHtmlWidget - Native HTML AIS target summary renderer shell
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: AisTargetHtmlFit, HtmlWidgetUtils, AisTargetRenderModel, AisTargetMarkup, ThemeResolver
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.2;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.8;

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function resolveSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("AisTargetHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const renderModel = Helpers.getModule("AisTargetRenderModel").create(def, Helpers);
    const markup = Helpers.getModule("AisTargetMarkup").create(def, Helpers);
    const themeResolver = Helpers.getModule("ThemeResolver");

    function buildModel(props, shellRect) {
      const p = props || {};
      const layout = toObject(p.layout);
      const surfacePolicy = resolveSurfacePolicy(p);
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
          const policy = resolveSurfacePolicy(lastProps);
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

      function layoutSignature(payload) {
        const model = buildModel(payload && payload.props ? payload.props : {}, payload && payload.shellRect ? payload.shellRect : null);
        return model.resizeSignatureParts.join("|");
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
      return { kind: "ratio", aspectRatio: 7 / 8 };
    }

    return {
      id: "AisTargetTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "AisTargetTextHtmlWidget", create: create };
}));
