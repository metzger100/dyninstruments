const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/dom-runtime.js", function () {
  function createElementNode(classNames, parentNode) {
    const classes = Array.isArray(classNames) ? classNames.slice() : [];
    const classSet = new Set(classes);
    const node = {
      nodeType: 1,
      parentNode: parentNode || null,
      classList: {
        contains(name) {
          return classSet.has(name);
        }
      },
      closest(selector) {
        let cursor = node;
        while (cursor) {
          if (cursor.nodeType === 1) {
            if (selector === ".widget.dyniplugin" &&
              cursor.classList.contains("widget") &&
              cursor.classList.contains("dyniplugin")) {
              return cursor;
            }
            if (selector === ".nightMode" && cursor.classList.contains("nightMode")) {
              return cursor;
            }
          }
          if (cursor.parentNode) {
            cursor = cursor.parentNode;
            continue;
          }
          if (cursor.nodeType === 11 && cursor.host) {
            cursor = cursor.host;
            continue;
          }
          cursor = null;
        }
        return null;
      }
    };
    return node;
  }

  function createShadowRootNode(host) {
    return {
      nodeType: 11,
      host: host || null,
      parentNode: null
    };
  }

  function loadRuntimeDom(extra) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    }, extra || {}));

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/dom-runtime.js", context);
    return context.DyniPlugin.runtime;
  }

  it("resolves committed plugin root across ShadowRoot and detects night mode", function () {
    const runtime = loadRuntimeDom();
    const root = createElementNode(["widget", "dyniplugin"]);
    const host = createElementNode(["host"], root);
    const shadowRoot = createShadowRootNode(host);
    const child = createElementNode(["child"], shadowRoot);

    expect(runtime.dom.requirePluginRoot(child)).toBe(root);
    expect(runtime.dom.getNightModeState(createElementNode(["child"], createElementNode(["nightMode"])))).toBe(true);
  });
});
