const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsMarkup", function () {
  function createMarkup() {
    const moduleCache = Object.create(null);
    const Helpers = {
      getModule(id) {
        if (!moduleCache[id]) {
          if (id === "StateScreenMarkup") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenMarkup.js");
          }
          else if (id === "StateScreenTextFit") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenTextFit.js");
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
    return loadFresh("shared/widget-kits/nav/RoutePointsMarkup.js").create({}, Helpers);
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
      showHeader: true,
      hasRoute: true,
      routeNameText: "Harbor Run",
      metaText: "2 waypoints",
      canActivateRoutePoint: true,
      isActiveRoute: true,
      showOrdinal: true,
      points: [
        { index: 0, ordinalText: "1", nameText: "Start", infoText: "--°/--nm", selected: false },
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
      emptyStyle: "",
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
    expect(html).toContain('data-dyni-action="route-points-activate"');
    expect(html).toContain('data-rp-idx="0"');
    expect(html).toContain('data-rp-idx="1"');
    expect(html).toContain('data-rp-row="1"');
    expect(html).toContain("dyni-route-points-row-selected");
    expect(html).toContain("dyni-route-points-marker-selected");
    expect(html).toContain("dyni-route-points-ordinal");
  });

  it("renders lat/lon rows with coordinatesTabular enabled", function () {
    const markup = createMarkup();
    const model = makeModel({
      showLatLon: true,
      points: [
        { index: 0, ordinalText: "1", nameText: "Start", infoText: "54.102 N / 10.400 E", selected: false },
        { index: 1, ordinalText: "2", nameText: "Finish", infoText: "081°/01.2nm", selected: true }
      ]
    });
    const fit = makeFit({
      rowFits: [
        { ordinalStyle: "font-size:8px;", nameStyle: "font-size:10px;", infoStyle: "font-size:8px;", infoText: "54.102 N / 10.400 E" },
        { ordinalStyle: "font-size:8px;", nameStyle: "font-size:10px;", infoStyle: "font-size:8px;", infoText: "081°/01.2nm" }
      ]
    });
    const html = markup.render({
      model: model,
      fit: fit,
      coordinatesTabular: true,
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("081°/01.2nm");
    expect(html).toContain("dyni-route-points-info-text dyni-tabular");
  });

  it("renders fit-selected fallback text for stableDigits course-distance rows", function () {
    const markup = createMarkup();
    const model = makeModel({
      showLatLon: false,
      stableDigitsEnabled: true,
      points: [
        {
          index: 0,
          ordinalText: "1",
          nameText: "Finish",
          infoText: "00360°/00012.3nm",
          infoFallbackText: "360°/12.3nm",
          selected: true
        }
      ],
      inlineGeometry: Object.assign({}, makeModel().inlineGeometry, {
        rows: [makeModel().inlineGeometry.rows[0]]
      })
    });
    const fit = makeFit({
      rowFits: [
        {
          ordinalStyle: "font-size:8px;",
          nameStyle: "font-size:10px;",
          infoStyle: "font-size:8px;",
          infoText: "360°/12.3nm"
        }
      ]
    });
    const html = markup.render({
      model: model,
      fit: fit,
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("360°/12.3nm");
    expect(html).not.toContain("00360°/00012.3nm");
    expect(html).toContain("dyni-route-points-info-text dyni-tabular");
  });

  it("renders passive mode without click handlers", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        interactionState: "passive",
        canActivateRoutePoint: false,
        isActiveRoute: false
      }),
      fit: makeFit(),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-route-points-passive");
    expect(html).toContain('data-dyni-action="route-points-activate"');
    expect(html).toContain('data-rp-idx="0"');
    expect(html).toContain('data-rp-idx="1"');
  });

  it("does not render ordinal cell markup when compact row policy disables it", function () {
    const markup = createMarkup();
    const compactGeometry = makeModel().inlineGeometry.rows.map((row) =>
      Object.assign({}, row, { ordinalStyle: "" })
    );
    const html = markup.render({
      model: makeModel({
        mode: "high",
        showOrdinal: false,
        inlineGeometry: Object.assign({}, makeModel().inlineGeometry, { rows: compactGeometry })
      }),
      fit: makeFit({
        rowFits: makeFit().rowFits.map((row) => Object.assign({}, row, { ordinalStyle: "" }))
      }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).not.toContain("dyni-route-points-ordinal");
    expect(html).toContain("dyni-route-points-name");
    expect(html).toContain("dyni-route-points-info");
    expect(html).toContain("dyni-route-points-marker-cell");
  });

  it("renders no-route state through shared state-screen markup", function () {
    const markup = createMarkup();
    const html = markup.render({
      model: makeModel({
        kind: "noRoute",
        stateLabel: "No Route",
        interactionState: "passive",
        hasRoute: false,
        points: [],
        showHeader: true
      }),
      fit: makeFit({ rowFits: [], emptyStyle: "font-size:12px;" }),
      htmlUtils: createHtmlUtils()
    });

    expect(html).toContain("dyni-route-points-html");
    expect(html).toContain("dyni-state-no-route");
    expect(html).toContain("dyni-state-screen-body");
    expect(html).toContain("No Route");
    expect(html).not.toContain("dyni-route-points-header");
    expect(html).not.toContain("dyni-route-points-row");
    expect(html).not.toContain("dyni-route-points-list");
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

  it("adds tabular class on row info text when lat/lon mode and coordinatesTabular are enabled", function () {
    const markup = createMarkup();
    const htmlTabular = markup.render({
      model: makeModel({ showLatLon: true }),
      fit: makeFit(),
      coordinatesTabular: true,
      htmlUtils: createHtmlUtils()
    });
    const htmlNonTabular = markup.render({
      model: makeModel({ showLatLon: true }),
      fit: makeFit(),
      coordinatesTabular: false,
      htmlUtils: createHtmlUtils()
    });

    expect(htmlTabular).toContain("dyni-route-points-info-text dyni-tabular");
    expect(htmlNonTabular).not.toContain("dyni-route-points-info-text dyni-tabular");
  });
});
