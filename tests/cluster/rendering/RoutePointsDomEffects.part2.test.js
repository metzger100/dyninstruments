// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

const EFFECT_STATE_KEY = "__dyniRoutePointsDomEffects";

describe("RoutePointsDomEffects (part2 - fallback and guard branches)", function () {
  function createDomEffects() {
    const htmlWidgetUtils = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsDomEffects.js").create(
      {},
      createComponentContextMock({
        modules: {
          HtmlWidgetUtils: htmlWidgetUtils
        }
      })
    );
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

  afterEach(function () {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  describe("isConnectedNode via applyCommittedEffects", function () {
    it("treats a non-object truthy targetEl as disconnected", function () {
      const domEffects = createDomEffects();
      expect(domEffects.applyCommittedEffects({ targetEl: "not-an-element" })).toEqual({
        targetEl: null,
        isVerticalCommitted: false,
        scrollbarGutterPx: 0
      });
    });

    it("treats a plain object without isConnected as connected (fallback true)", function () {
      const domEffects = createDomEffects();
      const bareTarget = {};
      const result = domEffects.applyCommittedEffects({ targetEl: bareTarget });
      expect(result.targetEl).toBe(bareTarget);
      expect(result.isVerticalCommitted).toBe(false);
      expect(result.scrollbarGutterPx).toBe(0);
    });
  });

  describe("isVerticalContainer guard", function () {
    it("returns false for null and for elements without closest()", function () {
      const domEffects = createDomEffects();
      expect(domEffects.isVerticalContainer(null)).toBe(false);
      expect(domEffects.isVerticalContainer({})).toBe(false);
    });
  });

  describe("measureListScrollbarGutter guards", function () {
    it("returns 0 for a null targetEl", function () {
      const domEffects = createDomEffects();
      expect(domEffects.measureListScrollbarGutter(null)).toBe(0);
    });

    it("returns 0 when no .dyni-route-points-list is found", function () {
      const domEffects = createDomEffects();
      const empty = document.createElement("div");
      expect(domEffects.measureListScrollbarGutter(empty)).toBe(0);
    });

    it("returns 0 when the list offsetWidth is not positive", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(1);
      defineFixedMetric(created.list, "offsetWidth", 0);
      expect(domEffects.measureListScrollbarGutter(created.root)).toBe(0);
    });

    it("returns 0 when the list clientWidth is not finite", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(1);
      defineFixedMetric(created.list, "clientWidth", NaN);
      expect(domEffects.measureListScrollbarGutter(created.root)).toBe(0);
    });

    it("returns 0 when offsetWidth does not exceed clientWidth", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(1);
      defineFixedMetric(created.list, "offsetWidth", 96);
      defineFixedMetric(created.list, "clientWidth", 96);
      expect(domEffects.measureListScrollbarGutter(created.root)).toBe(0);
    });
  });

  describe("ensureSelectedRowVisible guards", function () {
    it("returns false when listEl is missing or selectedIndex is negative", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(3);
      expect(domEffects.ensureSelectedRowVisible(null, 0)).toBe(false);
      expect(domEffects.ensureSelectedRowVisible(created.list, -1)).toBe(false);
    });

    it("returns false when no row matches the selected index", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(3);
      expect(domEffects.ensureSelectedRowVisible(created.list, 999)).toBe(false);
    });

    it("returns false when the computed viewport height is not positive", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(2);
      defineFixedMetric(created.list, "clientHeight", 0);
      expect(domEffects.ensureSelectedRowVisible(created.list, 0)).toBe(false);
    });

    it("uses getBoundingClientRect height when clientHeight/offsetHeight are unusable", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(5);
      defineFixedMetric(created.list, "clientHeight", 0);
      created.list.getBoundingClientRect = function () {
        return { height: 50, top: 0 };
      };
      created.list.scrollTop = 0;

      const moved = domEffects.ensureSelectedRowVisible(created.list, 4);
      expect(moved).toBe(true);
      expect(created.list.scrollTop).toBe(50);
    });

    it("uses getBoundingClientRect diff for row offset when offsetTop is not finite", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(1);
      const row = created.list.querySelector('[data-rp-row="0"]');

      defineFixedMetric(row, "offsetTop", NaN);
      row.getBoundingClientRect = function () {
        return { top: 130 };
      };
      created.list.getBoundingClientRect = function () {
        return { top: 100 };
      };
      created.list.scrollTop = 5;

      const moved = domEffects.ensureSelectedRowVisible(created.list, 0);
      expect(moved).toBe(true);
      expect(created.list.scrollTop).toBe(15);
    });

    it("returns false when the normalized next scroll position rounds to the current one", function () {
      const domEffects = createDomEffects();
      const created = createListRoot(1);
      const row = created.list.querySelector('[data-rp-row="0"]');

      defineFixedMetric(row, "offsetTop", 30.5);
      defineFixedMetric(row, "offsetHeight", 20);
      defineFixedMetric(created.list, "clientHeight", 40);
      defineFixedMetric(created.list, "scrollTop", 10);

      const moved = domEffects.ensureSelectedRowVisible(created.list, 0);
      expect(moved).toBe(false);
      expect(created.list.scrollTop).toBe(10);
    });
  });

  describe("maybeRevealActiveRow guards", function () {
    it("returns false without throwing when hostContext is missing", function () {
      const domEffects = createDomEffects();
      expect(domEffects.maybeRevealActiveRow({ selectedIndex: 4 })).toBe(false);
      expect(domEffects.maybeRevealActiveRow(undefined)).toBe(false);
    });

    it("returns false and schedules nothing when selectedIndex is negative", function () {
      vi.useFakeTimers();
      const domEffects = createDomEffects();
      const created = createListRoot(3);
      const hostContext = createHostContext(created.root);

      const scheduled = domEffects.maybeRevealActiveRow({
        hostContext: hostContext,
        rootEl: created.root,
        selectedIndex: -1,
        activeKey: "id:wp-0"
      });
      vi.runAllTimers();

      expect(scheduled).toBe(false);
      expect(created.list.scrollTop).toBe(0);
    });
  });

  describe("maybeRevealActiveRow scheduled-timer guards", function () {
    it("skips the reveal when the token becomes stale before the timer fires", function () {
      vi.useFakeTimers();
      const domEffects = createDomEffects();
      const created = createListRoot(5);
      const hostContext = createHostContext(created.root);
      created.list.scrollTop = 0;

      const scheduled = domEffects.maybeRevealActiveRow({
        hostContext: hostContext,
        rootEl: created.root,
        selectedIndex: 4,
        activeKey: "id:wp-4",
        reason: "mount"
      });
      expect(scheduled).toBe(true);

      // Simulate a race where another in-flight reveal bumped the token
      // before this scheduled timer fires.
      hostContext[EFFECT_STATE_KEY].token += 1;

      vi.runAllTimers();

      expect(created.list.scrollTop).toBe(0);
    });

    it("skips the reveal when the root is disconnected before the timer fires", function () {
      vi.useFakeTimers();
      const domEffects = createDomEffects();
      const created = createListRoot(5);
      const hostContext = createHostContext(created.root);
      created.list.scrollTop = 0;

      const scheduled = domEffects.maybeRevealActiveRow({
        hostContext: hostContext,
        rootEl: created.root,
        selectedIndex: 4,
        activeKey: "id:wp-4",
        reason: "mount"
      });
      expect(scheduled).toBe(true);

      document.body.removeChild(created.root);

      vi.runAllTimers();

      expect(created.list.scrollTop).toBe(0);
    });

    it("skips the reveal when the resolved root at fire-time no longer matches the scheduled root", function () {
      vi.useFakeTimers();
      const domEffects = createDomEffects();
      const createdA = createListRoot(5);
      const createdB = createListRoot(5);
      const hostContext = createHostContext(createdA.root);
      createdA.list.scrollTop = 0;

      const args = {
        hostContext: hostContext,
        rootEl: createdA.root,
        selectedIndex: 4,
        activeKey: "id:wp-4",
        reason: "mount"
      };
      const scheduled = domEffects.maybeRevealActiveRow(args);
      expect(scheduled).toBe(true);

      // Mutate the same args object the closure captured, simulating the
      // committed root changing between scheduling and the timer firing.
      args.rootEl = createdB.root;

      vi.runAllTimers();

      expect(createdA.list.scrollTop).toBe(0);
    });
  });
});
