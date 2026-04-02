const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsMarkup", function () {
  function createMarkup() {
    return loadFresh("shared/widget-kits/nav/RoutePointsMarkup.js").create();
  }

  function createHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  function makeModel(overrides) {
    return Object.assign({
      mode: "normal",
      showHeader: true,
      hasRoute: true,
      routeNameText: "Harbor Run",
      metaText: "2 waypoints",
      canActivateRoutePoint: true,
      isActiveRoute: true,
      points: [
        { index: 0, ordinalText: "1", nameText: "Start", infoText: "---°/---nm", selected: false },
        { index: 1, ordinalText: "2", nameText: "Finish", infoText: "DIR:89°/DST:2:nm", selected: true }
      ],
      inlineGeometry: {
        wrapper: { style: "height:180px;" },
        header: {
          style: "width:100px;height:20px;",
          routeNameStyle: "width:60px;height:20px;",
          metaStyle: "width:40px;height:20px;"
        },
        list: {
          style: "width:100px;height:160px;",
          contentStyle: "min-height:90px;gap:2px;"
        },
        rows: [
          {
            rowStyle: "width:100px;height:40px;",
            ordinalStyle: "width:20px;height:40px;",
            middleStyle: "width:60px;height:40px;",
            nameStyle: "width:30px;height:40px;",
            infoStyle: "width:30px;height:40px;",
            markerStyle: "width:20px;height:40px;",
            markerDotStyle: "width:9px;height:9px;"
          },
          {
            rowStyle: "width:100px;height:40px;",
            ordinalStyle: "width:20px;height:40px;",
            middleStyle: "width:60px;height:40px;",
            nameStyle: "width:30px;height:40px;",
            infoStyle: "width:30px;height:40px;",
            markerStyle: "width:20px;height:40px;",
            markerDotStyle: "width:9px;height:9px;"
          }
        ]
      }
    }, overrides || {});
  }

  function makeFit(overrides) {
    return Object.assign({
      headerFit: {
        routeNameStyle: "font-size:11px;",
        metaStyle: "font-size:9px;"
      },
      rowFits: [
        { ordinalStyle: "font-size:8px;", nameStyle: "font-size:10px;", infoStyle: "font-size:8px;" },
        { ordinalStyle: "font-size:8px;", nameStyle: "font-size:10px;", infoStyle: "font-size:8px;" }
      ]
    }, overrides || {});
  }

  it("renders dispatch-mode wrapper/rows with active-route and selected state classes", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-route-points-html");
    expect(html).toContain("dyni-route-points-mode-normal");
    expect(html).toContain("dyni-route-points-dispatch");
    expect(html).toContain("dyni-route-points-active-route");
    expect(html).toContain('onclick="catchAll"');
    expect(html).toContain('onclick="routePointActivate" data-rp-idx="0"');
    expect(html).toContain('onclick="routePointActivate" data-rp-idx="1"');
    expect(html).toContain('data-rp-row="1"');
    expect(html).toContain("dyni-route-points-row-selected");
    expect(html).toContain("dyni-route-points-marker-selected");
  });

  it("renders passive mode without click handlers", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({ canActivateRoutePoint: false, isActiveRoute: false }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-route-points-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain('onclick="routePointActivate"');
    expect(html).not.toContain("data-rp-idx=");
  });

  it("fails closed for missing route by rendering no header content and no rows", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({ hasRoute: false, points: [], showHeader: true }),
      fit: makeFit({ rowFits: [] }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-route-points-html");
    expect(html).not.toContain("dyni-route-points-header");
    expect(html).not.toContain("dyni-route-points-row");
  });

  it("escapes all route/header/row text", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        routeNameText: '<img src=x onerror=1>',
        metaText: '"meta"',
        points: [
          {
            index: 0,
            ordinalText: "1",
            nameText: "<b>unsafe</b>",
            infoText: "'quoted'",
            selected: false
          }
        ],
        inlineGeometry: Object.assign({}, makeModel().inlineGeometry, {
          rows: [makeModel().inlineGeometry.rows[0]]
        })
      }),
      fit: makeFit({ rowFits: [makeFit().rowFits[0]] }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("&lt;img src=x onerror=1&gt;");
    expect(html).toContain("&quot;meta&quot;");
    expect(html).toContain("&lt;b&gt;unsafe&lt;/b&gt;");
    expect(html).toContain("&#39;quoted&#39;");
    expect(html).not.toContain("<img src=x onerror=1>");
    expect(html).not.toContain("<b>unsafe</b>");
  });

  it("applies layout geometry and fit styles inline", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel(),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain('style="height:180px;"');
    expect(html).toContain('style="width:100px;height:20px;"');
    expect(html).toContain('style="width:100px;height:160px;"');
    expect(html).toContain('style="min-height:90px;gap:2px;"');
    expect(html).toContain('style="font-size:11px;"');
    expect(html).toContain('style="font-size:10px;"');
    expect(html).toContain('style="width:9px;height:9px;"');
  });
});
