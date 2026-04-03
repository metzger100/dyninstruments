const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsDomEffects", function () {
  function createDomEffects() {
    return loadFresh("shared/widget-kits/nav/RoutePointsDomEffects.js").create();
  }

  function defineFixedMetric(target, key, value) {
    Object.defineProperty(target, key, {
      configurable: true,
      get() {
        return value;
      }
    });
  }

  function createListRoot(rowCount) {
    const root = document.createElement("div");
    const list = document.createElement("div");
    list.className = "dyni-route-points-list";
    root.appendChild(list);

    defineFixedMetric(list, "clientHeight", 40);
    defineFixedMetric(list, "clientWidth", 96);
    defineFixedMetric(list, "offsetWidth", 112);

    for (let i = 0; i < rowCount; i += 1) {
      const row = document.createElement("div");
      row.setAttribute("data-rp-row", String(i));
      defineFixedMetric(row, "offsetTop", i * 20);
      defineFixedMetric(row, "offsetHeight", 20);
      list.appendChild(row);
    }

    document.body.appendChild(root);
    return { root, list };
  }

  function createHostContext(root) {
    return {
      __dyniHostCommitState: {
        rootEl: root,
        shellEl: null
      }
    };
  }

  function runReveal(domEffects, hostContext, list, args) {
    const scheduled = domEffects.maybeRevealActiveRow(Object.assign({
      hostContext: hostContext,
      rootEl: hostContext.__dyniHostCommitState.rootEl
    }, args || {}));
    vi.runAllTimers();
    return { scheduled, scrollTop: list.scrollTop };
  }

  afterEach(function () {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("detects committed vertical-container ancestry", function () {
    const domEffects = createDomEffects();
    const vertical = document.createElement("div");
    vertical.className = "widgetContainer vertical";
    const shell = document.createElement("div");
    vertical.appendChild(shell);
    document.body.appendChild(vertical);

    expect(domEffects.isVerticalContainer(shell)).toBe(true);
    expect(domEffects.isVerticalContainer(document.createElement("div"))).toBe(false);
  });

  it("scrolls selected row into view only when needed", function () {
    const domEffects = createDomEffects();
    const created = createListRoot(5);

    created.list.scrollTop = 0;
    const movedDown = domEffects.ensureSelectedRowVisible(created.list, 4);
    expect(movedDown).toBe(true);
    expect(created.list.scrollTop).toBe(60);

    const alreadyVisible = domEffects.ensureSelectedRowVisible(created.list, 4);
    expect(alreadyVisible).toBe(false);

    created.list.scrollTop = 40;
    const movedUp = domEffects.ensureSelectedRowVisible(created.list, 0);
    expect(movedUp).toBe(true);
    expect(created.list.scrollTop).toBe(0);
  });

  it("drops stale scheduled visibility passes and keeps only the latest", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    created.list.scrollTop = 0;
    domEffects.scheduleSelectedRowVisibility({
      hostContext: hostContext,
      rootEl: created.root,
      selectedIndex: 4
    });
    domEffects.scheduleSelectedRowVisibility({
      hostContext: hostContext,
      rootEl: created.root,
      selectedIndex: 1
    });

    vi.runAllTimers();

    expect(created.list.scrollTop).toBe(0);
  });

  it("reveals active row once on mount and does not reveal again for same active key on rerender", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    const mount = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "mount"
    });
    expect(mount.scheduled).toBe(true);
    expect(mount.scrollTop).toBe(60);

    created.list.scrollTop = 0;
    const rerender = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4"
    });
    expect(rerender.scheduled).toBe(false);
    expect(rerender.scrollTop).toBe(0);
  });

  it("does not auto-reveal on resize when active key is unchanged", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "mount"
    });
    created.list.scrollTop = 0;

    const resize = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "resize"
    });
    expect(resize.scheduled).toBe(false);
    expect(resize.scrollTop).toBe(0);
  });

  it("does not auto-reveal on refit when active key is unchanged", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "mount"
    });
    created.list.scrollTop = 0;

    const refit = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "refit"
    });
    expect(refit.scheduled).toBe(false);
    expect(refit.scrollTop).toBe(0);
  });

  it("does not auto-reveal on layout recomputation when active key is unchanged", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "mount"
    });
    created.list.scrollTop = 0;

    const layout = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "layout"
    });
    expect(layout.scheduled).toBe(false);
    expect(layout.scrollTop).toBe(0);
  });

  it("does not auto-reveal on unrelated data refresh when active key is unchanged", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "mount"
    });
    created.list.scrollTop = 0;

    const refresh = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4",
      reason: "data-refresh"
    });
    expect(refresh.scheduled).toBe(false);
    expect(refresh.scrollTop).toBe(0);
  });

  it("auto-reveals when active waypoint key changes", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 0,
      activeKey: "id:wp-0",
      reason: "mount"
    });
    created.list.scrollTop = 0;

    const activeChange = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4"
    });
    expect(activeChange.scheduled).toBe(true);
    expect(activeChange.scrollTop).toBe(60);
  });

  it("reveals once per active change and does not repeat until active key changes again", function () {
    vi.useFakeTimers();
    const domEffects = createDomEffects();
    const created = createListRoot(5);
    const hostContext = createHostContext(created.root);

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 0,
      activeKey: "id:wp-0",
      reason: "mount"
    });

    runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4"
    });
    expect(created.list.scrollTop).toBe(60);

    created.list.scrollTop = 0;
    const sameActive = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 4,
      activeKey: "id:wp-4"
    });
    expect(sameActive.scheduled).toBe(false);
    expect(sameActive.scrollTop).toBe(0);

    const nextChange = runReveal(domEffects, hostContext, created.list, {
      selectedIndex: 2,
      activeKey: "id:wp-2"
    });
    expect(nextChange.scheduled).toBe(true);
    expect(nextChange.scrollTop).toBe(20);
  });

  it("resolves committed effects fail-closed when target is missing", function () {
    const domEffects = createDomEffects();
    const detached = document.createElement("div");

    expect(domEffects.applyCommittedEffects({ targetEl: null })).toEqual({
      targetEl: null,
      isVerticalCommitted: false,
      scrollbarGutterPx: 0
    });

    expect(domEffects.applyCommittedEffects({ targetEl: detached })).toEqual({
      targetEl: null,
      isVerticalCommitted: false,
      scrollbarGutterPx: 0
    });
  });

  it("measures list scrollbar gutter width from committed root", function () {
    const domEffects = createDomEffects();
    const created = createListRoot(2);

    expect(domEffects.measureListScrollbarGutter(created.root)).toBe(16);
    expect(domEffects.applyCommittedEffects({ targetEl: created.root }).scrollbarGutterPx).toBe(16);
  });
});
