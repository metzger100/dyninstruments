// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("exposes an empty translateFunction map", function () {
    const setup = createRenderer();
    expect(setup.renderer.translateFunction()).toEqual({});
  });

  it("detach unbinds the dispatch listener and removes committed root; destroy delegates to detach", function () {
    const showInfo = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { interactionMode: "dispatch", showInfo })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    if (!wrapper) {
      throw new Error("Expected the ais-target wrapper.");
    }
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).toHaveBeenCalledTimes(1);

    mounted.committed.detach();
    expect(mounted.mountEl.innerHTML).toBe("");

    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(showInfo).toHaveBeenCalledTimes(1);

    expect(() => mounted.committed.destroy()).not.toThrow();
    expect(mounted.mountEl.innerHTML).toBe("");
  });

  it("tolerates a non-object rendererContext by defaulting hostContext", function () {
    const setup = createRenderer();
    const mountEl = document.createElement("div");
    const committed = setup.renderer.createCommittedRenderer(null);

    committed.mount(mountEl, {
      props: withSurfacePolicy(makeProps(), { interactionMode: "dispatch" }),
      shellRect: { width: 300, height: 150 },
      layoutChanged: true
    });

    expect(mountEl.innerHTML).toContain("dyni-ais-target-html");
  });

  it("falls back to an undefined shell rect when payload omits shellRect", function () {
    const setup = createRenderer();
    const mountEl = document.createElement("div");
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {}
    });

    committed.mount(mountEl, {
      props: withSurfacePolicy(makeProps(), { interactionMode: "dispatch" }),
      layoutChanged: true
    });

    expect(setup.fitCompute).toHaveBeenCalledWith(expect.objectContaining({ shellRect: undefined }));
    expect(mountEl.innerHTML).toContain("dyni-ais-target-html");
  });

  it("reuses the cached fit instead of recomputing when layoutChanged is false", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(setup.renderer, withSurfacePolicy(makeProps(), { interactionMode: "dispatch" }));
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);

    mounted.update(
      withSurfacePolicy(makeProps({ domain: { distance: 5.1 } }), {
        interactionMode: "dispatch"
      }),
      2,
      false
    );

    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
  });
});
