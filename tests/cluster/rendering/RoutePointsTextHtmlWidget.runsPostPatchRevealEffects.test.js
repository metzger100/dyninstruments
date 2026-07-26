// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("runs post-patch reveal effects only for valid selections", function () {
    const maybeReveal = vi.fn(() => true);
    const setupValid = createRenderer({ maybeReveal });
    mountCommitted(
      setupValid.renderer,
      withSurfacePolicy(
        {
          __canActivate: true,
          __hasValidSelection: true,
          __selectedIndex: 0,
          __activeKey: "id:wp-0"
        },
        { mode: "dispatch" }
      )
    );

    expect(maybeReveal).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedIndex: 0,
        activeKey: "id:wp-0"
      })
    );

    const maybeRevealInvalid = vi.fn(() => true);
    const setupInvalid = createRenderer({ maybeReveal: maybeRevealInvalid });
    mountCommitted(
      setupInvalid.renderer,
      withSurfacePolicy(
        {
          __canActivate: false,
          __hasValidSelection: false,
          __selectedIndex: -1
        },
        { mode: "passive" }
      )
    );

    expect(maybeRevealInvalid).not.toHaveBeenCalled();
  });
});
