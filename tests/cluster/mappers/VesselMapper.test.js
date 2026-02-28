const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_voltageRadial: "VOLT",
  unit_voltageRadial: "V",
  caption_voltage: "VOLT",
  unit_voltage: "V",
  caption_clock: "TIME",
  unit_clock: "",
  caption_dateTime: "",
  unit_dateTime: "",
  caption_timeStatus: "",
  unit_timeStatus: "",
  caption_pitch: "PITCH",
  unit_pitch: "°",
  caption_roll: "ROLL",
  unit_roll: "°"
});

describe("VesselMapper", function () {
  it("maps voltageRadial with generic gauge keys and respects sector toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageRadial",
      value: 12.4,
      voltageWarningEnabled: false,
      voltageAlarmEnabled: true,
      warningFrom: "12.2",
      alarmFrom: "11.6",
      minValue: "7",
      maxValue: "15",
      tickMajor: "1",
      tickMinor: "0.2",
      voltageRatioThresholdNormal: "1.1",
      voltageRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("VoltageGaugeWidget");
    expect(out.value).toBe(12.4);
    expect(out.formatter).toBe("formatDecimal");
    expect(out.formatterParameters).toEqual([3, 1, true]);
    expect(out.rendererProps.warningFrom).toBeUndefined();
    expect(out.rendererProps.alarmFrom).toBe(11.6);
  });

  it("treats missing voltage sector toggles as enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageRadial",
      value: 12.4,
      warningFrom: "12.2",
      alarmFrom: "11.6"
    }, toolkit);

    expect(out.rendererProps.warningFrom).toBe(12.2);
    expect(out.rendererProps.alarmFrom).toBe(11.6);
  });

  it("uses only value for voltageRadial source and does not fall back to legacy voltage field", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageRadial",
      voltage: 12.4
    }, toolkit);

    expect(out.value).toBeUndefined();
  });

  it("maps voltage and clock numeric kinds", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const rawClock = new Date("2026-02-22T14:30:00Z");

    expect(mapper.translate({ kind: "voltage", value: 12.3 }, toolkit).formatter).toBe("formatDecimal");
    const clockOut = mapper.translate({ kind: "clock", clock: rawClock }, toolkit);
    expect(clockOut.formatter).toBe("formatTime");
    expect(clockOut.value).toBe(rawClock);
  });

  it("maps dateTime to DateTimeRendererWrapper with thin mapper output", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({ kind: "dateTime", clock: rawClock, default: "---" }, toolkit);
    expect(out.renderer).toBe("DateTimeRendererWrapper");
    expect(out.clock).toBe(rawClock);
    expect(out.caption).toBe("");
    expect(out.unit).toBe("");
    expect(out.value).toBeUndefined();
  });

  it("maps timeStatus to TimeStatusRendererWrapper with thin mapper output", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({ kind: "timeStatus", clock: rawClock, gpsValid: true, default: "---" }, toolkit);
    expect(out.renderer).toBe("TimeStatusRendererWrapper");
    expect(out.clock).toBe(rawClock);
    expect(out.gpsValid).toBe(true);
    expect(out.caption).toBe("");
    expect(out.unit).toBe("");
    expect(out.value).toBeUndefined();
  });

  it("maps pitch and roll to formatDirection in signed-degree mode with radian input", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const pitchOut = mapper.translate({ kind: "pitch", pitch: 45, default: "---" }, toolkit);
    expect(pitchOut.value).toBe(45);
    expect(pitchOut.formatter).toBe("formatDirection");
    expect(pitchOut.formatterParameters).toEqual([true, true, false]);

    const rollOut = mapper.translate({ kind: "roll", roll: -90, default: "---" }, toolkit);
    expect(rollOut.value).toBe(-90);
    expect(rollOut.formatter).toBe("formatDirection");
    expect(rollOut.formatterParameters).toEqual([true, true, false]);
  });

  it("normalizes missing attitude payloads while preserving explicit zero", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const pitchNull = mapper.translate({ kind: "pitch", pitch: null, default: "---" }, toolkit);
    expect(Object.prototype.hasOwnProperty.call(pitchNull, "value")).toBe(true);
    expect(pitchNull.value).toBeUndefined();
    expect(pitchNull.formatterParameters).toEqual([true, true, false]);

    const rollNull = mapper.translate({ kind: "roll", roll: null, default: "---" }, toolkit);
    expect(Object.prototype.hasOwnProperty.call(rollNull, "value")).toBe(true);
    expect(rollNull.value).toBeUndefined();
    expect(rollNull.formatterParameters).toEqual([true, true, false]);

    const pitchBlank = mapper.translate({ kind: "pitch", pitch: "   ", default: "---" }, toolkit);
    expect(Object.prototype.hasOwnProperty.call(pitchBlank, "value")).toBe(true);
    expect(pitchBlank.value).toBeUndefined();
    expect(pitchBlank.formatterParameters).toEqual([true, true, false]);

    const rollBlank = mapper.translate({ kind: "roll", roll: "", default: "---" }, toolkit);
    expect(Object.prototype.hasOwnProperty.call(rollBlank, "value")).toBe(true);
    expect(rollBlank.value).toBeUndefined();
    expect(rollBlank.formatterParameters).toEqual([true, true, false]);

    const pitchZero = mapper.translate({ kind: "pitch", pitch: 0, default: "---" }, toolkit);
    expect(pitchZero.value).toBe(0);
    expect(pitchZero.formatterParameters).toEqual([true, true, false]);

    const rollZero = mapper.translate({ kind: "roll", roll: 0, default: "---" }, toolkit);
    expect(rollZero.value).toBe(0);
    expect(rollZero.formatterParameters).toEqual([true, true, false]);
  });

  it("supports toolkit fallback number conversion and returns empty object for unknown kind", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const toolkitWithoutNum = {
      cap(name) { return "C:" + name; },
      unit(name) { return "U:" + name; },
      out: toolkit.out,
      makeAngleFormatter: toolkit.makeAngleFormatter
    };

    const out = mapper.translate({
      kind: "voltageRadial",
      value: 12.4,
      minValue: "7",
      maxValue: "15",
      tickMajor: "1",
      tickMinor: "0.2"
    }, toolkitWithoutNum);

    expect(out.rendererProps.minValue).toBe(7);
    expect(out.rendererProps.maxValue).toBe(15);
    expect(out.rendererProps.tickMajor).toBe(1);
    expect(out.rendererProps.tickMinor).toBe(0.2);
    expect(mapper.translate({ kind: "unknownKind" }, toolkitWithoutNum)).toEqual({});
  });
});
