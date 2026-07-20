// @ts-nocheck
const {
  readCss,
  escapeRegExp,
  normalizeRuleBody,
  readRuleBody,
  normalizeSelectorList,
  readCombinedRuleBody,
  expectDeclaration,
  createHelpers,
  makePayload,
  createRealAlarmRenderer,
  createAisRendererWithRealLayout,
  mountRenderer,
  readStyleFields,
  createAlarmMeasureContext
} = require("./AlarmTextHtmlWidget.harness.js");

describe("AlarmTextHtmlWidget", function () {
  it("uses the committed HTML widget css contract", function () {
    const css = readCss("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css");

    expect(css).toContain(".dyni-html-root .dyni-alarm-html");
    expect(css).toContain(".dyni-html-root .dyni-alarm-root");
    expect(css).toContain(".dyni-html-root .dyni-alarm-html.dyni-alarm-open-dispatch");
    expect(css).toContain(".dyni-html-root .dyni-alarm-html.dyni-alarm-open-passive");
    expect(css).toContain(".dyni-html-root .dyni-alarm-state-accent");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main-flat");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main-normal");
    expect(css).toContain(".dyni-html-root .dyni-alarm-main-high");
    expect(css).toContain(".dyni-html-root .dyni-alarm-inline-row");
    expect(css).toContain(".dyni-html-root .dyni-alarm-caption-row");
    expect(css).toContain(".dyni-html-root .dyni-alarm-value-row");
    expect(css).toContain("font-weight: var(--dyni-theme-font-label-weight, 700);");
    expect(css).toContain("font-weight: var(--dyni-theme-font-weight, 700);");
    expect(css).toContain("inset: 0 auto 0 0;");
    expect(css).toContain("z-index: 0;");
    expect(css).toContain("gap: 0.16em;");
    expect(css).not.toMatch(/\.dyni-html-root\s+\.dyni-alarm-main-flat[\s\S]*?\{[\s\S]*?width:\s*100%/);
    expect(css).not.toMatch(/\.dyni-html-root\s+\.dyni-alarm-main-flat[\s\S]*?\{[\s\S]*?height:\s*100%/);
    expect(css).not.toContain("text-overflow: ellipsis;");
    expect(css).not.toContain("dyni-alarm-shell");
    expect(css).not.toContain("dyni-alarm-strip");
    expect(css).not.toContain("dyni-alarm-hotspot");
    expect(css).not.toContain("dyni-alarm-body");
    expect(css).not.toContain("dyni-alarm-caption-block");
    expect(css).not.toContain("dyni-alarm-value-block");
  });

  it("keeps AIS shell parity for accent, hotspot, and layering contract", function () {
    const alarmCss = readCss("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css");
    const aisCss = readCss("widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css");

    const alarmShell = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-html");
    const aisShell = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-html");
    expectDeclaration(alarmShell, "position: relative");
    expectDeclaration(alarmShell, "width: 100%");
    expectDeclaration(alarmShell, "height: 100%");
    expectDeclaration(alarmShell, "min-width: 0");
    expectDeclaration(alarmShell, "min-height: 0");
    expectDeclaration(alarmShell, "box-sizing: border-box");
    expectDeclaration(alarmShell, "display: grid");
    expectDeclaration(alarmShell, "color: inherit");
    expectDeclaration(aisShell, "position: relative");
    expectDeclaration(aisShell, "width: 100%");
    expectDeclaration(aisShell, "height: 100%");
    expectDeclaration(aisShell, "min-width: 0");
    expectDeclaration(aisShell, "min-height: 0");
    expectDeclaration(aisShell, "box-sizing: border-box");
    expectDeclaration(aisShell, "display: grid");
    expectDeclaration(aisShell, "color: inherit");

    const alarmAccent = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-state-accent");
    const aisAccent = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-state-accent");
    const alarmHotspot = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-open-hotspot");
    const aisHotspot = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-open-hotspot");
    expect(alarmAccent).toBe(aisAccent);
    expect(alarmHotspot).toBe(aisHotspot);
    expectDeclaration(alarmAccent, "inset: 0 auto 0 0");

    const alarmMain = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main");
    const aisIdentity = readRuleBody(aisCss, ".dyni-html-root .dyni-ais-target-identity");
    expectDeclaration(alarmAccent, "z-index: 0");
    expectDeclaration(alarmMain, "z-index: 1");
    expectDeclaration(alarmHotspot, "z-index: 2");
    expectDeclaration(aisAccent, "z-index: 0");
    expectDeclaration(aisIdentity, "z-index: 1");
    expectDeclaration(aisHotspot, "z-index: 2");
  });

  it("keeps MapZoom inner layout parity for main/rows and typography", function () {
    const alarmCss = readCss("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.css");
    const mapZoomCss = readCss("widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css");
    const alarmMain = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main");
    const mapZoomMain = readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main");
    const alarmMainModes = readCombinedRuleBody(alarmCss, [
      ".dyni-html-root .dyni-alarm-main-flat",
      ".dyni-html-root .dyni-alarm-main-normal",
      ".dyni-html-root .dyni-alarm-main-high"
    ]);
    const mapZoomMainModes = readCombinedRuleBody(mapZoomCss, [
      ".dyni-html-root .dyni-map-zoom-main-flat",
      ".dyni-html-root .dyni-map-zoom-main-normal",
      ".dyni-html-root .dyni-map-zoom-main-high"
    ]);
    const alarmMainModesWithoutPadding = alarmMainModes
      .split(";")
      .filter((entry) => entry !== "padding: 0 0.12em")
      .join(";");

    expect(alarmMainModes).toContain("padding: 0 0.12em");
    expect(alarmMainModesWithoutPadding).toBe(mapZoomMainModes);
    expect(
      readCombinedRuleBody(alarmCss, [
        ".dyni-html-root .dyni-alarm-inline-row",
        ".dyni-html-root .dyni-alarm-caption-row",
        ".dyni-html-root .dyni-alarm-value-row"
      ])
    ).toBe(
      readCombinedRuleBody(mapZoomCss, [
        ".dyni-html-root .dyni-map-zoom-inline-row",
        ".dyni-html-root .dyni-map-zoom-value-row",
        ".dyni-html-root .dyni-map-zoom-caption-row",
        ".dyni-html-root .dyni-map-zoom-unit-row"
      ])
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-flat .dyni-alarm-inline-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-flat .dyni-map-zoom-inline-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-normal .dyni-alarm-value-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-normal .dyni-map-zoom-value-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-normal .dyni-alarm-caption-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-normal .dyni-map-zoom-caption-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-high .dyni-alarm-caption-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-high .dyni-map-zoom-caption-row")
    );
    expect(readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-main-high .dyni-alarm-value-row")).toBe(
      readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-main-high .dyni-map-zoom-value-row")
    );

    const alarmCaption = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-caption");
    const mapZoomCaption = readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-caption");
    const alarmValue = readRuleBody(alarmCss, ".dyni-html-root .dyni-alarm-value");
    const mapZoomValue = readRuleBody(mapZoomCss, ".dyni-html-root .dyni-map-zoom-value");
    expect(alarmCaption).toBe(mapZoomCaption);
    expect(alarmValue).toBe(mapZoomValue);
    expect(alarmCss).not.toContain("text-overflow: ellipsis;");
  });
});
