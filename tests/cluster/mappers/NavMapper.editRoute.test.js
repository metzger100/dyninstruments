// @ts-check
const {
  makeToolkit,
  toolkit,
  createMapper,
  routeContext,
  makeEditRouteViewModel
} = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps editRoute with default RTE caption (not RTG) when configured defaults are used", function () {
    const mapper = createMapper();
    const defaultToolkit = makeToolkit(
      {
        caption_editRoutePts: "PTS",
        caption_editRouteDst: "DST",
        formatUnit_editRouteDst: undefined,
        unit_editRouteDst_nm: "nm",
        caption_editRouteRte: "RTE",
        formatUnit_editRouteRte: undefined,
        unit_editRouteRte_nm: "nm",
        caption_editRouteEta: "ETA"
      },
      {
        editRouteDst: { defaultToken: "nm" },
        editRouteRte: { defaultToken: "nm" },
        activeRouteRemain: { defaultToken: "nm" },
        xteDisplayXte: { defaultToken: "nm" },
        xteDisplayDst: { defaultToken: "nm" },
        routePointsDistance: { defaultToken: "nm" }
      }
    );
    const editRouteViewModel = makeEditRouteViewModel();
    const out = mapper.translate(
      {
        kind: "editRoute",
        editingRoute: { name: "Harbor Run", points: [] }
      },
      routeContext("editRoute", defaultToolkit, editRouteViewModel)
    );

    expect(out.captions.rte).toBe("RTE");
    expect(out.captions.rte).not.toBe("RTG");
  });

  it("maps editRoute safely when editingRoute is missing", function () {
    const mapper = createMapper();
    const editRouteViewModel = makeEditRouteViewModel();
    const out = mapper.translate(
      {
        kind: "editRoute",
        editingRoute: null,
        editRouteRatioThresholdNormal: "1.2",
        editRouteRatioThresholdFlat: "3.8"
      },
      routeContext("editRoute", toolkit, editRouteViewModel)
    );

    expect(out).toEqual({
      domain: {
        hasRoute: false,
        routeName: "",
        pointCount: 0,
        totalDistance: undefined,
        remainingDistance: undefined,
        rteEta: undefined,
        hideSeconds: false,
        isActiveRoute: false,
        isLocalRoute: false,
        isServerRoute: false
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8
      },
      captions: {
        pts: "PTS CAP",
        dst: "DST CAP",
        rte: "RTE CAP",
        rteEta: "ETA CAP"
      },
      units: {
        dst: "nmE",
        rte: "kmR"
      },
      formatUnits: {
        dst: "nm",
        rte: "km"
      }
    });
  });
});
