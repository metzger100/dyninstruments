const { loadFresh } = require("../../helpers/load-umd");

describe("ThemeResolver", function () {
  let previousGetComputedStyle;

  beforeEach(function () {
    previousGetComputedStyle = globalThis.getComputedStyle;
  });

  afterEach(function () {
    if (typeof previousGetComputedStyle === "undefined") {
      delete globalThis.getComputedStyle;
    } else {
      globalThis.getComputedStyle = previousGetComputedStyle;
    }
  });

  function createRoot() {
    const attrs = Object.create(null);
    return {
      nodeType: 1,
      classList: {
        contains(name) {
          return name === "widget" || name === "dyniplugin";
        }
      },
      hasAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name);
      },
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
      },
      setAttribute(name, value) {
        attrs[String(name)] = String(value);
      },
      removeAttribute(name) {
        delete attrs[String(name)];
      },
      closest() {
        return null;
      }
    };
  }

  function installComputedStyle(styleByEl, calls) {
    globalThis.getComputedStyle = function (el) {
      if (calls) {
        calls.value += 1;
      }
      const values = styleByEl && styleByEl.get(el) ? styleByEl.get(el) : {};
      return {
        getPropertyValue(name) {
          return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : "";
        }
      };
    };
  }

  function createResolver(options) {
    const opts = options || {};
    const themeModel = opts.themeModel || loadFresh("shared/theme/ThemeModel.js");
    const resolver = loadFresh("shared/theme/ThemeResolver.js");
    resolver.configure({
      ThemeModel: themeModel,
      getNightModeState: typeof opts.getNightModeState === "function" ? opts.getNightModeState : function () {
        return false;
      },
      getActivePresetName: typeof opts.getActivePresetName === "function" ? opts.getActivePresetName : undefined
    });
    return { resolver: resolver, themeModel: themeModel };
  }

  it("resolves full defaults when CSS variables are not set", function () {
    installComputedStyle(new Map());
    const rootEl = createRoot();
    const { resolver, themeModel } = createResolver();
    const out = resolver.resolveForRoot(rootEl);

    expect(Object.keys(out).sort()).toEqual(["colors", "font", "linear", "radial", "surface", "xte"]);
    expect(out.surface.border).toBe(themeModel.BASE_DEFAULTS.surface.border);
    expect(out.surface.bg).toBe("white");
    expect(out.font.weight).toBe(700);
  });

  it("applies preset overrides from configured getActivePresetName", function () {
    installComputedStyle(new Map());
    const rootEl = createRoot();
    const { resolver } = createResolver({
      getActivePresetName() {
        return "bold";
      }
    });
    const out = resolver.resolveForRoot(rootEl);

    expect(out.radial.ring.arcLineWidth).toBe(2.5);
    expect(out.linear.pointer.widthFactor).toBe(1.54);
    expect(out.xte.lineWidthFactor).toBe(2);
  });

  it("defaults to default preset when getActivePresetName is not configured", function () {
    const rootEl = createRoot();
    installComputedStyle(new Map([
      [rootEl, {
        "--dyni-theme-preset": " bold "
      }]
    ]));
    const { resolver } = createResolver();
    const out = resolver.resolveForRoot(rootEl);

    expect(out.radial.pointer.widthFactor).toBe(1);
    expect(out.linear.track.lineWidth).toBe(2);
    expect(out.font.labelWeight).toBe(700);
  });

  it("maps preset name night to default and still applies night mode defaults", function () {
    const rootEl = createRoot();
    installComputedStyle(new Map());

    const { resolver } = createResolver({
      getNightModeState() {
        return true;
      },
      getActivePresetName() {
        return "night";
      }
    });
    const out = resolver.resolveForRoot(rootEl);

    expect(out.surface.bg).toBe("black");
    expect(out.surface.border).toBe("rgba(252, 11, 11, 0.18)");
    expect(out.colors.pointer).toBe("#cc2222");
  });

  it("prefers explicit root css token overrides over presets/defaults", function () {
    const rootEl = createRoot();
    installComputedStyle(new Map([
      [rootEl, {
        "--dyni-pointer": " #123456 ",
        "--dyni-linear-track-linewidth": " 9 ",
        "--dyni-font-weight": " 600 "
      }]
    ]));

    const { resolver } = createResolver({
      getActivePresetName() {
        return "bold";
      }
    });
    const out = resolver.resolveForRoot(rootEl);

    expect(out.colors.pointer).toBe("#123456");
    expect(out.linear.track.lineWidth).toBe(9);
    expect(out.font.weight).toBe(600);
  });

  it("does not cache by root identity", function () {
    const calls = { value: 0 };
    const rootEl = createRoot();
    installComputedStyle(new Map(), calls);

    const { resolver } = createResolver();
    const first = resolver.resolveForRoot(rootEl);
    const second = resolver.resolveForRoot(rootEl);

    expect(first).not.toBe(second);
    expect(calls.value).toBe(2);
  });

  it("exposes direct module API without create/invalidation methods", function () {
    const mod = loadFresh("shared/theme/ThemeResolver.js");
    expect(mod.id).toBe("ThemeResolver");
    expect(typeof mod.configure).toBe("function");
    expect(typeof mod.resolveForRoot).toBe("function");
    expect(typeof mod.create).toBe("undefined");
    expect(typeof mod.invalidateRoot).toBe("undefined");
    expect(typeof mod.invalidateAll).toBe("undefined");
  });

  it("returns token definitions and output token definitions from ThemeModel", function () {
    const { resolver } = createResolver();
    const tokenDefs = resolver.getTokenDefinitions();
    const outputTokenDefs = resolver.getOutputTokenDefinitions();

    expect(Array.isArray(tokenDefs)).toBe(true);
    expect(tokenDefs.some((tokenDef) => tokenDef.path === "surface.border" && tokenDef.inputVar === "--dyni-border")).toBe(true);
    expect(outputTokenDefs.some((tokenDef) => tokenDef.outputVar === "--dyni-theme-font-family")).toBe(true);
    expect(outputTokenDefs).toHaveLength(6);
  });

  it("throws when root is missing", function () {
    installComputedStyle(new Map());
    const { resolver } = createResolver();
    expect(() => resolver.resolveForRoot(null)).toThrow(/committed \.widget\.dyniplugin root element/);
  });

  it("throws when root is not a committed plugin root", function () {
    const invalidRoot = {
      nodeType: 1,
      classList: {
        contains(name) {
          return name === "widget";
        }
      }
    };
    installComputedStyle(new Map());
    const { resolver } = createResolver();
    expect(() => resolver.resolveForRoot(invalidRoot)).toThrow(/committed \.widget\.dyniplugin root element/);
  });
});
