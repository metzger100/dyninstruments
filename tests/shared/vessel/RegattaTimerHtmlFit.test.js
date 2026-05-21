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
    expect(readPx(out.buttonStyle, "min-height")).toBeGreaterThan(0);
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

  it("uses smaller button minimum height in countdown phase than idle", function () {
    const fit = createFit();
    const shellRect = { width: 320, height: 160 };
    const idle = fit.compute({
      model: makeModel({ phase: "idle" }),
      shellRect: shellRect,
      mode: "normal",
      hostContext: {}
    });
    const countdown = fit.compute({
      model: makeModel({ phase: "countdown" }),
      shellRect: shellRect,
      mode: "normal",
      hostContext: {}
    });

    expect(readPx(idle.buttonStyle, "min-height")).toBeGreaterThan(readPx(countdown.buttonStyle, "min-height"));
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

  it("enforces a minimum tap-target floor for tiny shell geometry", function () {
    const fit = createFit();
    const out = fit.compute({
      model: makeModel({ phase: "countdown", displayTime: "00:09" }),
      shellRect: { width: 72, height: 36 },
      mode: "normal",
      hostContext: {}
    });

    expect(readPx(out.buttonStyle, "min-height")).toBeGreaterThanOrEqual(32);
  });
});
