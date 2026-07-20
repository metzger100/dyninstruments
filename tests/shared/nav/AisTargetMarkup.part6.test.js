// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("AisTargetMarkup", function () {
  function createMarkup() {
    const stateScreenMarkup = loadFresh("shared/widget-kits/state/StateScreenMarkup.js").create(
      {},
      createComponentContextMock({
        modules: {
          HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
          StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
          StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js")
        }
      })
    );
    const componentContext = createComponentContextMock({
      modules: {
        StateScreenMarkup: stateScreenMarkup,
        StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js")
      }
    });
    return loadFresh("shared/widget-kits/nav/AisTargetMarkup.js").create({}, componentContext);
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
    return Object.assign(
      {
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
          wrapperStyle: "padding:4px 4px 4px 21px;",
          identityStyle: "grid-template-rows:minmax(0,12px) minmax(0,10px);",
          metricsStyle: "grid-template-columns:minmax(0,100px) minmax(0,100px);",
          accentStyle: "left:4px;top:4px;bottom:4px;width:14px;",
          metricStyles: {
            dst: {
              metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);",
              valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);"
            },
            cpa: {
              metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);",
              valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);"
            },
            tcpa: {
              metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);",
              valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);"
            },
            brg: {
              metricStyle: "grid-template-columns:minmax(0,30px) minmax(0,70px);",
              valueRowStyle: "grid-template-columns:minmax(0,50px) minmax(0,20px);"
            }
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
      },
      overrides || {}
    );
  }

  function makeFit(overrides) {
    const out = Object.assign(
      {
        nameStyle: "font-size:13px;",
        frontStyle: "font-size:11px;",
        placeholderStyle: "font-size:12px;",
        accentStyle: "background-color:#d9534a;",
        metrics: {
          dst: {
            captionStyle: "font-size:8px;",
            valueRowStyle: "",
            valueStyle: "font-size:12px;",
            unitStyle: "font-size:9px;"
          },
          cpa: {
            captionStyle: "font-size:8px;",
            valueRowStyle: "",
            valueStyle: "font-size:12px;",
            unitStyle: "font-size:9px;"
          },
          tcpa: {
            captionStyle: "font-size:8px;",
            valueRowStyle: "",
            valueStyle: "font-size:12px;",
            unitStyle: "font-size:9px;"
          },
          brg: {
            captionStyle: "font-size:8px;",
            valueRowStyle: "",
            valueStyle: "font-size:12px;",
            unitStyle: "font-size:9px;"
          }
        }
      },
      overrides || {}
    );
    out.metrics = Object.assign(
      {},
      {
        dst: {
          captionStyle: "font-size:8px;",
          valueRowStyle: "",
          valueStyle: "font-size:12px;",
          unitStyle: "font-size:9px;"
        },
        cpa: {
          captionStyle: "font-size:8px;",
          valueRowStyle: "",
          valueStyle: "font-size:12px;",
          unitStyle: "font-size:9px;"
        },
        tcpa: {
          captionStyle: "font-size:8px;",
          valueRowStyle: "",
          valueStyle: "font-size:12px;",
          unitStyle: "font-size:9px;"
        },
        brg: {
          captionStyle: "font-size:8px;",
          valueRowStyle: "",
          valueStyle: "font-size:12px;",
          unitStyle: "font-size:9px;"
        }
      },
      overrides && overrides.metrics ? overrides.metrics : {}
    );
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

  it("escapes model text and applies inline styles from fit payload", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        nameText: '<img src=x onerror="1">',
        frontText: '"Front"',
        metrics: {
          dst: { captionText: "<DST>", valueText: "<4.2>", unitText: "<nm>" },
          cpa: { captionText: "<DCPA>", valueText: "<0.7>", unitText: "<nm>" },
          tcpa: {
            captionText: "<TCPA>",
            valueText: "<0.5>",
            unitText: "<min>"
          },
          brg: { captionText: "<BRG>", valueText: "<112>", unitText: "<°>" }
        }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;padding:4px 4px 4px 21px;"');
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
});
