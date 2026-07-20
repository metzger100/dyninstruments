/**
 * @file AlarmTextHtmlWidget - Native HTML renderer for vessel alarm status/control tile
 * Documentation: documentation/widgets/alarm.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAlarmTextHtmlWidget = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {{ props?: unknown, shellRect?: DyniAlarmShellRect | null, rootEl?: HTMLElement | null, fontMetricsEpoch?: number }} DyniAlarmWidgetPayload */

  const ROOT_CLASS_NAME = "dyni-alarm-root";

  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;

  /** @param {DyniAlarmHtmlFitLayout | null} layout @param {DyniAlarmShellRect | null} shellRect @returns {{ width: number, height: number }} */
  function resolveLayoutBasisRect(layout, shellRect) {
    const rect = layout && layout.contentRect ? layout.contentRect : shellRect;
    if (!rect) {
      return { width: 0, height: 0 };
    }
    return {
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height))
    };
  }

  /** @param {DyniAlarmHtmlFitApi} htmlFit @param {DyniAlarmRenderModel} model @param {DyniAlarmShellRect | null} shellRect @returns {DyniAlarmHtmlFitLayout | null} */
  function resolveAlarmLayout(htmlFit, model, shellRect) {
    if (!shellRect || typeof htmlFit.resolveLayout !== "function") {
      return null;
    }
    return htmlFit.resolveLayout({
      model: model,
      shellRect: shellRect
    });
  }

  /** @returns {DyniAlarmHtmlFitResult} */
  function buildBaselineFit() {
    return {
      mode: "normal",
      captionPx: 12,
      valuePx: 16,
      captionStyle: "",
      valueStyle: "",
      shellStyle: "",
      accentStyle: "",
      activeBackgroundStyle: "",
      activeForegroundStyle: "",
      idleStripStyle: "",
      showStrip: false,
      showActiveBackground: false,
      valueSingleLine: true,
      interactionState: "passive",
      state: "idle"
    };
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const htmlFit = componentContext.components.require("AlarmHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const renderModel = componentContext.components.require("AlarmRenderModel");
    const markup = componentContext.components.require("AlarmMarkup");
    toObject = componentContext.components.require("ValueMath").toObject;

    /** @param {DyniWidgetValues} props @param {DyniAlarmShellRect | null} shellRect @returns {DyniAlarmRenderModel} */
    function buildModel(props, shellRect) {
      return renderModel.buildModel({
        props: props,
        domain: props && props.domain ? props.domain : null,
        shellRect: shellRect
      });
    }

    /** @param {unknown} rendererContext @returns {Record<string, unknown>} */
    function createCommittedRenderer(rendererContext) {
      const context = /** @type {Record<string, unknown>} */ (
        rendererContext && typeof rendererContext === "object" ? rendererContext : {}
      );
      const hostContext = context.hostContext || {};
      const baselineFit = buildBaselineFit();

      /** @type {HTMLElement | null} */
      let rootEl = null;
      /** @type {((ev: MouseEvent) => void) | null} */
      let clickHandler = null;
      /** @type {DyniWidgetValues | null} */
      let lastProps = null;
      let lastFit = baselineFit;

      function removeClickHandler() {
        if (rootEl && clickHandler) {
          rootEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;
      }

      function removeRoot() {
        removeClickHandler();
        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }
        rootEl = null;
        lastProps = null;
        lastFit = baselineFit;
      }

      function ensureRootClass() {
        if (!rootEl) {
          return;
        }
        const className = String(rootEl.className || "");
        if (className.indexOf(ROOT_CLASS_NAME) < 0) {
          rootEl.className = (className ? className + " " : "") + ROOT_CLASS_NAME;
        }
      }

      /** @param {DyniAlarmRenderModel} model */
      function bindClickHandler(model) {
        removeClickHandler();
        if (!rootEl || !model || model.interactionState !== "dispatch") {
          return;
        }
        clickHandler = function onClick(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          const policy = htmlUtils.resolveSurfacePolicy(lastProps);
          const actions =
            policy && typeof policy.actions === "object" && policy.actions
              ? /** @type {{ alarm?: { stopAll?: () => void } }} */ (policy.actions)
              : null;
          const alarmActions = actions ? actions.alarm : null;
          if (!alarmActions || typeof alarmActions.stopAll !== "function") {
            return;
          }
          alarmActions.stopAll();
        };
        rootEl.addEventListener("click", clickHandler);
      }

      /** @param {DyniAlarmWidgetPayload} payload */
      function patchDom(payload) {
        if (!rootEl || !payload) {
          return;
        }
        const props = toObject(payload.props);
        const shellRect = payload.shellRect || null;
        const model = buildModel(props, shellRect);
        const fit =
          htmlFit.compute({
            model: model,
            hostContext: hostContext,
            targetEl: payload.rootEl,
            shellRect: shellRect,
            fontMetricsEpoch: payload.fontMetricsEpoch || 0
          }) ||
          lastFit ||
          baselineFit;

        htmlUtils.applyMirroredContext(rootEl, props);
        ensureRootClass();
        htmlUtils.patchInnerHtml(
          rootEl,
          markup.render({
            model: model,
            fit: fit,
            htmlUtils: htmlUtils
          })
        );

        lastProps = props;
        lastFit = fit;
        bindClickHandler(model);
      }

      /** @param {HTMLElement} mountHostEl @param {DyniAlarmWidgetPayload} payload */
      function mount(mountHostEl, payload) {
        removeRoot();
        if (!mountHostEl || !mountHostEl.ownerDocument || typeof mountHostEl.appendChild !== "function") {
          return;
        }
        rootEl = mountHostEl.ownerDocument.createElement("div");
        rootEl.className = ROOT_CLASS_NAME;
        mountHostEl.appendChild(rootEl);
        patchDom(payload || {});
      }

      /** @param {DyniAlarmWidgetPayload} payload */
      function update(payload) {
        patchDom(payload || {});
      }

      function postPatch() {
        return false;
      }

      function detach() {
        removeRoot();
      }

      function destroy() {
        removeRoot();
      }

      /** @param {DyniAlarmWidgetPayload} payload @returns {string} */
      function layoutSignature(payload) {
        const props = toObject(payload && payload.props);
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        const model = buildModel(props, shellRect);
        const layout = resolveAlarmLayout(htmlFit, model, shellRect);
        const basisRect = resolveLayoutBasisRect(layout, shellRect);
        const mode = layout && layout.mode ? layout.mode : "normal";
        return [
          mode,
          model.state,
          model.interactionState,
          model.captionText,
          model.valueText,
          model.ratioThresholdNormal,
          model.ratioThresholdFlat,
          basisRect.width,
          basisRect.height
        ].join("|");
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

    return {
      id: "AlarmTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer
    };
  }

  return { id: "AlarmTextHtmlWidget", create: create };
});
