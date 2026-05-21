const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RegattaTimerHtmlFit", function () {
  function createFit() {
    const componentContext = createComponentContextMock({
      modules: {
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js")
      }
    });
    return loadFresh("shared/widget-kits/vessel/RegattaTimerHtmlFit.js").create({}, componentContext);
  }

  function parseStyle(styleText) {
    return String(styleText || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce((acc, part) => {
        const idx = part.indexOf(":");
        if (idx <= 0) {
          return acc;
        }
        acc[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
        return acc;
      }, Object.create(null));
  }

  function readPx(styleText, key) {
    const styleMap = parseStyle(styleText);
    const raw = styleMap[key] || "";
    const match = raw.match(/^(\d+(?:\.\d+)?)px$/);
    return match ? Number(match[1]) : NaN;
  }

  function makeModel(overrides) {
    return Object.assign({
      phase: "idle",
      displayTime: "05:00"
    }, overrides || {});
  }

  it("computes proportional fit styles for timer, buttons, and bar", function () {
    const fit = createFit();
    const out = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "04:25" }),
      shellRect: { width: 320, height: 160 },
      mode: "normal",
      hostContext: {}
    });

    expect(out).toBeTruthy();
    expect(readPx(out.timerStyle, "font-size")).toBeGreaterThan(0);
    expect(readPx(out.buttonStyle, "height")).toBeGreaterThan(0);
    expect(readPx(out.barStyle, "height")).toBeGreaterThan(0);
  });

  it("scales timer font down on tighter geometry", function () {
    const fit = createFit();
    const large = fit.compute({
      model: makeModel(),
      shellRect: { width: 320, height: 160 },
      mode: "normal",
      hostContext: {}
    });
    const small = fit.compute({
      model: makeModel(),
      shellRect: { width: 160, height: 90 },
      mode: "normal",
      hostContext: {}
    });

    expect(readPx(large.timerStyle, "font-size")).toBeGreaterThan(readPx(small.timerStyle, "font-size"));
  });

  it("keeps high-mode countdown buttons vertically stacked with smaller height than idle", function () {
    const fit = createFit();
    const shellRect = { width: 320, height: 160 };
    const idle = fit.compute({
      model: makeModel({ phase: "idle" }),
      shellRect: shellRect,
      mode: "high",
      hostContext: {}
    });
    const countdown = fit.compute({
      model: makeModel({ phase: "countdown" }),
      shellRect: shellRect,
      mode: "high",
      hostContext: {}
    });

    expect(parseStyle(countdown.controlsStyle)["grid-template-columns"]).toBe("minmax(0,1fr)");
    expect(parseStyle(countdown.controlsStyle)["grid-template-rows"]).toBe("repeat(2,minmax(0,1fr))");
    expect(readPx(idle.buttonStyle, "height")).toBeGreaterThan(readPx(countdown.buttonStyle, "height"));
  });

  it("uses two-column controls in normal countdown and keeps full controls-row button height", function () {
    const fit = createFit();
    const shellRect = { width: 320, height: 160 };
    const idle = fit.compute({
      model: makeModel({ phase: "idle", displayTime: "05:00" }),
      shellRect: shellRect,
      mode: "normal",
      hostContext: {}
    });
    const countdown = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "04:25" }),
      shellRect: shellRect,
      mode: "normal",
      hostContext: {}
    });

    const idleHeight = readPx(idle.buttonStyle, "height");
    const countdownHeight = readPx(countdown.buttonStyle, "height");
    const idleFont = readPx(idle.buttonStyle, "font-size");
    const countdownFont = readPx(countdown.buttonStyle, "font-size");
    const narrowCountdown = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "04:25" }),
      shellRect: { width: 150, height: 160 },
      mode: "normal",
      hostContext: {}
    });
    const narrowCountdownFont = readPx(narrowCountdown.buttonStyle, "font-size");

    expect(parseStyle(countdown.controlsStyle)["grid-template-columns"]).toBe("repeat(2,minmax(0,1fr))");
    expect(parseStyle(countdown.controlsStyle)["grid-template-rows"]).toBe("minmax(0,1fr)");
    expect(countdownHeight).toBe(idleHeight);
    expect(countdownFont).toBeLessThanOrEqual(idleFont);
    expect(narrowCountdownFont).toBeLessThan(countdownFont);
  });

  it("keys fit-cache entries on hostContext and supports explicit invalidation", function () {
    const fit = createFit();
    const hostContext = {};
    const args = {
      model: makeModel({ phase: "countdown", displayTime: "04:10" }),
      shellRect: { width: 300, height: 140 },
      mode: "normal",
      hostContext: hostContext
    };
    const first = fit.compute(args);
    const second = fit.compute(args);

    expect(first).toBe(second);
    expect(hostContext[fit.FIT_CACHE_KEY]).toBeTruthy();

    fit.clearCache(hostContext);
    expect(hostContext[fit.FIT_CACHE_KEY]).toBeUndefined();

    const third = fit.compute(args);
    expect(third).not.toBe(first);
  });

  it("invalidates cached fit output when stableDigits state changes", function () {
    const fit = createFit();
    const hostContext = {};
    const baseArgs = {
      model: makeModel({ phase: "countdown", displayTime: "04:10" }),
      shellRect: { width: 300, height: 140 },
      mode: "normal",
      hostContext: hostContext
    };
    const plain = fit.compute(Object.assign({}, baseArgs, { stableDigitsEnabled: false }));
    const tabular = fit.compute(Object.assign({}, baseArgs, { stableDigitsEnabled: true }));

    expect(plain).not.toBe(tabular);
  });

  it("returns null when shellRect is missing or invalid", function () {
    const fit = createFit();

    expect(fit.compute({
      model: makeModel(),
      mode: "normal",
      hostContext: {}
    })).toBeNull();
    expect(fit.compute({
      model: makeModel(),
      shellRect: { width: 0, height: 120 },
      mode: "normal",
      hostContext: {}
    })).toBeNull();
  });

  it("scales countdown button height below 32px on tiny shells", function () {
    const fit = createFit();
    const out = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "00:09" }),
      shellRect: { width: 72, height: 36 },
      mode: "normal",
      hostContext: {}
    });

    expect(readPx(out.buttonStyle, "height")).toBeGreaterThan(0);
    expect(readPx(out.buttonStyle, "height")).toBeLessThan(32);
  });

  it("keeps flat narrow fit responsive without fixed control width assumptions", function () {
    const fit = createFit();
    const shellRect = { width: 92, height: 42 };
    const idle = fit.compute({
      model: makeModel({ phase: "idle", displayTime: "05:00" }),
      shellRect: shellRect,
      mode: "flat",
      hostContext: {}
    });
    const countdown = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "00:09" }),
      shellRect: shellRect,
      mode: "flat",
      hostContext: {}
    });

    const idleHeight = readPx(idle.buttonStyle, "height");
    const countdownHeight = readPx(countdown.buttonStyle, "height");

    expect(countdownHeight).toBeGreaterThan(0);
    expect(countdownHeight).toBeLessThan(32);
    expect(countdownHeight).toBeLessThan(idleHeight);
    expect(parseStyle(countdown.controlsStyle)["min-width"]).toBe("0");
    expect(parseStyle(countdown.displayStyle)["min-width"]).toBe("0");
    expect(parseStyle(countdown.wrapperStyle)["grid-template-columns"]).toMatch(/^minmax\(0,\d+px\) minmax\(0,\d+px\)$/);
    expect(countdown.buttonStyle).not.toContain("min-width");
    expect(countdown.buttonStyle).not.toContain("em");
    expect(countdown.buttonStyle).not.toContain("32px");
  });

  it("keeps compact stacked geometry with positive separated display and control sizes", function () {
    const fit = createFit();
    const compact = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "1:15:04" }),
      shellRect: { width: 116, height: 62 },
      mode: "normal",
      hostContext: {}
    });
    const timerSize = readPx(compact.timerStyle, "font-size");
    const buttonHeight = readPx(compact.buttonStyle, "height");
    const gapPx = readPx(compact.controlsStyle, "gap");

    expect(timerSize).toBeGreaterThan(0);
    expect(buttonHeight).toBeGreaterThan(0);
    expect(gapPx).toBeGreaterThan(0);
    expect(parseStyle(compact.buttonStyle)["max-height"]).toBe(parseStyle(compact.buttonStyle)["height"]);
    expect(parseStyle(compact.buttonStyle)["min-height"]).toBe("0");
    expect(parseStyle(compact.controlsStyle)["min-height"]).toBe("0");
    expect(parseStyle(compact.displayStyle)["min-height"]).toBe("0");
  });

  it("uses width-constrained button label fitting for very narrow tall geometry", function () {
    const fit = createFit();
    const narrow = fit.compute({
      model: makeModel({ phase: "idle", displayTime: "05:00" }),
      shellRect: { width: 64, height: 220 },
      mode: "high",
      hostContext: {}
    });
    const wide = fit.compute({
      model: makeModel({ phase: "idle", displayTime: "05:00" }),
      shellRect: { width: 180, height: 220 },
      mode: "high",
      hostContext: {}
    });

    const narrowButtonFont = readPx(narrow.buttonStyle, "font-size");
    const wideButtonFont = readPx(wide.buttonStyle, "font-size");
    const narrowTimerFont = readPx(narrow.timerStyle, "font-size");

    expect(narrowButtonFont).toBeGreaterThan(0);
    expect(wideButtonFont).toBeGreaterThan(narrowButtonFont);
    expect(narrowButtonFont).toBeLessThan(narrowTimerFont);
    expect(parseStyle(narrow.buttonStyle)["height"]).toBe(parseStyle(narrow.buttonStyle)["max-height"]);
    expect(parseStyle(narrow.buttonStyle)["min-height"]).toBe("0");
  });

  it("scales bar height from widget height for same-width shells", function () {
    const fit = createFit();
    const shortShell = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "04:10" }),
      shellRect: { width: 220, height: 80 },
      mode: "normal",
      hostContext: {}
    });
    const tallShell = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "04:10" }),
      shellRect: { width: 220, height: 200 },
      mode: "normal",
      hostContext: {}
    });

    const shortBar = readPx(shortShell.barStyle, "height");
    const tallBar = readPx(tallShell.barStyle, "height");
    const narrowTall = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "04:10" }),
      shellRect: { width: 80, height: 220 },
      mode: "high",
      hostContext: {}
    });
    const narrowTallBar = readPx(narrowTall.barStyle, "height");

    expect(shortBar).toBeGreaterThan(0);
    expect(tallBar).toBeGreaterThan(shortBar);
    expect(narrowTallBar).toBeGreaterThan(0);
  });
});
