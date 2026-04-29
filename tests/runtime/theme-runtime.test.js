const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/theme-runtime.js", function () {
  function setupContext(overrides) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    }, overrides || {}));
    runIifeScript("runtime/theme-runtime.js", context);
    return context;
  }

  it("configures ThemeResolver with normalized preset ownership", function () {
    const context = setupContext();
    const themeModel = {
      normalizePresetName: vi.fn(() => "bold"),
      getOutputTokenDefinitions: vi.fn(() => [])
    };
    const themeResolver = {
      configure: vi.fn(),
      resolveForRoot: vi.fn(() => ({}))
    };

    const preset = context.DyniPlugin.runtime._theme.configure({
      ThemeModel: themeModel,
      ThemeResolver: themeResolver,
      activePresetName: " BOLD "
    });

    expect(preset).toBe("bold");
    expect(themeResolver.configure).toHaveBeenCalledTimes(1);
    const args = themeResolver.configure.mock.calls[0][0];
    expect(args.ThemeModel).toBe(themeModel);
    expect(args.getActivePresetName()).toBe("bold");
    const rootEl = {
      closest(selector) {
        return selector === ".nightMode" ? { id: "night" } : null;
      }
    };
    expect(args.getNightModeState(rootEl)).toBe(true);
  });

  it("applies mandatory output vars on every commit call", function () {
    const context = setupContext();
    const themeModel = {
      normalizePresetName: () => "default",
      getOutputTokenDefinitions: () => [
        { path: "surface.fg", outputVar: "--dyni-theme-surface-fg" },
        { path: "surface.bg", outputVar: "--dyni-theme-surface-bg" }
      ]
    };
    const themeResolver = {
      configure: vi.fn(),
      resolveForRoot: vi.fn(() => ({
        surface: {
          fg: "black",
          bg: "white"
        }
      })),
      resolveOutputsForRoot: vi.fn(() => ({
        surface: {
          fg: "black",
          bg: "white"
        }
      }))
    };
    const rootEl = {
      style: {
        setProperty: vi.fn()
      }
    };

    context.DyniPlugin.runtime._theme.configure({
      ThemeModel: themeModel,
      ThemeResolver: themeResolver,
      activePresetName: "default"
    });

    context.DyniPlugin.runtime._theme.applyToRoot(rootEl);
    context.DyniPlugin.runtime._theme.applyToRoot(rootEl);

    expect(themeResolver.resolveOutputsForRoot).toHaveBeenCalledTimes(2);
    expect(rootEl.style.setProperty).toHaveBeenCalledTimes(4);
    expect(rootEl.style.setProperty.mock.calls).toEqual([
      ["--dyni-theme-surface-fg", "black"],
      ["--dyni-theme-surface-bg", "white"],
      ["--dyni-theme-surface-fg", "black"],
      ["--dyni-theme-surface-bg", "white"]
    ]);
  });

  it("keeps startup preset resolution bound to the root CSS preset only", function () {
    const context = setupContext();
    const themeModel = {
      normalizePresetName: vi.fn((presetName) => {
        const normalized = typeof presetName === "string" ? presetName.trim().toLowerCase() : "";
        return normalized === "bold" || normalized === "slim" ? normalized : "default";
      }),
      getOutputTokenDefinitions: vi.fn(() => [])
    };
    const themeResolver = {
      configure: vi.fn(),
      resolveForRoot: vi.fn(() => ({}))
    };
    const rootEl = {};

    context.DyniPlugin.runtime._theme.configure({
      ThemeModel: themeModel,
      ThemeResolver: themeResolver,
      activePresetName: "bold"
    });

    expect(context.DyniPlugin.runtime._theme.resolveStartupPresetName(rootEl, themeModel)).toBe("default");
    expect(themeModel.normalizePresetName).toHaveBeenNthCalledWith(2, null);
  });

  it("falls back to the active preset when the ThemeResolver callback sees no CSS preset", function () {
    const context = setupContext();
    const themeModel = {
      normalizePresetName: vi.fn((presetName) => {
        const normalized = typeof presetName === "string" ? presetName.trim().toLowerCase() : "";
        return normalized === "bold" || normalized === "slim" ? normalized : "default";
      }),
      getOutputTokenDefinitions: vi.fn(() => [])
    };
    const themeResolver = {
      configure: vi.fn(),
      resolveForRoot: vi.fn(() => ({}))
    };
    const rootEl = {};

    context.DyniPlugin.runtime._theme.configure({
      ThemeModel: themeModel,
      ThemeResolver: themeResolver,
      activePresetName: "bold"
    });

    const args = themeResolver.configure.mock.calls[0][0];
    expect(args.getActivePresetName(rootEl)).toBe("bold");
  });

  it("lets the root CSS preset override the active preset in ThemeResolver callbacks", function () {
    const rootEl = {};
    const context = setupContext({
      getComputedStyle(el) {
        return {
          getPropertyValue(name) {
            return el === rootEl && name === "--dyni-theme-preset" ? " slim " : "";
          }
        };
      }
    });
    const themeModel = {
      normalizePresetName: vi.fn((presetName) => {
        const normalized = typeof presetName === "string" ? presetName.trim().toLowerCase() : "";
        return normalized === "bold" || normalized === "slim" ? normalized : "default";
      }),
      getOutputTokenDefinitions: vi.fn(() => [])
    };
    const themeResolver = {
      configure: vi.fn(),
      resolveForRoot: vi.fn(() => ({}))
    };

    context.DyniPlugin.runtime._theme.configure({
      ThemeModel: themeModel,
      ThemeResolver: themeResolver,
      activePresetName: "bold"
    });
    rootEl.__dyniThemePreset = " slim ";

    const args = themeResolver.configure.mock.calls[0][0];
    expect(args.getActivePresetName(rootEl)).toBe("slim");
    expect(context.DyniPlugin.runtime._theme.resolveStartupPresetName(rootEl, themeModel)).toBe("slim");
  });

  it("preloads shadow css text via fetch and reuses cache", async function () {
    const fetch = vi.fn((url) => Promise.resolve({
      ok: true,
      text: () => Promise.resolve("/* " + url + " */")
    }));
    const context = setupContext({ fetch });

    const first = context.DyniPlugin.runtime._theme.preloadShadowCssUrls(["/one.css", "/two.css", "/one.css"]);
    await first;
    await flushPromises();

    const second = context.DyniPlugin.runtime._theme.preloadShadowCssUrls(["/two.css"]);
    await second;
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls).toEqual([["/one.css"], ["/two.css"]]);
    expect(context.DyniPlugin.runtime._theme.hasShadowCssText("/one.css")).toBe(true);
    expect(context.DyniPlugin.runtime._theme.getShadowCssText("/one.css")).toBe("/* /one.css */");
  });

  it("throws when applyToRoot is called before configure", function () {
    const context = setupContext();
    expect(function () {
      context.DyniPlugin.runtime._theme.applyToRoot({ style: { setProperty() {} } });
    }).toThrow("requires prior configure");
  });

  it("resolves startup preset names from the document root CSS boundary", function () {
    const rootEl = {};
    const context = setupContext({
      getComputedStyle(el) {
        return {
          getPropertyValue(name) {
            return el === rootEl && name === "--dyni-theme-preset" ? " bold " : "";
          }
        };
      }
    });
    const themeModel = {
      normalizePresetName: vi.fn((presetName) => {
        const normalized = typeof presetName === "string" ? presetName.trim().toLowerCase() : "";
        return normalized === "bold" ? "bold" : "default";
      }),
      getOutputTokenDefinitions: vi.fn(() => [])
    };

    expect(context.DyniPlugin.runtime._theme.resolveStartupPresetName(rootEl, themeModel)).toBe("bold");
    expect(themeModel.normalizePresetName).toHaveBeenCalledWith("bold");
  });
});
