/**
 * @file RoutePointsTextHtmlWidget - HTML renderer shell for nav route-points kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsTextHtmlWidget = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {DyniComponentContext & { theme: { tokens: DyniRoutePointsThemeResolver } }} DyniRoutePointsWidgetContext */
  /** @typedef {{ props: DyniWidgetValues, shellRect?: DyniHtmlShellRect | null, rootEl?: HTMLElement | null, layoutChanged?: boolean }} DyniRoutePointsWidgetPayload */

  /** @param {Event} ev @returns {number} */
  function resolveEventIndex(ev) {
    const target = /** @type {Element | null} */ (ev && ev.target);
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

  /** @param {DyniRoutePointsRenderModel} model @param {number} pointIndex */
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

  /** @param {unknown} def @param {DyniRoutePointsWidgetContext} componentContext */
  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("RoutePointsHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const lifecycle = componentContext.components.require("HtmlWidgetLifecycle");
    const renderModel = componentContext.components.require("RoutePointsRenderModel");
    const layoutApi = componentContext.components.require("RoutePointsLayout");
    const markup = componentContext.components.require("RoutePointsMarkup");
    const domEffects = componentContext.components.require("RoutePointsDomEffects");
    const themeResolver = componentContext.theme.tokens;

    /** @param {unknown} props @param {DyniHtmlShellRect | null} shellRect @param {number} scrollbarGutterPx @returns {DyniRoutePointsRenderModel} */
    function buildModel(props, shellRect, scrollbarGutterPx) {
      const p = /** @type {DyniWidgetValues} */ (props && typeof props === "object" ? props : {});
      const surfacePolicy = htmlUtils.resolveSurfacePolicy(p);
      const viewportHeight = p.viewportHeight;
      return renderModel.buildModel({
        props: p,
        shellRect: shellRect,
        isVerticalCommitted: !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical"),
        scrollbarGutterPx: scrollbarGutterPx,
        viewportHeight: viewportHeight
      });
    }

    /** @param {unknown} rendererContext */
    function createCommittedRenderer(rendererContext) {
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
      /** @type {DyniRoutePointsRenderModel | null} */
      let lastModel = null;
      /** @type {DyniRoutePointsHtmlFitResult} */
      let lastFit = { headerFit: null, rowFits: [], emptyStyle: "" };
      let scrollbarGutterPx = 0;

      /** @param {DyniRoutePointsRenderModel} model */
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

          const policy = htmlUtils.resolveSurfacePolicy(lastProps);
          const actions =
            policy && policy.actions
              ? /** @type {{ routePoints?: { activate?: (args: unknown) => void } }} */ (policy.actions)
              : null;
          const routePointActions = actions ? actions.routePoints : null;
          if (!routePointActions || typeof routePointActions.activate !== "function") {
            return;
          }
          routePointActions.activate({
            index: pointIndex,
            pointSnapshot: lastModel ? resolvePointSnapshot(lastModel, pointIndex) : null
          });
        };

        wrapperEl.addEventListener("click", clickHandler);
      }

      /** @param {DyniRoutePointsWidgetPayload} payload */
      function patchDom(payload) {
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const model = buildModel(payload.props, shellRect, scrollbarGutterPx);
        const shouldComputeFit = model.kind === "data" && (payload.layoutChanged || !lastFit);
        const computedFit = shouldComputeFit
          ? htmlFit.compute({
              model: model,
              hostContext: hostContext,
              targetEl: payload.rootEl,
              shellRect: shellRect
            })
          : null;
        const rawFit = computedFit || lastFit;
        const fit = rawFit
          ? {
              headerFit: rawFit.headerFit || { routeNameStyle: "", metaStyle: "" },
              rowFits: rawFit.rowFits
            }
          : { headerFit: { routeNameStyle: "", metaStyle: "" }, rowFits: [] };

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(
          rootEl,
          markup.render({
            model: model,
            fit: fit,
            coordinatesTabular: payload.props && payload.props.coordinatesTabular !== false,
            htmlUtils: htmlUtils,
            shellRect: shellRect,
            fontFamily: theme.font.family,
            fontWeight: theme.font.labelWeight
          })
        );
        lastProps = payload.props;
        lastModel = model;
        lastFit = rawFit;

        bindDispatchListener(model);
      }

      const mount = lifecycle.createMountHandler({
        applyMounted(mounted) {
          mountEl = mounted.mountEl;
          rootEl = mounted.rootEl;
        },
        patchDom: patchDom
      });

      /** @param {DyniRoutePointsWidgetPayload} payload */
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
        lastFit = { headerFit: null, rowFits: [], emptyStyle: "" };
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

      /** @param {DyniRoutePointsWidgetPayload} payload */
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

    return {
      id: "RoutePointsTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      translateFunction: translateFunction
    };
  }

  return { id: "RoutePointsTextHtmlWidget", create: create };
});
