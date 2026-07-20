// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { makeRouteContext } = require("../../helpers/mapper-route-context");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js")
  .create(
    {},
    createComponentContextMock({
      modules: {
        RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
        ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
      }
    })
  )
  .createToolkit({
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
      const alarmNames = activeAlarms.map(function (alarm) {
        return alarm.name;
      });
      const activeCount = activeAlarms.length;

      return {
        activeAlarms: activeAlarms,
        hasActiveAlarms: activeCount > 0,
        activeCount: activeCount,
        alarmNames: alarmNames,
        alarmText:
          activeCount === 0
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
  it("maps dateTime to PositionCoordinateWidget with direct variant props", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate(
      {
        kind: "dateTime",
        clock: rawClock,
        dateTimeRatioThresholdNormal: "1.35",
        dateTimeRatioThresholdFlat: "4.55",
        default: "---"
      },
      routeContext("dateTime", toolkit)
    );
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
    const out = mapper.translate(
      { kind: "timeStatus", clock: rawClock, gpsValid: true, default: "---" },
      routeContext("timeStatus", toolkit)
    );
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

    const dateTimeOut = mapper.translate(
      {
        kind: "dateTime",
        clock: rawClock,
        hideSeconds: true,
        default: "---"
      },
      routeContext("dateTime", toolkit)
    );
    expect(dateTimeOut.hideSeconds).toBe(true);

    const timeStatusOut = mapper.translate(
      {
        kind: "timeStatus",
        clock: rawClock,
        gpsValid: true,
        hideSeconds: true,
        default: "---"
      },
      routeContext("timeStatus", toolkit)
    );
    expect(timeStatusOut.hideSeconds).toBe(true);
  });

  it("maps regattaTimer defaults with renderer props for the HTML route", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate(
      {
        kind: "regattaTimer"
      },
      routeContext("regattaTimer", toolkit)
    );

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
    const out = mapper.translate(
      {
        kind: "regattaTimer",
        regattaSoundEnabled: false,
        regattaProgressBar: false,
        regattaDuration: 6,
        stableDigits: true,
        regattaTimerRatioThresholdNormal: "1.05",
        regattaTimerRatioThresholdFlat: "2.95",
        captionUnitScale: "0.9"
      },
      routeContext("regattaTimer", toolkit)
    );

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

    const pitchBlank = mapper.translate(
      { kind: "pitch", pitch: "   ", default: "---" },
      routeContext("pitch", toolkit)
    );
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
});
