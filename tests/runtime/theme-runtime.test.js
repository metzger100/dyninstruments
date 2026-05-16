const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");
const hasOwn = Object.prototype.hasOwnProperty;

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

  function createPluginRootElement() {
    return {
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
  }

  function getAppliedOutput(rootEl, outputVar) {
    const calls = rootEl.style.setProperty.mock.calls;
    for (let i = 0; i < calls.length; i += 1) {
      if (calls[i][0] === outputVar) {
        return calls[i][1];
      }
    }
    return undefined;
  }

  it("configures runtime.theme and applies output vars", function () {
    const context = setupContext();
    expect(context.DyniPlugin.runtime.theme.tokens).toBeTruthy();
    expect(typeof context.DyniPlugin.runtime.theme.tokens.resolveForRoot).toBe("function");
    expect(context.DyniPlugin.runtime.theme.resolveForRoot).toBeUndefined();
    expect(context.DyniPlugin.runtime.theme.fetchShadowCssText).toBeUndefined();
    const rootEl = createPluginRootElement();

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

  it("derives day border from resolved foreground when border input is absent", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(resolved.surface.fg).toBe("black");
    expect(resolved.surface.border).toBe("black");
    expect(getAppliedOutput(rootEl, "--dyni-theme-surface-border")).toBe("black");
  });

  it("derives night border from resolved foreground when border input is absent", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(resolved.surface.fg).toBe("rgba(252, 11, 11, 0.60)");
    expect(resolved.surface.border).toBe("rgba(252, 11, 11, 0.60)");
    expect(getAppliedOutput(rootEl, "--dyni-theme-surface-border")).toBe("rgba(252, 11, 11, 0.60)");
  });

  it("inherits custom foreground into border when border input is absent", function () {
    const cssVars = {
      "--dyni-fg": "#123456"
    };
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[name] : "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(resolved.surface.fg).toBe("#123456");
    expect(resolved.surface.border).toBe("#123456");
    expect(getAppliedOutput(rootEl, "--dyni-theme-surface-border")).toBe("#123456");
  });

  it("uses explicit border input instead of derived foreground border", function () {
    const cssVars = {
      "--dyni-fg": "#123456",
      "--dyni-border": "rgba(1, 2, 3, 0.75)"
    };
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[name] : "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(resolved.surface.fg).toBe("#123456");
    expect(resolved.surface.border).toBe("rgba(1, 2, 3, 0.75)");
    expect(getAppliedOutput(rootEl, "--dyni-theme-surface-border")).toBe("rgba(1, 2, 3, 0.75)");
  });

  it("resolves highcontrast preset AIS role colors", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "highcontrast" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ais.warning).toBe("#FF3300");
    expect(resolved.colors.ais.nearest).toBe("#00AA66");
    expect(resolved.colors.ais.tracking).toBe("#CC6600");
    expect(resolved.colors.ais.normal).toBe("#8A7300");
  });

  it("resolves default preset AIS role colors in night mode", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
  });

  it("resolves darkmode preset surface and semantic colors", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "darkmode" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.surface.fg).toBe("#ffffff");
    expect(resolved.surface.bg).toBe("#000000");
    expect(resolved.surface.border).toBe("#ffffff");

    expect(resolved.colors.pointer).toBe("#ff2b2b");
    expect(resolved.colors.warning).toBe("#e7c66a");
    expect(resolved.colors.alarm).toBe("#ff7a76");

    expect(resolved.colors.alarmWidget.bg).toBe("#b3261e");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#66b8ff");

    expect(resolved.colors.laylineStb).toBe("#82b683");
    expect(resolved.colors.laylinePort).toBe("#ff7a76");

    expect(resolved.colors.ais.warning).toBe("#FA584A");
    expect(resolved.colors.ais.nearest).toBe("#70F3AF");
    expect(resolved.colors.ais.tracking).toBe("#f8a601");
    expect(resolved.colors.ais.normal).toBe("#EBEB55");
  });

  it("resolves darkmode preset to night-mode palette when AvNav night mode is active", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "darkmode" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.surface.fg).toBe("rgba(252, 11, 11, 0.60)");
    expect(resolved.surface.bg).toBe("black");
    expect(resolved.surface.border).toBe("rgba(252, 11, 11, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
  });

  it("resolves highcontrast preset to night-mode semantic colors when AvNav night mode is active", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "highcontrast" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.pointer).toBe("#cc2222");
    expect(resolved.colors.warning).toBe("#8b6914");
    expect(resolved.colors.alarm).toBe("#992222");
    expect(resolved.colors.alarmWidget.bg).toBe("#991111");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#66b8ff");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
  });
});
