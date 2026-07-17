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

  it("regatta button stroke weight inherits and overrides global stroke weight", function () {
    const cssVars = { "--dyni-stroke-weight": "1.7" };
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

    const inherited =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(rootEl);
    expect(inherited.regatta.buttonStrokeWeight).toBe(1.7);

    cssVars["--dyni-regatta-button-stroke-weight"] = "2.4";
    const overrideRootEl = createPluginRootElement();
    const overridden =
      context.DyniPlugin.runtime.theme.tokens.resolveForRoot(overrideRootEl);
    expect(overridden.regatta.buttonStrokeWeight).toBe(2.4);
  });

  it("resolver caches snapshots by canonical root state and invalidates on input changes", function () {
    const inlineValues = { "--dyni-pointer": "#111111" };
    const inlineStyle = {
      getPropertyValue(name) {
        return hasOwn.call(inlineValues, name) ? inlineValues[name] : "";
      },
      setProperty(name, value) {
        inlineValues[String(name)] = String(value);
      },
    };
    let computedStyleCalls = 0;
    const context = setupContext({
      getComputedStyle() {
        computedStyleCalls += 1;
        return inlineStyle;
      },
    });
    const model = context.DyniPlugin.runtime.createThemeModel();
    const resolver = context.DyniPlugin.runtime.createThemeResolver(model, {
      getNightModeState() {
        return false;
      },
      getActivePresetName() {
        return "default";
      },
    });
    const rootEl = createPluginRootElement();
    rootEl.style = inlineStyle;

    const first = resolver.resolveForRoot(rootEl);
    const second = resolver.resolveForRoot(rootEl);
    const firstOutputs = resolver.resolveOutputsForRoot(rootEl);
    const secondOutputs = resolver.resolveOutputsForRoot(rootEl);
    expect(second).toBe(first);
    expect(secondOutputs).toBe(firstOutputs);
    expect(first.colors.pointer).toBe("#111111");
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.colors)).toBe(true);
    expect(Object.isFrozen(firstOutputs)).toBe(true);
    expect(computedStyleCalls).toBe(2);

    rootEl.style.setProperty("--dyni-pointer", "#222222");
    const changed = resolver.resolveForRoot(rootEl);
    expect(changed).not.toBe(first);
    expect(changed.colors.pointer).toBe("#222222");

    rootEl.style.setProperty("--dyni-theme-surface-fg", "#00ff00");
    const outputChanged = resolver.resolveForRoot(rootEl);
    expect(outputChanged).toBe(changed);

    const secondResolver = context.DyniPlugin.runtime.createThemeResolver(model, {
      getNightModeState() {
        return false;
      },
      getActivePresetName() {
        return "default";
      },
    });
    const fresh = secondResolver.resolveForRoot(rootEl);
    expect(fresh).not.toBe(changed);
    expect(fresh.colors.pointer).toBe("#222222");
  });
});
