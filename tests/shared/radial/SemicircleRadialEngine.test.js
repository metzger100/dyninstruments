const {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  makeBaseSpec,
  createRenderHarness,
} = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("resolves theme once and applies tokenized geometry and label metrics from the layout owner", function () {
    const pointerCalls = [];
    const tickCalls = [];
    const labelCalls = [];
    const arcRingCalls = [];
    const buildSectorsCalls = [];
    const themeDefaults = makeThemeDefaults();
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });
    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: { resolveForRoot: resolveTheme },
          text: {
            drawDisconnectOverlay() {},
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing(ctx, cx, cy, rOuter, startDeg, endDeg, opts) {
              arcRingCalls.push(opts);
            },
            drawAnnularSector() {},
            drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
              pointerCalls.push(opts);
            },
            drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
              tickCalls.push(opts);
            },
            drawLabels(ctx, cx, cy, rOuter, opts) {
              labelCalls.push(opts);
            },
          },
        };
      },
    };
    const textLayoutCalls = [];
    const modules = {
      RadialToolkit: gaugeToolkit,
      SemicircleRadialLayout: loadFresh(
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
      ),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText(state, display) {
              textLayoutCalls.push({ state, display });
            },
          };
        },
      },
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale,
    };
    const helpers = makeComponentContext(modules);
    const renderer = loadFresh(
      "shared/widget-kits/radial/SemicircleRadialEngine.js",
    )
      .create({}, helpers)
      .createRenderer({
        ...makeBaseSpec(),
        buildSectors(props, minV, maxV, arc, valueUtils, theme) {
          buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
          return [];
        },
      });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D(),
    });

    renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn",
    });

    const layoutApi = createLayoutModule();
    const insets = layoutApi.computeInsets(480, 110);
    const expectedLayout = layoutApi.computeLayout({
      W: 480,
      H: 110,
      mode: "flat",
      theme: themeDefaults,
      insets: insets,
      responsive: insets.responsive,
    });

    expect(resolveTheme).toHaveBeenCalledTimes(1);
    expect(resolveTheme).toHaveBeenCalledWith(canvas);
    expect(buildSectorsCalls[0].theme).toBe(themeDefaults);
    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    expect(pointerCalls[0].depth).toBe(expectedLayout.geom.pointerDepth);
    expect(pointerCalls[0].halfWidth).toBe(
      Math.max(1, Math.floor(expectedLayout.geom.pointerSide / 2)),
    );
    expect(arcRingCalls[0].lineWidth).toBe(expectedLayout.geom.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: expectedLayout.geom.majorTickLen,
      width: expectedLayout.geom.majorTickWidth,
    });
    expect(tickCalls[0].minor).toEqual({
      len: expectedLayout.geom.minorTickLen,
      width: expectedLayout.geom.minorTickWidth,
    });
    expect(labelCalls[0].radiusOffset).toBe(expectedLayout.labels.radiusOffset);
    expect(labelCalls[0].fontPx).toBe(expectedLayout.labels.fontPx);
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);
    expect(textLayoutCalls).toHaveLength(1);
    expect(textLayoutCalls[0].state.layout.mode).toBe("flat");
  });

});
