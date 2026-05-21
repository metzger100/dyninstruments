/**
 * Module: RegattaTimerTextHtmlWidget - Interactive committed HTML renderer for regatta timer controls
 * Documentation: exec-plans/active/PLAN28.md
 * Depends: RegattaTimerModel, RegattaTimerAudio, RegattaTimerMarkup, RegattaTimerHtmlFit, HtmlWidgetUtils, ValueMath, componentContext.theme.tokens
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const ROOT_CLASS_NAME = "dyni-regatta-root";
  const DEFAULT_DURATION_MINUTES = 5;
  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const BASELINE_FIT = {
    wrapperStyle: "",
    displayStyle: "",
    timerStyle: "",
    controlsStyle: "",
    barStyle: "",
    buttonStyle: "",
    startButtonStyle: "",
    syncButtonStyle: "",
    resetButtonStyle: ""
  };

  function create(def, componentContext) {
    const timerModelFactory = componentContext.components.require("RegattaTimerModel");
    const audioFactory = componentContext.components.require("RegattaTimerAudio");
    const markup = componentContext.components.require("RegattaTimerMarkup");
    const htmlFit = componentContext.components.require("RegattaTimerHtmlFit");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const valueMath = componentContext.components.require("ValueMath");
    const themeResolver = componentContext.theme.tokens;

    const toObject = valueMath.toObject;
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    function toDurationMinutes(rawValue) {
      const parsed = toOptionalFiniteNumber(rawValue);
      if (!(parsed > 0)) {
        return DEFAULT_DURATION_MINUTES;
      }
      return Math.max(1, Math.round(parsed));
    }

    function resolveMode(props, shellRect) {
      return htmlUtils.resolveRatioModeForRect({
        ratioThresholdNormal: props.regattaTimerRatioThresholdNormal,
        ratioThresholdFlat: props.regattaTimerRatioThresholdFlat,
        defaultRatioThresholdNormal: DEFAULT_RATIO_THRESHOLD_NORMAL,
        defaultRatioThresholdFlat: DEFAULT_RATIO_THRESHOLD_FLAT,
        defaultMode: "normal",
        shellRect: shellRect || null
      });
    }

    function resolveInteractionState(props) {
      if (htmlUtils.isEditingMode(props)) {
        return "passive";
      }
      return htmlUtils.canDispatchSurfaceInteraction(props) ? "dispatch" : "passive";
    }

    function createCommittedRenderer(rendererContext) {
      const context = rendererContext && typeof rendererContext === "object" ? rendererContext : {};
      const hostContext = context.hostContext || {};

      let rootEl = null;
      let wrapperEl = null;
      let clickHandler = null;
      let timerModel = null;
      let audioEngine = null;
      let lastProps = {};
      let lastShellRect = null;
      let lastHostRootEl = null;
      let lastFit = BASELINE_FIT;
      let config = {
        soundEnabled: true,
        progressBarEnabled: true,
        durationMinutes: DEFAULT_DURATION_MINUTES
      };

      function ensureRootClass() {
        const className = rootEl ? String(rootEl.className || "") : "";
        if (className && className.indexOf(ROOT_CLASS_NAME) >= 0) {
          return;
        }
        rootEl.className = className ? (className + " " + ROOT_CLASS_NAME) : ROOT_CLASS_NAME;
      }

      function unbindClickHandler() {
        if (wrapperEl && clickHandler) {
          wrapperEl.removeEventListener("click", clickHandler);
        }
        clickHandler = null;
      }

      function clearOwnedResources() {
        unbindClickHandler();
        if (timerModel && typeof timerModel.destroy === "function") {
          timerModel.destroy();
        }
        if (audioEngine && typeof audioEngine.destroy === "function") {
          audioEngine.destroy();
        }
        timerModel = null;
        audioEngine = null;
      }

      function resolveConfig(props) {
        return {
          soundEnabled: props.regattaSoundEnabled !== false,
          progressBarEnabled: props.regattaProgressBar !== false,
          durationMinutes: toDurationMinutes(props.regattaDuration)
        };
      }

      function patchDomFromState(modelState) {
        if (!rootEl || !timerModel) {
          return;
        }

        const mode = resolveMode(lastProps, lastShellRect);
        const interactionState = resolveInteractionState(lastProps);

        if (lastHostRootEl && themeResolver && typeof themeResolver.resolveForRoot === "function") {
          themeResolver.resolveForRoot(lastHostRootEl);
        }

        const fit = htmlFit.compute({
          model: modelState,
          shellRect: lastShellRect,
          mode: mode,
          hostContext: hostContext
        }) || lastFit || BASELINE_FIT;

        const markupHtml = markup.render({
          model: modelState,
          fit: fit,
          config: config,
          mode: mode,
          interactionState: interactionState,
          htmlUtils: htmlUtils
        });

        htmlUtils.applyMirroredContext(rootEl, lastProps);
        ensureRootClass();
        unbindClickHandler();
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, markupHtml);
        lastFit = fit;

        if (wrapperEl && interactionState === "dispatch") {
          clickHandler = function onClick(ev) {
            ev.preventDefault();
            ev.stopPropagation();

            const target = ev.target;
            const actionEl = target && typeof target.closest === "function"
              ? target.closest("[data-dyni-action]")
              : null;

            if (!actionEl || !timerModel) {
              return;
            }

            const action = actionEl.getAttribute("data-dyni-action");
            if (action === "regatta-start") {
              if (audioEngine) {
                audioEngine.ensureContext();
              }
              timerModel.start();
              return;
            }
            if (action === "regatta-sync") {
              timerModel.sync();
              return;
            }
            if (action === "regatta-reset") {
              timerModel.reset();
            }
          };
          wrapperEl.addEventListener("click", clickHandler);
        }
      }

      function mount(mountHostEl, payload) {
        clearOwnedResources();

        if (!mountHostEl || !mountHostEl.ownerDocument || typeof mountHostEl.appendChild !== "function") {
          return;
        }

        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }

        rootEl = mountHostEl.ownerDocument.createElement("div");
        rootEl.className = ROOT_CLASS_NAME;
        mountHostEl.appendChild(rootEl);

        const initialPayload = payload || {};
        lastProps = toObject(initialPayload.props);
        lastShellRect = initialPayload.shellRect || null;
        lastHostRootEl = initialPayload.rootEl || null;
        config = resolveConfig(lastProps);

        audioEngine = audioFactory.createAudioEngine();
        timerModel = timerModelFactory.createTimerModel({
          durationMinutes: config.durationMinutes,
          onTick: function onTick(state) {
            patchDomFromState(state);
          },
          onSignal: function onSignal(type, frequency, durationMs) {
            if (config.soundEnabled !== true || !audioEngine) {
              return;
            }
            audioEngine.playTone(frequency, durationMs);
          }
        });

        patchDomFromState(timerModel.getState());
      }

      function update(payload) {
        const nextPayload = payload || {};
        const nextProps = toObject(nextPayload.props);
        const nextConfig = resolveConfig(nextProps);
        const previousDurationMinutes = config.durationMinutes;

        lastProps = nextProps;
        lastShellRect = nextPayload.shellRect || null;
        lastHostRootEl = nextPayload.rootEl || null;
        config = nextConfig;

        if (timerModel && timerModel.getState().phase === "idle" && nextConfig.durationMinutes !== previousDurationMinutes) {
          timerModel.destroy();
          timerModel = timerModelFactory.createTimerModel({
            durationMinutes: nextConfig.durationMinutes,
            onTick: function onTick(state) {
              patchDomFromState(state);
            },
            onSignal: function onSignal(type, frequency, durationMs) {
              if (config.soundEnabled !== true || !audioEngine) {
                return;
              }
              audioEngine.playTone(frequency, durationMs);
            }
          });
        }

        if (timerModel) {
          patchDomFromState(timerModel.getState());
        }
      }

      function postPatch() {
        return false;
      }

      function detach() {
        unbindClickHandler();
        if (hostContext) {
          htmlFit.clearCache(hostContext);
        }
        clearOwnedResources();
        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }
        wrapperEl = null;
        rootEl = null;
        lastProps = {};
        lastShellRect = null;
        lastHostRootEl = null;
        lastFit = BASELINE_FIT;
      }

      function destroy() {
        detach();
      }

      function layoutSignature(payload) {
        const p = toObject(payload && payload.props);
        const shellRect = payload && payload.shellRect ? payload.shellRect : null;
        const width = shellRect && shellRect.width ? shellRect.width : 0;
        const height = shellRect && shellRect.height ? shellRect.height : 0;
        const durationMinutes = toDurationMinutes(p.regattaDuration);
        const mode = resolveMode(p, shellRect);
        const activeState = timerModel ? timerModel.getState() : {
          phase: "idle",
          colorPhase: "normal",
          displayTime: String(durationMinutes < 10 ? "0" + durationMinutes : durationMinutes) + ":00"
        };
        const soundEnabled = p.regattaSoundEnabled !== false;
        const progressBarEnabled = p.regattaProgressBar !== false;

        return [
          width,
          height,
          mode,
          activeState.phase,
          activeState.colorPhase,
          activeState.displayTime,
          soundEnabled,
          progressBarEnabled,
          durationMinutes
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
      id: "RegattaTimerTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer
    };
  }

  return { id: "RegattaTimerTextHtmlWidget", create: create };
}));
