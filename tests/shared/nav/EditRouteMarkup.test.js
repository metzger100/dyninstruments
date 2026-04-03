const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteMarkup", function () {
  function createMarkup() {
    return loadFresh("shared/widget-kits/nav/EditRouteMarkup.js").create();
  }

  function createHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  function makeModel(overrides) {
    return Object.assign({
      mode: "normal",
      hasRoute: true,
      isActiveRoute: true,
      isLocalRoute: true,
      canOpenEditRoute: true,
      captureClicks: true,
      nameText: "Harbor Run",
      sourceBadgeText: "LOCAL",
      wrapperStyle: "height:auto;aspect-ratio:7/8;min-height:8em;",
      metricVisibility: { pts: true, dst: true, rtg: true, eta: true },
      visibleMetricIds: ["pts", "dst", "rtg", "eta"],
      metrics: {
        pts: { labelText: "PTS:", valueText: "005" },
        dst: { labelText: "DST:", valueText: "12.3" },
        rtg: { labelText: "RTG:", valueText: "3.9" },
        eta: { labelText: "ETA:", valueText: "12:34" }
      }
    }, overrides || {});
  }

  function makeFit(overrides) {
    return Object.assign({
      nameTextStyle: "font-size:13px;",
      sourceBadgeStyle: "font-size:10px;",
      metrics: {
        pts: { labelStyle: "font-size:8px;", valueStyle: "font-size:12px;" },
        dst: { labelStyle: "font-size:8px;", valueStyle: "font-size:12px;" },
        rtg: { labelStyle: "font-size:8px;", valueStyle: "font-size:12px;" },
        eta: { labelStyle: "font-size:8px;", valueStyle: "font-size:12px;" }
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
    expect(html).toContain('onclick="catchAll"');
    expect(html).toContain('class="dyni-edit-route-open-hotspot" onclick="editRouteOpen"');

    const ptsIndex = html.indexOf("dyni-edit-route-metric-pts");
    const dstIndex = html.indexOf("dyni-edit-route-metric-dst");
    const rtgIndex = html.indexOf("dyni-edit-route-metric-rtg");
    const etaIndex = html.indexOf("dyni-edit-route-metric-eta");
    expect(ptsIndex).toBeGreaterThan(-1);
    expect(dstIndex).toBeGreaterThan(ptsIndex);
    expect(rtgIndex).toBeGreaterThan(dstIndex);
    expect(etaIndex).toBeGreaterThan(rtgIndex);
  });

  it("renders passive mode without catchAll/hotspot", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({ canOpenEditRoute: false, captureClicks: false, isLocalRoute: false, sourceBadgeText: "" }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-edit-route-open-hotspot");
  });

  it("renders no-route state with name bar only", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        hasRoute: false,
        isLocalRoute: false,
        nameText: "No Route",
        canOpenEditRoute: false,
        captureClicks: false,
        visibleMetricIds: [],
        metricVisibility: { pts: false, dst: false, rtg: false, eta: false }
      }),
      fit: makeFit({ sourceBadgeStyle: "", metrics: {} }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-no-route");
    expect(html).toContain("No Route");
    expect(html).not.toContain("dyni-edit-route-metrics");
    expect(html).not.toContain("dyni-edit-route-metric-pts");
  });

  it("omits RTG/ETA tiles in flat mode", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        mode: "flat",
        visibleMetricIds: ["pts", "dst"],
        metricVisibility: { pts: true, dst: true, rtg: false, eta: false }
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-edit-route-mode-flat");
    expect(html).toContain("dyni-edit-route-metric-pts");
    expect(html).toContain("dyni-edit-route-metric-dst");
    expect(html).not.toContain("dyni-edit-route-metric-rtg");
    expect(html).not.toContain("dyni-edit-route-metric-eta");
  });

  it("uses high-mode row topology and escapes text content", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        mode: "high",
        nameText: '<img src=x onerror="1">',
        sourceBadgeText: '"LOCAL"',
        metrics: {
          pts: { labelText: "<PTS>", valueText: "<5>" },
          dst: { labelText: "<DST>", valueText: "<12>" },
          rtg: { labelText: "<RTG>", valueText: "<3>" },
          eta: { labelText: "<ETA>", valueText: "<1>" }
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
    expect(html).toContain('class="dyni-edit-route-metric-value" style="font-size:12px;"');
  });
});
