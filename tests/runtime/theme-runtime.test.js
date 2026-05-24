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

    expect(resolved.colors.alarm).toBe("#FF3300");
    expect(resolved.colors.alarmWidget.bg).toBe("#CC2A1F");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#00AA66");

    expect(resolved.colors.ais.warning).toBe("#FF3300");
    expect(resolved.colors.ais.nearest).toBe("#00AA66");
    expect(resolved.colors.ais.tracking).toBe("#CC6600");
    expect(resolved.colors.ais.normal).toBe("#8A7300");
    expect(resolved.colors.regatta.barWarning).toBe("#ffcc00");
    expect(resolved.colors.regatta.barCritical).toBe("#FF3300");
    expect(resolved.colors.regatta.barDefault).toBe("#00AAFF");
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

    expect(resolved.colors.alarm).toBe("#FA584A");
    expect(resolved.colors.alarmWidget.bg).toBe("#C73A32");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#70F3AF");
    expect(resolved.colors.regatta.barWarning).toBe("#e7a834");
    expect(resolved.colors.regatta.barCritical).toBe("#FA584A");
    expect(resolved.colors.regatta.barDefault).toBe("#70B0F3");
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

    expect(resolved.colors.ok).toBe("#70F3AF");
    expect(resolved.colors.info).toBe("#70B0F3");
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

    expect(resolved.colors.alarm).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(199, 58, 50, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("rgba(231, 168, 52, 0.60)");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe("rgba(112, 176, 243, 0.60)");
  });

  it("resolves colors.ok and colors.info in default night mode", function () {
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

    expect(resolved.colors.ok).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.info).toBe("rgba(112, 176, 243, 0.60)");
  });

  it("resolves colors.ok and colors.info highcontrast base overrides", function () {
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

    expect(resolved.colors.ok).toBe("#00AA66");
    expect(resolved.colors.info).toBe("#00AAFF");
  });

  it("cascades scoped semantic tokens from global parents by default", function () {
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

    const dayResolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    expect(dayResolved.colors.ais.warning).toBe(dayResolved.colors.alarm);
    expect(dayResolved.colors.ais.nearest).toBe(dayResolved.colors.ok);
    expect(dayResolved.colors.alarmWidget.strip).toBe(dayResolved.colors.ok);
    expect(dayResolved.colors.regatta.barDefault).toBe(dayResolved.colors.info);
    expect(dayResolved.colors.alarmWidget.bg).toBe("#C73A32");

    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    const nightResolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    expect(nightResolved.colors.ais.warning).toBe(nightResolved.colors.alarm);
    expect(nightResolved.colors.ais.nearest).toBe(nightResolved.colors.ok);
    expect(nightResolved.colors.alarmWidget.strip).toBe(nightResolved.colors.ok);
    expect(nightResolved.colors.regatta.barDefault).toBe(nightResolved.colors.info);
  });

  it("cascades scoped tokens in highcontrast base mode", function () {
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

    expect(resolved.colors.alarm).toBe("#FF3300");
    expect(resolved.colors.ais.warning).toBe("#FF3300");
    expect(resolved.colors.ais.warning).toBe(resolved.colors.alarm);
  });

  it("applies global root overrides to all cascaded scoped tokens", function () {
    const cssVars = {
      "--dyni-alarm": "#00ff00",
      "--dyni-ok": "#112233",
      "--dyni-info": "#445566"
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ais.warning).toBe("#00ff00");
    expect(resolved.colors.regatta.barCritical).toBe("#00ff00");
    expect(resolved.colors.ais.nearest).toBe("#112233");
    expect(resolved.colors.alarmWidget.strip).toBe("#112233");
    expect(resolved.colors.regatta.barDefault).toBe("#445566");
    expect(resolved.colors.alarmWidget.bg).toBe("#C73A32");
    expect(resolved.colors.regatta.barWarning).toBe("#e7a834");
  });

  it("uses scoped override over parent cascade for ais.warning", function () {
    const cssVars = {
      "--dyni-alarm": "#00ff00",
      "--dyni-ais-warning": "#0000ff"
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ais.warning).toBe("#0000ff");
  });

  it("uses kebab-case regatta input var override", function () {
    const cssVars = {
      "--dyni-regatta-bar-warning": "#123abc"
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.regatta.barWarning).toBe("#123abc");
  });

  it("resolves deprecated regatta alias input var", function () {
    const cssVars = {
      "--dyni-regatta-barWarning": "#654321"
    };
    const context = setupContext({
      console: { warn: vi.fn() },
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.regatta.barWarning).toBe("#654321");
  });

  it("prefers kebab-case regatta input var over deprecated alias", function () {
    const cssVars = {
      "--dyni-regatta-bar-warning": "#aabbcc",
      "--dyni-regatta-barWarning": "#ddeeff"
    };
    const context = setupContext({
      console: { warn: vi.fn() },
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.regatta.barWarning).toBe("#aabbcc");
  });

  it("warns when deprecated regatta alias input var is used", function () {
    const cssVars = {
      "--dyni-regatta-barWarning": "#654321"
    };
    const warn = vi.fn();
    const context = setupContext({
      console: { warn: warn },
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

    context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("--dyni-regatta-barWarning");
    expect(warn.mock.calls[0][0]).toContain("--dyni-regatta-bar-warning");
  });

  it("deduplicates deprecated regatta alias warning across resolve cycles", function () {
    const cssVars = {
      "--dyni-regatta-barWarning": "#654321"
    };
    const warn = vi.fn();
    const context = setupContext({
      console: { warn: warn },
      getComputedStyle() {
        return {
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[name] : "";
          }
        };
      }
    });
    const rootEl = createPluginRootElement();
    const secondRootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    context.DyniPlugin.runtime.theme.tokens.resolveForRoot(secondRootEl);

    expect(warn).toHaveBeenCalledTimes(1);
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
    expect(resolved.colors.alarm).toBe("#FA584A");

    expect(resolved.colors.alarmWidget.bg).toBe("#C73A32");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#70F3AF");

    expect(resolved.colors.laylineStb).toBe("#82b683");
    expect(resolved.colors.laylinePort).toBe("#ff7a76");

    expect(resolved.colors.ais.warning).toBe("#FA584A");
    expect(resolved.colors.ais.nearest).toBe("#70F3AF");
    expect(resolved.colors.ais.tracking).toBe("#f8a601");
    expect(resolved.colors.ais.normal).toBe("#EBEB55");
    expect(resolved.colors.regatta.barWarning).toBe("#e7a834");
    expect(resolved.colors.regatta.barCritical).toBe("#FA584A");
    expect(resolved.colors.regatta.barDefault).toBe("#70B0F3");
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

    expect(resolved.colors.alarm).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(199, 58, 50, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("rgba(231, 168, 52, 0.60)");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe("rgba(112, 176, 243, 0.60)");
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
    expect(resolved.colors.alarm).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(199, 58, 50, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("rgba(231, 168, 52, 0.60)");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe("rgba(112, 176, 243, 0.60)");
  });

  it("resolves opacity.caption to default 1.0", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.caption).toBe(1);
  });

  it("resolves opacity.unit to default 1.0", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.unit).toBe(1);
  });

  it("opacity.caption respects root CSS input override", function () {
    const cssVars = { "--dyni-caption-opacity": "0.6" };
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.caption).toBe(0.6);
  });

  it("opacity.unit respects root CSS input override", function () {
    const cssVars = { "--dyni-unit-opacity": "0.4" };
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

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.unit).toBe(0.4);
  });

  it("applyToRoot materializes --dyni-theme-opacity-caption", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(getAppliedOutput(rootEl, "--dyni-theme-opacity-caption")).toBe("1");
  });

  it("applyToRoot materializes --dyni-theme-opacity-unit", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(getAppliedOutput(rootEl, "--dyni-theme-opacity-unit")).toBe("1");
  });

  it("applyToRoot materializes regatta output vars", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(getAppliedOutput(rootEl, "--dyni-theme-regatta-bar-warning")).toBe("#e7a834");
    expect(getAppliedOutput(rootEl, "--dyni-theme-regatta-bar-critical")).toBe("#FA584A");
    expect(getAppliedOutput(rootEl, "--dyni-theme-regatta-bar-default")).toBe("#70B0F3");
  });

  it("opacity tokens have no preset overrides", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    const presets = ["slim", "bold", "darkmode", "highcontrast"];

    presets.forEach(function (preset) {
      context.DyniPlugin.runtime.theme.configure({ activePresetName: preset });
      const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
      expect(resolved.opacity.caption).toBe(1);
      expect(resolved.opacity.unit).toBe(1);
    });
  });

  it("opacity tokens have no night mode override", function () {
    const context = setupContext({
      getComputedStyle() {
        return { getPropertyValue() { return ""; } };
      }
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved = context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.caption).toBe(1);
    expect(resolved.opacity.unit).toBe(1);
  });
});
