/**
 * @file AlarmViewModel - Shared domain normalization for vessel alarm kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAlarmViewModel = factory();
  }
})(this, function () {
  "use strict";

  /** @typedef {{ name: string, category: unknown, repeat: unknown, index: number }} DyniActiveAlarm */
  /** @typedef {{ name: string, category: unknown, repeat: unknown }} DyniVisibleAlarm */
  /** @typedef {{ activeAlarms: DyniVisibleAlarm[], hasActiveAlarms: boolean, activeCount: number, alarmNames: string[], alarmText: string, state: "active" | "idle" }} DyniAlarmViewModelOutput */
  /** @typedef {{ id: "AlarmViewModel", build: (props?: { alarmInfo?: unknown }) => DyniAlarmViewModelOutput }} DyniAlarmViewModelApi */

  /** @param {unknown} value @returns {value is Record<string, unknown>} */
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  /** @param {unknown} value @returns {boolean} */
  function hasDefinedCategory(value) {
    return value !== undefined && value !== null;
  }

  /** @param {DyniVisibleAlarm} a @param {DyniVisibleAlarm} b @returns {number} */
  function compareActiveAlarms(a, b) {
    const aHasCategory = hasDefinedCategory(a.category);
    const bHasCategory = hasDefinedCategory(b.category);
    if (aHasCategory !== bHasCategory) {
      return aHasCategory ? -1 : 1;
    }
    if (!aHasCategory || a.category === b.category) {
      return 0;
    }
    if (a.category === "critical" && b.category === "info") {
      return -1;
    }
    if (a.category === "info" && b.category === "critical") {
      return 1;
    }
    return 0;
  }

  /** @param {string[]} names @returns {string} */
  function buildAlarmText(names) {
    const count = names.length;
    if (count === 0) {
      return "NONE";
    }
    if (count === 1) {
      return names[0];
    }
    if (count === 2) {
      return names[0] + ", " + names[1];
    }
    return names[0] + ", " + names[1] + " +" + (count - 2);
  }

  /** @returns {DyniAlarmViewModelApi} */
  function create() {
    /** @param {{ alarmInfo?: unknown } | undefined} props @returns {DyniAlarmViewModelOutput} */
    function build(props) {
      const p = props || {};
      const alarmInfo = isPlainObject(p.alarmInfo) ? p.alarmInfo : {};
      const activeAlarms = Object.keys(alarmInfo)
        .map(function (name, index) {
          const entry = alarmInfo[name];
          if (!isPlainObject(entry) || entry.running !== true) {
            return null;
          }
          return {
            name: name,
            category: entry.category,
            repeat: entry.repeat,
            index: index
          };
        })
        .filter(function (entry) {
          return entry !== null;
        })
        .sort(function (a, b) {
          const order = compareActiveAlarms(a, b);
          if (order !== 0) {
            return order;
          }
          return a.index - b.index;
        })
        .map(function (entry) {
          return {
            name: entry.name,
            category: entry.category,
            repeat: entry.repeat
          };
        });
      const alarmNames = activeAlarms.map(function (entry) {
        return entry.name;
      });
      const activeCount = activeAlarms.length;
      const alarmText = buildAlarmText(alarmNames);

      return {
        activeAlarms: activeAlarms,
        hasActiveAlarms: activeCount > 0,
        activeCount: activeCount,
        alarmNames: alarmNames,
        alarmText: alarmText,
        state: activeCount > 0 ? "active" : "idle"
      };
    }

    return {
      id: "AlarmViewModel",
      build: build
    };
  }

  return { id: "AlarmViewModel", create: create };
});
