// @ts-check
const { createRenderer, mountCommitted, withSurfacePolicy } = require("./EditRouteTextHtmlWidget-setup");

describe("EditRouteTextHtmlWidget", function () {
  it("exposes committed renderer contract", function () {
    const renderer = createRenderer().renderer;

    expect(renderer.id).toBe("EditRouteTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });

  it("dispatches route-editor open action only in dispatch state", function () {
    const openEditRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "a" }, { mode: "dispatch", openEditRoute })
    );

    let wrapper = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-edit-route-html"));
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openEditRoute).toHaveBeenCalledTimes(1);

    mounted.update(withSurfacePolicy({ __canOpen: false, __token: "b" }, { mode: "dispatch", openEditRoute }), true);
    wrapper = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-edit-route-html"));
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(openEditRoute).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-edit-route-open-passive");
  });

  it("passes hideSeconds through to the render model", function () {
    const setup = createRenderer();
    mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, hideSeconds: true, __token: "hide-seconds" }, { mode: "dispatch" })
    );

    expect(setup.buildModel).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          hideSeconds: true
        })
      })
    );
  });

  it("orchestrates model/fit/markup with committed vertical facts", function () {
    const setup = createRenderer();
    mountCommitted(setup.renderer, withSurfacePolicy({ __canOpen: true, __token: "x" }, { orientation: "vertical" }), {
      shellSize: { width: 240, height: 120 }
    });

    expect(setup.buildModel).toHaveBeenCalledWith(
      expect.objectContaining({
        isVerticalCommitted: true,
        shellRect: { width: 240, height: 120 }
      })
    );
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(setup.markupRender).toHaveBeenCalledTimes(1);
  });
});
