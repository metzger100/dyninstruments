// @ts-check
const { toolkit, createMapper, routeContext, makeActiveRouteViewModel } = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps activeRoute disconnect from raw connectionLost signal only", function () {
    const mapper = createMapper();
    const activeRouteViewModel = makeActiveRouteViewModel();

    const wpServerDown = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "Harbor Run",
        wpServer: false
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );
    expect(wpServerDown.wpServer).toBe(false);
    expect(wpServerDown.display.disconnect).toBe(false);

    const emptyName = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "   ",
        wpServer: true
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );
    expect(emptyName.display.disconnect).toBe(false);

    const disconnected = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "Harbor Run",
        wpServer: true,
        disconnect: true
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );
    expect(disconnected.display.disconnect).toBe(true);
  });

  it("maps positions with lon/lat formatter", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "positionBoat", positionBoat: [1, 2] }, routeContext("positionBoat", toolkit));

    expect(out.formatter).toBe("formatLonLats");
    expect(out.value).toEqual([1, 2]);
    expect(out).not.toHaveProperty("renderer");
    expect(out.coordinateFormatter).toBe("formatLonLatsDecimal");
    expect(out.coordinateFormatterParameters).toEqual([]);

    const wp = mapper.translate(
      { kind: "positionWp", positionWp: { lon: 3, lat: 4 } },
      routeContext("positionWp", toolkit)
    );
    expect(wp.formatter).toBe("formatLonLats");
    expect(wp).not.toHaveProperty("renderer");
    expect(wp.coordinateFormatter).toBe("formatLonLatsDecimal");
    expect(wp.coordinateFormatterParameters).toEqual([]);
    expect(wp.disconnect).toBe(false);
  });

  it("maps disconnect for dst and positionWp so memo signatures can change on WP link loss", function () {
    const mapper = createMapper();

    const dstConnected = mapper.translate({ kind: "dst", dst: 1.2, disconnect: false }, routeContext("dst", toolkit));
    const dstDisconnected = mapper.translate({ kind: "dst", dst: 1.2, disconnect: true }, routeContext("dst", toolkit));
    expect(dstConnected.disconnect).toBe(false);
    expect(dstDisconnected.disconnect).toBe(true);
    expect(JSON.stringify(dstConnected)).not.toBe(JSON.stringify(dstDisconnected));

    const positionConnected = mapper.translate(
      {
        kind: "positionWp",
        positionWp: { lon: 3, lat: 4 },
        disconnect: false
      },
      routeContext("positionWp", toolkit)
    );
    const positionDisconnected = mapper.translate(
      {
        kind: "positionWp",
        positionWp: { lon: 3, lat: 4 },
        disconnect: true
      },
      routeContext("positionWp", toolkit)
    );
    expect(positionConnected.disconnect).toBe(false);
    expect(positionDisconnected.disconnect).toBe(true);
    expect(JSON.stringify(positionConnected)).not.toBe(JSON.stringify(positionDisconnected));
  });
});
