// @ts-check
const {
  createRenderer,
  dispatchPoints,
  mountCommitted,
  withSurfacePolicy
} = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget (part10 - update/detach/destroy lifecycle)", function () {
  it("re-binds the dispatch click listener on update without duplicating activations", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __points: dispatchPoints() }, { mode: "dispatch", activate })
    );

    mounted.update(
      withSurfacePolicy(
        { __canActivate: true, __points: dispatchPoints(), __routeNameText: "Route2" },
        { mode: "dispatch", activate }
      )
    );
    expect(mounted.html()).toContain("Route2");

    const row = mounted.mountEl.querySelector('[data-rp-idx="3"]');
    if (!row) {
      throw new Error("Expected the route-points row.");
    }
    row.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(activate).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledWith({
      index: 3,
      pointSnapshot: { idx: 3, name: "WP4", lat: 54.4, lon: 10.4 }
    });
  });

  it("ignores clicks whose target has no closest() (e.g. a text node)", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __points: dispatchPoints() }, { mode: "dispatch", activate })
    );

    const row = mounted.mountEl.querySelector('[data-rp-idx="3"]');
    if (!row) {
      throw new Error("Expected the route-points row.");
    }
    const textNode = document.createTextNode("WP4");
    row.appendChild(textNode);
    textNode.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(activate).not.toHaveBeenCalled();
  });

  it("ignores clicks on an injected row with a negative data-rp-idx attribute", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __points: dispatchPoints() }, { mode: "dispatch", activate })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-route-points-html");
    if (!wrapper) {
      throw new Error("Expected the route-points wrapper.");
    }
    const bogusRow = document.createElement("div");
    bogusRow.setAttribute("data-rp-idx", "-1");
    wrapper.appendChild(bogusRow);
    bogusRow.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(activate).not.toHaveBeenCalled();
  });

  it("activates with a null pointSnapshot when the clicked index is not in the model", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __points: dispatchPoints() }, { mode: "dispatch", activate })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-route-points-html");
    if (!wrapper) {
      throw new Error("Expected the route-points wrapper.");
    }
    const orphanRow = document.createElement("div");
    orphanRow.setAttribute("data-rp-idx", "99");
    wrapper.appendChild(orphanRow);
    orphanRow.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(activate).toHaveBeenCalledWith({ index: 99, pointSnapshot: null });
  });

  it("does nothing when the resolved surface policy has no activate function", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(
        { __canActivate: true, __points: dispatchPoints() },
        { mode: "dispatch", actions: { routePoints: {} } }
      )
    );

    const row = mounted.mountEl.querySelector('[data-rp-idx="3"]');
    if (!row) {
      throw new Error("Expected the route-points row.");
    }
    expect(function () {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }).not.toThrow();
  });

  it("detach() removes the mounted root, unbinds the listener, and disarms postPatch/detach re-entry", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __points: dispatchPoints() }, { mode: "dispatch", activate })
    );
    expect(mounted.mountEl.children.length).toBeGreaterThan(0);

    const row = mounted.mountEl.querySelector('[data-rp-idx="3"]');
    if (!row) {
      throw new Error("Expected the route-points row.");
    }

    mounted.committed.detach();

    expect(mounted.mountEl.children.length).toBe(0);
    expect(mounted.committed.postPatch()).toBe(false);

    row.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(activate).not.toHaveBeenCalled();

    // Calling detach() again must stay safe (already-cleared state).
    expect(function () {
      mounted.committed.detach();
    }).not.toThrow();
  });

  it("destroy() delegates to detach() and removes the mounted root", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __points: dispatchPoints() }, { mode: "dispatch" })
    );
    expect(mounted.mountEl.children.length).toBeGreaterThan(0);

    mounted.committed.destroy();

    expect(mounted.mountEl.children.length).toBe(0);
    expect(mounted.committed.postPatch()).toBe(false);
  });

  it("postPatch() returns false before anything has been mounted", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: document.createElement("div"),
      shadowRoot: null
    });

    expect(committed.postPatch()).toBe(false);
  });

  it("translateFunction() returns an empty object", function () {
    const setup = createRenderer();
    expect(setup.renderer.translateFunction()).toEqual({});
  });
});
