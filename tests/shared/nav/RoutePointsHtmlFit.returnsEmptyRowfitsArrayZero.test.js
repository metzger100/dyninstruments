// @ts-check
const {
  buildModel,
  createHarness,
  expectStyleFormat,
  extractPx,
  resolveEmptyCapRatio
} = require("./RoutePointsHtmlFit-setup");

describe("RoutePointsHtmlFit", function () {
  it("returns an empty rowFits array for zero-point routes", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({ points: [], metaText: "0 waypoints" }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(out.rowFits).toEqual([]);
  });

  it("measures placeholder fit for no-route state with mode-capped max font size", function () {
    const h = createHarness();
    const shellRect = { width: 300, height: 180 };
    const insets = h.layout.computeInsets(shellRect.width, shellRect.height);
    const contentRect = h.layout.createContentRect(shellRect.width, shellRect.height, insets);
    const modes = ["flat", "normal", "high"];

    modes.forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({
          mode: mode,
          hasRoute: false,
          routeNameText: "",
          emptyText: "A",
          points: [],
          metaText: "0 waypoints"
        }),
        hostContext: h.hostContext,
        targetEl: h.targetEl,
        shellRect: shellRect
      });

      expect(out.rowFits).toEqual([]);
      expectStyleFormat(out.emptyStyle);

      const emptyPx = extractPx(out.emptyStyle);
      const capPx = Math.max(1, Math.floor(contentRect.h * resolveEmptyCapRatio(mode)));
      expect(emptyPx).toBeGreaterThan(0);
      expect(emptyPx).toBeLessThanOrEqual(capPx);
    });
  });

  it("scales down font size for long text", function () {
    const h = createHarness();
    const shortOut = h.fit.compute({
      model: buildModel({
        routeNameText: "A",
        points: [{ ordinalText: "1", nameText: "A", infoText: "B" }]
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });
    const longOut = h.fit.compute({
      model: buildModel({
        routeNameText: "Very Long Route Name That Must Scale Down",
        points: [
          {
            ordinalText: "1",
            nameText: "Waypoint Name That Is Intentionally Very Very Long To Trigger Fitting",
            infoText: "095.2°/123.456789nm"
          }
        ]
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(extractPx(longOut.headerFit.routeNameStyle)).toBeLessThan(extractPx(shortOut.headerFit.routeNameStyle));
    expect(extractPx(longOut.rowFits[0].nameStyle)).toBeLessThan(extractPx(shortOut.rowFits[0].nameStyle));
  });
});
