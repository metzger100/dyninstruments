const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterKindCatalog", function () {
  function createFactory() {
    return loadFresh("cluster/rendering/ClusterKindCatalog.js").create({}, {});
  }

  it("exposes all shipped cluster/kind routes in the default catalog", function () {
    const catalogFactory = createFactory();
    const catalog = catalogFactory.createDefaultCatalog();

    const routes = catalog.listRoutes();
    expect(routes).toHaveLength(56);

    const activeRoute = catalog.resolveRoute("nav", "activeRoute");
    expect(activeRoute).toEqual({
      cluster: "nav",
      kind: "activeRoute",
      viewModelId: "ActiveRouteViewModel",
      rendererId: "ActiveRouteTextHtmlWidget",
      surface: "html"
    });

    const mapZoom = catalog.resolveRoute("map", "zoom");
    expect(mapZoom).toEqual({
      cluster: "map",
      kind: "zoom",
      viewModelId: "MapperOutputViewModel",
      rendererId: "MapZoomTextHtmlWidget",
      surface: "html"
    });

    const mapAisTarget = catalog.resolveRoute("map", "aisTarget");
    expect(mapAisTarget).toEqual({
      cluster: "map",
      kind: "aisTarget",
      viewModelId: "AisTargetViewModel",
      rendererId: "AisTargetTextHtmlWidget",
      surface: "html"
    });

    const vesselAlarm = catalog.resolveRoute("vessel", "alarm");
    expect(vesselAlarm).toEqual({
      cluster: "vessel",
      kind: "alarm",
      viewModelId: "AlarmViewModel",
      rendererId: "AlarmTextHtmlWidget",
      surface: "html"
    });

    const routePoints = catalog.resolveRoute("nav", "routePoints");
    expect(routePoints).toEqual({
      cluster: "nav",
      kind: "routePoints",
      viewModelId: "RoutePointsViewModel",
      rendererId: "RoutePointsTextHtmlWidget",
      surface: "html"
    });

    const editRoute = catalog.resolveRoute("nav", "editRoute");
    expect(editRoute).toEqual({
      cluster: "nav",
      kind: "editRoute",
      viewModelId: "EditRouteViewModel",
      rendererId: "EditRouteTextHtmlWidget",
      surface: "html"
    });
  });

  it("throws for missing catalog tuples", function () {
    const catalogFactory = createFactory();
    const catalog = catalogFactory.createDefaultCatalog();

    expect(function () {
      catalog.resolveRoute("nav", "missing");
    }).toThrow("missing catalog entry");

    expect(function () {
      catalog.resolveRoute("nav", "activeRouteInteractive");
    }).toThrow("missing catalog entry");
  });

  it("enforces strict validation for duplicates, unsupported surfaces, and missing fields", function () {
    const catalogFactory = createFactory();

    expect(function () {
      catalogFactory.createCatalog([
        {
          cluster: "nav",
          kind: "eta",
          viewModelId: "MapperOutputViewModel",
          rendererId: "ThreeValueTextWidget",
          surface: "canvas-dom"
        },
        {
          cluster: "nav",
          kind: "eta",
          viewModelId: "MapperOutputViewModel",
          rendererId: "ThreeValueTextWidget",
          surface: "canvas-dom"
        }
      ]);
    }).toThrow("duplicate entry");

    expect(function () {
      catalogFactory.createCatalog([
        {
          cluster: "nav",
          kind: "eta",
          viewModelId: "MapperOutputViewModel",
          rendererId: "ThreeValueTextWidget",
          surface: "legacy-html"
        }
      ]);
    }).toThrow("unsupported surface");

    expect(function () {
      catalogFactory.createCatalog([
        {
          cluster: "",
          kind: "eta",
          viewModelId: "MapperOutputViewModel",
          rendererId: "ThreeValueTextWidget",
          surface: "canvas-dom"
        }
      ]);
    }).toThrow("entry.cluster");
  });
});
