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
