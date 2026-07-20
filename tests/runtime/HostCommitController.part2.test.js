// @ts-nocheck
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/HostCommitController.js", function () {
  function createHostRoot() {
    return {
      classList: {
        contains(name) {
          return name === "dyniplugin" || name === "dyni-host-html";
        }
      }
    };
  }

  function createShell(rootEl) {
    return {
      closest(selector) {
        return selector === ".widget.dyniplugin" ? rootEl : null;
      }
    };
  }

  function createHarness() {
    let shell = null;
    const rafQueue = [];
    const canceledRafs = [];
    let rafId = 0;

    const timeoutQueue = [];
    const clearedTimeouts = [];
    let timeoutId = 0;

    const observerInstances = [];
    function MutationObserverStub(callback) {
      this.callback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      observerInstances.push(this);
    }

    function requestAnimationFrameStub(callback) {
      rafId += 1;
      rafQueue.push({ id: rafId, callback: callback });
      return rafId;
    }

    function cancelAnimationFrameStub(handle) {
      canceledRafs.push(handle);
      const next = [];
      for (let i = 0; i < rafQueue.length; i++) {
        if (rafQueue[i].id !== handle) {
          next.push(rafQueue[i]);
        }
      }
      rafQueue.length = 0;
      Array.prototype.push.apply(rafQueue, next);
    }

    function setTimeoutStub(callback, delay) {
      timeoutId += 1;
      timeoutQueue.push({ id: timeoutId, callback: callback, delay: delay });
      return timeoutId;
    }

    function clearTimeoutStub(handle) {
      clearedTimeouts.push(handle);
      const next = [];
      for (let i = 0; i < timeoutQueue.length; i++) {
        if (timeoutQueue[i].id !== handle) {
          next.push(timeoutQueue[i]);
        }
      }
      timeoutQueue.length = 0;
      Array.prototype.push.apply(timeoutQueue, next);
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

    function triggerObserver(index) {
      const targetIndex = Number.isInteger(index) ? index : 0;
      const observer = observerInstances[targetIndex];
      if (!observer) {
        throw new Error("No MutationObserver instance at index " + String(targetIndex));
      }
      observer.callback([{ type: "childList" }]);
    }

    return {
      createController: context.DyniPlugin.runtime.createHostCommitController,
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

  it("cleanup cancels pending rAF, observer, and timeout handles", function () {
    const harness = createHarness();
    const controller = harness.createController();

    controller.recordRender({ value: 9 });
    controller.scheduleCommit({ onCommit: vi.fn() });
    const rafId = harness.rafQueue[0].id;
    controller.cleanup();

    expect(harness.canceledRafs).toContain(rafId);
    expect(controller.getState().commitPending).toBe(false);

    controller.recordRender({ value: 10 });
    controller.scheduleCommit({ onCommit: vi.fn() });
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();

    expect(harness.observerInstances).toHaveLength(1);
    const observer = harness.observerInstances[0];
    expect(harness.timeoutQueue).toHaveLength(1);
    const timeoutId = harness.timeoutQueue[0].id;

    controller.cleanup();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.clearedTimeouts).toContain(timeoutId);
    const state = controller.getState();
    expect(state.rootEl).toBe(null);
    expect(state.shellEl).toBe(null);
    expect(state.commitPending).toBe(false);
  });

  it("uses timeout as last fallback when MutationObserver is unavailable", function () {
    const harness = createHarness();
    const controller = harness.createController({ MutationObserver: null });
    const rootEl = createHostRoot();
    const shellEl = createShell(rootEl);
    const onCommit = vi.fn();

    controller.recordRender({ value: 11 });
    controller.scheduleCommit({ onCommit: onCommit });
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();

    expect(harness.observerInstances).toHaveLength(0);
    expect(harness.timeoutQueue).toHaveLength(1);

    harness.setShell(shellEl);
    harness.runNextTimeout();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0].rootEl).toBe(rootEl);
  });

  it("abandons observer fallback after timeout ceiling when shell never appears", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const onCommit = vi.fn();

    controller.recordRender({ value: 12 });
    controller.scheduleCommit({ onCommit: onCommit });

    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();

    expect(harness.observerInstances).toHaveLength(1);
    const observer = harness.observerInstances[0];
    expect(harness.timeoutQueue).toHaveLength(1);
    expect(harness.timeoutQueue[0].delay).toBe(2000);

    harness.runNextTimeout();

    expect(onCommit).not.toHaveBeenCalled();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    const state = controller.getState();
    expect(state.commitPending).toBe(false);
    expect(state.scheduledRevision).toBe(null);
    expect(state.mountedRevision).toBe(0);
  });

  it("abandons active observer fallback handles when a newer revision is scheduled", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const onCommitOld = vi.fn();
    const onCommitNew = vi.fn();
    const rootEl = createHostRoot();
    const shellEl = createShell(rootEl);

    controller.recordRender({ value: 1 });
    controller.scheduleCommit({ onCommit: onCommitOld });
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();

    const oldObserver = harness.observerInstances[0];
    const oldTimeoutId = harness.timeoutQueue[0].id;

    controller.recordRender({ value: 2 });
    controller.scheduleCommit({ onCommit: onCommitNew });

    expect(oldObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.clearedTimeouts).toContain(oldTimeoutId);
    expect(onCommitOld).not.toHaveBeenCalled();

    harness.setShell(shellEl);
    harness.runNextRaf();

    expect(onCommitNew).toHaveBeenCalledTimes(1);
    expect(onCommitNew.mock.calls[0][0].revision).toBe(2);
  });
});
