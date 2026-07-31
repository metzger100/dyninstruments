// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("dispatches route-point activation for valid row clicks", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(
        {
          __canActivate: true,
          __points: [
            {
              index: 0,
              ordinalText: "1",
              nameText: "WP1",
              infoText: "I",
              selected: false,
              pointSnapshot: {
                idx: 0,
                name: "WP1",
                lat: 54.1,
                lon: 10.1,
                routeName: "Route",
                selected: false
              }
            },
            {
              index: 3,
              ordinalText: "4",
              nameText: "WP4",
              infoText: "I",
              selected: true,
              pointSnapshot: {
                idx: 3,
                name: "WP4",
                lat: 54.4,
                lon: 10.4,
                routeName: "Route",
                selected: true
              }
            }
          ]
        },
        { mode: "dispatch", activate }
      )
    );

    const row = mounted.mountEl.querySelector('[data-rp-idx="3"]');
    if (!row) {
      throw new Error("Expected the route-points row.");
    }
    row.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(activate).toHaveBeenCalledWith({
      index: 3,
      pointSnapshot: {
        idx: 3,
        name: "WP4",
        lat: 54.4,
        lon: 10.4,
        routeName: "Route",
        selected: true
      }
    });

    const wrapper = mounted.mountEl.querySelector(".dyni-route-points-html");
    if (!wrapper) {
      throw new Error("Expected the route-points wrapper.");
    }
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(activate).toHaveBeenCalledTimes(1);
  });
});
