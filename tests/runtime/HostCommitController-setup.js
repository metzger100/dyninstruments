const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

function createHostRoot() {
  return {
    classList: {
      /** @param {string} name */
      contains(name) {
        return name === "dyniplugin" || name === "dyni-host-html";
      }
    }
  };
}

/** @param {object} rootEl */
function createShell(rootEl) {
  return {
    /** @param {string} selector */
    closest(selector) {
      return selector === ".widget.dyniplugin" ? rootEl : null;
    }
  };
}

function createHarness() {
  /** @type {ReturnType<typeof createShell> | null} */
  let shell = null;
  const rafQueue = /** @type {Array<{ callback: () => void, id: number }>} */ ([]);
  const canceledRafs = /** @type {number[]} */ ([]);
  let rafId = 0;

  const timeoutQueue = /** @type {Array<{ callback: () => void, delay: number | undefined, id: number }>} */ ([]);
  const clearedTimeouts = /** @type {number[]} */ ([]);
  let timeoutId = 0;

  const observerInstances = /** @type {MutationObserverStub[]} */ ([]);
  class MutationObserverStub {
    /** @param {(records: Array<{ type: string }>) => void} callback */
    constructor(callback) {
      this.callback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      observerInstances.push(this);
    }
  }

  /** @param {() => void} callback */
  function requestAnimationFrameStub(callback) {
    rafId += 1;
    rafQueue.push({ id: rafId, callback: callback });
    return rafId;
  }

  /** @param {number} handle */
  function cancelAnimationFrameStub(handle) {
    canceledRafs.push(handle);
    const next = [];
    for (let i = 0; i < rafQueue.length; i++) {
      if (rafQueue[i].id !== handle) {
        next.push(rafQueue[i]);
      }
    }
    rafQueue.length = 0;
    rafQueue.push(...next);
  }

  /** @param {() => void} callback @param {number} [delay] */
  function setTimeoutStub(callback, delay) {
    timeoutId += 1;
    timeoutQueue.push({ id: timeoutId, callback: callback, delay: delay });
    return timeoutId;
  }

  /** @param {number} handle */
  function clearTimeoutStub(handle) {
    clearedTimeouts.push(handle);
    const next = [];
    for (let i = 0; i < timeoutQueue.length; i++) {
      if (timeoutQueue[i].id !== handle) {
        next.push(timeoutQueue[i]);
      }
    }
    timeoutQueue.length = 0;
    timeoutQueue.push(...next);
  }

  const document = {
    body: {},
    querySelector: vi.fn(function () {
      return shell;
    })
  };

  const context = createScriptContext({
    document: document,
    requestAnimationFrame: requestAnimationFrameStub,
    cancelAnimationFrame: cancelAnimationFrameStub,
    setTimeout: setTimeoutStub,
    clearTimeout: clearTimeoutStub,
    MutationObserver: MutationObserverStub,
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });

  runIifeScript("runtime/HostCommitController.js", context);

  function runNextRaf() {
    const task = rafQueue.shift();
    if (!task) {
      throw new Error("No requestAnimationFrame callback queued");
    }
    task.callback();
    return task.id;
  }

  function runNextTimeout() {
    const task = timeoutQueue.shift();
    if (!task) {
      throw new Error("No timeout callback queued");
    }
    task.callback();
    return task.id;
  }

  /** @param {number} [index] */
  function triggerObserver(index) {
    const targetIndex = Number.isInteger(index) ? Number(index) : 0;
    const observer = observerInstances[targetIndex];
    if (!observer) {
      throw new Error("No MutationObserver instance at index " + String(targetIndex));
    }
    observer.callback([{ type: "childList" }]);
  }

  return {
    createController: context.DyniPlugin.runtime.createHostCommitController,
    /** @param {ReturnType<typeof createShell> | null} nextShell */
    setShell(nextShell) {
      shell = nextShell;
    },
    document,
    rafQueue,
    canceledRafs,
    timeoutQueue,
    clearedTimeouts,
    observerInstances,
    runNextRaf,
    runNextTimeout,
    triggerObserver
  };
}

module.exports = {
  createHarness,
  createHostRoot,
  createScriptContext,
  createShell,
  runIifeScript
};
