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
    const hostContext = {
      __dyniHostCommitState: {
        rootEl: created.root,
        shellEl: null
      }
    };

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
