const { loadFresh } = require("../../helpers/load-umd");

const defaultToolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_text: "VALUE",
  unit_text: "",
  caption_linearGauge: "VALUE",
  unit_linearGauge: "",
  caption_radialGauge: "VALUE",
  unit_radialGauge: ""
});

describe("ClusterMapperRegistry", function () {
  function makeHelpers() {
    const modules = {
      CourseHeadingMapper: { create: () => ({ cluster: "courseHeading", translate: (p) => ({ c: p.kind }) }) },
      SpeedMapper: { create: () => ({ cluster: "speed", translate: (p) => ({ s: p.kind }) }) },
      EnvironmentMapper: { create: () => ({ cluster: "environment", translate: () => ({}) }) },
      WindMapper: { create: () => ({ cluster: "wind", translate: () => ({}) }) },
      NavMapper: { create: () => ({ cluster: "nav", translate: (p) => ({ n: p.kind }) }) },
      MapMapper: { create: () => ({ cluster: "map", translate: (p) => ({ m: p.kind }) }) },
      AnchorMapper: { create: () => ({ cluster: "anchor", translate: () => ({}) }) },
      VesselMapper: { create: () => ({ cluster: "vessel", translate: () => ({}) }) },
      DefaultMapper: loadFresh("cluster/mappers/DefaultMapper.js")
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
    expect(reg.mapCluster({ cluster: "map", kind: "zoom" }, () => ({}))).toEqual({ m: "zoom" });
    expect(reg.mapCluster({ cluster: "default", kind: "text", value: "nav.gps.speed" }, () => defaultToolkit)).toEqual({
      value: "nav.gps.speed",
      caption: "VALUE",
      unit: ""
    });
    expect(reg.mapCluster({
      cluster: "default",
      kind: "linearGauge",
      value: 12.3,
      defaultLinearMinValue: 0,
      defaultLinearMaxValue: 100
    }, () => defaultToolkit)).toMatchObject({
      renderer: "DefaultLinearWidget",
      value: 12.3,
      caption: "VALUE",
      unit: "",
      rendererProps: {
        defaultLinearMinValue: 0,
        defaultLinearMaxValue: 100
      }
    });
    expect(reg.mapCluster({
      cluster: "default",
      kind: "radialGauge",
      value: 12.3,
      defaultRadialMinValue: 0,
      defaultRadialMaxValue: 100
    }, () => defaultToolkit)).toMatchObject({
      renderer: "DefaultRadialWidget",
      value: 12.3,
      caption: "VALUE",
      unit: "",
      rendererProps: {
        defaultRadialMinValue: 0,
        defaultRadialMaxValue: 100
      }
    });
    expect(reg.mapCluster({ cluster: "default", kind: "unknown" }, () => defaultToolkit)).toEqual({});
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
