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
        isVerticalCommitted: false,
        scrollbarGutterPx: 0
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
      isVerticalCommitted: !!(effects && effects.isVerticalCommitted),
      scrollbarGutterPx: effects ? effects.scrollbarGutterPx : 0
    };
  }
  function resolveSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
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
    const layoutApi = Helpers.getModule("RoutePointsLayout").create(def, Helpers);
    const markup = Helpers.getModule("RoutePointsMarkup").create(def, Helpers);
    const domEffects = Helpers.getModule("RoutePointsDomEffects").create(def, Helpers);

    function buildModel(props, hostContext) {
      const committed = resolveCommittedFacts(hostContext, domEffects);
      const surfacePolicy = resolveSurfacePolicy(props);
      const shellRect = htmlUtils.resolveShellRect(hostContext, committed.targetEl);
      const viewportHeight = props && props.viewportHeight;
      const model = renderModel.buildModel({
        props: props,
        shellRect: shellRect,
        isVerticalCommitted: !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical"),
        scrollbarGutterPx: committed.scrollbarGutterPx,
        viewportHeight: viewportHeight
      });

      return {
        model: model,
        committed: committed,
        shellRect: shellRect
      };
    }

    const namedHandlers = function (props, hostContext) {
      const surfacePolicy = resolveSurfacePolicy(props);
      const routePointActions = surfacePolicy && surfacePolicy.actions ? surfacePolicy.actions.routePoints : null;
      const active = renderModel.canActivateRoutePoint({
        props: props
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
          if (!renderModel.canActivateRoutePoint({ props: props })) {
            return false;
          }
          if (!routePointActions || typeof routePointActions.activate !== "function") {
            return false;
          }
          return routePointActions.activate(pointIndex) !== false;
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
        domEffects.maybeRevealActiveRow({
          hostContext: this,
          rootEl: targetEl,
          selectedIndex: setup.model.selectedIndex,
          activeKey: setup.model.activeWaypointKey
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

    const getVerticalShellSizing = function (sizingContext, surfacePolicy) {
      if (!surfacePolicy || surfacePolicy.containerOrientation !== "vertical") {
        return undefined;
      }
      const ctx = sizingContext && typeof sizingContext === "object" ? sizingContext : {};
      const payload = ctx.payload && typeof ctx.payload === "object" ? ctx.payload : {};
      const domain = payload.domain && typeof payload.domain === "object" ? payload.domain : {};
      const layout = payload.layout && typeof payload.layout === "object" ? payload.layout : {};
      const shellWidth = htmlUtils.toFiniteNumber(ctx.shellWidth);
      if (!(shellWidth > 0)) {
        return undefined;
      }
      const pointCountRaw = htmlUtils.toFiniteNumber(domain.pointCount);
      const pointCount = pointCountRaw >= 0 ? Math.floor(pointCountRaw) : 0;
      const naturalHeight = layoutApi.computeNaturalHeight({
        W: shellWidth,
        pointCount: pointCount,
        showHeader: layout.showHeader !== false,
        viewportHeight: htmlUtils.toFiniteNumber(ctx.viewportHeight)
      });
      return {
        kind: "natural",
        height: String(Math.max(0, Math.floor(naturalHeight.cappedHeight))) + "px"
      };
    };

    return {
      id: "RoutePointsTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "RoutePointsTextHtmlWidget", create: create };
}));
