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
    const scheduleSelected = opts.scheduleSelected || vi.fn(() => true);
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
                scheduleSelectedRowVisibility: scheduleSelected
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
      scheduleSelected,
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
      },
      hostActions: {
        routePoints: {
          activate: vi.fn(() => true)
        }
      }
    };
  }

  it("returns passive namedHandlers when activation gate is closed", function () {
    const setup = createRenderer({ canActivate: vi.fn(() => false) });
    const handlers = setup.renderer.namedHandlers({}, createHostContext());

    expect(handlers).toEqual({});
    expect(setup.canActivate).toHaveBeenCalled();
  });

  it("dispatches routePointActivate for valid row clicks and ignores invalid clicks", function () {
    const setup = createRenderer({ canActivate: vi.fn(() => true) });
    const hostContext = createHostContext();
    const handlers = setup.renderer.namedHandlers({}, hostContext);

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
    expect(hostContext.hostActions.routePoints.activate).toHaveBeenCalledWith(3);
  });

  it("orchestrates committed facts, fit, markup, and post-commit visibility scheduling", function () {
    const setup = createRenderer({
      buildModel: vi.fn(() => ({
        mode: "high",
        points: [{ index: 0 }],
        hasValidSelection: true,
        selectedIndex: 0,
        resizeSignatureParts: ["x", "y"]
      }))
    });
    const hostContext = createHostContext();
    const html = setup.renderer.renderHtml.call(hostContext, { viewportHeight: 900 });

    expect(html).toBe("<div>markup</div>");
    expect(setup.applyCommittedEffects).toHaveBeenCalledTimes(1);
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(setup.markupRender).toHaveBeenCalledTimes(1);
    expect(setup.scheduleSelected).toHaveBeenCalledWith(
      expect.objectContaining({ selectedIndex: 0 })
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

    setup.renderer.renderHtml.call(createHostContext(), {});

    expect(setup.scheduleSelected).not.toHaveBeenCalled();
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

    const signature = setup.renderer.resizeSignature.call(createHostContext(), {});
    expect(signature).toBe("1|2|3");
  });

  it("requests a corrective rerender via initFunction.triggerResize", function () {
    const setup = createRenderer();
    const triggerResize = vi.fn();

    setup.renderer.initFunction.call({ triggerResize: triggerResize });

    expect(triggerResize).toHaveBeenCalledTimes(1);
  });
});
