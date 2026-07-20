const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RegattaTimerMarkup", function () {
  function createMarkup() {
    const componentContext = createComponentContextMock({
      modules: {
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js")
      }
    });
    return loadFresh("shared/widget-kits/vessel/RegattaTimerMarkup.js").create({}, componentContext);
  }

  function createHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  /** @param {any} html */
  function parseHtml(html) {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host;
  }

  /** @param {any} [overrides] */
  function makeFit(overrides) {
    return Object.assign(
      {
        wrapperStyle: "padding:4px;",
        displayStyle: "row-gap:2px;",
        timerStyle: "font-size:30px;",
        controlsStyle: "column-gap:4px;",
        barStyle: "height:3px;",
        buttonStyle: "min-height:24px;",
        startButtonStyle: "border-radius:4px;",
        syncButtonStyle: "border-radius:4px;",
        resetButtonStyle: "border-radius:4px;"
      },
      overrides || {}
    );
  }

  /** @param {any} [overrides] */
  function makeModel(overrides) {
    return Object.assign(
      {
        phase: "idle",
        displayTime: "05:00",
        colorPhase: "normal",
        remainingMs: 300000
      },
      overrides || {}
    );
  }

  /** @param {any} [overrides] */
  function makeConfig(overrides) {
    return Object.assign(
      {
        soundEnabled: true,
        progressBarEnabled: true,
        durationMinutes: 5
      },
      overrides || {}
    );
  }

  it("renders wrapper classes, escaped display text, and action buttons", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({ displayTime: "<05:00>" }),
      fit: makeFit(),
      config: makeConfig(),
      mode: "flat",
      interactionState: "dispatch",
      stableDigitsEnabled: false,
      htmlUtils: createHtmlUtils()
    });
    const root = /** @type {Element} */ (parseHtml(html).querySelector(".dyni-regatta-html"));

    expect(html).toContain("dyni-regatta-mode-flat");
    expect(html).toContain("dyni-regatta-phase-idle");
    expect(html).toContain("dyni-regatta-color-normal");
    expect(html).toContain("dyni-regatta-open-dispatch");
    expect(/** @type {Element} */ (root.querySelector(".dyni-regatta-time")).innerHTML).toBe("&lt;05:00&gt;");
    expect(/** @type {Element} */ (root.querySelector(".dyni-regatta-time")).classList.contains("dyni-tabular")).toBe(
      false
    );
    expect(root.querySelector('[data-dyni-action="regatta-start"]')).toBeTruthy();
    expect(root.querySelector('[data-dyni-action="regatta-sync"]')).toBeTruthy();
    expect(root.querySelector('[data-dyni-action="regatta-reset"]')).toBeTruthy();
  });

  it("adds dyni-tabular only when stable digits are enabled", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      config: makeConfig(),
      mode: "normal",
      interactionState: "dispatch",
      stableDigitsEnabled: true,
      htmlUtils: createHtmlUtils()
    });
    const timeEl = /** @type {Element} */ (parseHtml(html).querySelector(".dyni-regatta-time"));

    expect(timeEl.classList.contains("dyni-tabular")).toBe(true);
  });

  it("renders progress bar only when enabled in config", function () {
    const markup = createMarkup();
    const withBar = markup.render({
      model: makeModel(),
      fit: makeFit(),
      config: makeConfig({ progressBarEnabled: true }),
      mode: "normal",
      interactionState: "passive",
      stableDigitsEnabled: false,
      htmlUtils: createHtmlUtils()
    });
    const withoutBar = markup.render({
      model: makeModel(),
      fit: makeFit(),
      config: makeConfig({ progressBarEnabled: false }),
      mode: "normal",
      interactionState: "passive",
      stableDigitsEnabled: false,
      htmlUtils: createHtmlUtils()
    });

    expect(parseHtml(withBar).querySelector(".dyni-regatta-bar")).toBeTruthy();
    expect(parseHtml(withoutBar).querySelector(".dyni-regatta-bar")).toBeFalsy();
  });

  it("uses countdown remaining time to compute bar width", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        phase: "countdown",
        colorPhase: "warning",
        remainingMs: 150000
      }),
      fit: makeFit(),
      config: makeConfig({ durationMinutes: 5 }),
      mode: "high",
      interactionState: "dispatch",
      stableDigitsEnabled: false,
      htmlUtils: createHtmlUtils()
    });
    const bar = /** @type {Element} */ (parseHtml(html).querySelector(".dyni-regatta-bar"));

    expect(bar.getAttribute("style")).toContain("width:50%");
    expect(html).toContain("dyni-regatta-phase-countdown");
    expect(html).toContain("dyni-regatta-color-warning");
  });

  it("forces elapsed-phase progress bar width to zero", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        phase: "elapsed",
        colorPhase: "normal",
        remainingMs: 0
      }),
      fit: makeFit(),
      config: makeConfig({ progressBarEnabled: true }),
      mode: "normal",
      interactionState: "passive",
      stableDigitsEnabled: false,
      htmlUtils: createHtmlUtils()
    });
    const bar = /** @type {Element} */ (parseHtml(html).querySelector(".dyni-regatta-bar"));

    expect(bar.getAttribute("style")).toContain("width:0%");
    expect(html).toContain("dyni-regatta-phase-elapsed");
  });

  it("renders progress strip as a direct wrapper child and not inside display", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({ phase: "countdown", remainingMs: 120000 }),
      fit: makeFit(),
      config: makeConfig({ progressBarEnabled: true }),
      mode: "flat",
      interactionState: "dispatch",
      stableDigitsEnabled: false,
      htmlUtils: createHtmlUtils()
    });
    const root = /** @type {Element} */ (parseHtml(html).querySelector(".dyni-regatta-html"));
    const bar = /** @type {Element} */ (root.querySelector(".dyni-regatta-bar"));
    const display = /** @type {Element} */ (root.querySelector(".dyni-regatta-display"));

    expect(bar).toBeTruthy();
    expect(bar.parentElement).toBe(root);
    expect(display.querySelector(".dyni-regatta-bar")).toBeFalsy();
  });
});
