const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("RegattaTimerAudio", function () {
  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/vessel/RegattaTimerAudio.js", context);

    expect(context.DyniComponents.DyniRegattaTimerAudio).toBeTruthy();
    expect(context.DyniComponents.DyniRegattaTimerAudio.id).toBe("RegattaTimerAudio");
  });

  /** @type {any} */
  let originalAudioContext;
  /** @type {any} */
  let originalWebkitAudioContext;

  function installAudioContextMock() {
    const instances = /** @type {any[]} */ ([]);
    const AudioContextMock = vi.fn().mockImplementation(function () {
      const instance = {
        currentTime: 10,
        destination: { id: "destination" },
        oscillatorNodes: /** @type {any[]} */ ([]),
        gainNodes: /** @type {any[]} */ ([]),
        close: vi.fn().mockResolvedValue(undefined),
        createOscillator: vi.fn(function () {
          const oscillator = {
            type: "",
            frequency: {
              setValueAtTime: vi.fn()
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn()
          };
          instance.oscillatorNodes.push(oscillator);
          return oscillator;
        }),
        createGain: vi.fn(function () {
          const gainNode = {
            gain: {
              setValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn()
            },
            connect: vi.fn()
          };
          instance.gainNodes.push(gainNode);
          return gainNode;
        })
      };
      instances.push(instance);
      return instance;
    });

    /** @type {any} */ (globalThis).AudioContext = AudioContextMock;
    return { AudioContextMock: AudioContextMock, instances: instances };
  }

  function createAudioEngine() {
    const module = loadFresh("shared/widget-kits/vessel/RegattaTimerAudio.js");
    const api = module.create({}, createComponentContextMock());
    return api.createAudioEngine();
  }

  beforeEach(function () {
    originalAudioContext = /** @type {any} */ (globalThis).AudioContext;
    originalWebkitAudioContext = /** @type {any} */ (globalThis).webkitAudioContext;
    delete (/** @type {any} */ (globalThis).AudioContext);
    delete (/** @type {any} */ (globalThis).webkitAudioContext);
  });

  afterEach(function () {
    if (typeof originalAudioContext === "undefined") {
      delete (/** @type {any} */ (globalThis).AudioContext);
    } else {
      /** @type {any} */ (globalThis).AudioContext = originalAudioContext;
    }

    if (typeof originalWebkitAudioContext === "undefined") {
      delete (/** @type {any} */ (globalThis).webkitAudioContext);
    } else {
      /** @type {any} */ (globalThis).webkitAudioContext = originalWebkitAudioContext;
    }
  });

  it("ensureContext creates AudioContext on first call", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();

    expect(engine.ensureContext()).toBe(true);
    expect(harness.AudioContextMock).toHaveBeenCalledTimes(1);
    expect(harness.instances).toHaveLength(1);
  });

  it("ensureContext reuses existing context on subsequent calls", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();

    expect(engine.ensureContext()).toBe(true);
    expect(engine.ensureContext()).toBe(true);
    expect(harness.AudioContextMock).toHaveBeenCalledTimes(1);
  });

  it("playTone creates an oscillator with the requested frequency", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();
    engine.ensureContext();

    engine.playTone(440, 300);

    const ctx = harness.instances[0];
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    expect(ctx.createGain).toHaveBeenCalledTimes(1);
    expect(ctx.oscillatorNodes[0].frequency.setValueAtTime).toHaveBeenCalledWith(440, 10);
    expect(ctx.oscillatorNodes[0].type).toBe("sine");
    expect(ctx.oscillatorNodes[0].start).toHaveBeenCalledWith(10);
    expect(ctx.oscillatorNodes[0].stop).toHaveBeenCalledWith(10.3);
  });

  it("playTone is a no-op when context creation failed", function () {
    /** @type {any} */ (globalThis).AudioContext = vi.fn().mockImplementation(function () {
      throw new Error("unavailable");
    });
    const engine = createAudioEngine();

    expect(engine.ensureContext()).toBe(false);
    expect(function () {
      engine.playTone(880, 150);
    }).not.toThrow();
  });

  it("destroy closes the active context", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();
    engine.ensureContext();

    engine.destroy();

    expect(harness.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("destroy is idempotent", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();
    engine.ensureContext();

    engine.destroy();
    engine.destroy();

    expect(harness.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("ensureContext falls back to webkitAudioContext when AudioContext is unavailable", function () {
    const harness = installAudioContextMock();
    /** @type {any} */ (globalThis).webkitAudioContext = harness.AudioContextMock;
    delete (/** @type {any} */ (globalThis).AudioContext);
    const engine = createAudioEngine();

    expect(engine.ensureContext()).toBe(true);
    expect(harness.AudioContextMock).toHaveBeenCalledTimes(1);
  });

  it("ensureContext keeps returning false once marked unavailable without retrying construction", function () {
    const engine = createAudioEngine();

    expect(engine.ensureContext()).toBe(false);
    expect(engine.ensureContext()).toBe(false);
  });

  it("playTone is a no-op for non-positive or non-finite frequency and duration", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();
    engine.ensureContext();

    engine.playTone(0, 300);
    engine.playTone(-10, 300);
    engine.playTone(NaN, 300);
    engine.playTone(440, 0);
    engine.playTone(440, -50);
    engine.playTone(440, NaN);

    expect(harness.instances[0].createOscillator).not.toHaveBeenCalled();
  });

  it("playTone swallows errors thrown while wiring the oscillator graph", function () {
    const harness = installAudioContextMock();
    const engine = createAudioEngine();
    engine.ensureContext();
    harness.instances[0].createOscillator.mockImplementation(function () {
      throw new Error("graph failure");
    });

    expect(function () {
      engine.playTone(440, 300);
    }).not.toThrow();
  });

  it("destroy is a no-op when no context was ever created", function () {
    const engine = createAudioEngine();

    expect(function () {
      engine.destroy();
    }).not.toThrow();
  });

  it("destroy tolerates a close() result that is not a thenable", function () {
    /** @type {any} */ (globalThis).AudioContext = vi.fn().mockImplementation(function () {
      return {
        currentTime: 10,
        destination: {},
        close: vi.fn().mockReturnValue(undefined),
        createOscillator: vi.fn(),
        createGain: vi.fn()
      };
    });
    const engine = createAudioEngine();
    engine.ensureContext();

    expect(function () {
      engine.destroy();
    }).not.toThrow();
  });

  it("destroy swallows errors thrown while closing the context", function () {
    /** @type {any} */ (globalThis).AudioContext = vi.fn().mockImplementation(function () {
      return {
        currentTime: 10,
        destination: {},
        close: vi.fn().mockImplementation(function () {
          throw new Error("close failure");
        }),
        createOscillator: vi.fn(),
        createGain: vi.fn()
      };
    });
    const engine = createAudioEngine();
    engine.ensureContext();

    expect(function () {
      engine.destroy();
    }).not.toThrow();
  });
});
