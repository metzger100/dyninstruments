// @ts-check
const { toolkit, createMapper, routeContext } = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps xteDisplay to XteDisplayWidget with normalized renderer props", function () {
    const mapper = createMapper();
    const out = mapper.translate(
      {
        kind: "xteDisplay",
        xte: "0.25",
        cog: "93",
        dtw: "1.2",
        btw: "91",
        wpName: "Fairway Buoy",
        disconnect: true,
        leadingZero: false,
        showWpNameXteDisplay: false,
        xteHideTextualMetrics: true,
        xteRatioThresholdNormal: "0.8",
        xteRatioThresholdFlat: "2.4"
      },
      routeContext("xteDisplay", toolkit)
    );

    expect(out).not.toHaveProperty("renderer");
    expect(out.display).toEqual({
      xte: 0.25,
      cog: 93,
      dtw: 1.2,
      btw: 91,
      wpName: "Fairway Buoy",
      disconnect: true
    });
    expect(out.captions).toEqual({
      xte: "XTE CAP",
      track: "COG CAP",
      dtw: "DST CAP",
      brg: "BRG CAP"
    });
    expect(out.units).toEqual({
      xte: "nmX",
      track: "degT",
      dtw: "nmD",
      brg: "degM"
    });
    expect(out.formatUnits).toEqual({
      xte: "nm",
      dtw: "nm"
    });
    expect(out.xteScale).toBe(0.8);
    expect(out.layout).toEqual({
      leadingZero: false,
      showWpName: false,
      hideTextualMetrics: true,
      xteRatioThresholdNormal: 0.8,
      xteRatioThresholdFlat: 2.4,
      easing: true
    });
    expect(out.stableDigits).toBe(false);
  });

  it("defaults xteDisplay waypoint-name toggle to false when setting is absent", function () {
    const mapper = createMapper();
    const out = mapper.translate(
      { kind: "xteDisplay", xte: 0.2, cog: 90, dtw: 1.1, btw: 95 },
      routeContext("xteDisplay", toolkit)
    );
    expect(out.layout.showWpName).toBe(false);
    expect(out.layout.hideTextualMetrics).toBe(false);
  });

  it("keeps xteDisplay missing values missing instead of coercing to zero", function () {
    const mapper = createMapper();
    const out = mapper.translate(
      {
        kind: "xteDisplay",
        xte: null,
        cog: "",
        dtw: "   ",
        btw: undefined
      },
      routeContext("xteDisplay", toolkit)
    );

    expect(out.display.xte).toBeUndefined();
    expect(out.display.cog).toBeUndefined();
    expect(out.display.dtw).toBeUndefined();
    expect(out.display.btw).toBeUndefined();
  });
});
