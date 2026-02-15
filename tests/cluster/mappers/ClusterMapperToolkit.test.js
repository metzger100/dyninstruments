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
  });
});
