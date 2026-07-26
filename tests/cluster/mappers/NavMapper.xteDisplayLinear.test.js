// @ts-check
const { makeToolkit, createMapper, routeContext } = require("../../helpers/nav-mapper");

describe("NavMapper", function () {
  it("maps xteDisplayLinear to XteDisplayLinearWidget payload with token-aware scale and disconnect propagation", function () {
    const mapper = createMapper();
    const customToolkit = makeToolkit({
      caption_xteDisplayLinearXte: "XTE LIN",
      formatUnit_xteDisplayLinearXte: "m",
      unit_xteDisplayLinearXte_m: "mX",
      caption_xteDisplayLinearCog: "COG LIN",
      unit_xteDisplayLinearCog: "degT",
      caption_xteDisplayLinearDst: "DST LIN",
      formatUnit_xteDisplayLinearDst: "km",
      unit_xteDisplayLinearDst_km: "kmD",
      caption_xteDisplayLinearBrg: "BRG LIN",
      unit_xteDisplayLinearBrg: "degM",
      xteLinearScale_m: "250"
    });
    const out = mapper.translate(
      {
        kind: "xteDisplayLinear",
        xte: "0.22",
        cog: "96",
        dtw: "2.4",
        btw: "100",
        wpName: "West Cardinal",
        wpServer: false,
        disconnect: true,
        xteLinearLeadingZero: false,
        xteLinearShowWpName: true,
        xteLinearHideTextualMetrics: true,
        xteLinearEasing: false,
        xteLinearRatioThresholdNormal: "0.9",
        xteLinearRatioThresholdFlat: "2.6",
        xteLinearTickMajor: "2",
        xteLinearTickMinor: "0.5",
        xteLinearShowEndLabels: true,
        stableDigits: true
      },
      routeContext("xteDisplayLinear", customToolkit)
    );

    expect(out).toEqual({
      display: {
        xte: 0.22,
        cog: 96,
        dtw: 2.4,
        btw: 100,
        wpName: "West Cardinal",
        disconnect: true
      },
      captions: {
        xte: "XTE LIN",
        track: "COG LIN",
        dtw: "DST LIN",
        brg: "BRG LIN"
      },
      units: {
        xte: "mX",
        track: "degT",
        dtw: "kmD",
        brg: "degM"
      },
      formatUnits: {
        xte: "m",
        dtw: "km"
      },
      xteScale: 250,
      layout: {
        leadingZero: false,
        showWpName: true,
        hideTextualMetrics: true,
        easing: false,
        ratioThresholdNormal: 0.9,
        ratioThresholdFlat: 2.6,
        tickMajor: 2,
        tickMinor: 0.5,
        showEndLabels: true
      },
      stableDigits: true
    });
  });
});
