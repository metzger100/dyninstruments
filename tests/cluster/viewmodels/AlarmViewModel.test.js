const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmViewModel", function () {
  function createViewModel() {
    return loadFresh("cluster/viewmodels/AlarmViewModel.js").create();
  }

  it("returns idle state for missing, non-object, and empty alarm payloads", function () {
    const vm = createViewModel();

    [
      undefined,
      null,
      "bad",
      [],
      {},
      { first: { running: false } }
    ].forEach(function (alarmInfo) {
      expect(vm.build({ alarmInfo: alarmInfo })).toEqual({
        activeAlarms: [],
        hasActiveAlarms: false,
        activeCount: 0,
        alarmNames: [],
        alarmText: "NONE",
        state: "idle"
      });
    });
  });

  it("builds the active alarm summary for one running alarm", function () {
    const vm = createViewModel();
    const out = vm.build({
      alarmInfo: {
        portAlarm: {
          running: true,
          category: "critical",
          repeat: false,
          name: "ignored"
        }
      }
    });

    expect(out).toEqual({
      activeAlarms: [
        {
          name: "portAlarm",
          category: "critical",
          repeat: false
        }
      ],
      hasActiveAlarms: true,
      activeCount: 1,
      alarmNames: ["portAlarm"],
      alarmText: "portAlarm",
      state: "active"
    });
  });

  it("joins two active alarm names exactly", function () {
    const vm = createViewModel();
    const out = vm.build({
      alarmInfo: {
        firstAlarm: {
          running: true,
          category: "info",
          repeat: true
        },
        secondAlarm: {
          running: true,
          category: "info",
          repeat: false
        }
      }
    });

    expect(out.alarmNames).toEqual(["firstAlarm", "secondAlarm"]);
    expect(out.alarmText).toBe("firstAlarm, secondAlarm");
    expect(out.activeCount).toBe(2);
    expect(out.state).toBe("active");
  });

  it("summarizes three or more active alarms by count, not width", function () {
    const vm = createViewModel();
    const out = vm.build({
      alarmInfo: {
        firstAlarm: { running: true },
        secondAlarm: { running: true },
        thirdAlarm: { running: true },
        ignoredAlarm: { running: false }
      }
    });

    expect(out.alarmNames).toEqual(["firstAlarm", "secondAlarm", "thirdAlarm"]);
    expect(out.alarmText).toBe("firstAlarm, secondAlarm +1");
    expect(out.activeCount).toBe(3);
    expect(out.hasActiveAlarms).toBe(true);
  });

  it("preserves the native object-key ordering contract for active alarms", function () {
    const vm = createViewModel();
    const out = vm.build({
      alarmInfo: {
        alpha: {
          running: true,
          category: "critical",
          repeat: true,
          name: "should-not-appear"
        },
        beta: {
          running: true,
          category: "critical",
          repeat: false,
          name: "also-ignored"
        },
        gamma: {
          running: true,
          category: "info",
          repeat: true,
          name: "still-ignored"
        },
        delta: {
          running: true,
          repeat: false,
          name: "ignored"
        }
      }
    });

    expect(out.activeAlarms.map(function (entry) { return entry.name; })).toEqual([
      "alpha",
      "beta",
      "gamma",
      "delta"
    ]);
    expect(out.activeAlarms[0]).toEqual({ name: "alpha", category: "critical", repeat: true });
    expect(out.activeAlarms[1]).toEqual({ name: "beta", category: "critical", repeat: false });
    expect(out.activeAlarms[2]).toEqual({ name: "gamma", category: "info", repeat: true });
    expect(out.activeAlarms[3].name).toBe("delta");
    expect(out.activeAlarms[3].category).toBeUndefined();
    expect(out.alarmNames).toEqual(["alpha", "beta", "gamma", "delta"]);
    expect(out.activeCount).toBe(4);
  });

  it("sorts defined categories before undefined categories even when undefined appears first", function () {
    const vm = createViewModel();
    const out = vm.build({
      alarmInfo: {
        earlyUndefined: { running: true, repeat: false },
        laterCritical: { running: true, category: "critical", repeat: true },
        laterInfo: { running: true, category: "info", repeat: false }
      }
    });

    expect(out.activeAlarms).toEqual([
      { name: "laterCritical", category: "critical", repeat: true },
      { name: "laterInfo", category: "info", repeat: false },
      { name: "earlyUndefined", category: undefined, repeat: false }
    ]);
    expect(out.alarmNames).toEqual(["laterCritical", "laterInfo", "earlyUndefined"]);
    expect(out.alarmText).toBe("laterCritical, laterInfo +1");
    expect(out.activeCount).toBe(3);
    expect(out.state).toBe("active");
  });
});
