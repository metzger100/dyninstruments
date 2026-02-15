const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterMapperRegistry", function () {
  function makeHelpers() {
    const modules = {
      CourseHeadingMapper: { create: () => ({ cluster: "courseHeading", translate: (p) => ({ c: p.kind }) }) },
      SpeedMapper: { create: () => ({ cluster: "speed", translate: (p) => ({ s: p.kind }) }) },
      EnvironmentMapper: { create: () => ({ cluster: "environment", translate: () => ({}) }) },
      WindMapper: { create: () => ({ cluster: "wind", translate: () => ({}) }) },
      NavMapper: { create: () => ({ cluster: "nav", translate: (p) => ({ n: p.kind }) }) },
      AnchorMapper: { create: () => ({ cluster: "anchor", translate: () => ({}) }) },
      VesselMapper: { create: () => ({ cluster: "vessel", translate: () => ({}) }) }
    };

    return {
      getModule(id) {
        return modules[id];
      }
    };
  }

  it("maps by props.cluster first, then def.cluster", function () {
    const reg = loadFresh("cluster/mappers/ClusterMapperRegistry.js").create({ cluster: "speed" }, makeHelpers());

    expect(reg.mapCluster({ cluster: "nav", kind: "eta" }, () => ({}))).toEqual({ n: "eta" });
    expect(reg.mapCluster({ kind: "sog" }, () => ({}))).toEqual({ s: "sog" });
  });

  it("returns empty object for unknown clusters", function () {
    const reg = loadFresh("cluster/mappers/ClusterMapperRegistry.js").create({ cluster: "x" }, makeHelpers());
    expect(reg.mapCluster({ kind: "y" }, () => ({}))).toEqual({});
  });

  it("passes toolkit created from createToolkit callback", function () {
    const mod = loadFresh("cluster/mappers/ClusterMapperRegistry.js");
    const helpers = makeHelpers();

    helpers.getModule = function (id) {
      if (id === "SpeedMapper") {
        return {
          create: () => ({
            cluster: "speed",
            translate: (props, toolkit) => ({ got: toolkit.flag, kind: props.kind })
          })
        };
      }
      return {
        create: () => ({ cluster: id, translate: () => ({}) })
      };
    };

    const reg = mod.create({ cluster: "speed" }, helpers);
    const createToolkit = vi.fn(() => ({ flag: "ok" }));

    expect(reg.mapCluster({ kind: "sog" }, createToolkit)).toEqual({ got: "ok", kind: "sog" });
    expect(createToolkit).toHaveBeenCalledOnce();
  });
});
