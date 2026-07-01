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

  it("applyToRoot materializes --dyni-theme-opacity-unit", function () {
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

    expect(getAppliedOutput(rootEl, "--dyni-theme-opacity-unit")).toBe("1");
  });

  it("applyToRoot materializes regatta output vars", function () {
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

    expect(getAppliedOutput(rootEl, "--dyni-theme-regatta-bar-warning")).toBe(
      "#e0a92e",
    );
    expect(getAppliedOutput(rootEl, "--dyni-theme-regatta-bar-critical")).toBe(
      "#d9534a",
    );
    expect(getAppliedOutput(rootEl, "--dyni-theme-regatta-bar-default")).toBe(
      "#3366cc",
    );
  });

  it("opacity tokens have no preset overrides", function () {
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
    const presets = ["slim", "bold", "darkmode", "highcontrast"];

    presets.forEach(function (preset) {
      context.DyniPlugin.runtime.theme.configure({ activePresetName: preset });
      const resolved =
        context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
      expect(resolved.opacity.caption).toBe(1);
      expect(resolved.opacity.unit).toBe(1);
    });
  });

  it("opacity tokens have no night mode override", function () {
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

    expect(resolved.opacity.caption).toBe(1);
    expect(resolved.opacity.unit).toBe(1);
  });
});
