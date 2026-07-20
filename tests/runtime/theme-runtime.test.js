const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");
const hasOwn = Object.prototype.hasOwnProperty;

describe("runtime/theme-runtime.js", function () {
  /** @param {Record<string, any>} [overrides] */
  function setupContext(overrides) {
    const context = createScriptContext(
      Object.assign(
        {
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
        },
        overrides || {}
      )
    );

    runIifeScript("runtime/namespace.js", context);
    context.DyniPlugin.runtime.dom = context.DyniPlugin.runtime.dom || {
      getNightModeState() {
        return false;
      }
    };
    runIifeScript("runtime/theme/token-catalog.js", context);
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
        /** @param {any} name */
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

  /** @param {any} rootEl @param {any} outputVar */
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
      getComputedStyle(/** @type {any} */ el) {
        return {
          /** @param {any} name */
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
    const fetch = vi.fn((url) =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("/* " + url + " */")
      })
    );
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
      context.DyniPlugin.runtime.theme.applyToRoot({
        style: { setProperty() {} }
      });
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

    expect(resolved.surface.fg).toBe("#000000");
    expect(resolved.surface.border).toBe("#000000");
    expect(getAppliedOutput(rootEl, "--dyni-theme-surface-border")).toBe("#000000");
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
          /** @param {any} name */
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[/** @type {keyof typeof cssVars} */ (name)] : "";
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
          /** @param {any} name */
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[/** @type {keyof typeof cssVars} */ (name)] : "";
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
    context.DyniPlugin.runtime.theme.configure({
      activePresetName: "highcontrast"
    });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.alarm).toBe("#ff3b2f");
    expect(resolved.colors.alarmWidget.bg).toBe("#ff3b2f");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#008f5a");

    expect(resolved.colors.ais.warning).toBe("#ff3b2f");
    expect(resolved.colors.ais.nearest).toBe("#008f5a");
    expect(resolved.colors.ais.tracking).toBe("#ffd200");
    expect(resolved.colors.ais.normal).toBe("#008f5a");
    expect(resolved.colors.regatta.barWarning).toBe("#ffd200");
    expect(resolved.colors.regatta.barCritical).toBe("#ff3b2f");
    expect(resolved.colors.regatta.barDefault).toBe("#0057ff");
  });

  it("resolves default preset alarm and alarm widget colors in day mode", function () {
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.alarm).toBe("#d9534a");
    expect(resolved.colors.alarmWidget.bg).toBe("#d9534a");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#2e9e6b");
    expect(resolved.colors.regatta.barWarning).toBe("#e0a92e");
    expect(resolved.colors.regatta.barCritical).toBe("#d9534a");
    expect(resolved.colors.regatta.barDefault).toBe("#3366cc");
  });

  it("resolves colors.ok and colors.info in default day mode", function () {
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ok).toBe("#2e9e6b");
    expect(resolved.colors.info).toBe("#3366cc");
  });
});
