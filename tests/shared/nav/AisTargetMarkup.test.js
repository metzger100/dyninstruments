const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetMarkup", function () {
  function createMarkup() {
    const moduleCache = Object.create(null);
    const Helpers = {
      getModule(id) {
        if (!moduleCache[id]) {
          if (id === "StateScreenMarkup") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenMarkup.js");
          }
          else if (id === "StateScreenLabels") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenLabels.js");
          }
          else if (id === "HtmlWidgetUtils") {
            moduleCache[id] = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
          }
          else {
            throw new Error("unexpected module: " + id);
          }
        }
        return moduleCache[id];
      }
    };
    return loadFresh("shared/widget-kits/nav/AisTargetMarkup.js").create({}, Helpers);
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
      mode: "normal",
      kind: "data",
      stateLabel: "",
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
      inlineGeometry: {
        wrapperStyle: "padding:4px 4px 4px 8px;",
        identityStyle: "grid-template-rows:minmax(0,12px) minmax(0,10px);",
        metricsStyle: "grid-template-columns:minmax(0,100px) minmax(0,100px);",
        accentStyle: "left:4px;top:4px;bottom:4px;width:3px;",
        metricStyles: {
          dst: { metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);", valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);" },
          cpa: { metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);", valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);" },
          tcpa: { metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);", valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);" },
          brg: { metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);", valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);" }
        }
      },
      nameText: "Poseidon",
      frontText: "Front",
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
      nameStyle: "font-size:13px;",
      frontStyle: "font-size:11px;",
      placeholderStyle: "font-size:12px;",
      accentStyle: "background-color:#f39b52;",
      metrics: {
        dst: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        cpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        tcpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        brg: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" }
      }
    }, overrides || {});
    out.metrics = Object.assign({}, {
      dst: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
      cpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
      tcpa: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
      brg: { captionStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" }
    }, overrides && overrides.metrics ? overrides.metrics : {});
    return out;
  }

  function expectFlatMetricStructure(root, id) {
    const metric = root.querySelector(".dyni-ais-target-metric-" + id);
    expect(metric).toBeTruthy();
    expect(metric.children).toHaveLength(3);
    expect(metric.children[0].className).toContain("dyni-ais-target-metric-caption");
    expect(metric.children[1].className).toContain("dyni-ais-target-metric-value");
    expect(metric.children[2].className).toContain("dyni-ais-target-metric-unit");
  }

  function expectInlineMetricStructure(root, id) {
    const metric = root.querySelector(".dyni-ais-target-metric-" + id);
    expect(metric).toBeTruthy();
    expect(metric.children).toHaveLength(2);
    expect(metric.children[0].className).toContain("dyni-ais-target-metric-caption");
    expect(metric.children[1].className).toContain("dyni-ais-target-metric-value-row");

    const row = metric.children[1];
    expect(row.children).toHaveLength(2);
    expect(row.children[0].className).toContain("dyni-ais-target-metric-value-text");
    expect(row.children[1].className).toContain("dyni-ais-target-metric-unit");
  }

  it("renders dispatch-mode wrapper, accent, hotspot, and ordered metric tiles", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });
    const root = parseHtml(html);

    expect(html).toContain('class="dyni-ais-target-html dyni-ais-target-mode-normal dyni-ais-target-data dyni-ais-target-open-dispatch dyni-ais-target-branch-tcpa dyni-ais-target-color-warning"');
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).toContain('class="dyni-ais-target-open-hotspot"');
    expect(html).toContain('class="dyni-ais-target-state-accent" style="left:4px;top:4px;bottom:4px;width:3px;background-color:#f39b52;"');
    expect(root.querySelector(".dyni-ais-target-name")).toBeTruthy();
    expect(root.querySelector(".dyni-ais-target-front")).toBeTruthy();

    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectInlineMetricStructure(root, id);
    });

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
    expect(html).toContain('data-dyni-action="ais-target-open"');
    expect(html).not.toContain("dyni-ais-target-open-hotspot");
    expect(html).not.toContain("dyni-ais-target-state-accent");
  });

  it("renders all four metrics and identity in all data modes", function () {
    const markup = createMarkup();

    ["flat", "normal", "high"].forEach((mode) => {
      const html = markup.render({
        model: makeModel({
          mode: mode,
          wrapperClasses: [
            "dyni-ais-target-html",
            "dyni-ais-target-mode-" + mode,
            "dyni-ais-target-data",
            "dyni-ais-target-open-dispatch",
            "dyni-ais-target-branch-brg"
          ]
        }),
        fit: makeFit(),
        htmlUtils: createHtmlUtils()
      });
      const root = parseHtml(html);

      expect(root.querySelector(".dyni-ais-target-name")).toBeTruthy();
      expect(root.querySelector(".dyni-ais-target-front")).toBeTruthy();
      if (mode === "flat") {
        ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
          expectFlatMetricStructure(root, id);
        });
      } else {
        ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
          expectInlineMetricStructure(root, id);
        });
      }
    });
  });

  it("renders noAis state through shared state-screen markup", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        kind: "noAis",
        stateLabel: "No AIS",
        captureClicks: false,
        showHotspot: false,
        hasAccent: false,
        wrapperClasses: [
          "dyni-ais-target-html",
          "dyni-ais-target-mode-normal",
          "dyni-ais-target-open-passive",
          "dyni-ais-target-branch-tcpa"
        ],
        visibleMetricIds: []
      }),
      fit: makeFit({ accentStyle: "" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-state-no-ais");
    expect(html).toContain("dyni-state-screen-body");
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

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;padding:4px 4px 4px 8px;"');
    expect(html).toContain('class="dyni-ais-target-name" style="font-size:13px;"');
    expect(html).toContain('class="dyni-ais-target-front" style="font-size:11px;"');
    expect(html).toContain('class="dyni-ais-target-metric-caption" style="font-size:8px;"');
    expect(html).toContain('class="dyni-ais-target-metric-value-row"');
    expect(html).toContain('class="dyni-ais-target-metric-value-text" style="font-size:12px;"');
    expect(html).toContain('class="dyni-ais-target-metric-unit" style="font-size:9px;"');
    expect(html).toContain("&lt;img src=x onerror=&quot;1&quot;&gt;");
    expect(html).toContain("&quot;Front&quot;");
    expect(html).toContain("&lt;DST&gt;");
    expect(html).toContain("&lt;4.2&gt;");
    expect(html).toContain("&lt;nm&gt;");
    expect(html).not.toContain('<img src=x onerror="1">');
  });

  it("applies layout-driven geometry styles for wrapper, accent, identity, metrics, and inline value rows", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;padding:4px 4px 4px 8px;"');
    expect(html).toContain('class="dyni-ais-target-state-accent" style="left:4px;top:4px;bottom:4px;width:3px;background-color:#f39b52;"');
    expect(html).toContain('class="dyni-ais-target-identity" style="grid-template-rows:minmax(0,12px) minmax(0,10px);"');
    expect(html).toContain('class="dyni-ais-target-metrics" style="grid-template-columns:minmax(0,100px) minmax(0,100px);"');
    expect(html).toContain('class="dyni-ais-target-metric dyni-ais-target-metric-cpa" style="grid-template-columns:minmax(0,30px) minmax(0,70px);"');
    expect(html).toContain('class="dyni-ais-target-metric-value-row" style="grid-template-columns:minmax(0,50px) minmax(0,20px);"');
  });
});
