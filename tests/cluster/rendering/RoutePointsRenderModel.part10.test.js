// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RoutePointsRenderModel", function () {
  function createLayoutApi() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const routePointsLayoutSizing = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
          RoutePointsLayoutSizing: routePointsLayoutSizing,
          RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js")
        }
      })
    );
  }

  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      opts.applyFormatter ||
      function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatLonLats") {
          if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lon)) {
            return cfg.default;
          }
          return "LL:" + value.lat.toFixed(2) + "," + value.lon.toFixed(2);
        }

        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return cfg.default;
        }

        if (cfg.formatter === "formatDirection") {
          return "DIR:" + Math.round(numeric);
        }
        if (cfg.formatter === "formatDistance") {
          return "DST:" + Math.round(numeric);
        }
        return String(value);
      };

    const services = {
      format: { applyFormatter: applyFormatter },
      themeTokens: {
        resolveForRoot() {
          return {
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 720,
              labelWeight: 610
            }
          };
        }
      }
    };
    const moduleSources = {
      CenterDisplayMath: loadFresh("shared/widget-kits/nav/CenterDisplayMath.js"),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      NavInteractionPolicy: loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      CanvasTextLayout: loadFresh("shared/widget-kits/text/CanvasTextLayout.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      RoutePointsHtmlFit: loadFresh("shared/widget-kits/nav/RoutePointsHtmlFit.js"),
      RoutePointsInfoText: loadFresh("shared/widget-kits/nav/RoutePointsInfoText.js"),
      RoutePointsLayout: loadFresh("shared/widget-kits/nav/RoutePointsLayout.js"),
      RoutePointsLayoutSizing: loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js"),
      RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js"),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
      UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js")
    };
    const moduleSourceContext = createComponentContextMock({
      modules: moduleSources,
      services: services
    });
    const modules = Object.create(null);
    Object.keys(moduleSources).forEach(function (id) {
      modules[id] = moduleSourceContext.components.require(id);
    });
    const componentContext = createComponentContextMock({
      modules: modules,
      services: services
    });

    return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create({}, componentContext);
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const interactionMode = opts.mode === "passive" ? "passive" : "dispatch";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: { mode: interactionMode },
        containerOrientation: opts.orientation === "vertical" ? "vertical" : "default",
        actions: {
          routePoints: {
            activate: vi.fn(() => true)
          }
        }
      }
    });
  }

  function makeProps(overrides) {
    return Object.assign(
      {
        default: "---",
        domain: {
          route: {
            name: "Harbor Run",
            points: [
              { name: "Start", lat: 54.1, lon: 10.4 },
              { name: "Mid", lat: 54.2, lon: 10.5 },
              { name: "", lat: 54.3, lon: 10.6 }
            ]
          },
          routeName: "Harbor Run",
          pointCount: 3,
          selectedIndex: 2,
          isActiveRoute: true,
          showLatLon: false,
          useRhumbLine: false
        },
        layout: {
          ratioThresholdNormal: 1.0,
          ratioThresholdFlat: 3.5,
          showHeader: true
        },
        formatting: {
          courseUnit: "°",
          waypointsText: "waypoints"
        },
        units: {
          distance: "nm"
        },
        formatUnits: {
          distance: "nm"
        }
      },
      overrides || {}
    );
  }

  function extractHeight(style) {
    const match = String(style || "").match(new RegExp("height:(\\d+)px\\x3b"));
    return match ? Number(match[1]) : 0;
  }

  function extractMinHeight(style) {
    const match = String(style || "").match(new RegExp("min-height:(\\d+)px\\x3b"));
    return match ? Number(match[1]) : 0;
  }

  it("fails closed when route payload is missing", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            route: null,
            routeName: "",
            pointCount: 0,
            selectedIndex: -1,
            isActiveRoute: false,
            showLatLon: false,
            useRhumbLine: false
          }
        }),
        { mode: "dispatch" }
      ),
      shellRect: { width: 220, height: 140 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("noRoute");
    expect(model.stateLabel).toBe("No Route");
    expect(model.hasRoute).toBe(false);
    expect(model.routeNameText).toBe("");
    expect(model.pointCount).toBe(0);
    expect(model.points).toEqual([]);
    expect(model.hasValidSelection).toBe(false);
  });
});
