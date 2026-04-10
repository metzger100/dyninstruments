const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel = opts.buildModel || vi.fn(function (args) {
      const props = args && args.props ? args.props : {};
      const points = Array.isArray(props.__points)
        ? props.__points
        : [{ index: 0, ordinalText: "1", nameText: "WP1", infoText: "I", selected: false }];
      return {
        mode: props.__mode || "normal",
        showHeader: true,
        showOrdinal: true,
        hasRoute: true,
        routeNameText: "Route",
        emptyText: "No Route",
        metaText: "1 WP",
        points,
        isActiveRoute: false,
        canActivateRoutePoint: props.__canActivate === true,
        hasValidSelection: props.__hasValidSelection === true,
        selectedIndex: Number.isInteger(props.__selectedIndex) ? props.__selectedIndex : -1,
        activeWaypointKey: props.__activeKey || null,
        resizeSignatureParts: ["sig", props.__token || "1"],
        inlineGeometry: {
          wrapper: { style: "" },
          list: { style: "", contentStyle: "" },
          header: { style: "", routeNameStyle: "", metaStyle: "" },
          rows: points.map(function () {
            return {
              rowStyle: "",
              ordinalStyle: "",
              middleStyle: "",
              nameStyle: "",
              infoStyle: "",
              markerStyle: "",
              markerDotStyle: ""
            };
          })
        }
      };
    });
    const fitCompute = opts.fitCompute || vi.fn(function (args) {
      const model = args && args.model ? args.model : { points: [] };
      return {
        headerFit: { routeNameStyle: "", metaStyle: "" },
        rowFits: model.points.map(function () {
          return { ordinalStyle: "", nameStyle: "", infoStyle: "" };
        }),
        emptyStyle: ""
      };
    });
    const maybeReveal = opts.maybeReveal || vi.fn(() => true);
    const measureListScrollbarGutter = opts.measureListScrollbarGutter || vi.fn(() => 0);
    const computeNaturalHeight = opts.computeNaturalHeight || vi.fn(() => ({ cappedHeight: 240 }));

    const Helpers = {
      getModule(id) {
        if (id === "RoutePointsHtmlFit") {
          return {
            create() {
              return { compute: fitCompute };
            }
          };
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        if (id === "RoutePointsRenderModel") {
          return {
            create() {
              return {
                buildModel
              };
            }
          };
        }
        if (id === "RoutePointsMarkup") {
          return loadFresh("shared/widget-kits/nav/RoutePointsMarkup.js");
        }
        if (id === "RoutePointsDomEffects") {
          return {
            create() {
              return {
                measureListScrollbarGutter,
                maybeRevealActiveRow: maybeReveal,
                scheduleSelectedRowVisibility: maybeReveal
              };
            }
          };
        }
        if (id === "RoutePointsLayout") {
          return {
            create() {
              return {
                computeNaturalHeight
              };
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js").create({}, Helpers),
      buildModel,
      fitCompute,
      maybeReveal,
      measureListScrollbarGutter,
      computeNaturalHeight
    };
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const activate = opts.activate || vi.fn(() => true);
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: opts.pageId || "navpage",
        interaction: { mode },
        containerOrientation: orientation,
        actions: {
          routePoints: {
            activate
          }
        }
      }
    });
  }

  function mountCommitted(rendererSpec, props, options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 300, height: 160 };
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

    let revision = 0;

    function payload(nextProps, layoutChanged) {
      revision += 1;
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

    const initial = payload(props, true);
    committed.mount(mountEl, initial);
    const postPatchResult = committed.postPatch(initial);

    return {
      mountEl,
      committed,
      postPatchResult,
      update(nextProps, layoutChanged) {
        const next = payload(nextProps, layoutChanged === true);
        committed.update(next);
        return committed.postPatch(next);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("exposes committed renderer contract and vertical natural sizing", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;

    expect(renderer.id).toBe("RoutePointsTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");

    const verticalSizing = renderer.getVerticalShellSizing(
      { shellWidth: 320, viewportHeight: 900, payload: { domain: { pointCount: 4 }, layout: { showHeader: true } } },
      { containerOrientation: "vertical" }
    );

    expect(verticalSizing).toEqual({ kind: "natural", height: "240px" });
    expect(setup.computeNaturalHeight).toHaveBeenCalledTimes(1);
  });

  it("dispatches route-point activation for valid row clicks", function () {
    const activate = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({
        __canActivate: true,
        __points: [
          { index: 0, ordinalText: "1", nameText: "WP1", infoText: "I", selected: false },
          { index: 3, ordinalText: "4", nameText: "WP4", infoText: "I", selected: true }
        ]
      }, { mode: "dispatch", activate })
    );

    const row = mounted.mountEl.querySelector('[data-rp-idx="3"]');
    row.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(activate).toHaveBeenCalledWith(3);

    const wrapper = mounted.mountEl.querySelector(".dyni-route-points-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it("runs post-patch reveal effects only for valid selections", function () {
    const maybeReveal = vi.fn(() => true);
    const setupValid = createRenderer({ maybeReveal });
    mountCommitted(
      setupValid.renderer,
      withSurfacePolicy({
        __canActivate: true,
        __hasValidSelection: true,
        __selectedIndex: 0,
        __activeKey: "id:wp-0"
      }, { mode: "dispatch" })
    );

    expect(maybeReveal).toHaveBeenCalledWith(expect.objectContaining({
      selectedIndex: 0,
      activeKey: "id:wp-0"
    }));

    const maybeRevealInvalid = vi.fn(() => true);
    const setupInvalid = createRenderer({ maybeReveal: maybeRevealInvalid });
    mountCommitted(
      setupInvalid.renderer,
      withSurfacePolicy({
        __canActivate: false,
        __hasValidSelection: false,
        __selectedIndex: -1
      }, { mode: "passive" })
    );

    expect(maybeRevealInvalid).not.toHaveBeenCalled();
  });

  it("requests relayout when scrollbar gutter changes", function () {
    const setup = createRenderer({
      measureListScrollbarGutter: vi.fn()
        .mockReturnValueOnce(6)
        .mockReturnValue(6)
    });
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy({ __canActivate: true, __hasValidSelection: false }, { mode: "dispatch" })
    );

    expect(mounted.postPatchResult).toEqual({ relayout: true });
  });

  it("derives layout signature from model resizeSignatureParts", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });

    const sigA = committed.layoutSignature({ props: { __token: "A" }, shellRect: { width: 300, height: 160 } });
    const sigB = committed.layoutSignature({ props: { __token: "B" }, shellRect: { width: 300, height: 160 } });

    expect(sigB).not.toBe(sigA);
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-route-points-html");
    expect(css).toContain('.dyni-html-root[data-dyni-orientation="vertical"] .dyni-route-points-html');
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
  });
});
