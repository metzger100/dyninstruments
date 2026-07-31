// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("renders plain stableDigits info text through the widget path", function () {
    const setup = createRenderer({
      fitCompute: vi.fn(function () {
        return {
          headerFit: { routeNameStyle: "", metaStyle: "" },
          rowFits: [
            {
              ordinalStyle: "font-size:8px;",
              nameStyle: "font-size:10px;",
              infoStyle: "font-size:8px;",
              infoText: "360°/12.3nm"
            }
          ],
          emptyStyle: ""
        };
      })
    });
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
              nameText: "Finish",
              infoText: "00360°/00012.3nm",
              infoPlainText: "360°/12.3nm",
              selected: true
            }
          ]
        },
        { mode: "dispatch" }
      )
    );

    expect(mounted.html()).toContain("360°/12.3nm");
    expect(mounted.html()).not.toContain("00360°/00012.3nm");
    expect(mounted.html()).toContain("dyni-route-points-info-text dyni-tabular");
  });
});
