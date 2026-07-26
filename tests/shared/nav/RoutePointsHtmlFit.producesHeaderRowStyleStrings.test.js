// @ts-check
const { buildModel, createHarness, expectStyleFormat, extractPx } = require("./RoutePointsHtmlFit-setup");

describe("RoutePointsHtmlFit", function () {
  it("produces header and row style strings", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel(),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(out).not.toBeNull();
    expect(out.headerFit).not.toBeNull();
    expectStyleFormat(out.headerFit.routeNameStyle);
    expectStyleFormat(out.headerFit.metaStyle);
    expect(out.emptyStyle).toBe("");
    expect(out.rowFits).toHaveLength(2);
    out.rowFits.forEach((/** @type {any} */ row) => {
      expectStyleFormat(row.ordinalStyle);
      expectStyleFormat(row.nameStyle);
      expectStyleFormat(row.infoStyle);
    });
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
  });

  it("returns null when shellRect or targetEl is missing", function () {
    const h = createHarness();
    const model = buildModel();

    expect(
      h.fit.compute({
        model: model,
        hostContext: h.hostContext,
        targetEl: h.targetEl
      })
    ).toBeNull();

    expect(
      h.fit.compute({
        model: model,
        hostContext: h.hostContext,
        shellRect: { width: 240, height: 160 }
      })
    ).toBeNull();
  });

  it("returns null headerFit when showHeader is false", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({ showHeader: false }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 280, height: 180 }
    });

    expect(out.headerFit).toBeNull();
    expect(out.rowFits).toHaveLength(2);
  });

  it("reflects mode-specific box proportions in fitted row text sizes", function () {
    const h = createHarness();
    const row = [{ ordinalText: "1", nameText: "A", infoText: "B" }];
    const high = h.fit.compute({
      model: buildModel({ mode: "high", points: row }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });
    const normal = h.fit.compute({
      model: buildModel({ mode: "normal", points: row }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(extractPx(high.rowFits[0].nameStyle)).toBeLessThan(extractPx(normal.rowFits[0].nameStyle));
  });

  it("keeps name/info text fitting active when compact high rows hide ordinal", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        mode: "high",
        points: [{ ordinalText: "1", nameText: "Alpha", infoText: "089°/12.3nm" }]
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 240, height: 360 }
    });

    expect(out.rowFits).toHaveLength(1);
    expect(out.rowFits[0].ordinalStyle).toBe("");
    expectStyleFormat(out.rowFits[0].nameStyle);
    expectStyleFormat(out.rowFits[0].infoStyle);
  });
});
