const path = require("node:path");
const fs = require("node:fs");
const {
  ORIGINAL_DYNI_PLUGIN,
  createRenderer,
  makeProps,
  withSurfacePolicy,
  createSurfaceDom,
  mountCommitted,
} = require("./ActiveRouteTextHtmlWidget.harness.js");

describe("ActiveRouteTextHtmlWidget", function () {
  it("exposes committed renderer contract", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;

    expect(renderer.id).toBe("ActiveRouteTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });

  it("renders dispatch markup and dispatches route open on click", function () {
    const setup = createRenderer();
    const openActiveRoute = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", openActiveRoute }),
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-html");
    expect(html).toContain("dyni-active-route-open-dispatch");
    expect(html).toContain('data-dyni-action="active-route-open"');
    expect(html).toContain("dyni-active-route-open-hotspot");
    expect(html).toContain("DIST:12.4");
    expect(
      mounted.mountEl
        .querySelector(".dyni-active-route-metric-value-row")
        .getAttribute("style"),
    ).toBe("gap:4px;");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(
      mounted.mountEl
        .querySelector(".dyni-active-route-metric-caption")
        .getAttribute("style"),
    ).toBe("font-size:12px;");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(openActiveRoute).toHaveBeenCalledTimes(1);
  });

  it("keeps passive interaction in edit mode and does not dispatch", function () {
    const openActiveRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ editing: true }), {
        mode: "dispatch",
        openActiveRoute,
      }),
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(openActiveRoute).not.toHaveBeenCalled();
  });

  it("renders disconnected and no-route state screens with passive interaction", function () {
    const setup = createRenderer();
    const openActiveRoute = vi.fn(() => true);

    const disconnected = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), {
        mode: "dispatch",
        openActiveRoute,
      }),
    );
    expect(disconnected.html()).toContain("dyni-state-disconnected");
    expect(disconnected.html()).toContain("GPS Lost");
    expect(disconnected.html()).toContain("dyni-active-route-open-passive");
    expect(disconnected.html()).not.toContain("dyni-active-route-open-hotspot");
    disconnected.mountEl
      .querySelector(".dyni-active-route-html")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    expect(openActiveRoute).not.toHaveBeenCalled();

    const noRouteByWpServer = mountCommitted(
      setup.renderer,
      withSurfacePolicy(
        makeProps({
          disconnect: false,
          wpServer: false,
          routeName: "Harbor Run",
        }),
        { mode: "dispatch", openActiveRoute },
      ),
    );
    expect(noRouteByWpServer.html()).toContain("dyni-state-no-route");
    expect(noRouteByWpServer.html()).toContain("No Route");

    const noRouteByEmptyName = mountCommitted(
      setup.renderer,
      withSurfacePolicy(
        makeProps({ disconnect: false, wpServer: true, routeName: "   " }),
        { mode: "dispatch", openActiveRoute },
      ),
    );
    expect(noRouteByEmptyName.html()).toContain("dyni-state-no-route");
    expect(noRouteByEmptyName.html()).toContain("No Route");
  });

  it("keeps inline fitted font sizing on tiny state screens", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), { mode: "dispatch" }),
      { shellSize: { width: 2, height: 2 } },
    );

    const label = mounted.mountEl.querySelector(".dyni-state-screen-label");
    expect(label.textContent).toBe("GPS Lost");
    expect(label.getAttribute("style")).toBe("font-size:1px;");
  });

  it("renders ETA with formatClock when hideSeconds is enabled", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ hideSeconds: true }), { mode: "dispatch" }),
    );

    expect(mounted.html()).toContain("CLOCK:");
    expect(mounted.html()).toContain("dyni-active-route-html");
  });

  it("normalizes known formatter fallback tokens to the configured default", function () {
    const setup = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDistance") {
          return "  -";
        }
        if (cfg.formatter === "formatTime") {
          return "--:--:--";
        }
        if (cfg.formatter === "formatClock") {
          return "--:--";
        }
        if (cfg.formatter === "formatDirection") {
          return "NO DATA";
        }
        return value == null ? cfg.default : String(value);
      },
    });
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch" }),
    );

    const valueTexts = Array.from(
      mounted.mountEl.querySelectorAll(".dyni-active-route-metric-value"),
    ).map((el) => el.textContent);
    expect(valueTexts).toEqual(["---", "---", "---"]);
    expect(mounted.html()).not.toContain("--:--:--");
    expect(mounted.html()).not.toContain("NO DATA");
  });

  it("adds dyni-tabular class to metric values when stableDigits is enabled", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ stableDigits: true }), {
        mode: "dispatch",
      }),
    );

    const valueEls = mounted.mountEl.querySelectorAll(
      ".dyni-active-route-metric-value",
    );
    expect(valueEls.length).toBeGreaterThan(0);
    valueEls.forEach((el) => {
      expect(el.classList.contains("dyni-tabular")).toBe(true);
    });
  });

  it("always consults ActiveRouteHtmlFit when a shell rect exists", function () {
    const fitCompute = vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: {
            captionStyle: "font-size:12px;",
            valueStyle: "font-size:18px;",
            unitStyle: "font-size:11px;",
          },
          rteEta: {
            captionStyle: "font-size:11px;",
            valueStyle: "font-size:17px;",
            unitStyle: "font-size:10px;",
          },
          next: {
            captionStyle: "font-size:10px;",
            valueStyle: "font-size:16px;",
            unitStyle: "font-size:9px;",
          },
        },
      };
    });
    const setup = createRenderer({ fitCompute });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({
      hostContext,
      mountEl: null,
      shadowRoot: null,
    });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    function payload(revision, layoutChanged) {
      return {
        props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        mountEl: mountEl,
        shadowRoot: null,
        shellRect: { width: 320, height: 180 },
        hostContext: hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0,
      };
    }

    const initial = payload(1, true);
    committed.mount(mountEl, initial);
    expect(fitCompute).toHaveBeenCalledTimes(1);

    const stableUpdate = payload(2, false);
    committed.update(stableUpdate);
    expect(fitCompute).toHaveBeenCalledTimes(2);
  });

  it("updates layout signature when ratio-driven mode changes", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: null,
      shadowRoot: null,
    });

    const baseSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 220, height: 180 },
    });
    const flatSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 520, height: 120 },
    });

    expect(flatSig).not.toBe(baseSig);
  });

  it("mirrors page/orientation context into shadow-root-visible root", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), {
        mode: "dispatch",
        pageId: "editroutepage",
        orientation: "vertical",
      }),
    );

    const root = mounted.mountEl.querySelector(".dyni-html-root");
    expect(root).toBeTruthy();
    expect(root.getAttribute("data-dyni-page-id")).toBe("editroutepage");
    expect(root.getAttribute("data-dyni-orientation")).toBe("vertical");
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css",
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-active-route-html");
    expect(css).not.toContain("#navpage .widgetContainer.vertical");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*2\s*\/\s*1/);
    expect(css).not.toMatch(/min-height.*4\.8em/);
  });

  it("reuses prepared semantic model across layoutSignature and patchDom and invalidates on structural boundaries", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value == null) {
        return cfg.default;
      }
      if (cfg.formatter === "formatDistance") {
        return "DIST:" + String(value);
      }
      if (cfg.formatter === "formatTime") {
        return "TIME:" + String(value);
      }
      if (cfg.formatter === "formatClock") {
        return "CLOCK:" + String(value);
      }
      if (cfg.formatter === "formatDirection") {
        return "DIR:" + String(value);
      }
      return String(value);
    });
    const setup = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({
      hostContext,
      mountEl: null,
      shadowRoot: null,
    });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    function buildPayload(props, revision, shellRect, layoutChanged) {
      return {
        props,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect,
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0,
      };
    }

    const propsA = withSurfacePolicy(makeProps(), { mode: "dispatch" });
    const initial = buildPayload(propsA, 1, { width: 320, height: 180 }, true);
    committed.layoutSignature(initial);
    committed.mount(mountEl, initial);
    expect(applyFormatter).toHaveBeenCalledTimes(3);

    const revisionChanged = buildPayload(
      propsA,
      2,
      { width: 320, height: 180 },
      false,
    );
    committed.layoutSignature(revisionChanged);
    committed.update(revisionChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    const propsIdentityChanged = buildPayload(
      withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      2,
      { width: 320, height: 180 },
      false,
    );
    committed.layoutSignature(propsIdentityChanged);
    committed.update(propsIdentityChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(9);

    const shellSizeChanged = buildPayload(
      propsIdentityChanged.props,
      2,
      { width: 321, height: 180 },
      true,
    );
    committed.layoutSignature(shellSizeChanged);
    committed.update(shellSizeChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(12);
  });

  it("clears prepared semantic model state on detach and destroy", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value == null ? cfg.default : String(value);
    });
    const setup = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({
      hostContext,
      mountEl: null,
      shadowRoot: null,
    });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    const payload = {
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      revision: 7,
      rootEl,
      shellEl,
      mountEl,
      shadowRoot: null,
      shellRect: { width: 320, height: 180 },
      hostContext,
      layoutChanged: true,
      relayoutPass: 0,
    };

    committed.layoutSignature(payload);
    committed.mount(mountEl, payload);
    expect(applyFormatter).toHaveBeenCalledTimes(3);

    committed.detach("test");
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    committed.mount(mountEl, payload);
    committed.destroy();
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(9);
  });
});
