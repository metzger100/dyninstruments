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

  function resolvePointSnapshot(model, pointIndex) {
    const points = model.points;
    for (let i = 0; i < points.length; i += 1) {
      const row = points[i];
      if (row.index === pointIndex) {
        return row.pointSnapshot || null;
      }
    }
    return null;
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("RoutePointsHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const renderModel = Helpers.getModule("RoutePointsRenderModel").create(def, Helpers);
    const layoutApi = Helpers.getModule("RoutePointsLayout").create(def, Helpers);
    const markup = Helpers.getModule("RoutePointsMarkup").create(def, Helpers);
    const domEffects = Helpers.getModule("RoutePointsDomEffects").create(def, Helpers);

    function buildModel(props, shellRect, scrollbarGutterPx) {
      const surfacePolicy = resolveSurfacePolicy(props);
      const viewportHeight = props && props.viewportHeight;
      return renderModel.buildModel({
        props: props,
        shellRect: shellRect,
        isVerticalCommitted: !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical"),
        scrollbarGutterPx: scrollbarGutterPx,
        viewportHeight: viewportHeight
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
      let lastFit = { headerFit: null, rowFits: [] };
      let scrollbarGutterPx = 0;

      function bindDispatchListener(model) {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;

        if (!wrapperEl || model.canActivateRoutePoint !== true) {
          return;
        }

        clickHandler = function onDispatchClick(ev) {
          ev.preventDefault();
          ev.stopPropagation();

          const pointIndex = resolveEventIndex(ev);
          if (pointIndex < 0) {
            return;
          }

          const policy = resolveSurfacePolicy(lastProps);
          const routePointActions = policy && policy.actions ? policy.actions.routePoints : null;
          if (!routePointActions || typeof routePointActions.activate !== "function") {
            return;
          }
          routePointActions.activate({
            index: pointIndex,
            pointSnapshot: resolvePointSnapshot(lastModel, pointIndex)
          });
        };

        wrapperEl.addEventListener("click", clickHandler);
      }

      function patchDom(payload) {
        const shellRect = payload.shellRect || null;
        const model = buildModel(payload.props, shellRect, scrollbarGutterPx);
        const shouldComputeFit = model.kind === "data" && (payload.layoutChanged || !lastFit);
        const fit = shouldComputeFit
          ? (htmlFit.compute({
            model: model,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect
          }) || { headerFit: null, rowFits: [] })
          : lastFit;

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, markup.render({
          model: model,
          fit: fit,
          htmlUtils: htmlUtils
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
        if (!wrapperEl || !lastModel) {
          return false;
        }

        const nextScrollbarGutterPx = domEffects.measureListScrollbarGutter(wrapperEl);
        const gutterChanged = nextScrollbarGutterPx !== scrollbarGutterPx;
        scrollbarGutterPx = nextScrollbarGutterPx;

        if (lastModel.hasValidSelection) {
          domEffects.maybeRevealActiveRow({
            hostContext: hostContext,
            rootEl: wrapperEl,
            selectedIndex: lastModel.selectedIndex,
            activeKey: lastModel.activeWaypointKey
          });
        }

        return gutterChanged ? { relayout: true } : false;
      }

      function detach() {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;
        wrapperEl = null;
        lastProps = null;
        lastModel = null;
        lastFit = { headerFit: null, rowFits: [] };
        scrollbarGutterPx = 0;
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
        const model = buildModel(
          payload && payload.props ? payload.props : {},
          payload && payload.shellRect ? payload.shellRect : null,
          scrollbarGutterPx
        );
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

    function getVerticalShellSizing(sizingContext, surfacePolicy) {
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
    }

    return {
      id: "RoutePointsTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction
    };
  }

  return { id: "RoutePointsTextHtmlWidget", create: create };
}));
