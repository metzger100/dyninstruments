// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("adds tabular class to route-point info text when stableDigits is enabled", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(
        {
          __canActivate: true,
          __stableDigits: true,
          __points: [
            {
              index: 0,
              ordinalText: "1",
              nameText: "WP1",
              infoText: "09°/1.2nm",
              selected: false
            }
          ]
        },
        { mode: "dispatch" }
      )
    );

    expect(mounted.html()).toContain("dyni-route-points-info-text dyni-tabular");
  });
});
