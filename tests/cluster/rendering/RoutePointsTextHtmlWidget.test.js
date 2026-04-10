const fs = require("fs");
const path = require("path");
const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel = opts.buildModel || vi.fn(function () {
      return {
        mode: "normal",
        points: [],
        hasValidSelection: false,
        selectedIndex: -1,
        resizeSignatureParts: ["a", "b"]
      };
    });
    const canActivate = opts.canActivate || vi.fn(() => false);
    const markupRender = opts.markupRender || vi.fn(() => "<div>markup</div>");
    const maybeReveal = opts.maybeReveal || vi.fn(() => true);
    const applyCommittedEffects = opts.applyCommittedEffects || vi.fn(function (args) {
      return {
        targetEl: args && args.targetEl ? args.targetEl : null,
        isVerticalCommitted: false
      };
    });
    const fitCompute = opts.fitCompute || vi.fn(() => ({ headerFit: null, rowFits: [] }));

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
                buildModel: buildModel,
                canActivateRoutePoint: canActivate
              };
            }
          };
        }
        if (id === "RoutePointsMarkup") {
          return {
            create() {
              return { render: markupRender };
            }
          };
        }
        if (id === "RoutePointsDomEffects") {
          return {
            create() {
              return {
                applyCommittedEffects: applyCommittedEffects,
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
                computeNaturalHeight: vi.fn(() => ({ cappedHeight: 240 }))
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
      canActivate,
      markupRender,
      maybeReveal,
      applyCommittedEffects,
      fitCompute
    };
  }

  function createHostContext() {
    const shellEl = {
      getBoundingClientRect: vi.fn(() => ({ width: 300, height: 160 }))
    };
    return {
      __dyniHostCommitState: {
        shellEl: shellEl,
        rootEl: null
      }
    };
  }
  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const activate = opts.activate || vi.fn(() => true);
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: { mode: mode },
        containerOrientation: orientation,
        actions: {
          routePoints: {
            activate: activate
          }
        }
      }
    });
  }

  it("returns passive namedHandlers when activation gate is closed", function () {
    const setup = createRenderer({ canActivate: vi.fn(() => false) });
    const handlers = setup.renderer.namedHandlers(withSurfacePolicy({}, { mode: "passive" }), createHostContext());

    expect(handlers).toEqual({});
    expect(setup.canActivate).toHaveBeenCalled();
  });

  it("dispatches routePointActivate for valid row clicks and ignores invalid clicks", function () {
    const setup = createRenderer({ canActivate: vi.fn(() => true) });
    const activate = vi.fn(() => true);
    const hostContext = createHostContext();
    const handlers = setup.renderer.namedHandlers(withSurfacePolicy({}, {
      mode: "dispatch",
      activate: activate
    }), hostContext);

    expect(Object.keys(handlers)).toEqual(["routePointActivate"]);
    expect(handlers.routePointActivate({ target: { closest: () => null } })).toBe(false);

    const event = {
      target: {
        closest() {
          return {
            getAttribute() {
              return "3";
            }
          };
        }
      }
    };

    expect(handlers.routePointActivate(event)).toBe(true);
    expect(activate).toHaveBeenCalledWith(3);
  });

  it("orchestrates committed facts, fit, markup, and post-commit visibility scheduling", function () {
    const setup = createRenderer({
      buildModel: vi.fn(() => ({
        mode: "high",
        points: [{ index: 0 }],
        hasValidSelection: true,
        selectedIndex: 0,
        activeWaypointKey: "id:wp-0",
        resizeSignatureParts: ["x", "y"]
      }))
    });
    const hostContext = createHostContext();
    const html = setup.renderer.renderHtml.call(hostContext, withSurfacePolicy({ viewportHeight: 900 }, {
      mode: "dispatch"
    }));

    expect(html).toBe("<div>markup</div>");
    expect(setup.applyCommittedEffects).toHaveBeenCalledTimes(1);
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(setup.markupRender).toHaveBeenCalledTimes(1);
    expect(setup.maybeReveal).toHaveBeenCalledWith(
      expect.objectContaining({ selectedIndex: 0, activeKey: "id:wp-0" })
    );
  });

  it("does not schedule selected-row visibility when selection is invalid", function () {
    const setup = createRenderer({
      buildModel: vi.fn(() => ({
        mode: "normal",
        points: [],
        hasValidSelection: false,
        selectedIndex: -1,
        resizeSignatureParts: ["x", "z"]
      }))
    });

    setup.renderer.renderHtml.call(createHostContext(), withSurfacePolicy({}, { mode: "passive" }));

    expect(setup.maybeReveal).not.toHaveBeenCalled();
  });

  it("derives resize signature from model resizeSignatureParts", function () {
    const setup = createRenderer({
      buildModel: vi.fn(() => ({
        mode: "normal",
        points: [],
        hasValidSelection: false,
        selectedIndex: -1,
        resizeSignatureParts: [1, 2, 3]
      }))
    });

    const signature = setup.renderer.resizeSignature.call(createHostContext(), withSurfacePolicy({}, { mode: "passive" }));
    expect(signature).toBe("1|2|3");
  });

  it("requests a corrective rerender via initFunction.triggerResize", function () {
    const setup = createRenderer();
    const triggerResize = vi.fn();

    setup.renderer.initFunction.call({ triggerResize: triggerResize });

    expect(triggerResize).toHaveBeenCalledTimes(1);
  });

  it("keeps mode-specific wrapper/header flex-direction css contract", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-route-points-mode-flat");
    expect(css).toContain("flex-direction: row;");
    expect(css).toContain(".dyni-route-points-mode-high .dyni-route-points-header");
    expect(css).toContain(".dyni-route-points-mode-flat .dyni-route-points-header");
    expect(css).toContain(".dyni-route-points-mode-normal .dyni-route-points-header");
    expect(css).toContain(".dyni-route-points-header");
    expect(css).toContain("flex: 0 0 auto;");
    expect(css).toContain(".dyni-route-points-text");
    expect(css).toContain("overflow: visible;");
  });
});
