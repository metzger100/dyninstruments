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

/**
 * @typedef {{ build: (props: AlarmProps) => unknown }} AlarmViewModel
 * @typedef {Record<string, unknown> & { alarmInfo?: Record<string, { category: string, repeat?: boolean, running?: boolean }> }} AlarmProps
 */

/** @param {string} kind @param {unknown} activeToolkit @param {AlarmViewModel} [viewModel] */
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

/** @param {unknown} value */
function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** @param {unknown} value */
function toMaybeNumber(value) {
  return typeof value === "undefined" || value === null || value === "" ? undefined : Number(value);
}

function makeAlarmViewModel() {
  /** @param {string} category */
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
    /** @param {AlarmProps} props */
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

module.exports = {
  createAlarmMapper,
  createComponentContextMock,
  createMapper,
  loadFresh,
  makeAlarmViewModel,
  makeRouteContext,
  routeContext,
  toMaybeNumber,
  toolkit,
  trimText
};
