// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("rebinds the dispatch listener across successive dispatch-state updates", function () {
    const showInfoA = vi.fn(() => true);
    const showInfoB = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), {
        interactionMode: "dispatch",
        showInfo: showInfoA
      })
    );

    let wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    if (!wrapper) {
      throw new Error("Expected the ais-target wrapper.");
    }
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfoA).toHaveBeenCalledTimes(1);

    // Update while remaining in dispatch state with a changed distance forces
    // new markup, which reassigns wrapperEl while a clickHandler is still set
    // -- this is the rebind path.
    mounted.update(
      withSurfacePolicy(makeProps({ domain: { distance: 9.9 } }), {
        interactionMode: "dispatch",
        showInfo: showInfoB
      }),
      2,
      true
    );

    wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    if (!wrapper) {
      throw new Error("Expected the ais-target wrapper.");
    }
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfoB).toHaveBeenCalledTimes(1);
    expect(showInfoA).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale dispatch click after the model transitions away from dispatch", function () {
    const showInfo = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), {
        interactionMode: "dispatch",
        showInfo
      })
    );

    const staleWrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    if (!staleWrapper) {
      throw new Error("Expected the ais-target wrapper.");
    }

    mounted.update(
      withSurfacePolicy(makeProps(), {
        interactionMode: "passive",
        showInfo
      }),
      2,
      true
    );

    // The stale wrapper still carries its original listener (patchInnerHtml
    // replaced the DOM under jsdom), but lastModel now reports passive state,
    // so the click handler's own re-check must block the dispatch.
    staleWrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).not.toHaveBeenCalled();
  });
});
