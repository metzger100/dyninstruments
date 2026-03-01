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
    const toolkit = mod.create().createToolkit({ caption_sog: "SOG", unit_sog: "kn" });

    expect(toolkit.cap("sog")).toBe("SOG");
    expect(toolkit.unit("sog")).toBe("kn");
    expect(toolkit.cap("stw")).toBeUndefined();
    expect(toolkit.num("12.5")).toBe(12.5);
    expect(toolkit.num("x")).toBeUndefined();
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
