/**
 * @file EditRouteTextHtmlWidget - HTML renderer shell for nav edit-route summary kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteTextHtmlWidget = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {DyniComponentContext & { theme: { tokens: DyniEditRouteThemeResolver } }} DyniEditRouteWidgetContext */
  /** @typedef {{ props: DyniWidgetValues, shellRect?: DyniHtmlShellRect | null, rootEl?: HTMLElement | null, layoutChanged?: boolean }} DyniEditRouteWidgetPayload */

  /** @param {unknown} def @param {DyniEditRouteWidgetContext} componentContext */
  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("EditRouteHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const lifecycle = componentContext.components.require("HtmlWidgetLifecycle");
    const renderModel = componentContext.components.require("EditRouteRenderModel");
    const markup = componentContext.components.require("EditRouteMarkup");
    const themeResolver = componentContext.theme.tokens;

    /** @param {unknown} props @param {unknown} shellRect @returns {DyniEditRouteRenderModel} */
    function buildModel(props, shellRect) {
      const surfacePolicy = htmlUtils.resolveSurfacePolicy(props);
      const vertical = !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical");
      return renderModel.buildModel({
        props: props,
        shellRect: shellRect,
        isVerticalCommitted: vertical
      });
    }

    /** @param {unknown} rendererContext */
    function createCommittedRenderer(rendererContext) {
      const context = /** @type {Record<string, unknown>} */ (
        rendererContext && typeof rendererContext === "object" ? rendererContext : {}
      );
      const hostContext = context.hostContext;

      /** @type {HTMLElement | null} */
      let mountEl = null;
      /** @type {HTMLElement | null} */
      let rootEl = null;
      /** @type {HTMLElement | null} */
      /** @type {Element | null} */
      let wrapperEl = null;
      /** @type {((ev: Event) => void) | null} */
      let clickHandler = null;
      /** @type {DyniWidgetValues | null} */
      let lastProps = null;
      /** @type {DyniEditRouteMarkupFit} */
      let lastFit = {
        nameTextStyle: "",
        sourceBadgeStyle: "",
        metrics: Object.create(null)
      };

      /** @param {DyniEditRouteRenderModel} model */
      function bindDispatchListener(model) {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;

        if (!wrapperEl || model.canOpenEditRoute !== true) {
          return;
        }

        clickHandler = function onDispatchClick(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          const policy = htmlUtils.resolveSurfacePolicy(lastProps);
          const actions =
            policy && typeof policy.actions === "object" && policy.actions
              ? /** @type {{ routeEditor?: { openEditRoute?: () => void } }} */ (policy.actions)
              : null;
          const routeEditorActions = actions ? actions.routeEditor : null;
          if (!routeEditorActions || typeof routeEditorActions.openEditRoute !== "function") {
            return;
          }
          routeEditorActions.openEditRoute();
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      /** @param {DyniEditRouteWidgetPayload} payload */
      function patchDom(payload) {
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const model = buildModel(payload.props, shellRect);
        const shouldComputeFit = model.kind === "data" && (payload.layoutChanged || !lastFit);
        const fit = shouldComputeFit
          ? htmlFit.compute({
              model: model,
              hostContext: hostContext,
              targetEl: payload.rootEl,
              shellRect: shellRect
            }) || {
              nameTextStyle: "",
              sourceBadgeStyle: "",
              metrics: Object.create(null)
            }
          : lastFit;

        htmlUtils.applyMirroredContext(rootEl, payload.props);
        wrapperEl = htmlUtils.patchInnerHtml(
          rootEl,
          markup.render({
            model: model,
            fit: fit,
            htmlUtils: htmlUtils,
            shellRect: shellRect,
            fontFamily: theme.font.family,
            fontWeight: theme.font.labelWeight
          })
        );
        lastFit = fit;
        lastProps = payload.props;

        bindDispatchListener(model);
      }

      const mount = lifecycle.createMountHandler({
        applyMounted(mounted) {
          mountEl = mounted.mountEl;
          rootEl = mounted.rootEl;
        },
        patchDom: patchDom
      });

      /** @param {DyniEditRouteWidgetPayload} payload */
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
        lastFit = {
          nameTextStyle: "",
          sourceBadgeStyle: "",
          metrics: Object.create(null)
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
      id: "EditRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      translateFunction: translateFunction
    };
  }

  return { id: "EditRouteTextHtmlWidget", create: create };
});
