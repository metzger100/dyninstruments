/**
 * @file DyniPlugin HostCommitController - Deferred host commit scheduling for HTML shell mounting
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = /** @type {DyniPluginNamespace & { runtime: DyniHostRuntime }} */ (root.DyniPlugin);
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;
  const MAX_RAF_ATTEMPTS = 4;
  const OBSERVER_TIMEOUT_MS = 2000;

  let instanceCounter = 0;

  /** @param {string} prefix @returns {string} */
  function nextInstanceId(prefix) {
    instanceCounter += 1;
    return prefix + String(instanceCounter);
  }

  /** @param {string} instanceId @returns {DyniHostCommitState} */
  function createState(instanceId) {
    return {
      instanceId: instanceId,
      renderRevision: 0,
      mountedRevision: 0,
      lastProps: undefined,
      rootEl: null,
      shellEl: null,
      scheduledRevision: null,
      rafHandle: null,
      observer: null,
      timeoutHandle: null,
      commitPending: false
    };
  }

  /** @param {DyniHostCommitControllerOptions} options @returns {DyniHostCommitControllerApi} */
  function createHostCommitController(options) {
    const opts = /** @type {DyniHostCommitControllerOptions} */ (options || {});
    const instancePrefix =
      typeof opts.instancePrefix === "string" && opts.instancePrefix ? opts.instancePrefix : "dyni-host-";
    const doc = opts.document || root.document || null;
    const requestFrame =
      typeof opts.requestAnimationFrame === "function"
        ? opts.requestAnimationFrame
        : typeof root.requestAnimationFrame === "function"
          ? root.requestAnimationFrame.bind(root)
          : function (/** @type {() => void} */ cb) {
              return root.setTimeout(cb, 16);
            };
    const cancelFrame =
      typeof opts.cancelAnimationFrame === "function"
        ? opts.cancelAnimationFrame
        : typeof root.cancelAnimationFrame === "function"
          ? root.cancelAnimationFrame.bind(root)
          : function (/** @type {number} */ handle) {
              root.clearTimeout(handle);
            };
    const setTimer = typeof opts.setTimeout === "function" ? opts.setTimeout : root.setTimeout.bind(root);
    const clearTimer = typeof opts.clearTimeout === "function" ? opts.clearTimeout : root.clearTimeout.bind(root);
    const MutationObserverCtor = hasOwn.call(opts, "MutationObserver") ? opts.MutationObserver : root.MutationObserver;

    /** @type {DyniHostCommitState} */
    let state = createState(nextInstanceId(instancePrefix));
    /** @type {DyniHostCommitState | null} */
    let stateSnapshot = null;
    let stateSnapshotDirty = true;
    function markStateSnapshotDirty() {
      stateSnapshotDirty = true;
    }

    /** @param {keyof DyniHostCommitState} key @param {unknown} value */
    function setStateField(key, value) {
      if (state[key] === value) {
        return;
      }
      /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (state))[key] = value;
      markStateSnapshotDirty();
    }

    /** @returns {DyniHostCommitState} */
    function getState() {
      if (!stateSnapshotDirty && stateSnapshot) {
        return stateSnapshot;
      }
      stateSnapshot = {
        instanceId: state.instanceId,
        renderRevision: state.renderRevision,
        mountedRevision: state.mountedRevision,
        lastProps: state.lastProps,
        rootEl: state.rootEl,
        shellEl: state.shellEl,
        scheduledRevision: state.scheduledRevision,
        rafHandle: state.rafHandle,
        observer: state.observer,
        timeoutHandle: state.timeoutHandle,
        commitPending: state.commitPending
      };
      stateSnapshotDirty = false;
      return stateSnapshot;
    }

    function clearRafHandle() {
      if (state.rafHandle == null) {
        return;
      }
      cancelFrame(state.rafHandle);
      setStateField("rafHandle", null);
    }

    function clearObserver() {
      if (!state.observer) {
        return;
      }
      state.observer.disconnect();
      setStateField("observer", null);
    }

    function clearTimeoutHandle() {
      if (state.timeoutHandle == null) {
        return;
      }
      clearTimer(state.timeoutHandle);
      setStateField("timeoutHandle", null);
    }

    function clearAsyncHandles() {
      clearRafHandle();
      clearObserver();
      clearTimeoutHandle();
    }

    function clearPendingState() {
      setStateField("commitPending", false);
      setStateField("scheduledRevision", null);
    }

    /** @returns {Element | null} */
    function resolveShellElement() {
      if (!doc || typeof doc.querySelector !== "function") {
        return null;
      }
      const selector = '.widgetData.dyni-shell[data-dyni-instance="' + state.instanceId + '"]';
      return doc.querySelector(selector);
    }

    /** @param {Element | null} shellEl @returns {Element | null} */
    function resolveRootElement(shellEl) {
      if (!shellEl || typeof shellEl.closest !== "function") {
        return null;
      }
      const rootEl = shellEl.closest(".widget.dyniplugin");
      if (!rootEl || !rootEl.classList) {
        return null;
      }
      if (!rootEl.classList.contains("dyniplugin")) {
        return null;
      }
      if (!rootEl.classList.contains("dyni-host-html")) {
        return null;
      }
      return rootEl;
    }

    /** @param {number} targetRevision @param {DyniHostCommitCallbacks} callbacks @returns {boolean} */
    function commitIfReady(targetRevision, callbacks) {
      if (targetRevision !== state.renderRevision) {
        clearAsyncHandles();
        clearPendingState();
        return true;
      }

      const shellEl = resolveShellElement();
      if (!shellEl) {
        return false;
      }

      const rootEl = resolveRootElement(shellEl);
      if (!rootEl) {
        return false;
      }

      clearAsyncHandles();
      setStateField("shellEl", shellEl);
      setStateField("rootEl", rootEl);
      setStateField("mountedRevision", targetRevision);
      clearPendingState();

      if (callbacks && typeof callbacks.onCommit === "function") {
        callbacks.onCommit({
          instanceId: state.instanceId,
          revision: targetRevision,
          props: state.lastProps,
          rootEl: rootEl,
          shellEl: shellEl,
          state: getState()
        });
      }
      return true;
    }

    /** @param {number} targetRevision @param {DyniHostCommitCallbacks} callbacks */
    function installDeferredObservers(targetRevision, callbacks) {
      if (!MutationObserverCtor || typeof MutationObserverCtor !== "function") {
        setStateField(
          "timeoutHandle",
          setTimer(function () {
            commitIfReady(targetRevision, callbacks);
          }, 0)
        );
        return;
      }

      if (!state.observer) {
        const observer = new MutationObserverCtor(function () {
          commitIfReady(targetRevision, callbacks);
        });
        setStateField("observer", observer);
        if (doc && doc.body) {
          observer.observe(doc.body, { childList: true, subtree: true });
        }
      }

      if (state.timeoutHandle == null) {
        setStateField(
          "timeoutHandle",
          setTimer(function () {
            if (commitIfReady(targetRevision, callbacks)) {
              return;
            }
            clearAsyncHandles();
            clearPendingState();
          }, OBSERVER_TIMEOUT_MS)
        );
      }
    }

    /** @param {number} targetRevision @param {DyniHostCommitCallbacks} callbacks @param {number} attempt */
    function scheduleRafAttempt(targetRevision, callbacks, attempt) {
      setStateField(
        "rafHandle",
        requestFrame(function () {
          setStateField("rafHandle", null);

          if (commitIfReady(targetRevision, callbacks)) {
            return;
          }

          if (attempt < MAX_RAF_ATTEMPTS) {
            scheduleRafAttempt(targetRevision, callbacks, attempt + 1);
            return;
          }

          installDeferredObservers(targetRevision, callbacks);
        })
      );
    }

    function initState() {
      clearAsyncHandles();
      clearPendingState();
      state = createState(nextInstanceId(instancePrefix));
      markStateSnapshotDirty();
      return getState();
    }

    /** @param {unknown} props @returns {number} */
    function recordRender(props) {
      setStateField("lastProps", props);
      setStateField("renderRevision", state.renderRevision + 1);
      return state.renderRevision;
    }

    /** @param {DyniHostCommitCallbacks} callbacks @returns {boolean} */
    function scheduleCommit(callbacks) {
      const targetRevision = state.renderRevision;

      if (state.commitPending && state.scheduledRevision === targetRevision) {
        return false;
      }

      if (state.commitPending) {
        clearAsyncHandles();
        clearPendingState();
      }

      setStateField("commitPending", true);
      setStateField("scheduledRevision", targetRevision);
      scheduleRafAttempt(targetRevision, callbacks || {}, 1);
      return true;
    }

    function cleanup() {
      clearAsyncHandles();
      clearPendingState();
      setStateField("rootEl", null);
      setStateField("shellEl", null);
    }

    return {
      initState: initState,
      recordRender: recordRender,
      scheduleCommit: scheduleCommit,
      cleanup: cleanup,
      getState: getState
    };
  }

  runtime.createHostCommitController = createHostCommitController;
})(this);
