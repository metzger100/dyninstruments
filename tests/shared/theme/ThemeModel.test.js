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

    expect(surfaceBorder.inputVar).toBe("--dyni-border");
    expect(surfaceBorder.outputVar).toBe("--dyni-theme-surface-border");
    expect(surfaceBg.inputVar).toBe("--dyni-bg");
    expect(surfaceBg.outputVar).toBe("--dyni-theme-surface-bg");
    expect(fontFamily.outputVar).toBe("--dyni-theme-font-family");
    expect(model.getOutputTokenDefinitions()).toHaveLength(6);
  });

  it("contains expected preset override spot values", function () {
    const model = loadFresh("shared/theme/ThemeModel.js");

    expect(model.getPresetBase("slim").radial.pointer.widthFactor).toBe(0.72);
    expect(model.getPresetBase("bold").linear.pointer.widthFactor).toBe(1.54);
    expect(model.getPresetBase("highcontrast").colors.warning).toBe("#ffcc00");
    expect(model.getPresetMode("default", "night").surface.fg).toBe("rgba(252, 11, 11, 0.60)");
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
  });
});
