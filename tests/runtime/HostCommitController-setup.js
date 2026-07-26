const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

function createHostRoot() {
  return {
    classList: {
      // @ts-ignore -- pre-existing untyped test mock boundary
      contains(name) {
        return name === "dyniplugin" || name === "dyni-host-html";
      }
    }
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createShell(rootEl) {
  return {
    // @ts-ignore -- pre-existing untyped test mock boundary
    closest(selector) {
      return selector === ".widget.dyniplugin" ? rootEl : null;
    }
  };
}

function createHarness() {
  // @ts-ignore -- pre-existing untyped test mock boundary
  let shell = null;
  // @ts-ignore -- pre-existing untyped test mock boundary
  const rafQueue = [];
  // @ts-ignore -- pre-existing untyped test mock boundary
  const canceledRafs = [];
  let rafId = 0;

  // @ts-ignore -- pre-existing untyped test mock boundary
  const timeoutQueue = [];
  // @ts-ignore -- pre-existing untyped test mock boundary
  const clearedTimeouts = [];
  let timeoutId = 0;

  // @ts-ignore -- pre-existing untyped test mock boundary
  const observerInstances = [];
  // @ts-ignore -- pre-existing untyped test mock boundary
  function MutationObserverStub(callback) {
    // @ts-ignore -- pre-existing untyped test mock boundary
    this.callback = callback;
    // @ts-ignore -- pre-existing untyped test mock boundary
    this.observe = vi.fn();
    // @ts-ignore -- pre-existing untyped test mock boundary
    this.disconnect = vi.fn();
    // @ts-ignore -- pre-existing untyped test mock boundary
    observerInstances.push(this);
  }

  // @ts-ignore -- pre-existing untyped test mock boundary
  function requestAnimationFrameStub(callback) {
    rafId += 1;
    rafQueue.push({ id: rafId, callback: callback });
    return rafId;
  }

  // @ts-ignore -- pre-existing untyped test mock boundary
  function cancelAnimationFrameStub(handle) {
    canceledRafs.push(handle);
    const next = [];
    for (let i = 0; i < rafQueue.length; i++) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      if (rafQueue[i].id !== handle) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        next.push(rafQueue[i]);
      }
    }
    rafQueue.length = 0;
    // @ts-ignore -- pre-existing untyped test mock boundary
    Array.prototype.push.apply(rafQueue, next);
  }

  // @ts-ignore -- pre-existing untyped test mock boundary
  function setTimeoutStub(callback, delay) {
    timeoutId += 1;
    timeoutQueue.push({ id: timeoutId, callback: callback, delay: delay });
    return timeoutId;
  }

  // @ts-ignore -- pre-existing untyped test mock boundary
  function clearTimeoutStub(handle) {
    clearedTimeouts.push(handle);
    const next = [];
    for (let i = 0; i < timeoutQueue.length; i++) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      if (timeoutQueue[i].id !== handle) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        next.push(timeoutQueue[i]);
      }
    }
    timeoutQueue.length = 0;
    // @ts-ignore -- pre-existing untyped test mock boundary
    Array.prototype.push.apply(timeoutQueue, next);
  }

  const document = {
    body: {},
    querySelector: vi.fn(function () {
      // @ts-ignore -- pre-existing untyped test mock boundary
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
    // @ts-ignore -- pre-existing untyped test mock boundary
    const task = rafQueue.shift();
    if (!task) {
      throw new Error("No requestAnimationFrame callback queued");
    }
    task.callback();
    return task.id;
  }

  function runNextTimeout() {
    // @ts-ignore -- pre-existing untyped test mock boundary
    const task = timeoutQueue.shift();
    if (!task) {
      throw new Error("No timeout callback queued");
    }
    task.callback();
    return task.id;
  }

  // @ts-ignore -- pre-existing untyped test mock boundary
  function triggerObserver(index) {
    const targetIndex = Number.isInteger(index) ? index : 0;
    // @ts-ignore -- pre-existing untyped test mock boundary
    const observer = observerInstances[targetIndex];
    if (!observer) {
      throw new Error("No MutationObserver instance at index " + String(targetIndex));
    }
    observer.callback([{ type: "childList" }]);
  }

  return {
    createController: context.DyniPlugin.runtime.createHostCommitController,
    // @ts-ignore -- pre-existing untyped test mock boundary
    setShell(nextShell) {
      shell = nextShell;
    },
    document,
    // @ts-ignore -- pre-existing untyped test mock boundary
    rafQueue,
    // @ts-ignore -- pre-existing untyped test mock boundary
    canceledRafs,
    // @ts-ignore -- pre-existing untyped test mock boundary
    timeoutQueue,
    // @ts-ignore -- pre-existing untyped test mock boundary
    clearedTimeouts,
    // @ts-ignore -- pre-existing untyped test mock boundary
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
