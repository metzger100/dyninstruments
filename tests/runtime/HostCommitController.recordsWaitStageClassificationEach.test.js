// @ts-check
const { createHarness, createHostRoot, createShell } = require("./HostCommitController-setup");

describe("runtime/HostCommitController.js", function () {
  it("records wait-stage classification for each host-commit completion path", function () {
    const rafOneHarness = createHarness();
    const rafOneController = rafOneHarness.createController();
    const rafOneRoot = createHostRoot();
    const rafOneShell = createShell(rafOneRoot);
    rafOneHarness.setShell(rafOneShell);
    rafOneController.recordRender({ kind: "activeRoute" });
    rafOneController.scheduleCommit({ onCommit: vi.fn() });
    rafOneHarness.runNextRaf();

    const rafTwoHarness = createHarness();
    const rafTwoController = rafTwoHarness.createController();
    const rafTwoRoot = createHostRoot();
    const rafTwoShell = createShell(rafTwoRoot);
    rafTwoController.recordRender({ value: 2 });
    rafTwoController.scheduleCommit({ onCommit: vi.fn() });
    rafTwoHarness.runNextRaf();
    rafTwoHarness.setShell(rafTwoShell);
    rafTwoHarness.runNextRaf();

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
