// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("exposes committed renderer contract", function () {
    const renderer = createRenderer().renderer;

    expect(renderer.id).toBe("AisTargetTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });

  it("renders dispatch state and dispatches showInfo on click", function () {
    const setup = createRenderer();
    const showInfo = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), {
        interactionMode: "dispatch",
        showInfo
      })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-ais-target-html");
    expect(html).toContain("dyni-ais-target-open-dispatch");
    expect(html).toContain("dyni-ais-target-branch-tcpa");
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).toContain("dyni-ais-target-open-hotspot");

    const wrapper = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-ais-target-html"));
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).toHaveBeenCalledWith("211234560");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
  });
});
