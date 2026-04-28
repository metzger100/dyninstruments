const { loadFresh } = require("../../helpers/load-umd");

describe("ThemeModel", function () {
  it("exports direct module API with canonical preset metadata", function () {
    const model = loadFresh("shared/theme/ThemeModel.js");

    expect(model.id).toBe("ThemeModel");
    expect(typeof model.create).toBe("undefined");
    expect(model.DEFAULT_PRESET_NAME).toBe("default");
    expect(model.getSupportedPresetNames().sort()).toEqual(["bold", "default", "highcontrast", "slim"]);
    expect(model.normalizePresetName(" BOLD ")).toBe("bold");
    expect(model.normalizePresetName("night")).toBe("default");
    expect(model.normalizePresetName("missing")).toBe("default");
  });

  it("exposes baseline token metadata including surface/bg/border and output vars", function () {
    const model = loadFresh("shared/theme/ThemeModel.js");
    const surfaceBorder = model.getTokenDefinition("surface.border");
    const surfaceBg = model.getTokenDefinition("surface.bg");
    const fontFamily = model.getTokenDefinition("font.family");
    const fontFamilyMono = model.getTokenDefinition("font.familyMono");
    const strokeWeight = model.getTokenDefinition("strokeWeight");
    const pointerDepthWeight = model.getTokenDefinition("pointerDepthWeight");
    const pointerSideWeight = model.getTokenDefinition("pointerSideWeight");
    const radialMajorLen = model.getTokenDefinition("radial.ticks.majorLenFactor");
    const linearPointerDepth = model.getTokenDefinition("linear.pointer.depthFactor");
    const alarmWidgetBg = model.getTokenDefinition("colors.alarmWidget.bg");
    const alarmWidgetFg = model.getTokenDefinition("colors.alarmWidget.fg");
    const alarmWidgetStrip = model.getTokenDefinition("colors.alarmWidget.strip");

    expect(surfaceBorder.inputVar).toBe("--dyni-border");
    expect(surfaceBorder.outputVar).toBe("--dyni-theme-surface-border");
    expect(surfaceBg.inputVar).toBe("--dyni-bg");
    expect(surfaceBg.outputVar).toBe("--dyni-theme-surface-bg");
    expect(fontFamily.outputVar).toBe("--dyni-theme-font-family");
    expect(fontFamily.default.startsWith('"Roboto"')).toBe(true);
    expect(fontFamilyMono.inputVar).toBe("--dyni-font-mono");
    expect(fontFamilyMono.outputVar).toBe("--dyni-theme-font-family-mono");
    expect(fontFamilyMono.default).toBe('"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace');
    expect(strokeWeight.inputVar).toBe("--dyni-stroke-weight");
    expect(strokeWeight.default).toBe(1);
    expect(pointerDepthWeight.inputVar).toBe("--dyni-pointer-depth-weight");
    expect(pointerDepthWeight.default).toBe(1);
    expect(pointerSideWeight.inputVar).toBe("--dyni-pointer-side-weight");
    expect(pointerSideWeight.default).toBe(1);
    expect(radialMajorLen.inputVar).toBe("--dyni-radial-tick-major-len-factor");
    expect(radialMajorLen.default).toBe(0.087);
    [
      "radial.ticks.majorLen",
      "radial.ticks.majorWidth",
      "radial.ticks.minorLen",
      "radial.ticks.minorWidth",
      "radial.ring.arcLineWidth",
      "radial.pointer.widthFactor",
      "radial.pointer.lengthFactor",
      "linear.track.lineWidth",
      "linear.ticks.majorLen",
      "linear.ticks.majorWidth",
      "linear.ticks.minorLen",
      "linear.ticks.minorWidth",
      "linear.pointer.widthFactor",
      "linear.pointer.lengthFactor",
      "xte.lineWidthFactor",
      "xte.boatSizeFactor"
    ].forEach(function (path) {
      expect(model.getTokenDefinition(path)).toBe(null);
    });
    expect(model.getTokenDefinition("radial.ticks.majorWidthFactor").inputVar).toBe("--dyni-radial-tick-major-width-factor");
    expect(model.getTokenDefinition("radial.ticks.minorLenFactor").inputVar).toBe("--dyni-radial-tick-minor-len-factor");
    expect(model.getTokenDefinition("radial.ticks.minorWidthFactor").inputVar).toBe("--dyni-radial-tick-minor-width-factor");
    expect(model.getTokenDefinition("radial.pointer.sideFactor").inputVar).toBe("--dyni-radial-pointer-side-factor");
    expect(model.getTokenDefinition("radial.pointer.depthFactor").inputVar).toBe("--dyni-radial-pointer-depth-factor");
    expect(model.getTokenDefinition("radial.ring.arcLineWidthFactor").inputVar).toBe("--dyni-radial-arc-linewidth-factor");
    expect(model.getTokenDefinition("linear.track.widthFactor").inputVar).toBe("--dyni-linear-track-width");
    expect(model.getTokenDefinition("linear.track.lineWidthFactor").inputVar).toBe("--dyni-linear-track-linewidth-factor");
    expect(linearPointerDepth.inputVar).toBe("--dyni-linear-pointer-depth-factor");
    expect(linearPointerDepth.default).toBe(0.24);
    expect(model.getTokenDefinition("linear.ticks.majorLenFactor").inputVar).toBe("--dyni-linear-tick-major-len-factor");
    expect(model.getTokenDefinition("linear.ticks.majorWidthFactor").inputVar).toBe("--dyni-linear-tick-major-width-factor");
    expect(model.getTokenDefinition("linear.ticks.minorLenFactor").inputVar).toBe("--dyni-linear-tick-minor-len-factor");
    expect(model.getTokenDefinition("linear.ticks.minorWidthFactor").inputVar).toBe("--dyni-linear-tick-minor-width-factor");
    expect(model.getTokenDefinition("linear.pointer.sideFactor").inputVar).toBe("--dyni-linear-pointer-side-factor");
    expect(model.getTokenDefinition("xte.lineWidthFactor")).toBe(null);
    expect(model.getTokenDefinition("xte.boatSizeFactor")).toBe(null);
    expect(alarmWidgetBg.inputVar).toBe("--dyni-alarm-widget-bg");
    expect(alarmWidgetBg.default).toBe("#e04040");
    expect(alarmWidgetFg.inputVar).toBe("--dyni-alarm-widget-fg");
    expect(alarmWidgetFg.default).toBe("#ffffff");
    expect(alarmWidgetStrip.inputVar).toBe("--dyni-alarm-widget-strip");
    expect(alarmWidgetStrip.default).toBe("#66b8ff");
    expect(model.getTokenDefinitions().some((tokenDef) => tokenDef.path === "font.familyMono")).toBe(true);
    expect(model.getOutputTokenDefinitions()).toHaveLength(7);
  });

  it("contains expected preset override spot values", function () {
    const model = loadFresh("shared/theme/ThemeModel.js");

    expect(Object.keys(model.getPresetBase("slim")).sort()).toEqual(["font", "pointerDepthWeight", "pointerSideWeight", "strokeWeight"]);
    expect(Object.keys(model.getPresetBase("bold")).sort()).toEqual(["pointerDepthWeight", "pointerSideWeight", "strokeWeight"]);
    expect(Object.keys(model.getPresetBase("highcontrast")).sort()).toEqual(["colors", "pointerDepthWeight", "pointerSideWeight", "strokeWeight"]);
    expect(model.getPresetBase("slim").strokeWeight).toBe(0.67);
    expect(model.getPresetBase("slim").pointerDepthWeight).toBe(1);
    expect(model.getPresetBase("slim").pointerSideWeight).toBe(0.72);
    expect(model.getPresetBase("slim").font.labelWeight).toBe(400);
    expect(model.getPresetBase("slim").radial).toBeUndefined();
    expect(model.getPresetBase("slim").linear).toBeUndefined();
    expect(model.getPresetBase("bold").strokeWeight).toBe(1.4);
    expect(model.getPresetBase("bold").pointerDepthWeight).toBe(1);
    expect(model.getPresetBase("bold").pointerSideWeight).toBe(1.54);
    expect(model.getPresetBase("bold").radial).toBeUndefined();
    expect(model.getPresetBase("bold").linear).toBeUndefined();
    expect(model.getPresetBase("highcontrast").strokeWeight).toBe(1.35);
    expect(model.getPresetBase("highcontrast").pointerDepthWeight).toBe(1);
    expect(model.getPresetBase("highcontrast").pointerSideWeight).toBe(1.4);
    expect(model.getPresetBase("highcontrast").colors.warning).toBe("#ffcc00");
    expect(model.getPresetBase("highcontrast").colors.alarmWidget).toEqual({
      bg: "#ff2200",
      fg: "#ffffff",
      strip: "#3399ff"
    });
    expect(model.getPresetMode("default", "night").surface.fg).toBe("rgba(252, 11, 11, 0.60)");
    expect(model.getPresetMode("default", "night").colors.alarmWidget.strip).toBe("#66b8ff");
    expect(model.getPresetMode("slim", "night")).toEqual({});
  });

  it("publishes merge-order metadata and mode defaults", function () {
    const model = loadFresh("shared/theme/ThemeModel.js");
    const mergeOrder = model.getMergeOrder();

    expect(mergeOrder).toEqual([
      "rootInputOverride",
      "presetModeOverride",
      "presetBaseOverride",
      "globalModeDefault",
      "globalBaseDefault"
    ]);
    expect(model.MODE_DEFAULTS.night.surface.border).toBe("rgba(252, 11, 11, 0.18)");
    expect(model.BASE_DEFAULTS.surface.bg).toBe("white");
    expect(model.BASE_DEFAULTS.strokeWeight).toBe(1);
    expect(model.BASE_DEFAULTS.pointerDepthWeight).toBe(1);
    expect(model.BASE_DEFAULTS.pointerSideWeight).toBe(1);
  });
});
