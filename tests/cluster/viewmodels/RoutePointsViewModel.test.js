const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsViewModel", function () {
  function createViewModel() {
    return loadFresh("cluster/viewmodels/RoutePointsViewModel.js").create();
  }

  function createToolkit() {
    return {
      num(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      }
    };
  }

  it("builds normalized route-points domain payload for a valid route", function () {
    const vm = createViewModel();
    const editingRoute = {
      name: "  Harbor Run  ",
      points: [
        { name: "  Start  ", lat: "54.101", lon: "10.402" },
        { name: "   ", lat: "bad", lon: null },
        { lat: 54.31, lon: 10.52 }
      ]
    };

    const out = vm.build({
      editingRoute: editingRoute,
      editingIndex: "2",
      activeName: "  Harbor Run  ",
      routeShowLL: true,
      useRhumbLine: false
    }, createToolkit());

    expect(out.route).toEqual({
      name: "Harbor Run",
      points: [
        { name: "Start", lat: 54.101, lon: 10.402 },
        { name: "1", lat: undefined, lon: undefined },
        { name: "2", lat: 54.31, lon: 10.52 }
      ],
      sourceRoute: editingRoute
    });
    expect(out.route.sourceRoute).toBe(editingRoute);
    expect(out.selectedIndex).toBe(2);
    expect(out.isActiveRoute).toBe(true);
    expect(out.showLatLon).toBe(true);
    expect(out.useRhumbLine).toBe(false);
  });

  it("returns route null when editingRoute is missing or invalid", function () {
    const vm = createViewModel();

    expect(vm.build({}, createToolkit()).route).toBeNull();
    expect(vm.build({ editingRoute: null }, createToolkit()).route).toBeNull();
    expect(vm.build({ editingRoute: "bad" }, createToolkit()).route).toBeNull();
    expect(vm.build({
      editingRoute: { name: "Harbor Run", points: "bad" }
    }, createToolkit()).route).toBeNull();
  });

  it("keeps an empty points array as a valid empty route", function () {
    const vm = createViewModel();
    const out = vm.build({
      editingRoute: { name: "  Empty Route  ", points: [] }
    }, createToolkit());

    expect(out.route).toEqual({
      name: "Empty Route",
      points: [],
      sourceRoute: { name: "  Empty Route  ", points: [] }
    });
  });

  it("normalizes editingIndex to finite number or -1", function () {
    const vm = createViewModel();

    expect(vm.build({ editingIndex: "5" }, createToolkit()).selectedIndex).toBe(5);
    expect(vm.build({ editingIndex: "-1" }, createToolkit()).selectedIndex).toBe(-1);
    expect(vm.build({ editingIndex: "bad" }, createToolkit()).selectedIndex).toBe(-1);
    expect(vm.build({}, createToolkit()).selectedIndex).toBe(-1);
  });

  it("derives isActiveRoute only for exact non-empty activeName match", function () {
    const vm = createViewModel();
    const editingRoute = { name: "Harbor Run", points: [] };

    expect(vm.build({
      editingRoute: editingRoute,
      activeName: "Harbor Run"
    }, createToolkit()).isActiveRoute).toBe(true);

    expect(vm.build({
      editingRoute: editingRoute,
      activeName: "Harbor run"
    }, createToolkit()).isActiveRoute).toBe(false);

    expect(vm.build({
      editingRoute: editingRoute,
      activeName: ""
    }, createToolkit()).isActiveRoute).toBe(false);

    expect(vm.build({
      editingRoute: null,
      activeName: "Harbor Run"
    }, createToolkit()).isActiveRoute).toBe(false);
  });

  it("passes showLatLon and useRhumbLine as strict booleans", function () {
    const vm = createViewModel();

    expect(vm.build({
      routeShowLL: true,
      useRhumbLine: true
    }, createToolkit())).toMatchObject({
      showLatLon: true,
      useRhumbLine: true
    });

    expect(vm.build({
      routeShowLL: 1,
      useRhumbLine: "yes"
    }, createToolkit())).toMatchObject({
      showLatLon: false,
      useRhumbLine: false
    });
  });
});
