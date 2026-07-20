const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("PositionCoordinateFormatting", function () {
  function createApi() {
    const module = loadFresh("shared/widget-kits/text/PositionCoordinateFormatting.js");
    return module.create({}, createComponentContextMock());
  }

  function createHelpers() {
    const valueMath = loadFresh("shared/widget-kits/value/ValueMath.js").create({}, createComponentContextMock());
    const placeholderNormalize = loadFresh("shared/widget-kits/format/PlaceholderNormalize.js").create(
      {},
      createComponentContextMock()
    );
    return { toOptionalFiniteNumber: valueMath.toOptionalFiniteNumber, placeholderNormalize: placeholderNormalize };
  }

  /** @param {(value: unknown, cfg: any) => unknown} [applyFormatterImpl] */
  function makeContext(applyFormatterImpl) {
    return {
      format: {
        applyFormatter:
          applyFormatterImpl ||
          function (value, cfg) {
            return typeof cfg.formatter === "function" ? cfg.formatter(value) : cfg.default;
          }
      }
    };
  }

  /** @param {any} api @param {any} rawValue @param {any} axis @param {any} defaultText @param {any} props @param {any} context @param {any} placeholderNormalize @param {any} toOptionalFiniteNumber */
  function formatAxisValue(
    api,
    rawValue,
    axis,
    defaultText,
    props,
    context,
    placeholderNormalize,
    toOptionalFiniteNumber
  ) {
    return api.formatAxisValue(rawValue, axis, defaultText, props, {
      componentContext: context,
      placeholderNormalize,
      toOptionalFiniteNumber
    });
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/text/PositionCoordinateFormatting.js", context);

    expect(context.DyniComponents.DyniPositionCoordinateFormatting).toBeTruthy();
    expect(context.DyniComponents.DyniPositionCoordinateFormatting.id).toBe("PositionCoordinateFormatting");
  });

  describe("normalizeDisplayVariant", function () {
    it("passes through dateTime and timeStatus, defaulting everything else to position", function () {
      const api = createApi();

      expect(api.normalizeDisplayVariant("dateTime")).toBe("dateTime");
      expect(api.normalizeDisplayVariant("timeStatus")).toBe("timeStatus");
      expect(api.normalizeDisplayVariant("position")).toBe("position");
      expect(api.normalizeDisplayVariant("bogus")).toBe("position");
      expect(api.normalizeDisplayVariant(undefined)).toBe("position");
    });
  });

  describe("readCoordinatePair", function () {
    it("returns null for non-object values", function () {
      const api = createApi();
      const { toOptionalFiniteNumber } = createHelpers();

      expect(api.readCoordinatePair(null, false, toOptionalFiniteNumber)).toBeNull();
      expect(api.readCoordinatePair("nope", false, toOptionalFiniteNumber)).toBeNull();
    });

    it("returns null for short arrays but reads a two-element array as [lon, lat]", function () {
      const api = createApi();
      const { toOptionalFiniteNumber } = createHelpers();

      expect(api.readCoordinatePair([1], false, toOptionalFiniteNumber)).toBeNull();
      expect(api.readCoordinatePair([12.5, 48.5], true, toOptionalFiniteNumber)).toEqual({ lat: 48.5, lon: 12.5 });
    });

    it("returns raw lat/lon in rawMode without numeric coercion", function () {
      const api = createApi();
      const { toOptionalFiniteNumber } = createHelpers();

      expect(api.readCoordinatePair({ lat: "x", lon: "y" }, true, toOptionalFiniteNumber)).toEqual({
        lat: "x",
        lon: "y"
      });
    });

    it("returns null when either coerced axis is not finite", function () {
      const api = createApi();
      const { toOptionalFiniteNumber } = createHelpers();

      expect(api.readCoordinatePair({ lat: "x", lon: 1 }, false, toOptionalFiniteNumber)).toBeNull();
      expect(api.readCoordinatePair({ lat: 48.5, lon: 12.5 }, false, toOptionalFiniteNumber)).toEqual({
        lat: 48.5,
        lon: 12.5
      });
    });
  });

  describe("resolveVariantProps", function () {
    it("layers dateTime formatter defaults onto the props", function () {
      const api = createApi();

      const result = api.resolveVariantProps({ displayVariant: "dateTime", hideSeconds: true });

      expect(result.coordinateFormatterLat).toBe("formatDate");
      expect(result.coordinateFormatterLon).toBe("formatClock");
      expect(result.coordinateFlatFromAxes).toBe(true);
      expect(result.coordinateRawValues).toBe(true);
    });

    it("layers timeStatus formatter defaults onto the props with formatTime by default", function () {
      const api = createApi();

      const result = api.resolveVariantProps({ displayVariant: "timeStatus" });

      expect(typeof result.coordinateFormatterLat).toBe("function");
      expect(result.coordinateFormatterLon).toBe("formatTime");
    });

    it("passes props through unchanged for the position variant", function () {
      const api = createApi();
      const props = { displayVariant: "position", foo: 1 };

      expect(api.resolveVariantProps(props)).toBe(props);
    });
  });

  describe("formatAxisValue gps-status formatter (isGpsValid via resolveVariantProps)", function () {
    /** @param {unknown} rawValue */
    function statusFor(rawValue) {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const props = api.resolveVariantProps({ displayVariant: "timeStatus" });
      return formatAxisValue(
        api,
        rawValue,
        "lat",
        "---",
        props,
        makeContext(),
        placeholderNormalize,
        toOptionalFiniteNumber
      );
    }

    it("treats boolean true as valid and boolean false as invalid", function () {
      expect(statusFor(true)).toBe("🟢");
      expect(statusFor(false)).toBe("🔴");
    });

    it("treats a finite non-zero number as valid and zero/non-finite as invalid", function () {
      expect(statusFor(5)).toBe("🟢");
      expect(statusFor(0)).toBe("🔴");
      expect(statusFor(Infinity)).toBe("🔴");
    });

    it("treats blank/off/false/no strings as invalid and any other string as valid", function () {
      expect(statusFor("")).toBe("🔴");
      expect(statusFor("0")).toBe("🔴");
      expect(statusFor("false")).toBe("🔴");
      expect(statusFor("off")).toBe("🔴");
      expect(statusFor("no")).toBe("🔴");
      expect(statusFor("yes")).toBe("🟢");
    });

    it("falls back to boolean coercion for other value types", function () {
      expect(statusFor({})).toBe("🟢");
    });
  });

  describe("formatAxisValue formatter selection (pickAxisFormatter)", function () {
    it("uses the per-axis override formatter and per-axis params when both are set", function () {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const seen = /** @type {any[]} */ ([]);
      const context = makeContext(function (value, cfg) {
        seen.push(cfg);
        return "ok";
      });

      formatAxisValue(
        api,
        1,
        "lat",
        "---",
        { coordinateFormatterLat: "customLat", coordinateFormatterParametersLat: ["x", "y"] },
        context,
        placeholderNormalize,
        toOptionalFiniteNumber
      );

      expect(seen[0].formatter).toBe("customLat");
      expect(seen[0].formatterParameters).toEqual(["x", "y"]);
    });

    it("splits a string params override on commas and appends the axis when there is no override", function () {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const seen = /** @type {any[]} */ ([]);
      const context = makeContext(function (value, cfg) {
        seen.push(cfg);
        return "ok";
      });

      formatAxisValue(
        api,
        1,
        "lon",
        "---",
        { coordinateFormatterParameters: "a,b" },
        context,
        placeholderNormalize,
        toOptionalFiniteNumber
      );

      expect(seen[0].formatterParameters).toEqual(["a", "b", "lon"]);
    });

    it("falls back to formatLonLatsDecimal with empty params when nothing is configured", function () {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const seen = /** @type {any[]} */ ([]);
      const context = makeContext(function (value, cfg) {
        seen.push(cfg);
        return "ok";
      });

      formatAxisValue(api, 1, "lat", "---", {}, context, placeholderNormalize, toOptionalFiniteNumber);

      expect(seen[0].formatter).toBe("formatLonLatsDecimal");
      expect(seen[0].formatterParameters).toEqual(["lat"]);
    });

    it("uses the generic coordinateFormatter override when no per-axis override is set", function () {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const seen = /** @type {any[]} */ ([]);
      const context = makeContext(function (value, cfg) {
        seen.push(cfg);
        return "ok";
      });

      formatAxisValue(
        api,
        1,
        "lat",
        "---",
        { coordinateFormatter: "sharedFormatter" },
        context,
        placeholderNormalize,
        toOptionalFiniteNumber
      );

      expect(seen[0].formatter).toBe("sharedFormatter");
    });
  });

  describe("formatAxisValue value gating", function () {
    it("returns the default text in rawMode when the raw value is null or NaN", function () {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const context = makeContext();

      expect(
        formatAxisValue(
          api,
          null,
          "lat",
          "---",
          { coordinateRawValues: true },
          context,
          placeholderNormalize,
          toOptionalFiniteNumber
        )
      ).toBe("---");
      expect(
        formatAxisValue(
          api,
          NaN,
          "lat",
          "---",
          { coordinateRawValues: true },
          context,
          placeholderNormalize,
          toOptionalFiniteNumber
        )
      ).toBe("---");
    });

    it("returns the default text outside rawMode when the value cannot be coerced to a finite number", function () {
      const api = createApi();
      const { toOptionalFiniteNumber, placeholderNormalize } = createHelpers();
      const context = makeContext();

      expect(
        formatAxisValue(api, "not-a-number", "lat", "---", {}, context, placeholderNormalize, toOptionalFiniteNumber)
      ).toBe("---");
    });
  });

  describe("isTimeStatusMarker", function () {
    it("matches only the status glyphs", function () {
      const api = createApi();

      expect(api.isTimeStatusMarker("🟢")).toBe(true);
      expect(api.isTimeStatusMarker("🔴")).toBe(true);
      expect(api.isTimeStatusMarker("12:00")).toBe(false);
    });
  });

  describe("readActualTextHeight", function () {
    it("returns null when metrics is not an object", function () {
      const api = createApi();

      expect(api.readActualTextHeight(null)).toBeNull();
      expect(api.readActualTextHeight(undefined)).toBeNull();
    });

    it("returns null when ascent/descent are missing or non-finite", function () {
      const api = createApi();

      expect(api.readActualTextHeight({})).toBeNull();
    });

    it("returns null when the combined height is not positive", function () {
      const api = createApi();

      expect(api.readActualTextHeight({ actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 })).toBeNull();
    });

    it("returns the summed ascent/descent when both are finite and positive", function () {
      const api = createApi();

      expect(api.readActualTextHeight({ actualBoundingBoxAscent: 6, actualBoundingBoxDescent: 2 })).toBe(8);
    });
  });
});
