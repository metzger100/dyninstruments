// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("requests relayout when scrollbar gutter changes", function () {
    const setup = createRenderer({
      measureListScrollbarGutter: vi.fn().mockReturnValueOnce(6).mockReturnValue(6)
    });
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __hasValidSelection: false }, { mode: "dispatch" })
    );

    expect(mounted.postPatchResult).toEqual({ relayout: true });
  });
});
