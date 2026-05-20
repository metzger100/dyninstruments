/**
 * Module: EditRouteTextHtmlWidget - HTML renderer shell for nav edit-route summary kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: EditRouteHtmlFit, HtmlWidgetUtils, EditRouteRenderModel, EditRouteMarkup, componentContext.theme.tokens
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("EditRouteHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const renderModel = componentContext.components.require("EditRouteRenderModel");
    const markup = componentContext.components.require("EditRouteMarkup");
    const themeResolver = componentContext.theme.tokens;

    function buildModel(props, shellRect) {
      const surfacePolicy = htmlUtils.resolveSurfacePolicy(props);
      const vertical = !!(surfacePolicy && surfacePolicy.containerOrientation === "vertical");
      return renderModel.buildModel({
        props: props,
        shellRect: shellRect,
        isVerticalCommitted: vertical
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
      let lastFit = {
        nameTextStyle: "",
        sourceBadgeStyle: "",
        metrics: Object.create(null)
      };

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
          const routeEditorActions = policy && policy.actions ? policy.actions.routeEditor : null;
          if (!routeEditorActions || typeof routeEditorActions.openEditRoute !== "function") {
            return;
          }
          routeEditorActions.openEditRoute();
        };
        wrapperEl.addEventListener("click", clickHandler);
      }

      function patchDom(payload) {
        const shellRect = payload.shellRect || null;
        const theme = themeResolver.resolveForRoot(payload.rootEl);
        const model = buildModel(payload.props, shellRect);
        const shouldComputeFit = model.kind === "data" && (payload.layoutChanged || !lastFit);
        const fit = shouldComputeFit
          ? (htmlFit.compute({
            model: model,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect
          }) || {
            nameTextStyle: "",
            sourceBadgeStyle: "",
            metrics: Object.create(null)
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
        lastFit = fit;
        lastProps = payload.props;

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

    return {
      id: "EditRouteTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer,
      translateFunction: translateFunction
    };
  }

  return { id: "EditRouteTextHtmlWidget", create: create };
}));
