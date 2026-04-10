const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const fitCompute = opts.fitCompute || vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: { valueStyle: "font-size:18px;", unitStyle: "font-size:11px;" },
          eta: { valueStyle: "font-size:17px;", unitStyle: "font-size:10px;" },
          next: { valueStyle: "font-size:16px;", unitStyle: "font-size:9px;" }
        }
      };
    });
    const Helpers = {
      applyFormatter: opts.applyFormatter || function (value, formatterOptions) {
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
        if (cfg.formatter === "formatDirection") {
          return "DIR:" + String(value);
        }
        return String(value);
      },
      getModule(id) {
        if (id === "ActiveRouteHtmlFit") {
          return { create: () => ({ compute: fitCompute }) };
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, Helpers),
      fitCompute
    };
  }

  function makeProps(overrides) {
    return Object.assign({
      routeName: "Harbor Run",
      disconnect: false,
      display: {
        remain: 12.4,
        eta: "2026-03-06T11:45:00Z",
        nextCourse: 93,
        isApproaching: true
      },
      captions: {
        remain: "RTE",
        eta: "ETA",
        nextCourse: "NEXT"
      },
      units: {
        remain: "nm",
        eta: "",
        nextCourse: "deg"
      },
      default: "---"
    }, overrides || {});
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const openActiveRoute = opts.openActiveRoute || vi.fn(() => true);
    const pageId = opts.pageId || "navpage";
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId,
        containerOrientation: orientation,
        interaction: { mode },
        actions: {
          routeEditor: {
            openActiveRoute
          }
        }
      }
    });
  }

  function mountCommitted(rendererSpec, props, options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 320, height: 180 };
    const hostContext = opts.hostContext || {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    shellEl.appendChild(mountEl);
    rootEl.appendChild(shellEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

    mountEl.getBoundingClientRect = vi.fn(() => ({
      width: shellSize.width,
      height: shellSize.height
    }));

    const committed = rendererSpec.createCommittedRenderer({
      hostContext,
      mountEl,
      shadowRoot: null
    });

    function buildPayload(nextProps, revision, layoutChanged) {
      return {
        props: nextProps,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect: { width: shellSize.width, height: shellSize.height },
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const initial = buildPayload(props, 1, true);
    committed.mount(mountEl, initial);
    committed.postPatch(initial);

    return {
      hostContext,
      mountEl,
      committed,
      update(nextProps) {
        const payload = buildPayload(nextProps, 2, true);
        committed.update(payload);
        committed.postPatch(payload);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("exposes committed renderer contract", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;

    expect(renderer.id).toBe("ActiveRouteTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
    expect(renderer.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 2 });
  });

  it("renders dispatch markup and dispatches route open on click", function () {
    const setup = createRenderer();
    const openActiveRoute = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", openActiveRoute })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-html");
    expect(html).toContain("dyni-active-route-open-dispatch");
    expect(html).toContain('data-dyni-action="active-route-open"');
    expect(html).toContain("dyni-active-route-open-hotspot");
    expect(html).toContain("DIST:12.4");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).toHaveBeenCalledTimes(1);
  });

  it("keeps passive interaction in edit mode and does not dispatch", function () {
    const openActiveRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ editing: true }), { mode: "dispatch", openActiveRoute })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).not.toHaveBeenCalled();
  });

  it("updates layout signature when ratio-driven mode changes", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });

    const baseSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 220, height: 180 }
    });
    const flatSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 520, height: 120 }
    });

    expect(flatSig).not.toBe(baseSig);
  });

  it("mirrors page/orientation context into shadow-root-visible root", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "editroutepage", orientation: "vertical" })
    );

    const root = mounted.mountEl.querySelector(".dyni-html-root");
    expect(root).toBeTruthy();
    expect(root.getAttribute("data-dyni-page-id")).toBe("editroutepage");
    expect(root.getAttribute("data-dyni-orientation")).toBe("vertical");
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-active-route-html");
    expect(css).toContain('.dyni-html-root[data-dyni-orientation="vertical"] .dyni-active-route-html');
    expect(css).not.toContain("#navpage .widgetContainer.vertical");
  });
});
