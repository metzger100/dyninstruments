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

  function createRoot() {
    const attrs = Object.create(null);
    return {
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
      },
      setAttribute(name, value) {
        attrs[String(name)] = String(value);
      },
      removeAttribute(name) {
        delete attrs[String(name)];
      }
    };
  }

  function createCanvas(doc, rootEl) {
    return {
      ownerDocument: doc,
      parentElement: rootEl || null,
      closest() {
        return rootEl || null;
      }
    };
  }

  function createHelpers() {
    const presetsMod = loadFresh("shared/theme/ThemePresets.js");
    return {
      getModule(id) {
        return id === "ThemePresets" ? presetsMod : null;
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

  it("resolve returns full defaults when CSS variables are not set", function () {
    installComputedStyle(new Map());

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, createHelpers());
    const canvas = createCanvas(createDoc({ value: false }), createRoot());
    const out = resolver.resolve(canvas);

    expect(Object.keys(out).sort()).toEqual(["colors", "font", "linear", "radial", "xte"]);
    expect(out).toEqual(mod.DEFAULTS);
  });

  it("respects CSS variable overrides", function () {
    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const rootEl = createRoot();
    const canvas = createCanvas(createDoc({ value: false }), rootEl);
    installComputedStyle(new Map([
      [canvas, {
        "--dyni-pointer": "  #123456  ",
        "--dyni-linear-track-width": " 0.2 ",
        "--dyni-linear-pointer-width": " 0.9 ",
        "--dyni-xte-line-width-factor": " 1.5 "
      }]
    ]));

    const resolver = mod.create({}, createHelpers());
    const out = resolver.resolve(canvas);

    expect(out.colors.pointer).toBe("#123456");
    expect(out.colors.warning).toBe(mod.DEFAULTS.colors.warning);
    expect(out.linear.track.widthFactor).toBe(0.2);
    expect(out.linear.pointer.widthFactor).toBe(0.9);
    expect(out.xte.lineWidthFactor).toBe(1.5);
    expect(out.xte.boatSizeFactor).toBe(1);
  });

  it("applies active preset values from the widget root", function () {
    installComputedStyle(new Map());

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const rootEl = createRoot();
    rootEl.setAttribute("data-dyni-theme", "bold");
    const resolver = mod.create({}, createHelpers());
    const canvas = createCanvas(createDoc({ value: false }), rootEl);
    const out = resolver.resolve(canvas);

    expect(out.radial.ring.arcLineWidth).toBe(2.5);
    expect(out.radial.pointer.widthFactor).toBe(1.54);
    expect(out.linear.pointer.lengthFactor).toBe(2.2);
    expect(out.xte.lineWidthFactor).toBe(2);
    expect(out.xte.boatSizeFactor).toBe(mod.DEFAULTS.xte.boatSizeFactor);
  });

  it("prefers explicit root CSS overrides over active preset values", function () {
    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const rootEl = createRoot();
    rootEl.setAttribute("data-dyni-theme", "night");
    const canvas = createCanvas(createDoc({ value: false }), rootEl);
    installComputedStyle(new Map([
      [rootEl, {
        "--dyni-pointer": " #00aaff ",
        "--dyni-linear-track-linewidth": " 1.25 ",
        "--dyni-xte-boat-size-factor": " 1.4 "
      }]
    ]));

    const resolver = mod.create({}, createHelpers());
    const out = resolver.resolve(canvas);

    expect(out.colors.pointer).toBe("#00aaff");
    expect(out.colors.warning).toBe("#8b6914");
    expect(out.linear.track.lineWidth).toBe(1.25);
    expect(out.xte.boatSizeFactor).toBe(1.4);
    expect(out.xte.lineWidthFactor).toBe(mod.DEFAULTS.xte.lineWidthFactor);
  });

  it("returns the same cached object reference for repeated resolve calls", function () {
    const calls = { value: 0 };
    installComputedStyle(new Map(), calls);

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, createHelpers());
    const canvas = createCanvas(createDoc({ value: false }), createRoot());

    const first = resolver.resolve(canvas);
    const second = resolver.resolve(canvas);

    expect(first).toBe(second);
    expect(calls.value).toBe(2);
  });

  it("refreshes token cache only after explicit invalidation", function () {
    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const rootEl = createRoot();
    const resolver = mod.create({}, createHelpers());
    const canvas = createCanvas(createDoc({ value: false }), rootEl);
    installComputedStyle(new Map());

    const first = resolver.resolve(canvas);
    rootEl.setAttribute("data-dyni-theme", "bold");
    const stillCached = resolver.resolve(canvas);
    expect(stillCached.radial.pointer.widthFactor).toBe(first.radial.pointer.widthFactor);

    resolver.invalidateCanvas(canvas);
    const refreshed = resolver.resolve(canvas);
    expect(refreshed.radial.pointer.widthFactor).toBe(1.54);

    rootEl.removeAttribute("data-dyni-theme");
    resolver.invalidateAll();
    const refreshedAll = resolver.resolve(canvas);
    expect(refreshedAll.radial.pointer.widthFactor).toBe(mod.DEFAULTS.radial.pointer.widthFactor);
  });

  it("invalidates cache when night mode class state changes", function () {
    const calls = { value: 0 };
    installComputedStyle(new Map(), calls);

    const mod = loadFresh("shared/theme/ThemeResolver.js");
    const resolver = mod.create({}, createHelpers());

    const night = { value: false };
    const canvas = createCanvas(createDoc(night), createRoot());

    const dayTokens = resolver.resolve(canvas);
    night.value = true;
    const nightTokens = resolver.resolve(canvas);

    expect(dayTokens).not.toBe(nightTokens);
    expect(calls.value).toBe(4);
  });

  it("exposes DEFAULTS on module and create function", function () {
    const mod = loadFresh("shared/theme/ThemeResolver.js");
    expect(mod.DEFAULTS).toBe(mod.create.DEFAULTS);
    expect(mod.TOKEN_DEFS).toBe(mod.create.TOKEN_DEFS);
    expect(typeof mod.invalidateCanvas).toBe("function");
    expect(typeof mod.invalidateAll).toBe("function");
    expect(Array.isArray(mod.TOKEN_DEFS)).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => tokenDef.path === "radial.pointer.widthFactor" && tokenDef.cssVar === "--dyni-radial-pointer-width")).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => (
      tokenDef.path === "radial.fullCircle.normal.innerMarginFactor" &&
      tokenDef.cssVar === "--dyni-radial-fullcircle-normal-inner-margin"
    ))).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => (
      tokenDef.path === "xte.lineWidthFactor" &&
      tokenDef.cssVar === "--dyni-xte-line-width-factor"
    ))).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => (
      tokenDef.path === "xte.boatSizeFactor" &&
      tokenDef.cssVar === "--dyni-xte-boat-size-factor"
    ))).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => (
      tokenDef.path === "linear.track.widthFactor" &&
      tokenDef.cssVar === "--dyni-linear-track-width"
    ))).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => (
      tokenDef.path === "linear.pointer.lengthFactor" &&
      tokenDef.cssVar === "--dyni-linear-pointer-length"
    ))).toBe(true);
    expect(mod.TOKEN_DEFS.some((tokenDef) => (
      tokenDef.path === "linear.pointer.widthFactor" &&
      tokenDef.cssVar === "--dyni-linear-pointer-width"
    ))).toBe(true);
    expect(mod.DEFAULTS.radial.pointer.widthFactor).toBe(1);
    expect(mod.DEFAULTS.radial.ring.arcLineWidth).toBe(2);
    expect(mod.DEFAULTS.radial.ring.widthFactor).toBe(0.16);
    expect(mod.DEFAULTS.radial.ticks.majorLen).toBe(12);
    expect(mod.DEFAULTS.radial.ticks.minorWidth).toBe(1.5);
    expect(mod.DEFAULTS.radial.fullCircle.normal.innerMarginFactor).toBe(0.03);
    expect(mod.DEFAULTS.radial.fullCircle.normal.minHeightFactor).toBe(0.45);
    expect(mod.DEFAULTS.radial.fullCircle.normal.dualGapFactor).toBe(0.05);
    expect(mod.DEFAULTS.linear.track.widthFactor).toBe(0.16);
    expect(mod.DEFAULTS.linear.track.lineWidth).toBe(2);
    expect(mod.DEFAULTS.linear.ticks.majorWidth).toBe(3);
    expect(mod.DEFAULTS.linear.ticks.minorLen).toBe(7);
    expect(mod.DEFAULTS.linear.pointer.widthFactor).toBe(1);
    expect(mod.DEFAULTS.linear.pointer.lengthFactor).toBe(2);
    expect(mod.DEFAULTS.linear.labels.insetFactor).toBe(1.8);
    expect(mod.DEFAULTS.xte.lineWidthFactor).toBe(1.5);
    expect(mod.DEFAULTS.xte.boatSizeFactor).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(mod.DEFAULTS.radial.pointer, "sideFactor")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(mod.DEFAULTS.linear.pointer, "sideFactor")).toBe(false);
    expect(Object.keys(mod.DEFAULTS.xte).sort()).toEqual(["boatSizeFactor", "lineWidthFactor"]);
  });
});
