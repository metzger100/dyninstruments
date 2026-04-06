const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetMarkup", function () {
  function createMarkup() {
    return loadFresh("shared/widget-kits/nav/AisTargetMarkup.js").create();
  }

  function createHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  function makeModel(overrides) {
    return Object.assign({
      mode: "normal",
      renderState: "data",
      showTcpaBranch: true,
      captureClicks: true,
      showHotspot: true,
      hasAccent: true,
      wrapperStyle: "height:auto;aspect-ratio:7/8;min-height:8em;",
      wrapperClasses: [
        "dyni-ais-target-html",
        "dyni-ais-target-mode-normal",
        "dyni-ais-target-data",
        "dyni-ais-target-open-dispatch",
        "dyni-ais-target-branch-tcpa",
        "dyni-ais-target-color-warning"
      ],
      nameText: "Poseidon",
      frontText: "Front",
      frontInitialText: "F",
      placeholderText: "No AIS",
      visibleMetricIds: ["dst", "cpa", "tcpa", "brg"],
      metrics: {
        dst: { captionText: "DST", valueText: "4.2", unitText: "nm" },
        cpa: { captionText: "DCPA", valueText: "0.7", unitText: "nm" },
        tcpa: { captionText: "TCPA", valueText: "0.5", unitText: "min" },
        brg: { captionText: "BRG", valueText: "112", unitText: "°" }
      }
    }, overrides || {});
  }

  function makeFit(overrides) {
    const out = Object.assign({
      frontInitialStyle: "font-size:16px;",
      nameStyle: "font-size:13px;",
      frontStyle: "font-size:11px;",
      placeholderStyle: "font-size:12px;",
      accentStyle: "background-color:#f39b52;",
      metrics: {
        dst: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        cpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        tcpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        brg: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" }
      }
    }, overrides || {});
    out.metrics = Object.assign({}, {
      dst: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
      cpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
      tcpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
      brg: { captionStyle: "font-size:8px;", valueRowStyle: "", valueTextStyle: "font-size:12px;", unitStyle: "font-size:9px;" }
    }, overrides && overrides.metrics ? overrides.metrics : {});
    return out;
  }

  it("renders dispatch-mode wrapper, accent, hotspot, and ordered metric tiles", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('class="dyni-ais-target-html dyni-ais-target-mode-normal dyni-ais-target-data dyni-ais-target-open-dispatch dyni-ais-target-branch-tcpa dyni-ais-target-color-warning"');
    expect(html).toContain('onclick="catchAll"');
    expect(html).toContain('class="dyni-ais-target-open-hotspot" onclick="aisTargetShowInfo"');
    expect(html).toContain('class="dyni-ais-target-state-accent" style="background-color:#f39b52;"');
    expect(html).toContain("dyni-ais-target-name");
    expect(html).toContain("dyni-ais-target-front");
    expect(html).toContain("dyni-ais-target-metric-dst");
    expect(html).toContain("dyni-ais-target-metric-cpa");
    expect(html).toContain("dyni-ais-target-metric-tcpa");
    expect(html).toContain("dyni-ais-target-metric-brg");
    expect(html).toContain("dyni-ais-target-metric-value-row");
    expect(html).toContain("dyni-ais-target-metric-value-text");

    const dstIndex = html.indexOf("dyni-ais-target-metric-dst");
    const cpaIndex = html.indexOf("dyni-ais-target-metric-cpa");
    const tcpaIndex = html.indexOf("dyni-ais-target-metric-tcpa");
    const brgIndex = html.indexOf("dyni-ais-target-metric-brg");
    expect(dstIndex).toBeGreaterThan(-1);
    expect(cpaIndex).toBeGreaterThan(dstIndex);
    expect(tcpaIndex).toBeGreaterThan(cpaIndex);
    expect(brgIndex).toBeGreaterThan(tcpaIndex);
  });

  it("renders passive mode without catchAll/hotspot/accent", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        captureClicks: false,
        showHotspot: false,
        hasAccent: false,
        wrapperClasses: [
          "dyni-ais-target-html",
          "dyni-ais-target-mode-normal",
          "dyni-ais-target-data",
          "dyni-ais-target-open-passive",
          "dyni-ais-target-branch-tcpa"
        ]
      }),
      fit: makeFit({ accentStyle: "" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-ais-target-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-ais-target-open-hotspot");
    expect(html).not.toContain("dyni-ais-target-state-accent");
  });

  it("renders flat data body with name/front and all four metrics", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        mode: "flat",
        showTcpaBranch: false,
        wrapperClasses: [
          "dyni-ais-target-html",
          "dyni-ais-target-mode-flat",
          "dyni-ais-target-data",
          "dyni-ais-target-open-dispatch",
          "dyni-ais-target-branch-brg",
          "dyni-ais-target-flat-rows-2"
        ],
        visibleMetricIds: ["dst", "cpa", "tcpa", "brg"]
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-ais-target-name");
    expect(html).toContain('class="dyni-ais-target-front"');
    expect(html).not.toContain("dyni-ais-target-front-initial");
    expect(html).toContain("dyni-ais-target-metric-dst");
    expect(html).toContain("dyni-ais-target-metric-cpa");
    expect(html).toContain("dyni-ais-target-metric-tcpa");
    expect(html).toContain("dyni-ais-target-metric-brg");
  });

  it("renders placeholder state with placeholder text only", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        renderState: "placeholder",
        captureClicks: false,
        showHotspot: false,
        hasAccent: false,
        wrapperClasses: [
          "dyni-ais-target-html",
          "dyni-ais-target-mode-normal",
          "dyni-ais-target-placeholder",
          "dyni-ais-target-open-passive",
          "dyni-ais-target-branch-tcpa"
        ],
        visibleMetricIds: []
      }),
      fit: makeFit({ accentStyle: "" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-ais-target-placeholder");
    expect(html).toContain("dyni-ais-target-placeholder-text");
    expect(html).toContain(">No AIS<");
    expect(html).not.toContain("dyni-ais-target-identity");
    expect(html).not.toContain("dyni-ais-target-metrics");
  });

  it("escapes model text and applies inline styles from fit payload", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        nameText: '<img src=x onerror="1">',
        frontText: '"Front"',
        metrics: {
          dst: { captionText: "<DST>", valueText: "<4.2>", unitText: "<nm>" },
          cpa: { captionText: "<DCPA>", valueText: "<0.7>", unitText: "<nm>" },
          tcpa: { captionText: "<TCPA>", valueText: "<0.5>", unitText: "<min>" },
          brg: { captionText: "<BRG>", valueText: "<112>", unitText: "<°>" }
        }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;"');
    expect(html).toContain('class="dyni-ais-target-name" style="font-size:13px;"');
    expect(html).toContain('class="dyni-ais-target-front" style="font-size:11px;"');
    expect(html).toContain('class="dyni-ais-target-metric-caption" style="font-size:8px;"');
    expect(html).toContain('class="dyni-ais-target-metric-value-text" style="font-size:12px;"');
    expect(html).toContain('class="dyni-ais-target-metric-unit" style="font-size:9px;"');
    expect(html).toContain("&lt;img src=x onerror=&quot;1&quot;&gt;");
    expect(html).toContain("&quot;Front&quot;");
    expect(html).toContain("&lt;DST&gt;");
    expect(html).toContain("&lt;4.2&gt;");
    expect(html).toContain("&lt;nm&gt;");
    expect(html).not.toContain('<img src=x onerror="1">');
  });
});
