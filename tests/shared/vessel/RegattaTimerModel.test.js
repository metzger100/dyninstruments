const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RegattaTimerModel", function () {
  function createFactory() {
    const module = loadFresh("shared/widget-kits/vessel/RegattaTimerModel.js");
    const api = module.create({}, createComponentContextMock());
    return api.createTimerModel;
  }

  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("returns idle state with configured duration display", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 3 });

    expect(timer.getState()).toEqual({
      phase: "idle",
      remainingMs: 180000,
      elapsedMs: 0,
      displayTime: "03:00",
      colorPhase: "normal"
    });
  });

  it("starts countdown with the expected initial timing state", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 5 });

    timer.start();

    const state = timer.getState();
    expect(state.phase).toBe("countdown");
    expect(state.displayTime).toBe("05:00");
    expect(state.remainingMs).toBeGreaterThanOrEqual(299900);
    expect(state.remainingMs).toBeLessThanOrEqual(300000);
  });

  it("ticks countdown display from absolute Date.now timing", function () {
    const ticks = /** @type {any[]} */ ([]);
    const createTimerModel = createFactory();
    const timer = createTimerModel({
      durationMinutes: 5,
      /** @param {any} state */
      onTick(state) {
        ticks.push(state.displayTime);
      }
    });

    timer.start();
    vi.advanceTimersByTime(1100);

    expect(ticks[0]).toBe("05:00");
    expect(ticks[ticks.length - 1]).toBe("04:59");
  });

  it("formats countdown display as MM:SS below one hour and H:MM:SS at one hour or more", function () {
    const createTimerModel = createFactory();

    const oneMinute = createTimerModel({ durationMinutes: 1 });
    oneMinute.start();
    vi.advanceTimersByTime(1000);
    expect(oneMinute.getState().displayTime).toBe("00:59");

    const oneHour = createTimerModel({ durationMinutes: 60 });
    expect(oneHour.getState().displayTime).toBe("1:00:00");
    oneHour.start();
    vi.advanceTimersByTime(1000);
    expect(oneHour.getState().displayTime).toBe("59:59");

    const longCountdown = createTimerModel({ durationMinutes: 76 });
    longCountdown.start();
    vi.advanceTimersByTime(56000);
    expect(longCountdown.getState().displayTime).toBe("1:15:04");
  });

  it("sync snaps to the next supported signal point below current value", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 5 });

    timer.start();
    vi.advanceTimersByTime(35000);
    timer.sync();

    expect(timer.getState().displayTime).toBe("04:00");
  });

  it("sync at exact minute boundary advances to the next lower signal point", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 5 });

    timer.start();
    vi.advanceTimersByTime(35000);
    timer.sync();
    expect(timer.getState().displayTime).toBe("04:00");

    timer.sync();
    expect(timer.getState().displayTime).toBe("01:00");
  });

  it("sync below one minute snaps to immediate elapsed start", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 5 });

    timer.start();
    vi.advanceTimersByTime(255000);
    timer.sync();

    expect(timer.getState().phase).toBe("elapsed");
    expect(timer.getState().displayTime).toBe("00:00");
  });

  it("transitions from countdown to elapsed at zero", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 3 });

    timer.start();
    vi.advanceTimersByTime(180000);

    expect(timer.getState().phase).toBe("elapsed");
    expect(timer.getState().displayTime).toBe("00:00");
  });

  it("counts elapsed time upward after start boundary", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 3 });

    timer.start();
    vi.advanceTimersByTime(183000);

    expect(timer.getState().phase).toBe("elapsed");
    expect(timer.getState().displayTime).toBe("00:03");
  });

  it("formats elapsed display as H:MM:SS after one hour", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 1 });

    timer.start();
    vi.advanceTimersByTime(7449000);

    expect(timer.getState().phase).toBe("elapsed");
    expect(timer.getState().displayTime).toBe("2:03:09");
  });

  it("reset returns idle state from countdown and elapsed phases", function () {
    const createTimerModel = createFactory();
    const timer = createTimerModel({ durationMinutes: 3 });

    timer.start();
    vi.advanceTimersByTime(1000);
    timer.reset();
    expect(timer.getState().phase).toBe("idle");
    expect(timer.getState().displayTime).toBe("03:00");

    timer.start();
    vi.advanceTimersByTime(181000);
    expect(timer.getState().phase).toBe("elapsed");
    timer.reset();
    expect(timer.getState().phase).toBe("idle");
    expect(timer.getState().displayTime).toBe("03:00");
  });

  it("destroy clears interval-driven updates", function () {
    const ticks = [];
    const createTimerModel = createFactory();
    const timer = createTimerModel({
      durationMinutes: 3,
      /** @param {any} state */
      onTick(state) {
        ticks.push(state.displayTime);
      }
    });

    timer.start();
    vi.advanceTimersByTime(500);
    const beforeDestroy = ticks.length;
    timer.destroy();
    vi.advanceTimersByTime(2000);

    expect(ticks.length).toBe(beforeDestroy);
  });

  it("emits low-tone signals at countdown start and whole-minute boundaries", function () {
    const signals = /** @type {any[]} */ ([]);
    const createTimerModel = createFactory();
    const timer = createTimerModel({
      durationMinutes: 3,
      /** @param {any} type @param {any} frequency @param {any} durationMs */
      onSignal(type, frequency, durationMs) {
        signals.push({ type, frequency, durationMs });
      }
    });

    timer.start();
    vi.advanceTimersByTime(120000);

    const lowSignals = signals.filter((entry) => entry.type === "low");
    expect(lowSignals).toEqual([
      { type: "low", frequency: 440, durationMs: 300 },
      { type: "low", frequency: 440, durationMs: 300 },
      { type: "low", frequency: 440, durationMs: 300 }
    ]);
  });

  it("emits high-tone countdown signals for the final 10 seconds", function () {
    const signals = /** @type {any[]} */ ([]);
    const createTimerModel = createFactory();
    const timer = createTimerModel({
      durationMinutes: 3,
      /** @param {any} type @param {any} frequency @param {any} durationMs */
      onSignal(type, frequency, durationMs) {
        signals.push({ type, frequency, durationMs });
      }
    });

    timer.start();
    vi.advanceTimersByTime(179500);

    const highSignals = signals.filter((entry) => entry.type === "high");
    expect(highSignals).toHaveLength(10);
    expect(highSignals[0]).toEqual({ type: "high", frequency: 880, durationMs: 150 });
    expect(highSignals[9]).toEqual({ type: "high", frequency: 880, durationMs: 150 });
  });

  it("emits long start signal when countdown crosses zero", function () {
    const signals = /** @type {any[]} */ ([]);
    const createTimerModel = createFactory();
    const timer = createTimerModel({
      durationMinutes: 3,
      /** @param {any} type @param {any} frequency @param {any} durationMs */
      onSignal(type, frequency, durationMs) {
        signals.push({ type, frequency, durationMs });
      }
    });

    timer.start();
    vi.advanceTimersByTime(180000);

    expect(signals[signals.length - 1]).toEqual({
      type: "start",
      frequency: 880,
      durationMs: 800
    });
  });

  it("keeps signal emission independent from external sound toggles", function () {
    const signals = /** @type {any[]} */ ([]);
    const createTimerModel = createFactory();
    const timer = createTimerModel({
      durationMinutes: 3,
      /** @param {any} type @param {any} frequency @param {any} durationMs */
      onSignal(type, frequency, durationMs) {
        signals.push({ type, frequency, durationMs });
      }
    });

    timer.start();
    vi.advanceTimersByTime(60000);

    expect(signals.some((entry) => entry.type === "low")).toBe(true);
  });

  it("supports configurable durations including 3 and 10 minutes", function () {
    const createTimerModel = createFactory();
    const threeMinute = createTimerModel({ durationMinutes: 3 });
    const tenMinute = createTimerModel({ durationMinutes: 10 });

    expect(threeMinute.getState().displayTime).toBe("03:00");
    expect(tenMinute.getState().displayTime).toBe("10:00");
  });
});
