const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteViewModel", function () {
  function createViewModel(centerMathFactory) {
    const Helpers = {
      getModule(id) {
        if (id === "CenterDisplayMath") {
          if (typeof centerMathFactory === "function") {
            return { create: centerMathFactory };
          }
          return loadFresh("shared/widget-kits/nav/CenterDisplayMath.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return loadFresh("cluster/viewmodels/EditRouteViewModel.js").create({}, Helpers);
  }

  it("returns route null for missing or invalid editingRoute inputs", function () {
    const vm = createViewModel();

    expect(vm.build({}).route).toBeNull();
    expect(vm.build({ editingRoute: null }).route).toBeNull();
    expect(vm.build({ editingRoute: "bad" }).route).toBeNull();
    expect(vm.build({ editingRoute: { name: "A", points: "bad" } }).route).toBeNull();
  });

  it("keeps empty points arrays as valid routes with zero totals", function () {
    const vm = createViewModel();
    const sourceRoute = { name: "Empty Route", points: [] };
    const out = vm.build({ editingRoute: sourceRoute });

    expect(out).toEqual({
      route: {
        rawName: "Empty Route",
        displayName: "Empty Route",
        pointCount: 0,
        totalDistance: 0,
        isLocalRoute: false,
        isServerRoute: true,
        sourceRoute: sourceRoute
      },
      hasRoute: true,
      isActiveRoute: false,
      remainingDistance: undefined,
      eta: undefined
    });
  });

  it("strips local@ prefix for display name while preserving blank names", function () {
    const vm = createViewModel();

    const localOut = vm.build({
      editingRoute: { name: "local@Harbor Run", points: [] }
    });
    expect(localOut.route.displayName).toBe("Harbor Run");
    expect(localOut.route.isLocalRoute).toBe(true);
    expect(localOut.route.isServerRoute).toBe(false);

    const blankOut = vm.build({
      editingRoute: { name: "", points: [] }
    });
    expect(blankOut.route.displayName).toBe("");
    expect(blankOut.route.isLocalRoute).toBe(true);
    expect(blankOut.route.isServerRoute).toBe(false);
  });

  it("derives active state from exact raw-name equality and gates remain/eta by active state", function () {
    const vm = createViewModel();
    const eta = new Date("2026-03-31T09:30:00Z");

    const active = vm.build({
      editingRoute: { name: "Harbor Run", points: [] },
      activeName: "Harbor Run",
      rteDistance: "12.4",
      rteEta: eta
    });
    expect(active.isActiveRoute).toBe(true);
    expect(active.remainingDistance).toBe(12.4);
    expect(active.eta).toBe(eta);

    const inactive = vm.build({
      editingRoute: { name: "Harbor Run", points: [] },
      activeName: "harbor run",
      rteDistance: 99,
      rteEta: eta
    });
    expect(inactive.isActiveRoute).toBe(false);
    expect(inactive.remainingDistance).toBeUndefined();
    expect(inactive.eta).toBeUndefined();
  });

  it("uses computeLength fast path when available and finite", function () {
    const vm = createViewModel(function () {
      return {
        computeCourseDistance() {
          throw new Error("fallback must not run");
        }
      };
    });

    const out = vm.build({
      editingRoute: {
        name: "Harbor Run",
        points: [{ lat: 54.1, lon: 10.4 }, { lat: 54.2, lon: 10.5 }],
        computeLength(fromIndex, useRhumbLine) {
          expect(fromIndex).toBe(0);
          expect(useRhumbLine).toBe(true);
          return 321.5;
        }
      },
      useRhumbLine: true
    });

    expect(out.route.totalDistance).toBe(321.5);
  });

  it("falls back to leg summation when computeLength is missing, invalid, or throws", function () {
    const calls = [];
    const vm = createViewModel(function () {
      return {
        computeCourseDistance(previousPoint, currentPoint, useRhumbLine) {
          calls.push(useRhumbLine);
          if (currentPoint && currentPoint.badLeg === true) {
            return null;
          }
          return { distance: useRhumbLine ? 20 : 10 };
        }
      };
    });

    const noComputeLength = vm.build({
      editingRoute: {
        name: "NoMethod",
        points: [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }, { lat: 3, lon: 3 }]
      },
      useRhumbLine: false
    });
    expect(noComputeLength.route.totalDistance).toBe(20);

    const invalidComputeLength = vm.build({
      editingRoute: {
        name: "BadMethod",
        points: [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }, { lat: 3, lon: 3 }],
        computeLength() {
          return "NaN";
        }
      },
      useRhumbLine: true
    });
    expect(invalidComputeLength.route.totalDistance).toBe(40);

    const throwingComputeLength = vm.build({
      editingRoute: {
        name: "ThrowingMethod",
        points: [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }, { badLeg: true }],
        computeLength() {
          throw new Error("boom");
        }
      },
      useRhumbLine: true
    });
    expect(throwingComputeLength.route.totalDistance).toBe(20);

    expect(calls).toEqual([false, false, true, true, true, true]);
  });

  it("returns zero total distance for one-point routes", function () {
    const vm = createViewModel(function () {
      return {
        computeCourseDistance() {
          throw new Error("single-point routes should not compute legs");
        }
      };
    });

    const out = vm.build({
      editingRoute: {
        name: "Single",
        points: [{ lat: 54.1, lon: 10.4 }]
      }
    });

    expect(out.route.totalDistance).toBe(0);
  });

  it("never throws for malformed routes and malformed leg calculations", function () {
    const vm = createViewModel(function () {
      return {
        computeCourseDistance() {
          throw new Error("broken leg");
        }
      };
    });

    expect(function () {
      vm.build({
        editingRoute: {
          name: "local@Broken",
          points: [null, undefined, "bad"],
          computeLength() {
            throw new Error("broken computeLength");
          }
        }
      });
    }).not.toThrow();

    const out = vm.build({
      editingRoute: {
        name: "local@Broken",
        points: [null, undefined, "bad"],
        computeLength() {
          throw new Error("broken computeLength");
        }
      }
    });
    expect(out.route.totalDistance).toBe(0);
    expect(out.hasRoute).toBe(true);
  });
});
