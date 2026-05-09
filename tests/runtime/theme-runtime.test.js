const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/theme-runtime.js", function () {
  function setupContext(overrides) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        runtime: {
          dom: {
            getNightModeState() {
              return false;
            }
          }
        },
        state: {},
        config: { shared: {}, clusters: [] }
      }
    }, overrides || {}));

    runIifeScript("runtime/namespace.js", context);
    context.DyniPlugin.runtime.dom = context.DyniPlugin.runtime.dom || {
      getNightModeState() {
        return false;
      }
    };
    runIifeScript("runtime/theme/model.js", context);
    runIifeScript("runtime/theme/resolver.js", context);
    runIifeScript("runtime/theme-runtime.js", context);
    return context;
  }

  it("configures runtime.theme and applies output vars", function () {
    const context = setupContext();
    const rootEl = {
      nodeType: 1,
      className: "widget dyniplugin",
      classList: {
        contains(name) {
          return name === "widget" || name === "dyniplugin";
        }
      },
      closest() {
        return null;
      },
      style: {
        getPropertyValue() {
          return "";
        },
        setProperty: vi.fn()
      }
    };

    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });
    const resolved = context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(resolved).toBeTruthy();
    expect(rootEl.style.setProperty).toHaveBeenCalled();
  });

  it("resolves startup preset from document root css var", function () {
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

    expect(context.DyniPlugin.runtime.theme.resolveStartupPresetName(rootEl)).toBe("bold");
  });

  it("falls back to default startup preset when css var missing", function () {
    const rootEl = {};
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });

    expect(context.DyniPlugin.runtime.theme.resolveStartupPresetName(rootEl)).toBe("default");
  });

  it("preloads shadow css and reuses cache", async function () {
    const fetch = vi.fn((url) => Promise.resolve({
      ok: true,
      text: () => Promise.resolve("/* " + url + " */")
    }));
    const context = setupContext({ fetch });

    await context.DyniPlugin.runtime.theme.preloadShadowCssUrls(["/one.css", "/two.css", "/one.css"]);
    await flushPromises();
    await context.DyniPlugin.runtime.theme.preloadShadowCssUrls(["/two.css"]);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(context.DyniPlugin.runtime.theme.hasShadowCssText("/one.css")).toBe(true);
    expect(context.DyniPlugin.runtime.theme.getShadowCssText("/one.css")).toBe("/* /one.css */");
  });

  it("throws when applyToRoot is called before configure", function () {
    const context = setupContext();
    expect(function () {
      context.DyniPlugin.runtime.theme.applyToRoot({ style: { setProperty() {} } });
    }).toThrow("requires prior configure");
  });
});
