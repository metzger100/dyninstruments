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

  it("resolves default preset AIS role colors in night mode", function () {
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
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

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

  it("resolves colors.ok and colors.info in default night mode", function () {
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
    context.DyniPlugin.runtime.theme.configure({ activePresetName: "default" });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ok).toBe("rgba(112, 243, 175, 0.60)");
    expect(resolved.colors.info).toBe("rgba(112, 176, 243, 0.60)");
  });

  it("resolves colors.ok and colors.info highcontrast base overrides", function () {
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
      activePresetName: "highcontrast",
    });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.ok).toBe("#00AA66");
    expect(resolved.colors.info).toBe("#00AAFF");
  });

  it("cascades scoped semantic tokens from global parents by default", function () {
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

    const dayResolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    expect(dayResolved.colors.ais.warning).toBe(dayResolved.colors.alarm);
    expect(dayResolved.colors.ais.nearest).toBe(dayResolved.colors.ok);
    expect(dayResolved.colors.alarmWidget.strip).toBe(dayResolved.colors.ok);
    expect(dayResolved.colors.regatta.barDefault).toBe(dayResolved.colors.info);
    expect(dayResolved.colors.alarmWidget.bg).toBe("#C73A32");

    context.DyniPlugin.runtime.dom.getNightModeState = function () {
      return true;
    };
    const nightResolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    expect(nightResolved.colors.ais.warning).toBe(nightResolved.colors.alarm);
    expect(nightResolved.colors.ais.nearest).toBe(nightResolved.colors.ok);
    expect(nightResolved.colors.alarmWidget.strip).toBe(
      nightResolved.colors.ok,
    );
    expect(nightResolved.colors.regatta.barDefault).toBe(
      nightResolved.colors.info,
    );
  });

  it("cascades scoped tokens in highcontrast base mode", function () {
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
      activePresetName: "highcontrast",
    });

    const resolved =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);

    expect(resolved.colors.alarm).toBe("#FF3300");
    expect(resolved.colors.ais.warning).toBe("#FF3300");
    expect(resolved.colors.ais.warning).toBe(resolved.colors.alarm);
  });

  it("applies global root overrides to all cascaded scoped tokens", function () {
    const cssVars = {
      "--dyni-alarm": "#00ff00",
      "--dyni-ok": "#112233",
      "--dyni-info": "#445566",
    };
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
      "--dyni-ais-warning": "#0000ff",
    };
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

    expect(resolved.colors.ais.warning).toBe("#0000ff");
  });

  it("uses kebab-case regatta input var override", function () {
    const cssVars = {
      "--dyni-regatta-bar-warning": "#123abc",
    };
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

    expect(resolved.colors.regatta.barWarning).toBe("#123abc");
  });

  it("ignores removed camelCase regatta alias input var", function () {
    const cssVars = {
      "--dyni-regatta-bar-warning": "#aabbcc",
      "--dyni-regatta-barWarning": "#ddeeff",
    };
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

    expect(resolved.colors.regatta.barWarning).toBe("#aabbcc");
  });

});
