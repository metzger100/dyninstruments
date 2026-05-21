const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RegattaTimerAudio", function () {
  let originalAudioContext;
  let originalWebkitAudioContext;

  function installAudioContextMock() {
    const instances = [];
    const AudioContextMock = vi.fn().mockImplementation(function () {
      const instance = {
        currentTime: 10,
        destination: { id: "destination" },
        oscillatorNodes: [],
        gainNodes: [],
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

    globalThis.AudioContext = AudioContextMock;
    return { AudioContextMock: AudioContextMock, instances: instances };
  }

  function createAudioEngine() {
    const module = loadFresh("shared/widget-kits/vessel/RegattaTimerAudio.js");
    const api = module.create({}, createComponentContextMock());
    return api.createAudioEngine();
  }

  beforeEach(function () {
    originalAudioContext = globalThis.AudioContext;
    originalWebkitAudioContext = globalThis.webkitAudioContext;
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;
  });

  afterEach(function () {
    if (typeof originalAudioContext === "undefined") {
      delete globalThis.AudioContext;
    } else {
      globalThis.AudioContext = originalAudioContext;
    }

    if (typeof originalWebkitAudioContext === "undefined") {
      delete globalThis.webkitAudioContext;
    } else {
      globalThis.webkitAudioContext = originalWebkitAudioContext;
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
    globalThis.AudioContext = vi.fn().mockImplementation(function () {
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
});
