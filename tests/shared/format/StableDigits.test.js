const { loadFresh } = require("../../helpers/load-umd");

describe("StableDigits", function () {
  function createApi() {
    const placeholderNormalize = loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
    return loadFresh("shared/widget-kits/format/StableDigits.js").create({}, {
      getModule(id) {
        if (id === "PlaceholderNormalize") {
          return placeholderNormalize;
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  it("returns padded and fallback text pair for finite numeric values", function () {
    const api = createApi();
    const out = api.normalize("7.5", {
      integerWidth: 3,
      reserveSignSlot: true
    });

    expect(out.padded).toBe(" 007.5");
    expect(out.fallback).toBe("7.5");
  });

  it("preserves integer overflow and fractional digits without truncation", function () {
    const api = createApi();
    const out = api.normalize("122.50", {
      integerWidth: 2,
      reserveSignSlot: true
    });

    expect(out.padded).toBe(" 122.50");
    expect(out.fallback).toBe("122.50");
  });

  it("keeps negative sign and reserves side suffix slot when requested", function () {
    const api = createApi();
    const out = api.normalize("-4.2", {
      integerWidth: 2,
      reserveSignSlot: false,
      sideSuffix: "L",
      reserveSideSuffixSlot: true
    });

    expect(out.padded).toBe("-04.2L");
    expect(out.fallback).toBe("-4.2L");
  });

  it("uses blank side-suffix slot in padded output when no side is present", function () {
    const api = createApi();
    const out = api.normalize("4.2", {
      integerWidth: 2,
      reserveSignSlot: false,
      sideSuffix: "",
      reserveSideSuffixSlot: true
    });

    expect(out.padded).toBe("04.2 ");
    expect(out.fallback).toBe("4.2");
  });

  it("short-circuits placeholders unchanged for padded and fallback", function () {
    const api = createApi();
    const out = api.normalize("---", {
      integerWidth: 3,
      reserveSignSlot: true,
      sideSuffix: "R",
      reserveSideSuffixSlot: true
    });

    expect(out.padded).toBe("---");
    expect(out.fallback).toBe("---");
  });

  it("passes through non-numeric text unchanged", function () {
    const api = createApi();
    const out = api.normalize("HH:MM", {
      integerWidth: 2,
      reserveSignSlot: true
    });

    expect(out.padded).toBe("HH:MM");
    expect(out.fallback).toBe("HH:MM");
  });
});
