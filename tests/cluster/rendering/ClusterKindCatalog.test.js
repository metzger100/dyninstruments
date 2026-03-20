const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterKindCatalog", function () {
  function createFactory() {
    return loadFresh("cluster/rendering/ClusterKindCatalog.js").create({}, {});
  }

  it("exposes all shipped cluster/kind routes in the default catalog", function () {
    const catalogFactory = createFactory();
    const catalog = catalogFactory.createDefaultCatalog();

    const routes = catalog.listRoutes();
    expect(routes).toHaveLength(52);

    const activeRoute = catalog.resolveRoute("nav", "activeRoute");
    expect(activeRoute).toEqual({
      cluster: "nav",
      kind: "activeRoute",
      viewModelId: "ActiveRouteViewModel",
      rendererId: "ActiveRouteTextWidget",
      surface: "canvas-dom"
    });

    const activeRouteInteractive = catalog.resolveRoute("nav", "activeRouteInteractive");
    expect(activeRouteInteractive).toEqual({
      cluster: "nav",
      kind: "activeRouteInteractive",
      viewModelId: "ActiveRouteViewModel",
      rendererId: "ActiveRouteTextHtmlWidget",
      surface: "html"
    });
  });

  it("throws for missing catalog tuples", function () {
    const catalogFactory = createFactory();
    const catalog = catalogFactory.createDefaultCatalog();

    expect(function () {
      catalog.resolveRoute("nav", "missing");
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
