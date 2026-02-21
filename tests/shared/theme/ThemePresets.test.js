const { loadFresh } = require("../../helpers/load-umd");

describe("ThemePresets", function () {
  function createStyleStore() {
    const values = Object.create(null);
    return {
      values,
      setProperty(name, value) {
        values[String(name)] = String(value);
      },
      removeProperty(name) {
        delete values[String(name)];
      },
      getPropertyValue(name) {
        return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : "";
      }
    };
  }

  function createApi() {
    const resolverMod = loadFresh("shared/theme/ThemeResolver.js");
    const presetsMod = loadFresh("shared/theme/ThemePresets.js");
    return {
      resolverMod,
      api: presetsMod.create({}, {
        getModule(id) {
          if (id !== "ThemeResolver") throw new Error("unexpected module: " + id);
          return resolverMod;
        }
      })
    };
  }

  it("exposes all expected preset names and empty default preset", function () {
    const { api } = createApi();
    expect(Object.keys(api.presets).sort()).toEqual(["bold", "default", "highcontrast", "night", "slim"]);
    expect(api.presets.default).toEqual({});
  });

  it("apply sets css variables using ThemeResolver token mapping", function () {
    const { api } = createApi();
    const style = createStyleStore();
    style.setProperty("--dyni-pointer", "#010203");
    style.setProperty("--dyni-arc-linewidth", "9");
    const containerEl = { style };

    api.apply(containerEl, "slim");

    expect(style.getPropertyValue("--dyni-arc-linewidth")).toBe("0.5");
    expect(style.getPropertyValue("--dyni-ring-width")).toBe("0.09");
    expect(style.getPropertyValue("--dyni-tick-major-width")).toBe("1.5");
    expect(style.getPropertyValue("--dyni-label-weight")).toBe("400");
    expect(style.getPropertyValue("--dyni-pointer")).toBe("");
  });

  it("remove clears every known theme css variable", function () {
    const { api, resolverMod } = createApi();
    const style = createStyleStore();
    const containerEl = { style };
    resolverMod.TOKEN_DEFS.forEach(function (tokenDef) {
      style.setProperty(tokenDef.cssVar, "x");
    });

    api.remove(containerEl);

    resolverMod.TOKEN_DEFS.forEach(function (tokenDef) {
      expect(style.getPropertyValue(tokenDef.cssVar)).toBe("");
    });
  });

  it("contains expected spot overrides per preset", function () {
    const { api } = createApi();

    expect(api.presets.slim.ring.arcLineWidth).toBe(0.5);
    expect(api.presets.slim.pointer.sideFactor).toBe(0.18);

    expect(api.presets.bold.ring.widthFactor).toBe(0.16);
    expect(api.presets.bold.pointer.lengthFactor).toBe(2.2);

    expect(api.presets.night.colors.pointer).toBe("#cc2222");
    expect(api.presets.night.colors.laylinePort).toBe("#8b3333");

    expect(api.presets.highcontrast.colors.warning).toBe("#ffcc00");
    expect(api.presets.highcontrast.ticks.minorWidth).toBe(2);
  });
});
