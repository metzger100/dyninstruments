// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("exposes committed renderer contract", function () {
    const renderer = createRenderer();

    expect(renderer.id).toBe("MapZoomTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });

  it("renders dispatch markup and dispatches map check action on click", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(renderer, withSurfacePolicy(makeProps(), { mode: "dispatch", checkAutoZoom }));

    const html = mounted.html();
    expect(html).toContain("dyni-map-zoom-html");
    expect(html).toContain("dyni-map-zoom-open-dispatch");
    expect(html).toContain('data-dyni-action="map-zoom-check-auto"');
    expect(html).toContain("dyni-map-zoom-open-hotspot");

    const wrapper = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-map-zoom-html"));
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(checkAutoZoom).toHaveBeenCalledTimes(1);
  });

  it("stays passive when editing mode is active", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ editing: true }), {
        mode: "dispatch",
        checkAutoZoom
      })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-map-zoom-open-passive");

    const wrapper = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-map-zoom-html"));
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

  it("renders disconnected state-screen and disables dispatch", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), {
        mode: "dispatch",
        checkAutoZoom
      })
    );

    expect(mounted.html()).toContain("dyni-state-disconnected");
    expect(mounted.html()).toContain("GPS Lost");
    expect(mounted.html()).toContain("dyni-map-zoom-open-passive");
    expect(mounted.html()).not.toContain("dyni-map-zoom-open-hotspot");

    const wrapper = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-map-zoom-html"));
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });
});
