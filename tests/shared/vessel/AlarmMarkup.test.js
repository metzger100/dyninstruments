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
      shellStyle: "padding:2px 2px 2px 13px;",
      accentStyle: "left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;",
      activeBackgroundStyle: "",
      activeForegroundStyle: "",
      idleStripStyle: "left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;"
    }, overrides || {});
  }

  it("renders high mode with caption above value inside the main content wrapper", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit({
        mode: "high",
        activeBackgroundStyle: "background-color:#e04040;",
        activeForegroundStyle: "color:#ffffff;"
      }),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html).querySelector(".dyni-alarm-html");

    expect(html).toContain('style="padding:2px 2px 2px 13px;background-color:#e04040;color:#ffffff;"');
    expect(html).toContain('class="dyni-alarm-state-accent" style="left:2px;top:2px;bottom:2px;width:8px;border-radius:8px;background-color:#66b8ff;"');
    expect(html).not.toContain("dyni-alarm-shell");
    expect(root.children).toHaveLength(3);
    expect(root.children[0].className).toContain("dyni-alarm-state-accent");
    expect(root.children[1].className).toContain("dyni-alarm-open-hotspot");
    expect(root.children[2].className).toContain("dyni-alarm-main");
    expect(root.children[2].className).toContain("dyni-alarm-main-high");
    expect(root.children[2].querySelector(".dyni-alarm-caption-row")).toBeTruthy();
    expect(root.children[2].querySelector(".dyni-alarm-value-row")).toBeTruthy();
    expect(root.querySelector(".dyni-alarm-caption-block")).toBeFalsy();
    expect(root.querySelector(".dyni-alarm-value-block")).toBeFalsy();
  });

  it("renders normal mode with value row before caption row", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        interactionState: "passive",
        showStrip: false
      }),
      fit: makeFit({ mode: "normal", shellStyle: "padding:2px;" }),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html).querySelector(".dyni-alarm-html");

    expect(html).toContain('style="padding:2px;"');
    expect(root.children).toHaveLength(1);
    expect(root.children[0].className).toContain("dyni-alarm-main");
    expect(root.children[0].className).toContain("dyni-alarm-main-normal");
    expect(root.children[0].children).toHaveLength(2);
    expect(root.children[0].children[0].className).toContain("dyni-alarm-value-row");
    expect(root.children[0].children[1].className).toContain("dyni-alarm-caption-row");
  });

  it("renders flat mode with a single inline row", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        interactionState: "passive",
        showStrip: false
      }),
      fit: makeFit({ mode: "flat", shellStyle: "padding:2px;" }),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html).querySelector(".dyni-alarm-html");

    expect(root.children).toHaveLength(1);
    expect(root.children[0].className).toContain("dyni-alarm-main");
    expect(root.children[0].className).toContain("dyni-alarm-main-flat");
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].className).toContain("dyni-alarm-inline-row");
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
    const rootDispatch = parseHtml(htmlDispatch).querySelector(".dyni-alarm-html");
    const rootPassive = parseHtml(htmlPassive).querySelector(".dyni-alarm-html");

    expect(htmlDispatch).not.toContain("dyni-alarm-strip");
    expect(htmlDispatch).not.toContain("dyni-alarm-hotspot");
    expect(htmlDispatch).not.toContain("dyni-alarm-body");
    expect(rootDispatch.querySelector(".dyni-alarm-open-hotspot")).toBeTruthy();
    expect(rootPassive.querySelector(".dyni-alarm-open-hotspot")).toBeFalsy();
    expect(htmlDispatch).toContain("dyni-alarm-open-dispatch");
    expect(htmlPassive).toContain("dyni-alarm-open-passive");
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

    expect(htmlStrip).toContain("dyni-alarm-state-accent");
    expect(htmlNoStrip).not.toContain("dyni-alarm-state-accent");
  });
});
