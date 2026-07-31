// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("renders disconnected state-screen and blocks row activation", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(
        {
          __kind: "disconnected",
          __stateLabel: "GPS Lost",
          __interactionState: "passive",
          __canActivate: false,
          __points: []
        },
        { mode: "dispatch", activate }
      )
    );

    expect(mounted.html()).toContain("dyni-state-disconnected");
    expect(mounted.html()).toContain("GPS Lost");
    expect(mounted.html()).toContain("dyni-route-points-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-route-points-html");
    if (!wrapper) {
      throw new Error("Expected the route-points wrapper.");
    }
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(activate).not.toHaveBeenCalled();
  });
});
