const { loadFresh } = require("../../helpers/load-umd");
const { makeRouteContext } = require("../../helpers/mapper-route-context");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js")
  .create(
    {},
    createComponentContextMock({
      modules: {
        RadialAngleMath: loadFresh(
          "shared/widget-kits/radial/RadialAngleMath.js",
        ),
        ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
      },
    }),
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
    unit_alarm: "",
  });

function routeContext(kind, activeToolkit, viewModel) {
  return makeRouteContext({
    routeId: "vessel:" + kind,
    cluster: "vessel",
    kind: kind,
    toolkit: activeToolkit,
    viewModel: viewModel,
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
  return typeof value === "undefined" || value === null || value === ""
    ? undefined
    : Number(value);
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
            index: index,
          };
        })
        .sort(function (a, b) {
          return (
            priority(a.category) - priority(b.category) || a.index - b.index
          );
        })
        .map(function (alarm) {
          return {
            name: alarm.name,
            category: alarm.category,
            repeat: alarm.repeat,
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
        state: activeCount > 0 ? "active" : "idle",
      };
    },
  };
}

describe("VesselMapper", function () {
  it("maps voltageLinear with explicit linear keys and respects sector toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate(
      {
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
        voltageLinearHideTextualMetrics: "yes",
      },
      routeContext("voltageLinear", toolkit),
    );

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
    const out = mapper.translate(
      {
        kind: "voltageLinear",
        value: 12.4,
        voltageLinearWarningFrom: "12.2",
        voltageLinearAlarmFrom: "11.6",
      },
      routeContext("voltageLinear", toolkit),
    );

    expect(out.rendererProps.voltageLinearWarningFrom).toBe(12.2);
    expect(out.rendererProps.voltageLinearAlarmFrom).toBe(11.6);
  });

  it("maps voltageRadial with explicit radial keys and respects sector toggles", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate(
      {
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
        voltageRadialHideTextualMetrics: 0,
      },
      routeContext("voltageRadial", toolkit),
    );

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
    const out = mapper.translate(
      {
        kind: "voltageRadial",
        value: 12.4,
        voltageRadialWarningFrom: "12.2",
        voltageRadialAlarmFrom: "11.6",
      },
      routeContext("voltageRadial", toolkit),
    );

    expect(out.rendererProps.voltageRadialWarningFrom).toBe(12.2);
    expect(out.rendererProps.voltageRadialAlarmFrom).toBe(11.6);
  });

  it("uses only value for voltageRadial source and does not fall back to legacy voltage field", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate(
      {
        kind: "voltageRadial",
        voltage: 12.4,
      },
      routeContext("voltageRadial", toolkit),
    );

    expect(out.value).toBeUndefined();
  });

  it("uses only value for voltageLinear source and does not fall back to legacy voltage field", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const out = mapper.translate(
      {
        kind: "voltageLinear",
        voltage: 12.4,
      },
      routeContext("voltageLinear", toolkit),
    );

    expect(out.value).toBeUndefined();
  });

  it("maps voltage and clock numeric kinds", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const rawClock = new Date("2026-02-22T14:30:00Z");

    expect(
      mapper.translate(
        { kind: "voltage", value: 12.3 },
        routeContext("voltage", toolkit),
      ).formatter,
    ).toBe("formatDecimal");
    const clockOut = mapper.translate(
      { kind: "clock", clock: rawClock },
      routeContext("clock", toolkit),
    );
    expect(clockOut.formatter).toBe("formatTime");
    expect(clockOut.value).toBe(rawClock);
  });

  it("keeps voltage missing-value sources null-safe across null/undefined/empty string", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();

    const nullOut = mapper.translate(
      { kind: "voltage", value: null },
      routeContext("voltage", toolkit),
    );
    expect(Object.prototype.hasOwnProperty.call(nullOut, "value")).toBe(true);
    expect(nullOut.value).toBeNull();
    expect(nullOut.formatter).toBe("formatDecimal");

    const undefinedOut = mapper.translate(
      { kind: "voltage", value: undefined },
      routeContext("voltage", toolkit),
    );
    expect(Object.prototype.hasOwnProperty.call(undefinedOut, "value")).toBe(
      false,
    );
    expect(undefinedOut.formatter).toBe("formatDecimal");

    const blankOut = mapper.translate(
      { kind: "voltage", value: "" },
      routeContext("voltage", toolkit),
    );
    expect(Object.prototype.hasOwnProperty.call(blankOut, "value")).toBe(true);
    expect(blankOut.value).toBe("");
    expect(blankOut.formatter).toBe("formatDecimal");
  });

  it("uses formatClock for clock when hideSeconds is enabled", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const rawClock = new Date("2026-02-22T14:30:00Z");
    const clockOut = mapper.translate(
      { kind: "clock", clock: rawClock, hideSeconds: true },
      routeContext("clock", toolkit),
    );

    expect(clockOut.formatter).toBe("formatClock");
    expect(clockOut.value).toBe(rawClock);
  });

});
