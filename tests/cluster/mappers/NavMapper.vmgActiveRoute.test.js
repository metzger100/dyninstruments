// @ts-check
const { toolkit, createMapper, routeContext, makeActiveRouteViewModel } = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps VMG using speed formatter and unit parameter", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "vmg", vmg: 4.2 }, routeContext("vmg", toolkit));

    expect(out).toEqual({
      value: 4.2,
      caption: "VMG",
      unit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
  });

  it("maps activeRoute to ActiveRouteTextHtmlWidget with renderer-owned field props", function () {
    const mapper = createMapper();
    const rawEta = new Date("2026-03-06T11:45:00Z");
    const activeRouteViewModel = makeActiveRouteViewModel();
    const out = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "  Harbor Run  ",
        activeRouteRemain: "18.2",
        activeRouteEta: rawEta,
        activeRouteNextCourse: "93",
        activeRouteApproaching: true,
        activeRouteRatioThresholdNormal: "1.25",
        activeRouteRatioThresholdFlat: "4.4",
        wpServer: true,
        disconnect: true,
        hideSeconds: true
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );

    expect(out).toEqual({
      wpServer: true,
      display: {
        remain: 18.2,
        rteEta: rawEta,
        nextCourse: 93,
        isApproaching: true,
        routeName: "Harbor Run",
        disconnect: true,
        hideSeconds: true
      },
      captions: {
        remain: "RTE CAP",
        rteEta: "ETA CAP",
        nextCourse: "NEXT CAP"
      },
      units: {
        remain: "nmA",
        rteEta: "",
        nextCourse: "degN"
      },
      formatUnits: {
        remain: "nm"
      },
      ratioThresholdNormal: 1.25,
      ratioThresholdFlat: 4.4
    });
  });

  it("keeps next-course props available even when approach state is false", function () {
    const mapper = createMapper();
    const activeRouteViewModel = makeActiveRouteViewModel();
    const out = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "Harbor Run",
        activeRouteRemain: 12,
        activeRouteEta: new Date("2026-03-06T11:45:00Z"),
        activeRouteNextCourse: 91,
        activeRouteApproaching: false
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );

    expect(out).not.toHaveProperty("renderer");
    expect(out.display.isApproaching).toBe(false);
    expect(out.display.nextCourse).toBe(91);
    expect(out.captions.nextCourse).toBe("NEXT CAP");
    expect(out.units.nextCourse).toBe("degN");
  });

  it("keeps activeRoute numeric fields missing when live values are null/blank", function () {
    const mapper = createMapper();
    const activeRouteViewModel = makeActiveRouteViewModel();
    const out = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "Harbor Run",
        activeRouteRemain: null,
        activeRouteEta: new Date("2026-03-06T11:45:00Z"),
        activeRouteNextCourse: "   "
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );

    expect(out.display.remain).toBeUndefined();
    expect(out.display.nextCourse).toBeUndefined();
  });
});
