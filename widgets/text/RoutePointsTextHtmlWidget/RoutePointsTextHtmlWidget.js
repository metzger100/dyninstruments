/**
 * Module: RoutePointsTextHtmlWidget - HTML renderer shell for nav route-points kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: RoutePointsHtmlFit, HtmlWidgetUtils, RoutePointsRenderModel, RoutePointsMarkup, RoutePointsDomEffects
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  function resolveCommittedElements(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const commitState = ctx && ctx.__dyniHostCommitState ? ctx.__dyniHostCommitState : null;
    const shellEl = commitState && commitState.shellEl ? commitState.shellEl : null;
    const rootEl = commitState && commitState.rootEl ? commitState.rootEl : null;
    return {
      shellEl: shellEl,
      rootEl: rootEl,
      targetEl: shellEl || rootEl || null
    };
  }

  function resolveCommittedFacts(hostContext, domEffects) {
    const elements = resolveCommittedElements(hostContext);
    if (!elements.targetEl) {
      return {
        shellEl: null,
        rootEl: null,
        targetEl: null,
        isVerticalCommitted: false
      };
    }

    const effects = domEffects.applyCommittedEffects({
      hostContext: hostContext,
      targetEl: elements.targetEl
    });

    return {
      shellEl: elements.shellEl,
      rootEl: elements.rootEl,
      targetEl: effects && effects.targetEl ? effects.targetEl : null,
      isVerticalCommitted: !!(effects && effects.isVerticalCommitted)
    };
  }

  function resolveEventIndex(ev) {
    const target = ev && ev.target;
    if (!target || typeof target.closest !== "function") {
      return -1;
    }
    const rowEl = target.closest("[data-rp-idx]");
    if (!rowEl || typeof rowEl.getAttribute !== "function") {
      return -1;
    }
    const parsed = Number(rowEl.getAttribute("data-rp-idx"));
    if (!Number.isInteger(parsed) || parsed < 0) {
      return -1;
    }
    return parsed;
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("RoutePointsHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const renderModel = Helpers.getModule("RoutePointsRenderModel").create(def, Helpers);
    const markup = Helpers.getModule("RoutePointsMarkup").create(def, Helpers);
    const domEffects = Helpers.getModule("RoutePointsDomEffects").create(def, Helpers);

    function buildModel(props, hostContext) {
      const committed = resolveCommittedFacts(hostContext, domEffects);
      const shellRect = htmlUtils.resolveShellRect(hostContext, committed.targetEl);
      const viewportHeight = props && props.viewportHeight;
      const model = renderModel.buildModel({
        props: props,
        hostContext: hostContext,
        shellRect: shellRect,
        isVerticalCommitted: committed.isVerticalCommitted,
        viewportHeight: viewportHeight
      });

      return {
        model: model,
        committed: committed,
        shellRect: shellRect
      };
    }

    const namedHandlers = function (props, hostContext) {
      const active = renderModel.canActivateRoutePoint({
        props: props,
        hostContext: hostContext
      });

      if (!active) {
        return {};
      }

      return {
        routePointActivate: function routePointActivate(ev) {
          const pointIndex = resolveEventIndex(ev);
          if (pointIndex < 0) {
            return false;
          }
          if (!renderModel.canActivateRoutePoint({ props: props, hostContext: hostContext })) {
            return false;
          }
          return hostContext.hostActions.routePoints.activate(pointIndex) !== false;
        }
      };
    };

    const renderHtml = function (props) {
      const setup = buildModel(props, this);
      const targetEl = setup.committed.targetEl;
      const fit = htmlFit.compute({
        model: setup.model,
        hostContext: this,
        targetEl: targetEl,
        shellRect: setup.shellRect
      }) || { headerFit: null, rowFits: [] };

      if (setup.model.hasValidSelection) {
        domEffects.scheduleSelectedRowVisibility({
          hostContext: this,
          rootEl: targetEl,
          selectedIndex: setup.model.selectedIndex
        });
      }

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
      id: "RoutePointsTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      translateFunction: translateFunction
    };
  }

  return { id: "RoutePointsTextHtmlWidget", create: create };
}));
