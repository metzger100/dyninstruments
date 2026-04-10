const fs = require("fs");
const path = require("path");
const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel = opts.buildModel || vi.fn(function () {
      return {
        mode: "normal",
        hasRoute: true,
        canOpenEditRoute: false,
        captureClicks: false,
        resizeSignatureParts: ["sig", "1"]
      };
    });
    const canOpen = opts.canOpen || vi.fn(() => false);
    const fitCompute = opts.fitCompute || vi.fn(() => ({
      nameTextStyle: "font-size:12px;",
      sourceBadgeStyle: "font-size:9px;",
      metrics: Object.create(null)
    }));
    const markupRender = opts.markupRender || vi.fn(() => "<div>markup</div>");

    const Helpers = {
      getModule(id) {
        if (id === "EditRouteHtmlFit") {
          return {
            create() {
              return { compute: fitCompute };
            }
          };
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        if (id === "EditRouteRenderModel") {
          return {
            create() {
              return {
                buildModel: buildModel,
                canOpenEditRoute: canOpen
              };
            }
          };
        }
        if (id === "EditRouteMarkup") {
          return {
            create() {
              return { render: markupRender };
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js").create({}, Helpers),
      buildModel,
      canOpen,
      fitCompute,
      markupRender
    };
  }

  function createHostContext(options) {
    const opts = options || {};
    const shellRect = opts.shellRect || { width: 320, height: 180 };
    const shellEl = {
      getBoundingClientRect: vi.fn(() => shellRect)
    };
    const hostContext = {};

    if (opts.withCommitState !== false) {
      hostContext.__dyniHostCommitState = {
        shellEl: shellEl,
        rootEl: null
      };
    }
    return hostContext;
  }
  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    const openEditRoute = opts.openEditRoute || vi.fn(() => true);
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: { mode: mode },
        containerOrientation: orientation,
        actions: {
          routeEditor: {
            openEditRoute: openEditRoute
          }
        }
      }
    });
  }

  it("returns passive namedHandlers when capability gate is closed", function () {
    const setup = createRenderer({ canOpen: vi.fn(() => false) });
    const handlers = setup.renderer.namedHandlers(withSurfacePolicy({}, { mode: "passive" }), createHostContext());

    expect(handlers).toEqual({});
    expect(setup.canOpen).toHaveBeenCalled();
  });

  it("returns editRouteOpen handler in dispatch mode and dispatches host action", function () {
    const openEditRoute = vi.fn(() => true);
    const setup = createRenderer({ canOpen: vi.fn(() => true) });
    const hostContext = createHostContext();
    const handlers = setup.renderer.namedHandlers(withSurfacePolicy({}, {
      mode: "dispatch",
      openEditRoute: openEditRoute
    }), hostContext);

    expect(Object.keys(handlers)).toEqual(["editRouteOpen"]);
    expect(handlers.editRouteOpen()).toBe(true);
    expect(openEditRoute).toHaveBeenCalledTimes(1);
  });

  it("orchestrates committed vertical facts, render-model, fit, and markup", function () {
    const setup = createRenderer({
      buildModel: vi.fn(() => ({
        mode: "high",
        hasRoute: true,
        canOpenEditRoute: true,
        captureClicks: true,
        resizeSignatureParts: ["x", "y"]
      }))
    });
    const hostContext = createHostContext({ shellRect: { width: 240, height: 120 } });
    const html = setup.renderer.renderHtml.call(hostContext, withSurfacePolicy({}, { orientation: "vertical" }));

    expect(html).toBe("<div>markup</div>");
    expect(setup.buildModel).toHaveBeenCalledWith(expect.objectContaining({
      isVerticalCommitted: true,
      shellRect: { width: 240, height: 120 }
    }));
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(setup.markupRender).toHaveBeenCalledTimes(1);
  });

  it("tolerates first render without committed ancestry", function () {
    const setup = createRenderer();
    const hostContext = createHostContext({ withCommitState: false });
    const html = setup.renderer.renderHtml.call(hostContext, withSurfacePolicy({}, { orientation: "default" }));

    expect(html).toBe("<div>markup</div>");
    expect(setup.buildModel).toHaveBeenCalledWith(expect.objectContaining({
      shellRect: null,
      isVerticalCommitted: false
    }));
  });

  it("derives resize signature from model resizeSignatureParts", function () {
    const setup = createRenderer({
      buildModel: vi.fn(() => ({
        mode: "normal",
        hasRoute: true,
        canOpenEditRoute: false,
        captureClicks: false,
        resizeSignatureParts: [1, 2, 3]
      }))
    });
    const signature = setup.renderer.resizeSignature.call(createHostContext(), withSurfacePolicy({}, {}));

    expect(signature).toBe("1|2|3");
  });

  it("requests corrective rerender via initFunction.triggerResize", function () {
    const setup = createRenderer();
    const triggerResize = vi.fn();

    setup.renderer.initFunction.call({ triggerResize: triggerResize });

    expect(triggerResize).toHaveBeenCalledTimes(1);
  });

  it("keeps css mode and interaction contract selectors", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-edit-route-mode-flat .dyni-edit-route-metrics");
    expect(css).toContain(".dyni-edit-route-mode-flat.dyni-edit-route-flat-rows-2 .dyni-edit-route-metrics");
    expect(css).toContain(".dyni-edit-route-mode-normal .dyni-edit-route-metrics");
    expect(css).toContain(".dyni-edit-route-mode-high .dyni-edit-route-metrics");
    expect(css).not.toContain(".dyni-edit-route-mode-flat .dyni-edit-route-metric-value-stack");
    expect(css).not.toContain("0.58fr");
    expect(css).not.toContain("grid-template-rows: minmax(0, 0.36fr) minmax(0, 0.64fr);");
    expect(css).toContain(".dyni-edit-route-open-hotspot");
    expect(css).toContain(".dyni-edit-route-open-dispatch");
    expect(css).toContain(".dyni-edit-route-open-passive");
    expect(css).toContain(".dyni-edit-route-metric-value-text");
    expect(css).toContain(".dyni-edit-route-metric-unit");
    expect(css).toContain(".widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-edit-route-html");
    expect(css).toContain("aspect-ratio: 7 / 8;");
    expect(css).toContain("min-height: 8em;");
  });
});
