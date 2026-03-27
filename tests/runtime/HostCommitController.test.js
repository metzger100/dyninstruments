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
    const spans = [];

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
      __DYNI_PERF_HOOKS__: {
        startSpan(name, tags) {
          return { name, tags: tags || null };
        },
        endSpan(token, tags) {
          spans.push({
            name: token && token.name,
            tags: {
              ...(token && token.tags ? token.tags : {}),
              ...(tags && typeof tags === "object" ? tags : {})
            }
          });
        }
      },
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/PerfSpanHelper.js", context);
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
      spans,
      runNextRaf,
      runNextTimeout,
      triggerObserver
    };
  }

  it("initState creates a complete state shape without DOM queries", function () {
    const harness = createHarness();
    const controller = harness.createController();

    harness.document.querySelector.mockClear();
    const state = controller.initState();

    expect(harness.document.querySelector).not.toHaveBeenCalled();
    expect(typeof state.instanceId).toBe("string");
    expect(state).toMatchObject({
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
    });
  });

  it("scheduleCommit resolves shell/root via data-dyni-instance after requestAnimationFrame", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const rootEl = createHostRoot();
    const shellEl = createShell(rootEl);
    harness.setShell(shellEl);

    controller.recordRender({ kind: "activeRoute" });
    const onCommit = vi.fn();

    expect(controller.scheduleCommit({ onCommit: onCommit })).toBe(true);
    expect(harness.rafQueue).toHaveLength(1);

    harness.runNextRaf();

    expect(harness.document.querySelector).toHaveBeenCalled();
    expect(harness.document.querySelector.mock.calls[0][0]).toContain('.widgetData.dyni-shell[data-dyni-instance="');
    expect(onCommit).toHaveBeenCalledTimes(1);
    const payload = onCommit.mock.calls[0][0];
    expect(payload.revision).toBe(1);
    expect(payload.rootEl).toBe(rootEl);
    expect(payload.shellEl).toBe(shellEl);
    expect(payload.props).toEqual({ kind: "activeRoute" });

    const state = controller.getState();
    expect(state.commitPending).toBe(false);
    expect(state.mountedRevision).toBe(1);
    expect(state.rootEl).toBe(rootEl);
    expect(state.shellEl).toBe(shellEl);
  });

  it("discards stale commits when renderRevision changed before the frame callback", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const rootEl = createHostRoot();
    const shellEl = createShell(rootEl);
    harness.setShell(shellEl);

    controller.recordRender({ value: 1 });
    const onCommit = vi.fn();
    controller.scheduleCommit({ onCommit: onCommit });

    controller.recordRender({ value: 2 });
    harness.runNextRaf();

    expect(onCommit).not.toHaveBeenCalled();
    const state = controller.getState();
    expect(state.commitPending).toBe(false);
    expect(state.scheduledRevision).toBe(null);
    expect(state.mountedRevision).toBe(0);
  });

  it("deduplicates scheduleCommit calls for the same revision", function () {
    const harness = createHarness();
    const controller = harness.createController();

    controller.recordRender({ value: 12 });

    expect(controller.scheduleCommit({ onCommit: vi.fn() })).toBe(true);
    expect(controller.scheduleCommit({ onCommit: vi.fn() })).toBe(false);
    expect(harness.rafQueue).toHaveLength(1);
  });

  it("activates MutationObserver fallback after four rAF misses", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const onCommit = vi.fn();

    controller.recordRender({ value: 5 });
    controller.scheduleCommit({ onCommit: onCommit });

    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();
    harness.runNextRaf();

    expect(harness.observerInstances).toHaveLength(1);
    const observer = harness.observerInstances[0];
    expect(observer.observe).toHaveBeenCalledTimes(1);
    expect(observer.observe).toHaveBeenCalledWith(harness.document.body, { childList: true, subtree: true });
    expect(harness.timeoutQueue).toHaveLength(1);
    expect(harness.timeoutQueue[0].delay).toBe(2000);

    const rootEl = createHostRoot();
    const shellEl = createShell(rootEl);
    harness.setShell(shellEl);
    harness.triggerObserver(0);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

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
    expect(harness.spans.some((entry) => entry.tags.waitStage === "observer-timeout")).toBe(true);
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

  it("records wait-stage classification for each host-commit completion path", function () {
    const rafOneHarness = createHarness();
    const rafOneController = rafOneHarness.createController();
    const rafOneRoot = createHostRoot();
    const rafOneShell = createShell(rafOneRoot);
    rafOneHarness.setShell(rafOneShell);
    rafOneController.recordRender({ kind: "activeRoute" });
    rafOneController.scheduleCommit({ onCommit: vi.fn() });
    rafOneHarness.runNextRaf();
    expect(rafOneHarness.spans.some((entry) => entry.tags.waitStage === "raf-1")).toBe(true);

    const rafTwoHarness = createHarness();
    const rafTwoController = rafTwoHarness.createController();
    const rafTwoRoot = createHostRoot();
    const rafTwoShell = createShell(rafTwoRoot);
    rafTwoController.recordRender({ value: 2 });
    rafTwoController.scheduleCommit({ onCommit: vi.fn() });
    rafTwoHarness.runNextRaf();
    rafTwoHarness.setShell(rafTwoShell);
    rafTwoHarness.runNextRaf();
    expect(rafTwoHarness.spans.some((entry) => entry.tags.waitStage === "raf-2")).toBe(true);

    const observerHarness = createHarness();
    const observerController = observerHarness.createController();
    const observerRoot = createHostRoot();
    const observerShell = createShell(observerRoot);
    observerController.recordRender({ value: 3 });
    observerController.scheduleCommit({ onCommit: vi.fn() });
    observerHarness.runNextRaf();
    observerHarness.runNextRaf();
    observerHarness.runNextRaf();
    observerHarness.runNextRaf();
    observerHarness.setShell(observerShell);
    observerHarness.triggerObserver(0);
    expect(observerHarness.spans.some((entry) => entry.tags.waitStage === "mutation-observer")).toBe(true);

    const timeoutHarness = createHarness();
    const timeoutController = timeoutHarness.createController({ MutationObserver: null });
    const timeoutRoot = createHostRoot();
    const timeoutShell = createShell(timeoutRoot);
    timeoutController.recordRender({ value: 4 });
    timeoutController.scheduleCommit({ onCommit: vi.fn() });
    timeoutHarness.runNextRaf();
    timeoutHarness.runNextRaf();
    timeoutHarness.runNextRaf();
    timeoutHarness.runNextRaf();
    timeoutHarness.setShell(timeoutShell);
    timeoutHarness.runNextTimeout();
    expect(timeoutHarness.spans.some((entry) => entry.tags.waitStage === "timeout")).toBe(true);

    const rafFourHarness = createHarness();
    const rafFourController = rafFourHarness.createController();
    const rafFourRoot = createHostRoot();
    const rafFourShell = createShell(rafFourRoot);
    rafFourController.recordRender({ value: 5 });
    rafFourController.scheduleCommit({ onCommit: vi.fn() });
    rafFourHarness.runNextRaf();
    rafFourHarness.runNextRaf();
    rafFourHarness.runNextRaf();
    rafFourHarness.setShell(rafFourShell);
    rafFourHarness.runNextRaf();
    expect(rafFourHarness.spans.some((entry) => entry.tags.waitStage === "raf-4")).toBe(true);
  });

  it("returns the same getState snapshot reference when state is unchanged", function () {
    const harness = createHarness();
    const controller = harness.createController();

    const first = controller.getState();
    const second = controller.getState();

    expect(second).toBe(first);
  });

  it("returns a new getState snapshot after each meaningful state mutation", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const onCommit = vi.fn();

    const initial = controller.getState();
    controller.recordRender({ value: 1 });
    const afterRender = controller.getState();
    expect(afterRender).not.toBe(initial);
    expect(controller.getState()).toBe(afterRender);

    controller.scheduleCommit({ onCommit: onCommit });
    const afterSchedule = controller.getState();
    expect(afterSchedule).not.toBe(afterRender);
    expect(afterSchedule.commitPending).toBe(true);
    expect(controller.getState()).toBe(afterSchedule);
  });

  it("keeps post-commit state snapshots stable across repeated reads", function () {
    const harness = createHarness();
    const controller = harness.createController();
    const rootEl = createHostRoot();
    const shellEl = createShell(rootEl);
    const onCommit = vi.fn();

    harness.setShell(shellEl);
    controller.recordRender({ kind: "activeRoute" });
    controller.scheduleCommit({ onCommit: onCommit });
    harness.runNextRaf();

    const first = controller.getState();
    const second = controller.getState();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(first.commitPending).toBe(false);
    expect(first.mountedRevision).toBe(1);
    expect(second).toBe(first);
  });
});
