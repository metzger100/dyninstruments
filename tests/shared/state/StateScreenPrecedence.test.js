const { loadFresh } = require("../../helpers/load-umd");

describe("StateScreenPrecedence", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js").create();
  }

  it("returns the first candidate whose when flag is truthy", function () {
    const precedence = createApi();

    const kind = precedence.pickFirst([
      { kind: "disconnected", when: false },
      { kind: "noRoute", when: 1 },
      { kind: "data", when: true }
    ]);

    expect(kind).toBe("noRoute");
  });

  it("falls through to data when no candidate matches", function () {
    const precedence = createApi();

    expect(precedence.pickFirst([
      { kind: "disconnected", when: false },
      { kind: "noRoute", when: 0 }
    ])).toBe("data");
  });

  it("returns data for an empty list", function () {
    const precedence = createApi();

    expect(precedence.pickFirst([])).toBe("data");
  });

  it("validates candidate shape", function () {
    const precedence = createApi();

    expect(() => precedence.pickFirst("not-an-array")).toThrow("candidates must be an array");
    expect(() => precedence.pickFirst([{ when: true }])).toThrow("requires a non-empty kind");
    expect(() => precedence.pickFirst([{ kind: "disconnected" }])).toThrow("requires a when field");
  });
});
