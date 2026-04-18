const fs = require("node:fs");
const path = require("node:path");

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFontFaceBlocks(cssText) {
  return cssText.match(/@font-face\s*\{[\s\S]*?\}/g) || [];
}

describe("plugin.css font-face rules", function () {
  it("declares four bundled Roboto font faces with local-first src ordering", function () {
    const cssPath = path.join(process.cwd(), "plugin.css");
    const cssText = fs.readFileSync(cssPath, "utf8");
    const fontFaceBlocks = extractFontFaceBlocks(cssText);
    const expectedFaces = [
      {
        family: "Roboto",
        weight: "400",
        locals: ["Roboto", "Roboto Regular"],
        file: "Roboto-Regular.woff2"
      },
      {
        family: "Roboto",
        weight: "700",
        locals: ["Roboto Bold", "Roboto-Bold"],
        file: "Roboto-Bold.woff2"
      },
      {
        family: "Roboto Mono",
        weight: "400",
        locals: ["Roboto Mono", "RobotoMono-Regular"],
        file: "RobotoMono-Regular.woff2"
      },
      {
        family: "Roboto Mono",
        weight: "700",
        locals: ["Roboto Mono Bold", "RobotoMono-Bold"],
        file: "RobotoMono-Bold.woff2"
      }
    ];

    expect(fontFaceBlocks).toHaveLength(4);

    expectedFaces.forEach(function (face) {
      const familyPattern = new RegExp('font-family:\\s*"' + escapeRegExp(face.family) + '"');
      const weightPattern = new RegExp("font-weight:\\s*" + escapeRegExp(face.weight));
      const block = fontFaceBlocks.find(function (candidate) {
        return familyPattern.test(candidate) && weightPattern.test(candidate);
      });

      expect(block).toBeDefined();
      expect(block).toMatch(/font-style:\s*normal/);
      expect(block).toMatch(/font-display:\s*swap/);
      face.locals.forEach(function (localName) {
        expect(block).toContain('local("' + localName + '")');
      });
      const localIndex = block.indexOf("local(");
      const urlNeedle = 'url("assets/fonts/' + face.file + '")';
      const urlIndex = block.indexOf(urlNeedle);
      expect(localIndex).toBeGreaterThan(-1);
      expect(urlIndex).toBeGreaterThan(localIndex);
      expect(block).toContain(urlNeedle);
      expect(block).toContain('format("woff2")');
    });
  });
});
