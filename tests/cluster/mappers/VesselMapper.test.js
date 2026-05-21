const { loadFresh } = require("../../helpers/load-umd");
const { makeRouteContext } = require("../../helpers/mapper-route-context");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create({}, createComponentContextMock({
  modules: {
    RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
    ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
  }
})).createToolkit({
  caption_voltageLinear: "VOLT",
  unit_voltageLinear: "V",
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
  caption_regattaTimer: "REGATTA",
  unit_regattaTimer: "",
  caption_pitch: "PITCH",
  unit_pitch: "°",
  caption_roll: "ROLL",
  unit_roll: "°",
  caption_alarm: "ALARM",
  unit_alarm: ""
});

function routeContext(kind, activeToolkit, viewModel) {
  return makeRouteContext({
    routeId: "vessel:" + kind,
    cluster: "vessel",
    kind: kind,
    toolkit: activeToolkit,
    viewModel: viewModel
  });
}

function createMapper() {
  return loadFresh("cluster/mappers/VesselMapper.js").create();
}

function createAlarmMapper() {
  return createMapper();
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toMaybeNumber(value) {
  return typeof value === "undefined" || value === null || value === "" ? undefined : Number(value);
}

function makeAlarmViewModel() {
  function priority(category) {
    if (category === "critical") {
      return 0;
    }
    if (category === "info") {
      return 1;
    }
    return 2;
  }

  return {
    build(props) {
      const alarmInfo = props.alarmInfo || {};
      const activeAlarms = Object.keys(alarmInfo)
        .filter(function (name) {
          return alarmInfo[name] && alarmInfo[name].running === true;
        })
        .map(function (name, index) {
          const alarm = alarmInfo[name];
          return {
            name: name,
            category: alarm.category,
            repeat: alarm.repeat === true,
            index: index
          };
        })
        .sort(function (a, b) {
          return priority(a.category) - priority(b.category) || a.index - b.index;
        })
        .map(function (alarm) {
          return {
            name: alarm.name,
            category: alarm.category,
            repeat: alarm.repeat
          };
        });
      const alarmNames = activeAlarms.map(function (alarm) { return alarm.name; });
      const activeCount = activeAlarms.length;

      return {
        activeAlarms: activeAlarms,
        hasActiveAlarms: activeCount > 0,
        activeCount: activeCount,
        alarmNames: alarmNames,
        alarmText: activeCount === 0
          ? "NONE"
          : activeCount > 2
            ? alarmNames.slice(0, 2).join(", ") + " +" + (activeCount - 2)
            : alarmNames.join(", "),
        state: activeCount > 0 ? "active" : "idle"
      };
    }
  };
}

describe("VesselMapper", function () {
  it("maps voltageLinear with explicit linear keys and respects sector toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageLinear",
      value: 12.4,
      voltageLinearWarningEnabled: false,
      voltageLinearAlarmEnabled: true,
      voltageLinearWarningFrom: "12.2",
      voltageLinearAlarmFrom: "11.6",
      voltageLinearMinValue: "7",
      voltageLinearMaxValue: "15",
      voltageLinearTickMajor: "1",
      voltageLinearTickMinor: "0.2",
      voltageLinearRatioThresholdNormal: "1.1",
      voltageLinearRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8",
      voltageLinearHideTextualMetrics: "yes"
    }, routeContext("voltageLinear", toolkit));

    expect(out).not.toHaveProperty("renderer");
    expect(out.value).toBe(12.4);
    expect(out.formatter).toBe("formatDecimal");
    expect(out.formatterParameters).toEqual([3, 1, true]);
    expect(out.rendererProps.voltageLinearWarningFrom).toBeUndefined();
    expect(out.rendererProps.voltageLinearAlarmFrom).toBe(11.6);
    expect(out.rendererProps.voltageLinearHideTextualMetrics).toBe(true);
  });

  it("treats missing voltageLinear sector toggles as enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageLinear",
      value: 12.4,
      voltageLinearWarningFrom: "12.2",
      voltageLinearAlarmFrom: "11.6"
    }, routeContext("voltageLinear", toolkit));

    expect(out.rendererProps.voltageLinearWarningFrom).toBe(12.2);
    expect(out.rendererProps.voltageLinearAlarmFrom).toBe(11.6);
  });

  it("maps voltageRadial with explicit radial keys and respects sector toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageRadial",
      value: 12.4,
      voltageRadialWarningEnabled: false,
      voltageRadialAlarmEnabled: true,
      voltageRadialWarningFrom: "12.2",
      voltageRadialAlarmFrom: "11.6",
      voltageRadialMinValue: "7",
      voltageRadialMaxValue: "15",
      voltageRadialTickMajor: "1",
      voltageRadialTickMinor: "0.2",
      voltageRadialRatioThresholdNormal: "1.1",
      voltageRadialRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8",
      voltageRadialHideTextualMetrics: 0
    }, routeContext("voltageRadial", toolkit));

    expect(out).not.toHaveProperty("renderer");
    expect(out.value).toBe(12.4);
    expect(out.formatter).toBe("formatDecimal");
    expect(out.formatterParameters).toEqual([3, 1, true]);
    expect(out.rendererProps.voltageRadialWarningFrom).toBeUndefined();
    expect(out.rendererProps.voltageRadialAlarmFrom).toBe(11.6);
    expect(out.rendererProps.voltageRadialHideTextualMetrics).toBe(false);
  });

  it("treats missing voltage sector toggles as enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageRadial",
      value: 12.4,
      voltageRadialWarningFrom: "12.2",
      voltageRadialAlarmFrom: "11.6"
    }, routeContext("voltageRadial", toolkit));

    expect(out.rendererProps.voltageRadialWarningFrom).toBe(12.2);
    expect(out.rendererProps.voltageRadialAlarmFrom).toBe(11.6);
  });

  it("uses only value for voltageRadial source and does not fall back to legacy voltage field", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageRadial",
      voltage: 12.4
    }, routeContext("voltageRadial", toolkit));

    expect(out.value).toBeUndefined();
  });

  it("uses only value for voltageLinear source and does not fall back to legacy voltage field", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "voltageLinear",
      voltage: 12.4
    }, routeContext("voltageLinear", toolkit));

    expect(out.value).toBeUndefined();
  });

  it("maps voltage and clock numeric kinds", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const rawClock = new Date("2026-02-22T14:30:00Z");

    expect(mapper.translate({ kind: "voltage", value: 12.3 }, routeContext("voltage", toolkit)).formatter).toBe("formatDecimal");
    const clockOut = mapper.translate({ kind: "clock", clock: rawClock }, routeContext("clock", toolkit));
    expect(clockOut.formatter).toBe("formatTime");
    expect(clockOut.value).toBe(rawClock);
  });

  it("keeps voltage missing-value sources null-safe across null/undefined/empty string", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const nullOut = mapper.translate({ kind: "voltage", value: null }, routeContext("voltage", toolkit));
    expect(Object.prototype.hasOwnProperty.call(nullOut, "value")).toBe(true);
    expect(nullOut.value).toBeNull();
    expect(nullOut.formatter).toBe("formatDecimal");

    const undefinedOut = mapper.translate({ kind: "voltage", value: undefined }, routeContext("voltage", toolkit));
    expect(Object.prototype.hasOwnProperty.call(undefinedOut, "value")).toBe(false);
    expect(undefinedOut.formatter).toBe("formatDecimal");

    const blankOut = mapper.translate({ kind: "voltage", value: "" }, routeContext("voltage", toolkit));
    expect(Object.prototype.hasOwnProperty.call(blankOut, "value")).toBe(true);
    expect(blankOut.value).toBe("");
    expect(blankOut.formatter).toBe("formatDecimal");
  });

  it("uses formatClock for clock when hideSeconds is enabled", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const rawClock = new Date("2026-02-22T14:30:00Z");
    const clockOut = mapper.translate({ kind: "clock", clock: rawClock, hideSeconds: true }, routeContext("clock", toolkit));

    expect(clockOut.formatter).toBe("formatClock");
    expect(clockOut.value).toBe(rawClock);
  });

  it("maps dateTime to PositionCoordinateWidget with direct variant props", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "dateTime",
      clock: rawClock,
      dateTimeRatioThresholdNormal: "1.35",
      dateTimeRatioThresholdFlat: "4.55",
      default: "---"
    }, routeContext("dateTime", toolkit));
    expect(out).not.toHaveProperty("renderer");
    expect(out.displayVariant).toBe("dateTime");
    expect(out.value).toEqual([rawClock, rawClock]);
    expect(out.caption).toBe("");
    expect(out.unit).toBe("");
    expect(out.ratioThresholdNormal).toBe(1.35);
    expect(out.ratioThresholdFlat).toBe(4.55);
    expect(out.hideSeconds).toBe(false);
  });

  it("maps timeStatus to PositionCoordinateWidget with direct variant props", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({ kind: "timeStatus", clock: rawClock, gpsValid: true, default: "---" }, routeContext("timeStatus", toolkit));
    expect(out).not.toHaveProperty("renderer");
    expect(out.displayVariant).toBe("timeStatus");
    expect(out.value).toEqual([rawClock, true]);
    expect(out.caption).toBe("");
    expect(out.unit).toBe("");
    expect(out.hideSeconds).toBe(false);
  });

  it("threads hideSeconds through dateTime and timeStatus outputs", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const dateTimeOut = mapper.translate({
      kind: "dateTime",
      clock: rawClock,
      hideSeconds: true,
      default: "---"
    }, routeContext("dateTime", toolkit));
    expect(dateTimeOut.hideSeconds).toBe(true);

    const timeStatusOut = mapper.translate({
      kind: "timeStatus",
      clock: rawClock,
      gpsValid: true,
      hideSeconds: true,
      default: "---"
    }, routeContext("timeStatus", toolkit));
    expect(timeStatusOut.hideSeconds).toBe(true);
  });

  it("maps regattaTimer defaults with renderer props for the HTML route", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "regattaTimer"
    }, routeContext("regattaTimer", toolkit));

    expect(out).toEqual({
      caption: "REGATTA",
      unit: "",
      rendererProps: {
        regattaSoundEnabled: true,
        regattaProgressBar: true,
        regattaDuration: undefined,
        stableDigits: false,
        regattaTimerRatioThresholdNormal: undefined,
        regattaTimerRatioThresholdFlat: undefined,
        captionUnitScale: undefined
      }
    });
  });

  it("maps regattaTimer custom duration and toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate({
      kind: "regattaTimer",
      regattaSoundEnabled: false,
      regattaProgressBar: false,
      regattaDuration: 6,
      stableDigits: true,
      regattaTimerRatioThresholdNormal: "1.05",
      regattaTimerRatioThresholdFlat: "2.95",
      captionUnitScale: "0.9"
    }, routeContext("regattaTimer", toolkit));

    expect(out).toEqual({
      caption: "REGATTA",
      unit: "",
      rendererProps: {
        regattaSoundEnabled: false,
        regattaProgressBar: false,
        regattaDuration: 6,
        stableDigits: true,
        regattaTimerRatioThresholdNormal: 1.05,
        regattaTimerRatioThresholdFlat: 2.95,
        captionUnitScale: 0.9
      }
    });
  });

  it("maps pitch and roll to formatDirection in signed-degree mode with radian input", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const pitchOut = mapper.translate({ kind: "pitch", pitch: 45, default: "---" }, routeContext("pitch", toolkit));
    expect(pitchOut.value).toBe(45);
    expect(pitchOut.formatter).toBe("formatDirection");
    expect(pitchOut.formatterParameters).toEqual([true, true, false]);

    const rollOut = mapper.translate({ kind: "roll", roll: -90, default: "---" }, routeContext("roll", toolkit));
    expect(rollOut.value).toBe(-90);
    expect(rollOut.formatter).toBe("formatDirection");
    expect(rollOut.formatterParameters).toEqual([true, true, false]);
  });

  it("normalizes missing attitude payloads while preserving explicit zero", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const pitchNull = mapper.translate({ kind: "pitch", pitch: null, default: "---" }, routeContext("pitch", toolkit));
    expect(Object.prototype.hasOwnProperty.call(pitchNull, "value")).toBe(true);
    expect(pitchNull.value).toBeUndefined();
    expect(pitchNull.formatterParameters).toEqual([true, true, false]);

    const rollNull = mapper.translate({ kind: "roll", roll: null, default: "---" }, routeContext("roll", toolkit));
    expect(Object.prototype.hasOwnProperty.call(rollNull, "value")).toBe(true);
    expect(rollNull.value).toBeUndefined();
    expect(rollNull.formatterParameters).toEqual([true, true, false]);

    const pitchBlank = mapper.translate({ kind: "pitch", pitch: "   ", default: "---" }, routeContext("pitch", toolkit));
    expect(Object.prototype.hasOwnProperty.call(pitchBlank, "value")).toBe(true);
    expect(pitchBlank.value).toBeUndefined();
    expect(pitchBlank.formatterParameters).toEqual([true, true, false]);

    const rollBlank = mapper.translate({ kind: "roll", roll: "", default: "---" }, routeContext("roll", toolkit));
    expect(Object.prototype.hasOwnProperty.call(rollBlank, "value")).toBe(true);
    expect(rollBlank.value).toBeUndefined();
    expect(rollBlank.formatterParameters).toEqual([true, true, false]);

    const pitchZero = mapper.translate({ kind: "pitch", pitch: 0, default: "---" }, routeContext("pitch", toolkit));
    expect(pitchZero.value).toBe(0);
    expect(pitchZero.formatterParameters).toEqual([true, true, false]);

    const rollZero = mapper.translate({ kind: "roll", roll: 0, default: "---" }, routeContext("roll", toolkit));
    expect(rollZero.value).toBe(0);
    expect(rollZero.formatterParameters).toEqual([true, true, false]);
  });

  it("requires toolkit.num for numeric conversion and still returns empty object for unknown kind", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const toolkitWithoutNum = {
      cap(name) { return "C:" + name; },
      unit(name) { return "U:" + name; },
      out: toolkit.out,
      makeAngleFormatter: toolkit.makeAngleFormatter
    };

    expect(function () {
      mapper.translate({
        kind: "voltageRadial",
        value: 12.4,
        voltageRadialMinValue: "7",
        voltageRadialMaxValue: "15",
        voltageRadialTickMajor: "1",
        voltageRadialTickMinor: "0.2"
      }, routeContext("voltageRadial", toolkitWithoutNum));
    }).toThrow(/num is not a function/);

    expect(mapper.translate({ kind: "unknownKind" }, routeContext("unknownKind", toolkitWithoutNum))).toEqual({});
  });

  it("uses toolkit.num directly when it is available", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const toolkitWithNum = {
      cap(name) { return "C:" + name; },
      unit(name) { return "U:" + name; },
      out: toolkit.out,
      makeAngleFormatter: toolkit.makeAngleFormatter,
      num(value) {
        return Number(value);
      }
    };

    const out = mapper.translate({
      kind: "voltageRadial",
      value: 12.4,
      voltageRadialMinValue: "7",
      voltageRadialMaxValue: "15",
      voltageRadialTickMajor: "1",
      voltageRadialTickMinor: "0.2"
    }, routeContext("voltageRadial", toolkitWithNum));

    expect(out.rendererProps.voltageRadialMinValue).toBe(7);
    expect(out.rendererProps.voltageRadialMaxValue).toBe(15);
    expect(out.rendererProps.voltageRadialTickMajor).toBe(1);
    expect(out.rendererProps.voltageRadialTickMinor).toBe(0.2);
  });

  it("maps alarm to AlarmTextHtmlWidget with normalized domain payload and thresholds", function () {
    const mapper = createAlarmMapper();
    const out = mapper.translate({
      kind: "alarm",
      alarmInfo: {
        secondAlarm: {
          running: true,
          category: "info",
          repeat: false
        },
        firstAlarm: {
          running: true,
          category: "critical",
          repeat: true
        },
        ignoredAlarm: {
          running: false,
          category: "critical",
          repeat: true
        }
      },
      alarmRatioThresholdNormal: "1.25",
      alarmRatioThresholdFlat: "3.75"
    }, routeContext("alarm", toolkit, makeAlarmViewModel()));

    expect(out).toEqual({
      caption: "ALARM",
      unit: "",
      default: "NONE",
      domain: {
        activeAlarms: [
          { name: "firstAlarm", category: "critical", repeat: true },
          { name: "secondAlarm", category: "info", repeat: false }
        ],
        hasActiveAlarms: true,
        activeCount: 2,
        alarmNames: ["firstAlarm", "secondAlarm"],
        alarmText: "firstAlarm, secondAlarm",
        state: "active"
      },
      ratioThresholdNormal: 1.25,
      ratioThresholdFlat: 3.75
    });
  });

  it("preserves defined-before-undefined alarm ordering through mapper delegation", function () {
    const mapper = createAlarmMapper();
    const out = mapper.translate({
      kind: "alarm",
      alarmInfo: {
        earlyUndefined: { running: true, repeat: false },
        laterCritical: { running: true, category: "critical", repeat: true },
        laterInfo: { running: true, category: "info", repeat: false }
      }
    }, routeContext("alarm", toolkit, makeAlarmViewModel()));

    expect(out.domain).toEqual({
      activeAlarms: [
        { name: "laterCritical", category: "critical", repeat: true },
        { name: "laterInfo", category: "info", repeat: false },
        { name: "earlyUndefined", category: undefined, repeat: false }
      ],
      hasActiveAlarms: true,
      activeCount: 3,
      alarmNames: ["laterCritical", "laterInfo", "earlyUndefined"],
      alarmText: "laterCritical, laterInfo +1",
      state: "active"
    });
  });

  it("keeps alarm passive defaults available when there are no active alarms", function () {
    const mapper = createAlarmMapper();
    const out = mapper.translate({
      kind: "alarm",
      alarmInfo: null
    }, routeContext("alarm", toolkit, makeAlarmViewModel()));

    expect(out.caption).toBe("ALARM");
    expect(out.unit).toBe("");
    expect(out.default).toBe("NONE");
    expect(out.domain).toEqual({
      activeAlarms: [],
      hasActiveAlarms: false,
      activeCount: 0,
      alarmNames: [],
      alarmText: "NONE",
      state: "idle"
    });
    expect(out.ratioThresholdNormal).toBeUndefined();
    expect(out.ratioThresholdFlat).toBeUndefined();
  });
});
