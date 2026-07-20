const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/dom-runtime.js", function () {
  /** @param {any} classNames @param {any} [parentNode] */
  function createElementNode(classNames, parentNode) {
    const classes = Array.isArray(classNames) ? classNames.slice() : [];
    const classSet = new Set(classes);
    const node = {
      nodeType: 1,
      parentNode: parentNode || null,
      classList: {
        /** @param {any} name */
        contains(name) {
          return classSet.has(name);
        }
      },
      /** @param {any} selector */
      closest(selector) {
        let cursor = /** @type {any} */ (node);
        while (cursor) {
          if (cursor.nodeType === 1) {
            if (
              selector === ".widget.dyniplugin" &&
              cursor.classList.contains("widget") &&
              cursor.classList.contains("dyniplugin")
            ) {
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

  /** @param {any} [host] */
  function createShadowRootNode(host) {
    return {
      nodeType: 11,
      host: host || null,
      parentNode: null
    };
  }

  /** @param {Record<string, any>} [extra] */
  function loadRuntimeDom(extra) {
    const context = createScriptContext(
      Object.assign(
        {
          DyniPlugin: {
            runtime: {},
            state: {},
            config: { shared: {}, clusters: [] }
          }
        },
        extra || {}
      )
    );

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

  it("caches requirePluginRoot results per resolved target node", function () {
    const runtime = loadRuntimeDom();
    const root = createElementNode(["widget", "dyniplugin"]);
    const child = createElementNode(["child"], root);
    let closestCalls = 0;
    const originalClosest = child.closest;
    child.closest = function (selector) {
      closestCalls += 1;
      return originalClosest.call(child, selector);
    };

    expect(runtime.dom.requirePluginRoot(child)).toBe(root);
    expect(runtime.dom.requirePluginRoot(child)).toBe(root);
    expect(closestCalls).toBe(1);
  });

  it("reuses cache for event-like targets that resolve to the same node", function () {
    const runtime = loadRuntimeDom();
    const root = createElementNode(["widget", "dyniplugin"]);
    const child = createElementNode(["child"], root);
    let closestCalls = 0;
    const originalClosest = child.closest;
    child.closest = function (selector) {
      closestCalls += 1;
      return originalClosest.call(child, selector);
    };

    expect(runtime.dom.requirePluginRoot({ target: child })).toBe(root);
    expect(runtime.dom.requirePluginRoot({ target: child })).toBe(root);
    expect(closestCalls).toBe(1);
  });
});
