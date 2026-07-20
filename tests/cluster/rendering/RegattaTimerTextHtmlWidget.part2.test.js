// @ts-nocheck
const {
  parseStyle,
  readPx,
  toTimerSeconds,
  buildRenderer,
  makeProps,
  withSurfacePolicy,
  createMountedRenderer,
  installFakeTimerHooks
} = require("./RegattaTimerTextHtmlWidget.harness.js");

installFakeTimerHooks();

describe("RegattaTimerTextHtmlWidget", function () {
  it("updates mode selection from ratio thresholds and toggles progress bar visibility", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 3.0,
          regattaProgressBar: true
        }),
        "dispatch"
      ),
      shellSize: { width: 200, height: 100 }
    });
    expect(mounted.html()).toContain("dyni-regatta-mode-normal");
    expect(mounted.mountEl.querySelector(".dyni-regatta-bar")).toBeTruthy();

    mounted.update(
      withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 1.5,
          regattaProgressBar: true
        }),
        "dispatch"
      )
    );
    expect(mounted.html()).toContain("dyni-regatta-mode-flat");

    mounted.update(
      withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 2.5,
          regattaTimerRatioThresholdFlat: 4.0,
          regattaProgressBar: false
        }),
        "dispatch"
      )
    );
    expect(mounted.html()).toContain("dyni-regatta-mode-high");
    expect(mounted.mountEl.querySelector(".dyni-regatta-bar")).toBeFalsy();
  });

  it("renders progress strip as top-level wrapper child across normal/high/flat modes when enabled", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaProgressBar: true,
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 3.0
        }),
        "dispatch"
      ),
      shellSize: { width: 220, height: 120 }
    });

    function expectTopBar(expectedModeClass) {
      const wrapper = mounted.wrapper();
      const bar = wrapper.querySelector(".dyni-regatta-bar");
      const display = wrapper.querySelector(".dyni-regatta-display");
      expect(wrapper.className).toContain(expectedModeClass);
      expect(bar).toBeTruthy();
      expect(bar.parentElement).toBe(wrapper);
      expect(display.querySelector(".dyni-regatta-bar")).toBeFalsy();
    }

    expectTopBar("dyni-regatta-mode-normal");

    mounted.update(
      withSurfacePolicy(
        makeProps({
          regattaProgressBar: true,
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 1.5
        }),
        "dispatch"
      )
    );
    expectTopBar("dyni-regatta-mode-flat");

    mounted.update(
      withSurfacePolicy(
        makeProps({
          regattaProgressBar: true,
          regattaTimerRatioThresholdNormal: 2.5,
          regattaTimerRatioThresholdFlat: 4.0
        }),
        "dispatch"
      )
    );
    expectTopBar("dyni-regatta-mode-high");

    mounted.update(withSurfacePolicy(makeProps({ regattaProgressBar: false }), "dispatch"));
    expect(mounted.mountEl.querySelector(".dyni-regatta-bar")).toBeFalsy();
  });

  it("keeps compact geometry styles positive and separated for timer and controls", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 3.0
        }),
        "dispatch"
      ),
      shellSize: { width: 128, height: 64 }
    });
    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(56000);

    const wrapper = mounted.wrapper();
    const display = mounted.mountEl.querySelector(".dyni-regatta-display");
    const controls = mounted.mountEl.querySelector(".dyni-regatta-controls");
    const timer = mounted.mountEl.querySelector(".dyni-regatta-time");
    const button = mounted.mountEl.querySelector(".dyni-regatta-btn-sync");
    const timerSize = readPx(timer.getAttribute("style"), "font-size");
    const buttonHeight = readPx(button.getAttribute("style"), "height");

    expect(timerSize).toBeGreaterThan(0);
    expect(buttonHeight).toBeGreaterThan(0);
    expect(parseStyle(button.getAttribute("style"))["max-height"]).toBe(
      parseStyle(button.getAttribute("style"))["height"]
    );
    expect(parseStyle(button.getAttribute("style"))["min-height"]).toBe("0");
    expect(parseStyle(display.getAttribute("style"))["min-height"]).toBe("0");
    expect(parseStyle(controls.getAttribute("style"))["min-height"]).toBe("0");
    expect(wrapper.className).toContain("dyni-regatta-mode-normal");
  });

  it("uses a two-column controls grid in normal-mode countdown", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 3.0
        }),
        "dispatch"
      ),
      shellSize: { width: 220, height: 120 }
    });

    mounted.clickAction("regatta-start");

    const controls = mounted.mountEl.querySelector(".dyni-regatta-controls");
    const syncButton = mounted.mountEl.querySelector(".dyni-regatta-btn-sync");
    const resetButton = mounted.mountEl.querySelector(".dyni-regatta-btn-reset");
    const controlsStyle = parseStyle(controls.getAttribute("style"));
    const syncStyle = parseStyle(syncButton.getAttribute("style"));
    const resetStyle = parseStyle(resetButton.getAttribute("style"));

    expect(syncButton).toBeTruthy();
    expect(resetButton).toBeTruthy();
    expect(controlsStyle["grid-template-columns"]).toBe("repeat(2,minmax(0,1fr))");
    expect(controlsStyle["grid-template-rows"]).toBe("minmax(0,1fr)");
    expect(syncStyle.height).toBe(syncStyle["max-height"]);
    expect(resetStyle.height).toBe(resetStyle["max-height"]);
  });

  it("shrinks button labels for very narrow tall shells instead of enforcing intrinsic size", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 3.0
        }),
        "dispatch"
      ),
      shellSize: { width: 70, height: 220 }
    });
    const timeEl = mounted.mountEl.querySelector(".dyni-regatta-time");
    const startBtn = mounted.mountEl.querySelector(".dyni-regatta-btn-start");
    const timerFont = readPx(timeEl.getAttribute("style"), "font-size");
    const buttonFont = readPx(startBtn.getAttribute("style"), "font-size");
    const buttonHeight = readPx(startBtn.getAttribute("style"), "height");

    expect(buttonFont).toBeGreaterThan(0);
    expect(buttonFont).toBeLessThan(timerFont);
    expect(buttonHeight).toBeGreaterThan(0);
    expect(parseStyle(startBtn.getAttribute("style"))["min-height"]).toBe("0");
    expect(startBtn.getAttribute("style")).not.toContain("min-width");
    expect(startBtn.getAttribute("style")).not.toContain("em");
    expect(startBtn.getAttribute("style")).not.toContain("32px");
  });

  it("changes layoutSignature for phase/display time, shellRect, and mode", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaTimerRatioThresholdNormal: 1.0,
          regattaTimerRatioThresholdFlat: 3.0
        }),
        "dispatch"
      ),
      shellSize: { width: 220, height: 120 }
    });
    const basePayload = mounted.payloadFor(mounted.currentProps, mounted.currentRevision, { width: 220, height: 120 });
    const baseSig = mounted.committed.layoutSignature(basePayload);

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(1200);
    const tickingSig = mounted.committed.layoutSignature(basePayload);
    expect(tickingSig).not.toBe(baseSig);

    const shellChangedPayload = mounted.payloadFor(mounted.currentProps, mounted.currentRevision + 1, {
      width: 260,
      height: 120
    });
    const shellSig = mounted.committed.layoutSignature(shellChangedPayload);
    expect(shellSig).not.toBe(tickingSig);

    const modeProps = withSurfacePolicy(
      makeProps({
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 1.5
      }),
      "dispatch"
    );
    const modePayload = mounted.payloadFor(modeProps, mounted.currentRevision + 2, { width: 220, height: 120 });
    const modeSig = mounted.committed.layoutSignature(modePayload);
    expect(modeSig).not.toBe(shellSig);
  });

  it("gates tone playback from regattaSoundEnabled", function () {
    const silent = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaSoundEnabled: false,
          regattaDuration: 3
        }),
        "dispatch"
      )
    });
    silent.clickAction("regatta-start");
    vi.advanceTimersByTime(61000);
    expect(silent.audioEngine.playTone).not.toHaveBeenCalled();

    const audible = createMountedRenderer({
      props: withSurfacePolicy(
        makeProps({
          regattaSoundEnabled: true,
          regattaDuration: 3
        }),
        "dispatch"
      )
    });
    audible.clickAction("regatta-start");
    vi.advanceTimersByTime(61000);
    expect(audible.audioEngine.playTone).toHaveBeenCalled();
  });

  it("detach removes root and clears timer interval, and destroy delegates to detach", function () {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    mounted.clickAction("regatta-start");
    expect(mounted.mountEl.querySelector(".dyni-regatta-root")).toBeTruthy();

    mounted.committed.detach();
    expect(mounted.mountEl.querySelector(".dyni-regatta-root")).toBeFalsy();
    expect(clearIntervalSpy).toHaveBeenCalled();
    const afterDetachHtml = mounted.mountEl.innerHTML;
    vi.advanceTimersByTime(5000);
    expect(mounted.mountEl.innerHTML).toBe(afterDetachHtml);

    const mountedForDestroy = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    mountedForDestroy.clickAction("regatta-start");
    expect(mountedForDestroy.mountEl.querySelector(".dyni-regatta-root")).toBeTruthy();
    mountedForDestroy.committed.destroy();
    expect(mountedForDestroy.mountEl.querySelector(".dyni-regatta-root")).toBeFalsy();

    clearIntervalSpy.mockRestore();
  });
});
