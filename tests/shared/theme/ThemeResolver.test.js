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

  function createStyle(initialValues) {
    const values = Object.create(null);
    if (initialValues && typeof initialValues === "object") {
      Object.keys(initialValues).forEach(function (name) {
        values[name] = String(initialValues[name]);
      });
    }
    return {
      getPropertyValue(name) {
        return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : "";
      },
      setProperty(name, value) {
        values[String(name)] = String(value);
      },
      removeProperty(name) {
        delete values[String(name)];
      }
    };
  }

  function createRoot(options) {
    const opts = options || {};
    const attrs = Object.create(null);
    let className = typeof opts.className === "string" ? opts.className : "widget dyniplugin";
    const style = createStyle(opts.styleValues);

    attrs.class = className;

    return {
      nodeType: 1,
      style: style,
      get className() {
        return className;
      },
      set className(value) {
        className = String(value || "");
        attrs.class = className;
      },
      classList: {
        contains(name) {
          return String(className).split(/\s+/).filter(Boolean).indexOf(name) >= 0;
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
        if (String(name) === "class") {
          className = String(value);
        }
      },
      removeAttribute(name) {
        delete attrs[String(name)];
        if (String(name) === "class") {
          className = "";
        }
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
      const style = styleByEl && styleByEl.get(el);
      if (style && typeof style.getPropertyValue === "function") {
        return style;
      }
      const values = style && typeof style === "object" ? style : {};
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

  it("returns the same frozen object for identical root snapshots", function () {
    const calls = { value: 0 };
    const rootEl = createRoot();
    const computedValues = { "--dyni-pointer": "#111111" };
    installComputedStyle(new Map([[rootEl, computedValues]]), calls);

    const { resolver } = createResolver();
    const first = resolver.resolveForRoot(rootEl);
    const second = resolver.resolveForRoot(rootEl);

    expect(first).toBe(second);
    expect(calls.value).toBe(1);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.colors)).toBe(true);
  });

  it("reuses immutable output-only snapshots for identical root snapshots", function () {
    const rootEl = createRoot();
    installComputedStyle(new Map([[rootEl, rootEl.style]]));

    const { resolver } = createResolver();
    const first = resolver.resolveOutputsForRoot(rootEl);
    const second = resolver.resolveOutputsForRoot(rootEl);

    expect(first).toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.surface).toBeDefined();
  });

  it("returns a different object when inline ThemeModel input vars change", function () {
    const rootEl = createRoot();
    rootEl.style.setProperty("--dyni-pointer", "#111111");
    installComputedStyle(new Map([[rootEl, rootEl.style]]));

    const { resolver } = createResolver();
    const first = resolver.resolveForRoot(rootEl);
    rootEl.style.setProperty("--dyni-pointer", "#222222");
    const second = resolver.resolveForRoot(rootEl);

    expect(first).not.toBe(second);
    expect(second.colors.pointer).toBe("#222222");
  });

  it("returns a different object when inline mono font input var changes", function () {
    const rootEl = createRoot();
    rootEl.style.setProperty("--dyni-font-mono", '"Roboto Mono", monospace');
    installComputedStyle(new Map([[rootEl, rootEl.style]]));

    const { resolver } = createResolver();
    const first = resolver.resolveForRoot(rootEl);
    rootEl.style.setProperty("--dyni-font-mono", '"Fira Code", monospace');
    const second = resolver.resolveForRoot(rootEl);

    expect(first).not.toBe(second);
    expect(second.font.familyMono).toBe('"Fira Code", monospace');
  });

  it("returns a different object when committed root class signature changes", function () {
    const rootEl = createRoot();
    installComputedStyle(new Map([[rootEl, rootEl.style]]));

    const { resolver } = createResolver();
    const first = resolver.resolveForRoot(rootEl);
    rootEl.className = "widget dyniplugin theme-alt";
    const second = resolver.resolveForRoot(rootEl);

    expect(first).not.toBe(second);
  });

  it("ignores resolver-owned output vars in cache snapshot identity", function () {
    const rootEl = createRoot();
    const computedValues = { "--dyni-pointer": "#111111" };
    installComputedStyle(new Map([[rootEl, computedValues]]));

    const { resolver } = createResolver();
    const first = resolver.resolveForRoot(rootEl);
    computedValues["--dyni-theme-surface-fg"] = "#00ff00";
    const second = resolver.resolveForRoot(rootEl);

    expect(first).toBe(second);
  });

  it("clears snapshot caches when configure() is called", function () {
    const rootEl = createRoot({
      styleValues: {
        "--dyni-pointer": "#111111"
      }
    });
    installComputedStyle(new Map([[rootEl, rootEl.style]]));

    const { resolver, themeModel } = createResolver();
    const first = resolver.resolveForRoot(rootEl);

    resolver.configure({
      ThemeModel: themeModel,
      getNightModeState() {
        return false;
      }
    });

    const second = resolver.resolveForRoot(rootEl);
    expect(first).not.toBe(second);
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
    expect(tokenDefs.some((tokenDef) => tokenDef.path === "font.familyMono" && tokenDef.inputVar === "--dyni-font-mono")).toBe(true);
    expect(outputTokenDefs.some((tokenDef) => tokenDef.outputVar === "--dyni-theme-font-family")).toBe(true);
    expect(outputTokenDefs.some((tokenDef) => tokenDef.outputVar === "--dyni-theme-font-family-mono")).toBe(true);
    expect(outputTokenDefs).toHaveLength(7);
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
