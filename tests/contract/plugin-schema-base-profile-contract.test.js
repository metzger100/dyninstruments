const fs = require("node:fs");
const path = require("node:path");
const { default: Ajv } = require("ajv");

const root = process.cwd();
const corpus = require("../../tools/quality-policy/plugin-schema-corpus.json");

describe("AvNav plugin.json base/profile schema composition contract", function () {
  it("locks the intended local generic case payload explicitly", function () {
    expect(corpus.genericBase).toEqual({
      valid: [{}, { anyKey: "anyValue" }, { version: "1.2.3" }],
      invalid: [[], "not-an-object", null, 42, true]
    });
  });

  it("validates every generic base case against the base schema alone", function () {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(readSchema("avnav-plugin-base.schema.json"));

    corpus.genericBase.valid.forEach(function (candidate) {
      expect(validate(candidate), JSON.stringify(candidate)).toBe(true);
    });
    corpus.genericBase.invalid.forEach(function (candidate) {
      expect(validate(candidate), JSON.stringify(candidate)).toBe(false);
    });
  });

  it("validates every Dyn layouts-profile case against the composed profile schema", function () {
    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(readSchema("avnav-plugin-base.schema.json"));
    const validate = ajv.compile(readSchema("plugin.schema.json"));

    corpus.dynLayoutsProfile.valid.forEach(function (candidate) {
      expect(validate(candidate), JSON.stringify(candidate)).toBe(true);
    });
    corpus.dynLayoutsProfile.invalid.forEach(function (candidate) {
      expect(validate(candidate), JSON.stringify(candidate)).toBe(false);
    });
  });

  it("keeps the profile schema rejecting any property the base schema does not itself grant", function () {
    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(readSchema("avnav-plugin-base.schema.json"));
    const validate = ajv.compile(readSchema("plugin.schema.json"));

    expect(
      validate({ layouts: [{ name: "A", file: "layouts/a.json" }], unexpectedProfileKey: true }),
      "profile schema must still reject unknown top-level keys"
    ).toBe(false);
  });

  it("validates the real repository plugin.json against the composed profile schema", function () {
    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(readSchema("avnav-plugin-base.schema.json"));
    const validate = ajv.compile(readSchema("plugin.schema.json"));
    const pluginJson = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"), "utf8"));

    expect(validate(pluginJson), JSON.stringify(validate.errors)).toBe(true);
  });
});

/** @param {string} fileName @returns {object} */
function readSchema(fileName) {
  return JSON.parse(fs.readFileSync(path.join(root, "schemas", fileName), "utf8"));
}
