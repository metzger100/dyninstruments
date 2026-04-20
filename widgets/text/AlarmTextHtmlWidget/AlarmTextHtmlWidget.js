/**
 * Module: AlarmTextHtmlWidget - Native HTML renderer for vessel alarm status/control tile
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: AlarmHtmlFit, HtmlWidgetUtils, AlarmRenderModel, AlarmMarkup
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const ROOT_CLASS_NAME = "dyni-alarm-root";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function resolveSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
  }

  function resolveMode(htmlUtils, model, shellRect) {
    return htmlUtils.resolveRatioModeForRect({
      ratioThresholdNormal: model.ratioThresholdNormal,
      ratioThresholdFlat: model.ratioThresholdFlat,
      defaultRatioThresholdNormal: DEFAULT_RATIO_THRESHOLD_NORMAL,
      defaultRatioThresholdFlat: DEFAULT_RATIO_THRESHOLD_FLAT,
      defaultMode: "normal",
      shellRect: shellRect
    });
  }

  function buildFallbackFit() {
    return {
      mode: "normal",
      captionPx: 12,
      valuePx: 16,
      captionStyle: "",
      valueStyle: "",
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

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("AlarmHtmlFit").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const renderModel = Helpers.getModule("AlarmRenderModel").create(def, Helpers);
    const markup = Helpers.getModule("AlarmMarkup").create(def, Helpers);

    function buildModel(props, shellRect) {
      return renderModel.buildModel({
        props: props,
        domain: props && props.domain ? props.domain : null,
        shellRect: shellRect
      });
    }

    function createCommittedRenderer(rendererContext) {
      const context = rendererContext && typeof rendererContext === "object" ? rendererContext : {};
      const hostContext = context.hostContext || {};
      const fallbackFit = buildFallbackFit();

      let rootEl = null;
      let clickHandler = null;
      let lastProps = null;
      let lastFit = fallbackFit;

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
        lastFit = fallbackFit;
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

      function bindClickHandler(model) {
        removeClickHandler();
        if (!rootEl || !model || model.interactionState !== "dispatch") {
          return;
        }
        clickHandler = function onClick(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          const policy = resolveSurfacePolicy(lastProps);
          const alarmActions = policy && policy.actions ? policy.actions.alarm : null;
          if (!alarmActions || typeof alarmActions.stopAll !== "function") {
            return;
          }
          alarmActions.stopAll();
        };
        rootEl.addEventListener("click", clickHandler);
      }

      function patchDom(payload) {
        if (!rootEl || !payload) {
          return;
        }
        const props = toObject(payload.props);
        const shellRect = payload.shellRect || null;
        const model = buildModel(props, shellRect);
        const fit = htmlFit.compute({
          model: model,
          hostContext: hostContext,
          targetEl: payload.rootEl,
          shellRect: shellRect
        }) || lastFit || fallbackFit;

        htmlUtils.applyMirroredContext(rootEl, props);
        ensureRootClass();
        htmlUtils.patchInnerHtml(rootEl, markup.render({
          model: model,
          fit: fit,
          htmlUtils: htmlUtils
        }));

        lastProps = props;
        lastFit = fit;
        bindClickHandler(model);
      }

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

      function layoutSignature(payload) {
        const props = toObject(payload && payload.props);
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        const model = buildModel(props, shellRect);
        const mode = resolveMode(htmlUtils, model, shellRect);
        return [
          mode,
          model.state,
          model.interactionState,
          model.captionText,
          model.valueText,
          model.ratioThresholdNormal,
          model.ratioThresholdFlat,
          shellRect ? Math.round(shellRect.width) : 0,
          shellRect ? Math.round(shellRect.height) : 0
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
      createCommittedRenderer: createCommittedRenderer,
      getVerticalShellSizing: function () {
        return { kind: "ratio", aspectRatio: 2 };
      }
    };
  }

  return { id: "AlarmTextHtmlWidget", create: create };
}));
