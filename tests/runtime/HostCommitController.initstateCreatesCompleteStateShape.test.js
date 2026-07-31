// @ts-check
const { createHarness, createHostRoot, createShell } = require("./HostCommitController-setup");

describe("runtime/HostCommitController.js", function () {
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
    /** @type {import("vitest").Mock<(selector: string) => unknown>} */
    const querySelectorMock = harness.document.querySelector;
    expect(querySelectorMock.mock.calls[0][0]).toContain('.widgetData.dyni-shell[data-dyni-instance="');
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
});
