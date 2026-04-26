const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteViewModel", function () {
  function createToolkit() {
    return {
      cap(key) {
        const captions = {
          activeRouteRemain: "RTE CAP",
          activeRouteEta: "ETA CAP",
          activeRouteNextCourse: "NEXT CAP"
        };
        return captions[key];
      },
      unit(key) {
        const units = {
          activeRouteRemain: "nmA",
          activeRouteEta: "",
          activeRouteNextCourse: "degN"
        };
        return units[key];
      },
      num(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      }
    };
  }

  function createViewModel() {
    return loadFresh("cluster/viewmodels/ActiveRouteViewModel.js").create();
  }

  it("builds normalized active-route domain payload", function () {
    const vm = createViewModel();
    const rawEta = new Date("2026-03-06T11:45:00Z");
    const out = vm.build({
      activeRouteName: "  Harbor Run  ",
      activeRouteRemain: "18.2",
      activeRouteEta: rawEta,
      activeRouteNextCourse: "93",
      activeRouteApproaching: true,
      wpServer: true
    }, createToolkit());

    expect(out).toEqual({
      routeName: "Harbor Run",
      disconnect: false,
      display: {
        remain: 18.2,
        eta: rawEta,
        nextCourse: 93,
        isApproaching: true
      },
      captions: {
        remain: "RTE CAP",
        eta: "ETA CAP",
        nextCourse: "NEXT CAP"
      },
      units: {
        eta: "",
        nextCourse: "degN"
      },
      hideSeconds: false
    });
  });

  it("threads hideSeconds from props", function () {
    const vm = createViewModel();
    const out = vm.build({
      activeRouteName: "Harbor Run",
      hideSeconds: true,
      wpServer: true
    }, createToolkit());

    expect(out.hideSeconds).toBe(true);
  });

  it("derives disconnect from explicit flag, wp-server disconnect, or empty route name", function () {
    const vm = createViewModel();
    const toolkit = createToolkit();

    const explicit = vm.build({
      activeRouteName: "Harbor Run",
      disconnect: true,
      wpServer: true
    }, toolkit);
    expect(explicit.disconnect).toBe(true);

    const wpServerDown = vm.build({
      activeRouteName: "Harbor Run",
      wpServer: false
    }, toolkit);
    expect(wpServerDown.disconnect).toBe(true);

    const emptyName = vm.build({
      activeRouteName: "   ",
      wpServer: true
    }, toolkit);
    expect(emptyName.disconnect).toBe(true);
  });

  it("handles null or invalid values with strict normalization", function () {
    const vm = createViewModel();
    const out = vm.build({
      activeRouteName: null,
      activeRouteRemain: "bad",
      activeRouteEta: null,
      activeRouteNextCourse: "bad",
      activeRouteApproaching: 1,
      wpServer: true
    }, createToolkit());

    expect(out.routeName).toBe("");
    expect(out.disconnect).toBe(true);
    expect(out.display).toEqual({
      remain: undefined,
      eta: null,
      nextCourse: undefined,
      isApproaching: false
    });
  });
});
