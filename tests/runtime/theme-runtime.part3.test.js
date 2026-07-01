const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");
const hasOwn = Object.prototype.hasOwnProperty;

describe("runtime/theme-runtime.js", function () {
  function setupContext(overrides) {
    const context = createScriptContext(
      Object.assign(
        {
          DyniPlugin: {
            runtime: {
              dom: {
                getNightModeState() {
                  return false;
                },
              },
            },
            state: {},
            config: { shared: {}, clusters: [] },
          },
        },
        overrides || {},
      ),
    );

    runIifeScript("runtime/namespace.js", context);
    context.DyniPlugin.runtime.dom = context.DyniPlugin.runtime.dom || {
      getNightModeState() {
        return false;
      },
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
        },
      },
      closest() {
        return null;
      },
      style: {
        getPropertyValue() {
          return "";
        },
        setProperty: vi.fn(),
      },
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

  it("resolves deprecated camelCase regatta alias input var with one warning", function () {
    const cssVars = {
      "--dyni-regatta-barWarning": "#654321",
    };
    const warn = vi.fn();
    const context = setupContext({
      console: { warn: warn },
      getComputedStyle() {
        return {
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[name] : "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    const secondRootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.tokens.resolveForRoot(secondRootEl);

    expect(resolved.colors.regatta.barWarning).toBe("#654321");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("--dyni-regatta-barWarning");
    expect(warn.mock.calls[0][0]).toContain("--dyni-regatta-bar-warning");
  });

  it("resolves darkmode preset surface and semantic colors", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({
      activePresetName: "darkmode",
    });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.surface.fg).toBe("#ffffff");
    expect(resolved.surface.bg).toBe("#000000");
    expect(resolved.surface.border).toBe("#ffffff");

    expect(resolved.colors.pointer).toBe("#5aa2ff");
    expect(resolved.colors.warning).toBe("#ffd24a");
    expect(resolved.colors.alarm).toBe("#ff6b5c");

    expect(resolved.colors.alarmWidget.bg).toBe("#ff6b5c");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("#5fd68b");

    expect(resolved.colors.laylineStb).toBe("#5fd68b");
    expect(resolved.colors.laylinePort).toBe("#ff6b5c");

    expect(resolved.colors.ais.warning).toBe("#ff6b5c");
    expect(resolved.colors.ais.nearest).toBe("#5fd68b");
    expect(resolved.colors.ais.tracking).toBe("#ffd24a");
    expect(resolved.colors.ais.normal).toBe("#5fd68b");
    expect(resolved.colors.regatta.barWarning).toBe("#ffd24a");
    expect(resolved.colors.regatta.barCritical).toBe("#ff6b5c");
    expect(resolved.colors.regatta.barDefault).toBe("#5aa2ff");
  });

  it("resolves darkmode preset to night-mode palette when AvNav night mode is active", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({
      activePresetName: "darkmode",
    });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.surface.fg).toBe("rgba(252, 11, 11, 0.60)");
    expect(resolved.surface.bg).toBe("black");
    expect(resolved.surface.border).toBe("rgba(252, 11, 11, 0.60)");

    expect(resolved.colors.alarm).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("#8b6914");
    expect(resolved.colors.ais.normal).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("#8b6914");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe("#cc2222");
  });

  it("resolves highcontrast preset to night-mode semantic colors when AvNav night mode is active", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    context.DyniPlugin.runtime.theme.configure({
      activePresetName: "highcontrast",
    });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.pointer).toBe("#cc2222");
    expect(resolved.colors.warning).toBe("#8b6914");
    expect(resolved.colors.alarm).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("#8b6914");
    expect(resolved.colors.ais.normal).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("#8b6914");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe("#cc2222");
  });

  it("resolves opacity.caption to default 1.0", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.caption).toBe(1);
  });

  it("resolves opacity.unit to default 1.0", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.unit).toBe(1);
  });

  it("opacity.caption respects root CSS input override", function () {
    const cssVars = { "--dyni-caption-opacity": "0.6" };
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[name] : "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.caption).toBe(0.6);
  });

  it("opacity.unit respects root CSS input override", function () {
    const cssVars = { "--dyni-unit-opacity": "0.4" };
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue(name) {
            return hasOwn.call(cssVars, name) ? cssVars[name] : "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.opacity.unit).toBe(0.4);
  });

  it("applyToRoot materializes --dyni-theme-opacity-caption", function () {
    const context = setupContext({
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          },
        };
      },
    });
    const rootEl = createPluginRootElement();
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    context.DyniPlugin.runtime.theme.applyToRoot(rootEl);

    expect(getAppliedOutput(rootEl, "--dyni-theme-opacity-caption")).toBe("1");
  });

});
