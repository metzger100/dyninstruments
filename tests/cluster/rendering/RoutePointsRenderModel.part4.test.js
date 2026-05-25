const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("RoutePointsRenderModel", function () {
  function createLayoutApi() {
    const responsiveScaleProfile = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const routePointsLayoutSizing = loadFresh(
      "shared/widget-kits/nav/RoutePointsLayoutSizing.js",
    );
    return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: loadFresh(
            "shared/widget-kits/layout/LayoutRectMath.js",
          ),
          RoutePointsLayoutSizing: routePointsLayoutSizing,
          RoutePointsRowGeometry: loadFresh(
            "shared/widget-kits/nav/RoutePointsRowGeometry.js",
          ),
        },
      }),
    );
  }

  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      opts.applyFormatter ||
      function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatLonLats") {
          if (
            !value ||
            !Number.isFinite(value.lat) ||
            !Number.isFinite(value.lon)
          ) {
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
              labelWeight: 610,
            },
          };
        },
      },
    };
    const moduleSources = {
      CenterDisplayMath: loadFresh(
        "shared/widget-kits/nav/CenterDisplayMath.js",
      ),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      NavInteractionPolicy: loadFresh(
        "shared/widget-kits/nav/NavInteractionPolicy.js",
      ),
      PlaceholderNormalize: loadFresh(
        "shared/widget-kits/format/PlaceholderNormalize.js",
      ),
      RadialTextFitting: loadFresh(
        "shared/widget-kits/radial/RadialTextFitting.js",
      ),
      CanvasTextLayout: loadFresh(
        "shared/widget-kits/text/CanvasTextLayout.js",
      ),
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      RoutePointsHtmlFit: loadFresh(
        "shared/widget-kits/nav/RoutePointsHtmlFit.js",
      ),
      RoutePointsInfoText: loadFresh(
        "shared/widget-kits/nav/RoutePointsInfoText.js",
      ),
      RoutePointsLayout: loadFresh(
        "shared/widget-kits/nav/RoutePointsLayout.js",
      ),
      RoutePointsLayoutSizing: loadFresh(
        "shared/widget-kits/nav/RoutePointsLayoutSizing.js",
      ),
      RoutePointsRowGeometry: loadFresh(
        "shared/widget-kits/nav/RoutePointsRowGeometry.js",
      ),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenPrecedence: loadFresh(
        "shared/widget-kits/state/StateScreenPrecedence.js",
      ),
      StateScreenInteraction: loadFresh(
        "shared/widget-kits/state/StateScreenInteraction.js",
      ),
      StateScreenLabels: loadFresh(
        "shared/widget-kits/state/StateScreenLabels.js",
      ),
      TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
      UnitAwareFormatter: loadFresh(
        "shared/widget-kits/format/UnitAwareFormatter.js",
      ),
    };
    const moduleSourceContext = createComponentContextMock({
      modules: moduleSources,
      services: services,
    });
    const modules = Object.create(null);
    Object.keys(moduleSources).forEach(function (id) {
      modules[id] = moduleSourceContext.components.require(id);
    });
    const componentContext = createComponentContextMock({
      modules: modules,
      services: services,
    });

    return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create(
      {},
      componentContext,
    );
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const interactionMode = opts.mode === "passive" ? "passive" : "dispatch";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: { mode: interactionMode },
        containerOrientation:
          opts.orientation === "vertical" ? "vertical" : "default",
        actions: {
          routePoints: {
            activate: vi.fn(() => true),
          },
        },
      },
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
              { name: "", lat: 54.3, lon: 10.6 },
            ],
          },
          routeName: "Harbor Run",
          pointCount: 3,
          selectedIndex: 2,
          isActiveRoute: true,
          showLatLon: false,
          useRhumbLine: false,
        },
        layout: {
          ratioThresholdNormal: 1.0,
          ratioThresholdFlat: 3.5,
          showHeader: true,
        },
        formatting: {
          courseUnit: "°",
          waypointsText: "waypoints",
        },
        units: {
          distance: "nm",
        },
        formatUnits: {
          distance: "nm",
        },
      },
      overrides || {},
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

  it("prefers stable raw waypoint identity fields for active waypoint key", function () {
    const renderModel = createRenderModel();
    const props = makeProps({
      domain: {
        route: {
          name: "Identity Route",
          points: [
            { id: "wp-0", name: "Start", lat: 54.1, lon: 10.4 },
            { uid: "wp-1", name: "Mid", lat: 54.2, lon: 10.5 },
          ],
        },
        routeName: "Identity Route",
        pointCount: 2,
        selectedIndex: 0,
        isActiveRoute: false,
        showLatLon: false,
        useRhumbLine: false,
      },
    });

    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false,
    });

    expect(model.activeWaypointKey).toContain("id:wp-0");
    expect(model.activeWaypointKey).not.toBe("idx:0");
  });

});
