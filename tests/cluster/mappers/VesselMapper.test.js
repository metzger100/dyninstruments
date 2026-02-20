const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_voltageGraphic: "VOLT",
  unit_voltageGraphic: "V",
  caption_voltage: "VOLT",
  unit_voltage: "V",
  caption_clock: "TIME",
  unit_clock: ""
});

describe("VesselMapper", function () {
  it("maps voltageGraphic and respects sector toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageGraphic",
      value: 12.4,
      voltageWarningEnabled: false,
      voltageAlarmEnabled: true,
      voltageWarningFrom: "12.2",
      voltageAlarmFrom: "11.6",
      voltageMinValue: "7",
      voltageMaxValue: "15",
      voltageTickMajor: "1",
      voltageTickMinor: "0.2",
      voltageRatioThresholdNormal: "1.1",
      voltageRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("VoltageGaugeWidget");
    expect(out.value).toBe(12.4);
    expect(out.formatter).toBe("formatDecimal");
    expect(out.formatterParameters).toEqual([3, 1, true]);
    expect(out.warningFrom).toBeUndefined();
    expect(out.alarmFrom).toBe(11.6);
  });

  it("maps voltage and clock numeric kinds", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    expect(mapper.translate({ kind: "voltage", value: 12.3 }, toolkit).formatter).toBe("formatDecimal");
    expect(mapper.translate({ kind: "clock", clock: 1700000000 }, toolkit).formatter).toBe("formatTime");
  });
});
