const { loadFresh } = require("../../helpers/load-umd");

describe("HtmlWidgetUtils", function () {
  function createUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create();
  }

  function createTarget(width, height) {
    return {
      getBoundingClientRect() {
        return { width: width, height: height };
      }
    };
  }

  it("normalizes finite numbers and trims text", function () {
    const utils = createUtils();

    expect(utils.toFiniteNumber("12.5")).toBe(12.5);
    expect(utils.toFiniteNumber("x")).toBeUndefined();
    expect(utils.toFiniteNumber(Infinity)).toBeUndefined();
    expect(utils.trimText("  abc  ")).toBe("abc");
    expect(utils.trimText(null)).toBe("");
  });

  it("escapes html text and serializes style attributes", function () {
    const utils = createUtils();

    expect(utils.escapeHtml('<x>&"\'' )).toBe("&lt;x&gt;&amp;&quot;&#39;");
    expect(utils.toStyleAttr(" font-size:10px; ")).toBe(' style="font-size:10px;"');
    expect(utils.toStyleAttr("   ")).toBe("");
  });

  it("resolves shell rect from explicit target and host commit target", function () {
    const utils = createUtils();
    const explicit = createTarget(220, 110);
    const hostContext = {
      __dyniHostCommitState: {
        shellEl: createTarget(300, 120),
        rootEl: createTarget(400, 160)
      }
    };

    expect(utils.resolveShellRect(null, explicit)).toEqual({ width: 220, height: 110 });
    expect(utils.resolveShellRect(hostContext)).toEqual({ width: 300, height: 120 });

    const invalid = {
      __dyniHostCommitState: {
        shellEl: createTarget(0, 80)
      }
    };
    expect(utils.resolveShellRect(invalid)).toBe(null);
  });

  it("resolves ratio mode with defaults, overrides, and fallback mode", function () {
    const utils = createUtils();
    const hostContext = {
      __dyniHostCommitState: {
        shellEl: createTarget(100, 250)
      }
    };

    expect(utils.resolveRatioMode({
      hostContext: hostContext,
      defaultRatioThresholdNormal: 1.2,
      defaultRatioThresholdFlat: 3.8
    })).toBe("high");

    expect(utils.resolveRatioMode({
      hostContext: { __dyniHostCommitState: { shellEl: createTarget(500, 100) } },
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      defaultRatioThresholdNormal: 1.2,
      defaultRatioThresholdFlat: 3.8
    })).toBe("flat");

    expect(utils.resolveRatioMode({
      hostContext: null,
      defaultMode: "normal"
    })).toBe("normal");
  });

  it("detects editing mode from editing and dyniLayoutEditing flags", function () {
    const utils = createUtils();

    expect(utils.isEditingMode({ editing: true })).toBe(true);
    expect(utils.isEditingMode({ dyniLayoutEditing: true })).toBe(true);
    expect(utils.isEditingMode({ editing: false, dyniLayoutEditing: false })).toBe(false);
    expect(utils.isEditingMode(null)).toBe(false);
  });
});
