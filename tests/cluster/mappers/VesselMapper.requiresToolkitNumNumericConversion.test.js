// @ts-check
const { createAlarmMapper, loadFresh, makeAlarmViewModel, routeContext, toolkit } = require("./VesselMapper-setup");

describe("VesselMapper", function () {
  it("requires toolkit.num for numeric conversion and still returns empty object for unknown kind", function () {
    const mapper = loadFresh("cluster/mappers/VesselMapper.js").create();
    const toolkitWithoutNum = {
      // @ts-ignore -- pre-existing untyped test mock boundary
      cap(name) {
        return "C:" + name;
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
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
      // @ts-ignore -- pre-existing untyped test mock boundary
      cap(name) {
        return "C:" + name;
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      unit(name) {
        return "U:" + name;
      },
      out: toolkit.out,
      makeAngleFormatter: toolkit.makeAngleFormatter,
      // @ts-ignore -- pre-existing untyped test mock boundary
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
