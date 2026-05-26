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

  it("ignores removed camelCase regatta alias input var", function () {
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

    expect(resolved.colors.regatta.barWarning).toBe("#e7a834");
    expect(warn).not.toHaveBeenCalled();
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
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(199, 58, 50, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("rgba(231, 168, 52, 0.60)");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe(
      "rgba(112, 176, 243, 0.60)",
    );
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
    expect(resolved.colors.alarmWidget.bg).toBe("rgba(199, 58, 50, 0.60)");
    expect(resolved.colors.alarmWidget.fg).toBe("#ffffff");
    expect(resolved.colors.alarmWidget.strip).toBe("rgba(112, 243, 175, 0.60)");

    expect(resolved.colors.ais.warning).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.ais.nearest).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.ais.tracking).toBe("rgba(248, 166, 1, 0.60)");
    expect(resolved.colors.ais.normal).toBe("rgba(235, 235, 85, 0.60)");
    expect(resolved.colors.regatta.barWarning).toBe("rgba(231, 168, 52, 0.60)");
    expect(resolved.colors.regatta.barCritical).toBe("rgba(250, 88, 74, 0.60)");
    expect(resolved.colors.regatta.barDefault).toBe(
      "rgba(112, 176, 243, 0.60)",
    );
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
