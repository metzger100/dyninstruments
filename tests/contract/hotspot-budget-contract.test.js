const fs = require("node:fs");
const path = require("node:path");

const POLICY_PATH = path.join(process.cwd(), "tools/quality-policy/hotspot-budgets.json");

// A frozen ceiling per hotspot entry: raising a hotspot-budgets.json value above its frozen
// counterpart here requires a deliberate, reviewed co-edit of both files in the same change,
// so a budget can never silently creep upward.
/** @type {Record<string, number>} */
const FROZEN_MAX_BUDGETS = {
  "shared/widget-kits/radial/RadialTextLayout.js": 290,
  "widgets/radial/WindRadialWidget/WindRadialWidget.js": 370
};

describe("hotspot budget contract", function () {
  it("keeps known hotspot files below their local growth budgets", function () {
    expect(scanRepository()).toEqual([]);
  });

  it("rejects missing hotspot files", function () {
    expect(validateMissingFile("shared/widget-kits/radial/RadialTextLayout.js")).toEqual([
      "shared/widget-kits/radial/RadialTextLayout.js:1 Missing hotspot file."
    ]);
  });

  it("rejects hotspot files that grow beyond budget", function () {
    const text = Array.from({ length: 291 }, function (_, i) {
      return "const x" + i + " = " + i + ";";
    }).join("\n");

    expect(validateHotspotText("fixture.js", text, 290)).toEqual([
      "fixture.js:1 Hotspot file has 291 non-empty lines (> 290). Split before further growth."
    ]);
  });

  it("never allows a policy budget to exceed its frozen ceiling", function () {
    const entries = readHotspotPolicy();

    const increased = entries.filter(function (item) {
      return item.maxNonEmpty > FROZEN_MAX_BUDGETS[item.rel];
    });

    expect(increased).toEqual([]);
  });

  it("flags a seeded budget increase above the frozen ceiling", function () {
    const seeded = { rel: "shared/widget-kits/radial/RadialTextLayout.js", maxNonEmpty: 291 };

    expect(seeded.maxNonEmpty > FROZEN_MAX_BUDGETS[seeded.rel]).toBe(true);
  });
});

/** @returns {{rel: string, maxNonEmpty: number}[]} */
function readHotspotPolicy() {
  return JSON.parse(fs.readFileSync(POLICY_PATH, "utf8")).entries;
}

function scanRepository() {
  return readHotspotPolicy().flatMap(function (item) {
    const abs = path.join(process.cwd(), item.rel);
    if (!fs.existsSync(abs)) return validateMissingFile(item.rel);
    return validateHotspotText(item.rel, fs.readFileSync(abs, "utf8"), item.maxNonEmpty);
  });
}

/** @param {string} rel */
function validateMissingFile(rel) {
  return [rel + ":1 Missing hotspot file."];
}

/** @param {string} rel @param {string} text @param {number} maxNonEmpty */
function validateHotspotText(rel, text, maxNonEmpty) {
  const count = countNonEmptyLines(text);
  if (count <= maxNonEmpty) return [];
  return [
    rel + ":1 Hotspot file has " + count + " non-empty lines (> " + maxNonEmpty + "). Split before further growth."
  ];
}

/** @param {string} text */
function countNonEmptyLines(text) {
  let count = 0;
  text.split(/\r?\n/).forEach(function (line) {
    if (line.trim()) count += 1;
  });
  return count;
}
