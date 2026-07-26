// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("formats lat/lon rows through formatLonLats and normalizes known formatter placeholders", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatLonLats") {
        if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lon)) {
          return "-----";
        }
        return "LL:" + value.lat + "," + value.lon;
      }
      return cfg.default;
    });
    const renderModel = createRenderModel({ applyFormatter: applyFormatter });
    const props = makeProps({
      domain: {
        route: {
          name: "Harbor Run",
          points: [
            { name: "Start", lat: 54.1, lon: 10.4 },
            { name: "Mid", lat: undefined, lon: 10.5 }
          ]
        },
        routeName: "Harbor Run",
        pointCount: 2,
        selectedIndex: 0,
        isActiveRoute: false,
        showLatLon: true,
        useRhumbLine: false
      }
    });

    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.points[0].infoText).toBe("LL:54.1,10.4");
    expect(model.points[1].infoText).toBe("---");
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.objectContaining({ lat: undefined, lon: 10.5 }),
      expect.objectContaining({ formatter: "formatLonLats" })
    );
  });
});
