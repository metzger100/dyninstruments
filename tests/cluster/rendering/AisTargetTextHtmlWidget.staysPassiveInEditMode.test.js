// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("stays passive in edit mode", function () {
    const showInfo = vi.fn(() => true);
    const mounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({ editing: true }), {
        interactionMode: "dispatch",
        showInfo
      })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-ais-target-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    // @ts-ignore -- pre-existing untyped test mock boundary
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).not.toHaveBeenCalled();
  });

  it("renders flat branch and noAis state for gps page", function () {
    const flatMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({ domain: { showTcpaBranch: false, frontText: "Back" } }), {
        interactionMode: "dispatch"
      }),
      { shellSize: { width: 640, height: 120 } }
    );
    const placeholderMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(makeProps({ domain: { hasTargetIdentity: false } }), {
        pageId: "gpspage",
        interactionMode: "passive"
      })
    );

    expect(flatMounted.html()).toContain("dyni-ais-target-mode-flat");
    expect(flatMounted.html()).toContain("dyni-ais-target-branch-brg");
    expect(flatMounted.html()).toContain("dyni-ais-target-metric-value");
    expect(flatMounted.html()).not.toContain("dyni-ais-target-metric-value-row");

    expect(placeholderMounted.html()).toContain("dyni-state-no-ais");
    expect(placeholderMounted.html()).toContain("No AIS");
  });
});
