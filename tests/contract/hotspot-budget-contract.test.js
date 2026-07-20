const fs = require("node:fs");
const path = require("node:path");

const HOTSPOT_LIMITS = [
  { rel: "shared/widget-kits/radial/RadialTextLayout.js", maxNonEmpty: 290 },
  { rel: "widgets/radial/WindRadialWidget/WindRadialWidget.js", maxNonEmpty: 370 }
];

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
});

function scanRepository() {
  return HOTSPOT_LIMITS.flatMap(function (item) {
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
