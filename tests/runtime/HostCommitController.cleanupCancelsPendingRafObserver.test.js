// @ts-check
const { createHarness, createHostRoot, createShell } = require("./HostCommitController-setup");

describe("runtime/HostCommitController.js", function () {
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
