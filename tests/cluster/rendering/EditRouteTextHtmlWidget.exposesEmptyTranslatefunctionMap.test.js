// @ts-check
const {
  createRenderer,
  mountCommitted,
  withSurfacePolicy,
  withSurfacePolicyBadOpenEditRoute,
  withSurfacePolicyNoRouteEditor
} = require("./EditRouteTextHtmlWidget-setup");

describe("EditRouteTextHtmlWidget", function () {
  it("exposes an empty translateFunction map", function () {
    const setup = createRenderer();
    expect(setup.renderer.translateFunction()).toEqual({});
  });

  it("detach unbinds the dispatch listener and removes committed root; destroy delegates to detach", function () {
    const openEditRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canOpen: true, __token: "detach" }, { mode: "dispatch", openEditRoute })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    if (!wrapper) {
      throw new Error("Expected the edit-route wrapper.");
    }
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openEditRoute).toHaveBeenCalledTimes(1);

    mounted.committed.detach();
    expect(mounted.mountEl.innerHTML).toBe("");

    // The listener was explicitly removed on detach, so the stale wrapper
    // reference must no longer invoke the dispatch action.
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openEditRoute).toHaveBeenCalledTimes(1);

    // destroy() delegates to detach() and must tolerate an already-detached state.
    expect(() => mounted.committed.destroy()).not.toThrow();
    expect(mounted.mountEl.innerHTML).toBe("");
  });

  it("skips route-editor dispatch when surfacePolicy is absent at click time", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(setup.renderer, {
      __canOpen: true,
      __token: "no-policy"
    });

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    if (!wrapper) {
      throw new Error("Expected the edit-route wrapper.");
    }
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
    expect(mounted.html()).toContain("dyni-edit-route-open-dispatch");
  });

  it("skips route-editor dispatch when actions has no routeEditor entry", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicyNoRouteEditor({
        __canOpen: true,
        __token: "no-route-editor"
      })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    if (!wrapper) {
      throw new Error("Expected the edit-route wrapper.");
    }
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
  });

  it("skips route-editor dispatch when openEditRoute is not a function", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicyBadOpenEditRoute({
        __canOpen: true,
        __token: "bad-fn"
      })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-edit-route-html");
    if (!wrapper) {
      throw new Error("Expected the edit-route wrapper.");
    }
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
  });

  it("tolerates a non-object rendererContext by defaulting hostContext", function () {
    const setup = createRenderer();
    const mountEl = document.createElement("div");
    const committed = setup.renderer.createCommittedRenderer(null);

    committed.mount(mountEl, {
      props: withSurfacePolicy({ __canOpen: true, __token: "ctx" }, { mode: "dispatch" }),
      shellRect: { width: 300, height: 150 },
      layoutChanged: true
    });

    expect(mountEl.innerHTML).toContain("dyni-edit-route-html");
  });

  it("falls back to a null shell rect when payload omits shellRect", function () {
    const setup = createRenderer();
    const mountEl = document.createElement("div");
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {}
    });

    committed.mount(mountEl, {
      props: withSurfacePolicy({ __canOpen: true, __token: "no-rect" }, { mode: "dispatch" }),
      layoutChanged: true
    });

    expect(setup.fitCompute).toHaveBeenCalledWith(expect.objectContaining({ shellRect: null }));
  });

  it("falls back to a default fit object when htmlFit.compute returns falsy", function () {
    const setup = createRenderer({ fitCompute: vi.fn(() => null) });
    mountCommitted(setup.renderer, withSurfacePolicy({ __canOpen: true, __token: "falsy-fit" }, { mode: "dispatch" }));

    const markupMock = setup.markupRender.mock;
    if (!markupMock) {
      throw new Error("Expected the default markup renderer mock.");
    }
    const calls = markupMock.calls;
    const lastCall = calls[calls.length - 1];
    if (!lastCall || !lastCall[0] || typeof lastCall[0] !== "object") {
      throw new Error("Expected the markup renderer call payload.");
    }
    const lastArgs = /** @type {{ fit: { nameTextStyle: string, sourceBadgeStyle: string } }} */ (lastCall[0]);
    expect(lastArgs.fit.nameTextStyle).toBe("");
    expect(lastArgs.fit.sourceBadgeStyle).toBe("");
  });
});
