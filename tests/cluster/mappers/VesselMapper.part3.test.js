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
  it("requires toolkit.num for numeric conversion and still returns empty object for unknown kind", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const toolkitWithoutNum = {
      cap(name) {
        return "C:" + name;
      },
      unit(name) {
        return "U:" + name;
      },
      out: toolkit.out,
      makeAngleFormatter: toolkit.makeAngleFormatter
    };

    expect(function () {
      mapper.translate(
        {
          kind: "voltageRadial",
          value: 12.4,
          voltageRadialMinValue: "7",
          voltageRadialMaxValue: "15",
          voltageRadialTickMajor: "1",
          voltageRadialTickMinor: "0.2"
        },
        routeContext("voltageRadial", toolkitWithoutNum)
      );
    }).toThrow(/num is not a function/);

    expect(mapper.translate({ kind: "unknownKind" }, routeContext("unknownKind", toolkitWithoutNum))).toEqual({});
  });

  it("uses toolkit.num directly when it is available", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const toolkitWithNum = {
      cap(name) {
        return "C:" + name;
      },
      unit(name) {
        return "U:" + name;
      },
      out: toolkit.out,
      makeAngleFormatter: toolkit.makeAngleFormatter,
      num(value) {
        return Number(value);
      }
    };

    const out = mapper.translate(
      {
        kind: "voltageRadial",
        value: 12.4,
        voltageRadialMinValue: "7",
        voltageRadialMaxValue: "15",
        voltageRadialTickMajor: "1",
        voltageRadialTickMinor: "0.2"
      },
      routeContext("voltageRadial", toolkitWithNum)
    );

    expect(out.rendererProps.voltageRadialMinValue).toBe(7);
    expect(out.rendererProps.voltageRadialMaxValue).toBe(15);
    expect(out.rendererProps.voltageRadialTickMajor).toBe(1);
    expect(out.rendererProps.voltageRadialTickMinor).toBe(0.2);
  });

  it("maps alarm to AlarmTextHtmlWidget with normalized domain payload and thresholds", function () {
    const mapper = createAlarmMapper();
    const out = mapper.translate(
      {
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
      },
      routeContext("alarm", toolkit, makeAlarmViewModel())
    );

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
    const out = mapper.translate(
      {
        kind: "alarm",
        alarmInfo: {
          earlyUndefined: { running: true, repeat: false },
          laterCritical: { running: true, category: "critical", repeat: true },
          laterInfo: { running: true, category: "info", repeat: false }
        }
      },
      routeContext("alarm", toolkit, makeAlarmViewModel())
    );

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
    const out = mapper.translate(
      {
        kind: "alarm",
        alarmInfo: null
      },
      routeContext("alarm", toolkit, makeAlarmViewModel())
    );

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
