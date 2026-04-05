/**
 * Module: AisTargetTextHtmlWidget - Native HTML AIS target summary renderer shell
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: AisTargetHtmlFit, HtmlWidgetUtils, AisTargetRenderModel, AisTargetMarkup
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

  function resolveCommitState(hostContext) {
    if (!hostContext || typeof hostContext !== "object") {
      return null;
    }
    const commitState = hostContext.__dyniHostCommitState;
    return commitState && typeof commitState === "object" ? commitState : null;
  }

  function resolveCommittedElements(hostContext) {
    const commitState = resolveCommitState(hostContext);
    const shellEl = commitState ? (commitState.shellEl || null) : null;
    const rootEl = commitState ? (commitState.rootEl || null) : null;
    const targetEl = shellEl || rootEl || null;
    return {
      shellEl: shellEl,
      rootEl: rootEl,
      targetEl: targetEl
    };
  }

  function isVerticalCommitted(targetEl) {
    if (!targetEl || typeof targetEl.closest !== "function") {
      return false;
    }
    return !!targetEl.closest(".widgetContainer.vertical");
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("AisTargetHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const renderModel = Helpers.getModule("AisTargetRenderModel").create(def, Helpers);
    const markup = Helpers.getModule("AisTargetMarkup").create(def, Helpers);

    function buildSetup(props, hostContext) {
      const p = props || {};
      const layout = toObject(p.layout);
      const committed = resolveCommittedElements(hostContext);
      const shellRect = htmlUtils.resolveShellRect(hostContext, committed.targetEl);
      const mode = htmlUtils.resolveRatioMode({
        ratioThresholdNormal: layout.ratioThresholdNormal,
        ratioThresholdFlat: layout.ratioThresholdFlat,
        defaultRatioThresholdNormal: DEFAULT_RATIO_THRESHOLD_NORMAL,
        defaultRatioThresholdFlat: DEFAULT_RATIO_THRESHOLD_FLAT,
        defaultMode: "normal",
        hostContext: hostContext,
        targetEl: committed.targetEl
      });
      const model = renderModel.buildModel({
        props: p,
        hostContext: hostContext,
        shellRect: shellRect,
        mode: mode,
        isVerticalCommitted: isVerticalCommitted(committed.targetEl)
      });

      return {
        model: model,
        shellRect: shellRect,
        targetEl: committed.targetEl
      };
    }

    function buildDefaultFit() {
      return {
        frontInitialStyle: "",
        nameStyle: "",
        frontStyle: "",
        placeholderStyle: "",
        metrics: Object.create(null),
        accentStyle: ""
      };
    }

    const renderHtml = function (props) {
      const setup = buildSetup(props, this);
      const fit = htmlFit.compute({
        model: setup.model,
        hostContext: this,
        targetEl: setup.targetEl,
        shellRect: setup.shellRect
      }) || buildDefaultFit();

      return markup.render({
        model: setup.model,
        fit: fit,
        htmlUtils: htmlUtils
      });
    };

    const namedHandlers = function (props, hostContext) {
      const setup = buildSetup(props, hostContext);
      if (setup.model.interactionState !== "dispatch" || !setup.model.dispatchMmsi) {
        return {};
      }

      return {
        aisTargetShowInfo: function aisTargetShowInfo() {
          const latest = buildSetup(props, hostContext).model;
          if (latest.interactionState !== "dispatch" || !latest.dispatchMmsi) {
            return false;
          }
          const actions = hostContext && hostContext.hostActions;
          const aisActions = actions && actions.ais;
          if (!aisActions || typeof aisActions.showInfo !== "function") {
            return false;
          }
          return aisActions.showInfo(latest.dispatchMmsi) !== false;
        }
      };
    };

    const resizeSignature = function (props) {
      const setup = buildSetup(props, this);
      return setup.model.resizeSignatureParts.join("|");
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
      id: "AisTargetTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      translateFunction: translateFunction
    };
  }

  return { id: "AisTargetTextHtmlWidget", create: create };
}));
