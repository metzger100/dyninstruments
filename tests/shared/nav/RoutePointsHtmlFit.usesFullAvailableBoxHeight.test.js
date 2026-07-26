// @ts-check
const { buildModel, createHarness, expectStyleFormat, extractPx } = require("./RoutePointsHtmlFit-setup");

describe("RoutePointsHtmlFit", function () {
  it("uses full available box height for short text that already fits", function () {
    const h = createHarness();
    const model = buildModel({
      mode: "normal",
      points: [{ ordinalText: "1", nameText: "A", infoText: "B" }]
    });
    const shellRect = { width: 300, height: 180 };
    const fitOut = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: shellRect
    });
    const insets = h.layout.computeInsets(shellRect.width, shellRect.height);
    const contentRect = h.layout.createContentRect(shellRect.width, shellRect.height, insets);
    const layoutOut = h.layout.computeLayout({
      contentRect: contentRect,
      mode: model.mode,
      ratioThresholdNormal: model.ratioThresholdNormal,
      ratioThresholdFlat: model.ratioThresholdFlat,
      showHeader: model.showHeader,
      pointCount: model.points.length,
      responsive: insets.responsive
    });

    expect(extractPx(fitOut.rowFits[0].nameStyle)).toBe(layoutOut.rows[0].nameRect.h);
  });

  it("keeps source text unchanged and emits style-only output for no-trim regression coverage", function () {
    const h = createHarness();
    const longRouteName = "Route Name That Should Never Be Trimmed By Fit Logic";
    const longMeta = "1234567890 waypoints long suffix text stays intact";
    const longName = "Waypoint With A Very Long Name That Must Stay Unchanged";
    const longInfo = "012.34°/98765.4321nm long info text that should remain intact";
    const model = buildModel({
      routeNameText: longRouteName,
      metaText: longMeta,
      points: [{ ordinalText: "1", nameText: longName, infoText: longInfo }]
    });
    const before = JSON.parse(JSON.stringify(model));
    const out = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 260, height: 170 }
    });

    expect(model).toEqual(before);
    expect(out).not.toBeNull();
    expectStyleFormat(out.headerFit.routeNameStyle);
    expectStyleFormat(out.headerFit.metaStyle);
    expectStyleFormat(out.rowFits[0].ordinalStyle);
    expectStyleFormat(out.rowFits[0].nameStyle);
    expectStyleFormat(out.rowFits[0].infoStyle);
    expect(out.rowFits[0].infoText).toBe(longInfo);
    expect(JSON.stringify(out)).not.toContain(longRouteName);
    expect(JSON.stringify(out)).not.toContain(longMeta);
    expect(JSON.stringify(out)).not.toContain(longName);
  });

  it("uses mono family for course/distance info when stableDigits is enabled", function () {
    const h = createHarness();
    const shellRect = { width: 300, height: 180 };

    h.fit.compute({
      model: buildModel({
        points: [{ ordinalText: "1", nameText: "Start", infoText: "09°/1.2nm" }],
        stableDigitsEnabled: true
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: shellRect
    });

    const infoCall = h.radialTextApi.fitSingleTextPx.mock.calls.find((args) => args[1] === "09°/1.2nm");
    expect(infoCall).toBeDefined();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(infoCall[5]).toBe("monospace");
  });
});
