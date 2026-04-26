const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterMapperToolkit", function () {
  it("builds angle formatters with expected normalization behavior", function () {
    const mod = loadFresh("cluster/mappers/ClusterMapperToolkit.js");
    const toolkit = mod.create();

    const direction = toolkit.makeAngleFormatter(true, true, "NA");
    expect(direction(360)).toBe("000");
    expect(direction(-1)).toBe("359");

    const relative = toolkit.makeAngleFormatter(false, true, "NA");
    expect(relative(181)).toBe("-179");
    expect(relative(-181)).toBe("179");
    expect(relative("x")).toBe("NA");
  });

  it("out only includes fields that are explicitly provided", function () {
    const mod = loadFresh("cluster/mappers/ClusterMapperToolkit.js");
    const toolkit = mod.create();

    const one = toolkit.out(12, undefined, "kn", "formatSpeed", ["kn"]);
    expect(one).toEqual({
      value: 12,
      unit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });

    const two = toolkit.out(undefined, "SOG", undefined, undefined, "kn");
    expect(two).toEqual({
      caption: "SOG"
    });
  });

  it("createToolkit resolves cap/unit accessors from props", function () {
    const mod = loadFresh("cluster/mappers/ClusterMapperToolkit.js");
    loadFresh("shared/unit-format-families.js");
    const toolkit = mod.create().createToolkit({ caption_eta: "ETA", unit_eta: "" });

    expect(toolkit.cap("eta")).toBe("ETA");
    expect(toolkit.unit("eta")).toBe("");
    expect(toolkit.cap("stw")).toBeUndefined();
    expect(toolkit.num("12.5")).toBe(12.5);
    expect(toolkit.num("x")).toBeUndefined();
  });

  it("resolves format units and display units from the shared catalog", function () {
    const mod = loadFresh("cluster/mappers/ClusterMapperToolkit.js");
    loadFresh("shared/unit-format-families.js");
    const toolkit = mod.create().createToolkit({
      formatUnit_sog: "ms",
      unit_sog_ms: "m/s",
      unit_sog_kmh: "km/h",
      formatUnit_rteDistance: "nm",
      rteDistance_nm: 1,
      anchorDistance_nm: 1852
    });

    expect(toolkit.formatUnit("sog", "speed", "kn")).toBe("ms");
    expect(toolkit.unitText("sog", "speed", "ms")).toBe("m/s");
    expect(toolkit.unitText("sog", "speed", "kmh")).toBe("km/h");
    expect(toolkit.unitNumber("rteDistance", "nm")).toBe(1);
    expect(toolkit.unitNumber("anchorDistance", "m")).toBeUndefined();
    expect(toolkit.unitNumber("anchorDistance", "nm")).toBe(1852);
    expect(toolkit.formatUnit("rteDistance", "distance", "nm")).toBe("nm");
  });

  it("uses injected RadialAngleMath helpers when provided", function () {
    const mod = loadFresh("cluster/mappers/ClusterMapperToolkit.js");
    const toolkit = mod.create({}, {
      getModule(id) {
        if (id !== "RadialAngleMath") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              norm360() { return 42; },
              norm180() { return -7; }
            };
          }
        };
      }
    });

    const direction = toolkit.makeAngleFormatter(true, true, "NA");
    const relative = toolkit.makeAngleFormatter(false, true, "NA");
    expect(direction(123)).toBe("042");
    expect(relative(123)).toBe("-007");
  });
});
