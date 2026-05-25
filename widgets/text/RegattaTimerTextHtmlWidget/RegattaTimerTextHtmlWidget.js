/**
 * Module: RegattaTimerTextHtmlWidget - Interactive committed HTML renderer for regatta timer controls
 * Documentation: documentation/widgets/regatta-timer.md
 * Depends: RegattaTimerModel, RegattaTimerAudio, RegattaTimerSessionStore, RegattaTimerMarkup, RegattaTimerHtmlFit, HtmlWidgetUtils, ValueMath, componentContext.theme.tokens
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerTextHtmlWidget = factory();
  }
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
    const sessionStoreFactory = componentContext.components.require("RegattaTimerSessionStore");
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

    function formatDurationDisplay(durationMinutes) {
      const safeMinutes = Math.max(1, toDurationMinutes(durationMinutes));
      if (safeMinutes >= 60) {
        return String(Math.floor(safeMinutes / 60)) + ":" + String(safeMinutes % 60).padStart(2, "0") + ":00";
      }
      return String(safeMinutes).padStart(2, "0") + ":00";
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
      const sessionStore = sessionStoreFactory.createSessionStore({
        hostContext: hostContext
      });

      let rootEl = null;
      let wrapperEl = null;
      let clickHandler = null;
      let timerModel = null;
      let audioEngine = null;
      let lastProps = {};
      let lastShellRect = null;
      let lastHostRootEl = null;
      let lastFit = BASELINE_FIT;
      let lastRenderedDisplayTime = "";
      let lastRenderedColorPhase = "";
      let lastRenderedPhase = "";
      let lastRenderedShellRectWidth = 0;
      let lastRenderedShellRectHeight = 0;
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

      function clearOwnedResources(options) {
        const cfg = options || {};
        if (cfg.preserveSession === true && timerModel && typeof timerModel.getSnapshot === "function") {
          sessionStore.persistSnapshot(timerModel.getSnapshot());
        }

        unbindClickHandler();

        if (timerModel && typeof timerModel.destroy === "function") {
          timerModel.destroy();
        }
        if (audioEngine && typeof audioEngine.destroy === "function") {
          audioEngine.destroy();
        }

        timerModel = null;
        audioEngine = null;

        if (cfg.clearSession === true) {
          sessionStore.clearStoredSnapshot();
        }
      }

      function resolveConfig(props) {
        return {
          soundEnabled: props.regattaSoundEnabled !== false,
          progressBarEnabled: props.regattaProgressBar !== false,
          durationMinutes: toDurationMinutes(props.regattaDuration),
          stableDigitsEnabled: props.stableDigits === true
        };
      }

      function patchDomFromState(modelState) {
        if (!rootEl || !timerModel) {
          return;
        }

        const nextDisplayTime = modelState.displayTime == null ? "" : String(modelState.displayTime);
        const nextColorPhase = modelState.colorPhase || "normal";
        const nextPhase = modelState.phase || "idle";
        const nextShellRectWidth = lastShellRect && lastShellRect.width ? lastShellRect.width : 0;
        const nextShellRectHeight = lastShellRect && lastShellRect.height ? lastShellRect.height : 0;

        if (
          nextDisplayTime === lastRenderedDisplayTime
          && nextColorPhase === lastRenderedColorPhase
          && nextPhase === lastRenderedPhase
          && nextShellRectWidth === lastRenderedShellRectWidth
          && nextShellRectHeight === lastRenderedShellRectHeight
          && lastFit !== BASELINE_FIT
        ) {
          return;
        }

        if (nextPhase !== lastRenderedPhase) {
          sessionStore.persistSnapshot(timerModel.getSnapshot());
        }

        const mode = resolveMode(lastProps, lastShellRect);
        const interactionState = resolveInteractionState(lastProps);
        const stableDigitsEnabled = config.stableDigitsEnabled === true;

        if (lastHostRootEl && themeResolver && typeof themeResolver.resolveForRoot === "function") {
          themeResolver.resolveForRoot(lastHostRootEl);
        }

        const fit = htmlFit.compute({
          model: modelState,
          shellRect: lastShellRect,
          mode: mode,
          stableDigitsEnabled: stableDigitsEnabled,
          hostContext: hostContext,
          targetEl: lastHostRootEl
        }) || lastFit || BASELINE_FIT;

        const markupHtml = markup.render({
          model: modelState,
          fit: fit,
          config: config,
          mode: mode,
          interactionState: interactionState,
          stableDigitsEnabled: stableDigitsEnabled,
          htmlUtils: htmlUtils
        });

        htmlUtils.applyMirroredContext(rootEl, lastProps);
        ensureRootClass();
        const prevWrapperEl = wrapperEl;
        wrapperEl = htmlUtils.patchInnerHtml(rootEl, markupHtml);
        lastFit = fit;
        const wrapperChanged = wrapperEl !== prevWrapperEl;

        if (wrapperChanged || !clickHandler) {
          unbindClickHandler();
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
                sessionStore.persistSnapshot(timerModel.getSnapshot());
                return;
              }

              if (action === "regatta-sync") {
                timerModel.sync();
                sessionStore.persistSnapshot(timerModel.getSnapshot());
                return;
              }
              if (action === "regatta-reset") {
                timerModel.reset();
                sessionStore.persistSnapshot(timerModel.getSnapshot());
              }
            };
            wrapperEl.addEventListener("click", clickHandler);
          }
        }

        lastRenderedDisplayTime = nextDisplayTime;
        lastRenderedColorPhase = nextColorPhase;
        lastRenderedPhase = nextPhase;
        lastRenderedShellRectWidth = nextShellRectWidth;
        lastRenderedShellRectHeight = nextShellRectHeight;
      }

      function createTimerModelInstance(durationMinutes) {
        const session = sessionStore.readStoredSnapshot();
        const hasActiveSession = session && (session.phase === "countdown" || session.phase === "elapsed");

        timerModel = timerModelFactory.createTimerModel({
          durationMinutes: hasActiveSession ? session.durationMinutes : durationMinutes,
          snapshot: hasActiveSession ? session : null,
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

        sessionStore.persistSnapshot(timerModel.getSnapshot());
      }

      function mount(mountHostEl, payload) {
        clearOwnedResources({ preserveSession: true });

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
        sessionStore.syncIdentity(lastProps, initialPayload);
        config = resolveConfig(lastProps);

        audioEngine = audioFactory.createAudioEngine();
        createTimerModelInstance(config.durationMinutes);
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
        sessionStore.syncIdentity(lastProps, nextPayload);
        config = nextConfig;
        lastFit = BASELINE_FIT;

        if (timerModel && timerModel.getState().phase === "idle" && nextConfig.durationMinutes !== previousDurationMinutes) {
          timerModel.destroy();
          timerModel = null;
          createTimerModelInstance(nextConfig.durationMinutes);
        }

        if (timerModel) {
          patchDomFromState(timerModel.getState());
        }
      }

      function postPatch() {
        return false;
      }

      function detach(options) {
        const cfg = options || {};

        unbindClickHandler();

        if (hostContext) {
          htmlFit.clearCache(hostContext);
        }

        clearOwnedResources({
          preserveSession: cfg.preserveSession !== false,
          clearSession: cfg.clearSession === true
        });

        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }

        wrapperEl = null;
        rootEl = null;
        lastProps = {};
        lastShellRect = null;
        lastHostRootEl = null;
        lastFit = BASELINE_FIT;
        lastRenderedDisplayTime = "";
        lastRenderedColorPhase = "";
        lastRenderedPhase = "";
        lastRenderedShellRectWidth = 0;
        lastRenderedShellRectHeight = 0;
      }

      function destroy() {
        detach({ preserveSession: true, clearSession: false });
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
          displayTime: formatDurationDisplay(durationMinutes)
        };
        const soundEnabled = p.regattaSoundEnabled !== false;
        const progressBarEnabled = p.regattaProgressBar !== false;
        const stableDigitsEnabled = p.stableDigits === true;

        return [
          width,
          height,
          mode,
          activeState.phase,
          activeState.colorPhase,
          activeState.displayTime,
          soundEnabled,
          progressBarEnabled,
          stableDigitsEnabled,
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
