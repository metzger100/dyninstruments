/**
 * Module: EditRouteTextHtmlWidget - HTML renderer shell for nav edit-route summary kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: EditRouteHtmlFit, HtmlWidgetUtils, EditRouteRenderModel, EditRouteMarkup
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  function resolveHostCommitState(hostContext) {
    if (!hostContext || typeof hostContext !== "object") {
      return null;
    }
    return hostContext.__dyniHostCommitState || null;
  }

  function resolveCommittedElements(hostContext) {
    const commitState = resolveHostCommitState(hostContext);
    const shellEl = commitState && commitState.shellEl ? commitState.shellEl : null;
    const rootEl = commitState && commitState.rootEl ? commitState.rootEl : null;
    return {
      shellEl: shellEl,
      rootEl: rootEl,
      targetEl: shellEl || rootEl || null
    };
  }

  function isVerticalCommitted(targetEl) {
    if (!targetEl || typeof targetEl.closest !== "function") {
      return false;
    }
    return !!targetEl.closest(".widgetContainer.vertical");
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("EditRouteHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const renderModel = Helpers.getModule("EditRouteRenderModel").create(def, Helpers);
    const markup = Helpers.getModule("EditRouteMarkup").create(def, Helpers);

    function buildModel(props, hostContext) {
      const committed = resolveCommittedElements(hostContext);
      const vertical = isVerticalCommitted(committed.targetEl);
      const shellRect = htmlUtils.resolveShellRect(hostContext, committed.targetEl);
      const model = renderModel.buildModel({
        props: props,
        hostContext: hostContext,
        shellRect: shellRect,
        isVerticalCommitted: vertical
      });
      return {
        model: model,
        targetEl: committed.targetEl,
        shellRect: shellRect
      };
    }

    const namedHandlers = function (props, hostContext) {
      const canOpen = renderModel.canOpenEditRoute({
        props: props,
        hostContext: hostContext
      });
      if (!canOpen) {
        return {};
      }
      return {
        editRouteOpen: function editRouteOpenHandler() {
          if (!renderModel.canOpenEditRoute({ props: props, hostContext: hostContext })) {
            return false;
          }
          return hostContext.hostActions.routeEditor.openEditRoute() !== false;
        }
      };
    };

    const renderHtml = function (props) {
      const setup = buildModel(props, this);
      const fit = htmlFit.compute({
        model: setup.model,
        hostContext: this,
        targetEl: setup.targetEl,
        shellRect: setup.shellRect
      }) || { nameTextStyle: "", sourceBadgeStyle: "", metrics: Object.create(null) };

      return markup.render({
        model: setup.model,
        fit: fit,
        htmlUtils: htmlUtils
      });
    };

    const resizeSignature = function (props) {
      const setup = buildModel(props, this);
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
      id: "EditRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      translateFunction: translateFunction
    };
  }

  return { id: "EditRouteTextHtmlWidget", create: create };
}));
