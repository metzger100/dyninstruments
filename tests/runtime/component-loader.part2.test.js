// @ts-nocheck
const { setupComponentLoader, installComponentContextRuntime } = require("./component-loader.harness");

describe("runtime/component-loader.js createInstance", function () {
  it("fails before component closure is loaded", function () {
    const { runtime } = setupComponentLoader();
    installComponentContextRuntime(runtime);

    const loader = runtime.createComponentLoader({
      A: { js: "/a.js", css: undefined, globalKey: "DyniA" }
    });

    expect(function () {
      loader.createInstance("A", { name: "x" });
    }).toThrow("is not loaded");
  });

  it("builds deterministic dependency instances and fresh trees per call", async function () {
    const { runtime, context } = setupComponentLoader();
    installComponentContextRuntime(runtime);
    const hostActions = { routePoints: {} };
    runtime.hostActions = vi.fn(() => hostActions);
    runtime.theme.tokens.resolveForRoot.mockReturnValue({ token: true });

    context.DyniComponents.DyniDep = {
      create: vi.fn(() => ({ dep: true }))
    };
    context.DyniComponents.DyniA = {
      create: vi.fn((def, componentContext) => ({
        defName: def.name,
        dep: componentContext.components.require("Dep"),
        theme: componentContext.theme.tokens.resolveForRoot({}),
        format: componentContext.format,
        canvas: componentContext.canvas,
        dom: componentContext.dom,
        hostActions: componentContext.hostActions
      }))
    };

    const loader = runtime.createComponentLoader({
      A: { js: "/a.js", css: undefined, globalKey: "DyniA", deps: ["Dep"] },
      Dep: { js: "/dep.js", css: undefined, globalKey: "DyniDep" }
    });

    await loader.loadComponent("A");
    const first = loader.createInstance("A", { name: "one" });
    const second = loader.createInstance("A", { name: "two" });

    expect(first.defName).toBe("one");
    expect(second.defName).toBe("two");
    expect(first).not.toBe(second);
    expect(first.dep).not.toBe(second.dep);
    expect(first.theme).toEqual({ token: true });
    expect(first.format).toBe(runtime.format);
    expect(first.canvas).toBe(runtime.canvas);
    expect(first.dom).toBe(runtime.dom);
    expect(first.hostActions).toBe(runtime.hostActions);
    expect(first.hostActions()).toBe(hostActions);
  });

  it("denies undeclared dependency access through componentContext.components.require", async function () {
    const { runtime, context } = setupComponentLoader();
    installComponentContextRuntime(runtime);

    context.DyniComponents.DyniA = {
      create: vi.fn((def, componentContext) => {
        componentContext.components.require("MissingDep");
        return {};
      })
    };

    const loader = runtime.createComponentLoader({
      A: { js: "/a.js", css: undefined, globalKey: "DyniA" }
    });
    await loader.loadComponent("A");

    expect(function () {
      loader.createInstance("A", {});
    }).toThrow("requested undeclared dependency 'MissingDep'");
  });

  it("reports dependency cycles on load and create paths", async function () {
    const { runtime, context } = setupComponentLoader();
    installComponentContextRuntime(runtime);

    context.DyniComponents.DyniA = { create: vi.fn(() => ({})) };
    context.DyniComponents.DyniB = { create: vi.fn(() => ({})) };

    const loader = runtime.createComponentLoader({
      A: { js: "/a.js", css: undefined, globalKey: "DyniA", deps: ["B"] },
      B: { js: "/b.js", css: undefined, globalKey: "DyniB", deps: ["A"] }
    });

    expect(function () {
      loader.loadComponent("A");
    }).toThrow("dependency cycle detected (A -> B -> A)");
    expect(function () {
      loader.createInstance("A", {});
    }).toThrow("dependency cycle detected (A -> B -> A)");
  });
});
