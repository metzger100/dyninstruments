const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmMarkup", function () {
  function createMarkup() {
    const Helpers = {
      getModule(id) {
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return loadFresh("shared/widget-kits/vessel/AlarmMarkup.js").create({}, Helpers);
  }

  function createHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  function parseHtml(html) {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host;
  }

  function makeModel(overrides) {
    return Object.assign({
      state: "active",
      interactionState: "dispatch",
      showStrip: true,
      showActiveBackground: true,
      captionText: "ALARM",
      valueText: "ENGINE, FIRE",
      idleValueText: "NONE",
      activeValueText: "ENGINE, FIRE",
      alarmText: "ENGINE, FIRE"
    }, overrides || {});
  }

  function makeFit(overrides) {
    return Object.assign({
      mode: "high",
      captionStyle: "font-size:10px;",
      valueStyle: "font-size:14px;",
      activeBackgroundStyle: "background-color:#e04040;",
      activeForegroundStyle: "color:#ffffff;",
      idleStripStyle: "background-color:#4488cc;"
    }, overrides || {});
  }

  it("renders high mode with caption row above value row", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit({ mode: "high" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html.indexOf("dyni-alarm-caption-row")).toBeLessThan(html.indexOf("dyni-alarm-value-row"));
  });

  it("renders normal mode with value row above caption row", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit({ mode: "normal" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html.indexOf("dyni-alarm-value-row")).toBeLessThan(html.indexOf("dyni-alarm-caption-row"));
  });

  it("renders flat mode as a single inline caption/value row", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit({ mode: "flat" }),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html);

    expect(root.querySelector(".dyni-alarm-inline-row")).toBeTruthy();
    expect(root.querySelector(".dyni-alarm-caption")).toBeTruthy();
    expect(root.querySelector(".dyni-alarm-value")).toBeTruthy();
  });

  it("renders the hotspot only in dispatch mode", function () {
    const markup = createMarkup();
    const htmlDispatch = markup.render({
      model: makeModel({ interactionState: "dispatch" }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });
    const htmlPassive = markup.render({
      model: makeModel({ interactionState: "passive" }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(htmlDispatch).toContain('data-dyni-action="alarm-stop-all"');
    expect(htmlPassive).not.toContain('data-dyni-action="alarm-stop-all"');
  });

  it("renders the strip only when requested", function () {
    const markup = createMarkup();
    const htmlStrip = markup.render({
      model: makeModel({ showStrip: true }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });
    const htmlNoStrip = markup.render({
      model: makeModel({ showStrip: false }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(htmlStrip).toContain("dyni-alarm-strip");
    expect(htmlNoStrip).not.toContain("dyni-alarm-strip");
  });
});
