const { loadFresh } = require("../../helpers/load-umd");

describe("ThemePresets", function () {
  function createContainer() {
    const attrs = Object.create(null);
    return {
      setAttribute(name, value) {
        attrs[String(name)] = String(value);
      },
      removeAttribute(name) {
        delete attrs[String(name)];
      },
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[String(name)] : null;
      },
      hasAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name);
      }
    };
  }

  function createApi() {
    const presetsMod = loadFresh("shared/theme/ThemePresets.js");
    return {
      mod: presetsMod,
      api: presetsMod.create()
    };
  }

  it("exposes all expected preset names and empty default preset", function () {
    const { mod, api } = createApi();
    expect(mod.PRESETS).toBe(mod.create.PRESETS);
    expect(mod.normalizePresetName).toBe(mod.create.normalizePresetName);
    expect(Object.keys(api.presets).sort()).toEqual(["bold", "default", "highcontrast", "night", "slim"]);
    expect(api.presets.default).toEqual({});
    expect(typeof api.normalizePresetName).toBe("function");
    expect(api.normalizePresetName(" BOLD ")).toBe("bold");
    expect(api.normalizePresetName("missing")).toBe("default");
  });

  it("apply sets data-dyni-theme for non-default presets", function () {
    const { api } = createApi();
    const containerEl = createContainer();

    api.apply(containerEl, "slim");

    expect(containerEl.getAttribute("data-dyni-theme")).toBe("slim");
  });

  it("apply removes attribute for default preset and invalid names", function () {
    const { api } = createApi();
    const containerEl = createContainer();

    api.apply(containerEl, "bold");
    expect(containerEl.getAttribute("data-dyni-theme")).toBe("bold");

    api.apply(containerEl, "default");
    expect(containerEl.hasAttribute("data-dyni-theme")).toBe(false);

    api.apply(containerEl, "UNKNOWN");
    expect(containerEl.hasAttribute("data-dyni-theme")).toBe(false);
  });

  it("remove clears data-dyni-theme attribute", function () {
    const { api } = createApi();
    const containerEl = createContainer();

    api.apply(containerEl, "night");
    expect(containerEl.getAttribute("data-dyni-theme")).toBe("night");
    api.remove(containerEl);
    expect(containerEl.hasAttribute("data-dyni-theme")).toBe(false);
  });

  it("contains expected spot overrides per preset", function () {
    const { api } = createApi();

    expect(api.presets.slim.radial.ring.arcLineWidth).toBe(1);
    expect(api.presets.slim.radial.ticks.majorLen).toBe(9);
    expect(api.presets.slim.radial.pointer.widthFactor).toBe(0.72);
    expect(api.presets.slim.linear.track.widthFactor).toBe(0.12);
    expect(api.presets.slim.linear.ticks.minorWidth).toBe(1);
    expect(api.presets.slim.linear.ticks.minorLen).toBe(5);
    expect(api.presets.slim.xte.lineWidthFactor).toBe(1);

    expect(api.presets.bold.radial.ring.widthFactor).toBe(0.2);
    expect(api.presets.bold.radial.ticks.majorWidth).toBe(4);
    expect(api.presets.bold.radial.pointer.widthFactor).toBe(1.54);
    expect(api.presets.bold.radial.pointer.lengthFactor).toBe(2.2);
    expect(api.presets.bold.linear.track.widthFactor).toBe(0.2);
    expect(api.presets.bold.linear.track.lineWidth).toBe(2.5);
    expect(api.presets.bold.linear.pointer.widthFactor).toBe(1.54);
    expect(api.presets.bold.linear.pointer.lengthFactor).toBe(2.2);
    expect(api.presets.bold.xte.lineWidthFactor).toBe(2);

    expect(api.presets.night.colors.pointer).toBe("#cc2222");
    expect(api.presets.night.colors.laylinePort).toBe("#8b3333");

    expect(api.presets.highcontrast.colors.warning).toBe("#ffcc00");
    expect(api.presets.highcontrast.radial.ticks.minorWidth).toBe(2);
    expect(api.presets.highcontrast.linear.track.lineWidth).toBe(2);
    expect(api.presets.highcontrast.radial.pointer.widthFactor).toBe(1.4);
    expect(api.presets.highcontrast.linear.pointer.widthFactor).toBe(1.4);
    expect(api.presets.highcontrast.xte.lineWidthFactor).toBe(1.3);
  });
});
