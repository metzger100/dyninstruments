const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const { flushPromises } = require("../helpers/async");

const hasOwn = Object.prototype.hasOwnProperty;

// @ts-ignore -- pre-existing untyped test mock boundary
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
      // @ts-ignore -- pre-existing untyped test mock boundary
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

// @ts-ignore -- pre-existing untyped test mock boundary
function getAppliedOutput(rootEl, outputVar) {
  const calls = rootEl.style.setProperty.mock.calls;
  for (let i = 0; i < calls.length; i += 1) {
    if (calls[i][0] === outputVar) {
      return calls[i][1];
    }
  }
  return undefined;
}

module.exports = {
  createPluginRootElement,
  createScriptContext,
  flushPromises,
  getAppliedOutput,
  hasOwn,
  runIifeScript,
  setupContext
};
