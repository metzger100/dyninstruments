const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteMarkup", function () {
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
    return loadFresh("shared/widget-kits/nav/EditRouteMarkup.js").create({}, Helpers);
  }

  function createHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  function makeModel(overrides) {
    return Object.assign({
      mode: "normal",
      kind: "data",
      stateLabel: "",
      interactionState: "dispatch",
      hasRoute: true,
      isActiveRoute: true,
      isLocalRoute: true,
      canOpenEditRoute: true,
      captureClicks: true,
      nameText: "Harbor Run",
      sourceBadgeText: "LOCAL",
      wrapperStyle: "height:auto;aspect-ratio:7/8;min-height:8em;",
      metricVisibility: { pts: true, dst: true, rte: true, eta: true },
      visibleMetricIds: ["pts", "dst", "rte", "eta"],
      metrics: {
        pts: { labelText: "PTS:", valueText: "005", unitText: "", hasUnit: false },
        dst: { labelText: "DST:", valueText: "12.3", unitText: "nm", hasUnit: true },
        rte: { labelText: "RTE:", valueText: "3.9", unitText: "nm", hasUnit: true },
        eta: { labelText: "ETA:", valueText: "12:34", unitText: "", hasUnit: false }
      }
    }, overrides || {});
  }

  function makeFit(overrides) {
    return Object.assign({
      nameTextStyle: "font-size:13px;",
      sourceBadgeStyle: "font-size:10px;",
      metrics: {
        pts: { labelStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "" },
        dst: { labelStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        rte: { labelStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "font-size:9px;" },
        eta: { labelStyle: "font-size:8px;", valueRowStyle: "", valueStyle: "font-size:12px;", unitStyle: "" }
      }
    }, overrides || {});
  }

  it("renders dispatch-mode wrapper classes, click ownership, and ordered metric boxes", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-html");
    expect(html).toContain("dyni-edit-route-mode-normal");
    expect(html).toContain("dyni-edit-route-active-route");
    expect(html).toContain("dyni-edit-route-local-route");
    expect(html).toContain("dyni-edit-route-open-dispatch");
    expect(html).toContain('data-dyni-action="edit-route-open"');
    expect(html).toContain('class="dyni-edit-route-open-hotspot"');

    const ptsIndex = html.indexOf("dyni-edit-route-metric-pts");
    const dstIndex = html.indexOf("dyni-edit-route-metric-dst");
    const rteIndex = html.indexOf("dyni-edit-route-metric-rte");
    const etaIndex = html.indexOf("dyni-edit-route-metric-eta");
    expect(ptsIndex).toBeGreaterThan(-1);
    expect(dstIndex).toBeGreaterThan(ptsIndex);
    expect(rteIndex).toBeGreaterThan(dstIndex);
    expect(etaIndex).toBeGreaterThan(rteIndex);
    expect(html).toContain("dyni-edit-route-metric-unit");
    expect(html).toContain(">nm</span>");
    const ptsSlice = html.slice(
      html.indexOf("dyni-edit-route-metric-pts"),
      html.indexOf("dyni-edit-route-metric-dst")
    );
    const etaSlice = html.slice(html.indexOf("dyni-edit-route-metric-eta"));
    expect(ptsSlice).not.toContain("dyni-edit-route-metric-unit");
    expect(etaSlice).not.toContain("dyni-edit-route-metric-unit");
  });

  it("renders passive mode without catchAll/hotspot", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        interactionState: "passive",
        canOpenEditRoute: false,
        captureClicks: false,
        isLocalRoute: false,
        sourceBadgeText: ""
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-open-passive");
    expect(html).toContain('data-dyni-action="edit-route-open"');
    expect(html).not.toContain("dyni-edit-route-open-hotspot");
  });

  it("renders no-route state through shared state-screen markup", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        kind: "noRoute",
        stateLabel: "No Route",
        interactionState: "passive",
        hasRoute: false,
        isLocalRoute: false,
        nameText: "",
        canOpenEditRoute: false,
        captureClicks: false,
        visibleMetricIds: [],
        metricVisibility: { pts: false, dst: false, rte: false, eta: false }
      }),
      fit: makeFit({ sourceBadgeStyle: "", metrics: {} }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-state-no-route");
    expect(html).toContain("No Route");
    expect(html).toContain("dyni-state-screen-body");
    expect(html).not.toContain("dyni-edit-route-open-hotspot");
    expect(html).not.toContain("dyni-edit-route-metrics");
  });

  it("renders all 4 metrics in flat mode and keeps unit nodes only for DST/RTE", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        mode: "flat",
        flatMetricRows: 1,
        metricsStyle: "grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(1,minmax(0,1fr));gap:3px;",
        visibleMetricIds: ["pts", "dst", "rte", "eta"],
        metricVisibility: { pts: true, dst: true, rte: true, eta: true }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-mode-flat");
    expect(html).toContain("dyni-edit-route-flat-rows-1");
    expect(html).toContain("dyni-edit-route-metric-pts");
    expect(html).toContain("dyni-edit-route-metric-dst");
    expect(html).toContain("dyni-edit-route-metric-rte");
    expect(html).toContain("dyni-edit-route-metric-eta");
    expect(html).toContain("dyni-edit-route-metric-dst");
    expect(html).not.toContain("dyni-edit-route-metric-value-stack");
    expect(html).toContain('class="dyni-edit-route-metrics" style="grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(1,minmax(0,1fr));gap:3px;"');
    expect(html).toContain('class="dyni-edit-route-metric-unit"');
    const ptsSlice = html.slice(
      html.indexOf("dyni-edit-route-metric-pts"),
      html.indexOf("dyni-edit-route-metric-dst")
    );
    const etaSlice = html.slice(html.indexOf("dyni-edit-route-metric-eta"));
    expect(ptsSlice).not.toContain("dyni-edit-route-metric-unit");
    expect(etaSlice).not.toContain("dyni-edit-route-metric-unit");
  });

  it("does not render unit nodes for ETA/PTS in high mode", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({ mode: "high" }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    const ptsSlice = html.slice(
      html.indexOf("dyni-edit-route-metric-pts"),
      html.indexOf("dyni-edit-route-metric-dst")
    );
    const etaSlice = html.slice(html.indexOf("dyni-edit-route-metric-eta"));
    expect(ptsSlice).not.toContain("dyni-edit-route-metric-unit");
    expect(etaSlice).not.toContain("dyni-edit-route-metric-unit");
    expect(html).toContain("dyni-edit-route-metric-dst");
    expect(html).toContain("dyni-edit-route-metric-rte");
    expect(html).toContain(">nm</span>");
  });

  it("uses high-mode row topology and escapes text content", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        mode: "high",
        nameText: '<img src=x onerror="1">',
        sourceBadgeText: '"LOCAL"',
        metrics: {
          pts: { labelText: "<PTS>", valueText: "<5>", unitText: "" },
          dst: { labelText: "<DST>", valueText: "<12>", unitText: "<nm>" },
          rte: { labelText: "<RTE>", valueText: "<3>", unitText: "<nm>" },
          eta: { labelText: "<ETA>", valueText: "<1>", unitText: "" }
        }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-mode-high");
    expect(html).toContain("dyni-edit-route-metric-row dyni-edit-route-metric-pts");
    expect(html).toContain("&lt;img src=x onerror=&quot;1&quot;&gt;");
    expect(html).toContain("&quot;LOCAL&quot;");
    expect(html).toContain("&lt;PTS&gt;");
    expect(html).toContain("&lt;5&gt;");
    expect(html).toContain("&lt;nm&gt;");
    expect(html).not.toContain('<img src=x onerror="1">');
  });

  it("applies wrapper and fit styles inline", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:auto;aspect-ratio:7/8;min-height:8em;"');
    expect(html).toContain('class="dyni-edit-route-name-text" style="font-size:13px;"');
    expect(html).toContain('class="dyni-edit-route-source-badge" style="font-size:10px;"');
    expect(html).toContain('class="dyni-edit-route-metric-label" style="font-size:8px;"');
    expect(html).toContain('class="dyni-edit-route-metric-value-text" style="font-size:12px;"');
    expect(html).toContain('class="dyni-edit-route-metric-unit" style="font-size:9px;"');
  });

  it("renders custom caption and unit overrides", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        metrics: {
          pts: { labelText: "POINTS:", valueText: "005", unitText: "" },
          dst: { labelText: "DIST:", valueText: "12.3", unitText: "km" },
          rte: { labelText: "LEFT:", valueText: "3.9", unitText: "mi" },
          eta: { labelText: "ARRIVE:", valueText: "12:34", unitText: "" }
        }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("POINTS:");
    expect(html).toContain("DIST:");
    expect(html).toContain("LEFT:");
    expect(html).toContain("ARRIVE:");
    expect(html).toContain(">km</span>");
    expect(html).toContain(">mi</span>");
  });
});
