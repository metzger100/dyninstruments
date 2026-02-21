const { loadFresh } = require("../../helpers/load-umd");

describe("ThemeResolver", function () {
  let previousGetComputedStyle;

  beforeEach(function () {
    previousGetComputedStyle = globalThis.getComputedStyle;
  });

  afterEach(function () {
    if (typeof previousGetComputedStyle === "undefined") delete globalThis.getComputedStyle;
    else globalThis.getComputedStyle = previousGetComputedStyle;
  });

  function createDoc(nightRef) {
    return {
      documentElement: {
        classList: {
          contains(name) {
            return name === "nightMode" && !!nightRef.value;
          }
        }
      },
      body: {
        classList: {
          contains() {
            return false;
          }
        }
      }
    };
  }

  function createCanvas(doc) {
    return { ownerDocument: doc };
  }

  it("resolve returns full defaults when CSS variables are not set", function () {
    globalThis.getComputedStyle = function () {
      return {
        getPropertyValue() {
          return "";
        }
      };
    };

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, {});
    const canvas = createCanvas(createDoc({ value: false }));
    const out = resolver.resolve(canvas);

    expect(Object.keys(out).sort()).toEqual(["colors", "font", "labels", "pointer", "ring", "ticks"]);
    expect(out).toEqual(mod.DEFAULTS);
  });

  it("respects CSS variable overrides", function () {
    globalThis.getComputedStyle = function () {
      return {
        getPropertyValue(name) {
          if (name === "--dyni-pointer") return "  #123456  ";
          return "";
        }
      };
    };

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, {});
    const canvas = createCanvas(createDoc({ value: false }));
    const out = resolver.resolve(canvas);

    expect(out.colors.pointer).toBe("#123456");
    expect(out.colors.warning).toBe(mod.DEFAULTS.colors.warning);
  });

  it("returns the same cached object reference for repeated resolve calls", function () {
    const calls = { value: 0 };
    globalThis.getComputedStyle = function () {
      calls.value += 1;
      return {
        getPropertyValue() {
          return "";
        }
      };
    };

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, {});
    const canvas = createCanvas(createDoc({ value: false }));

    const first = resolver.resolve(canvas);
    const second = resolver.resolve(canvas);

    expect(first).toBe(second);
    expect(calls.value).toBe(1);
  });

  it("invalidates cache when night mode class state changes", function () {
    const calls = { value: 0 };
    globalThis.getComputedStyle = function () {
      calls.value += 1;
      return {
        getPropertyValue() {
          return "";
        }
      };
    };

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, {});

    const night = { value: false };
    const canvas = createCanvas(createDoc(night));

    const dayTokens = resolver.resolve(canvas);
    night.value = true;
    const nightTokens = resolver.resolve(canvas);

    expect(dayTokens).not.toBe(nightTokens);
    expect(calls.value).toBe(2);
  });

  it("exposes DEFAULTS on module and create function", function () {
    const mod = loadFresh("shared/theme/ThemeResolver.js");
    expect(mod.DEFAULTS).toBe(mod.create.DEFAULTS);
    expect(mod.TOKEN_DEFS).toBe(mod.create.TOKEN_DEFS);
    expect(Array.isArray(mod.TOKEN_DEFS)).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => tokenDef.path === "pointer.sideFactor" && tokenDef.cssVar === "--dyni-pointer-side")).toBe(true);
    expect(mod.DEFAULTS.pointer.sideFactor).toBe(0.25);
    expect(mod.DEFAULTS.ring.widthFactor).toBe(0.12);
  });
});
