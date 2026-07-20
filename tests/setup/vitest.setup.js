/**
 * Module: VitestCanvasSetup - Deterministic jsdom canvas 2D mock for tests
 * Documentation: documentation/conventions/coding-standards.md
 * Depends: Vitest setupFiles, jsdom HTMLCanvasElement
 */
(function () {
  "use strict";

  /** @param {string} [fontValue] @returns {number} */
  function resolveFontPx(fontValue) {
    var match = /(\d+(?:\.\d+)?)px/.exec(fontValue || "");
    return match ? Number(match[1]) : 16;
  }

  var mock2dContext = {
    font: "16px sans-serif",
    /** @param {any} text */
    measureText: function (text) {
      var safeText = text == null ? "" : String(text);
      var fontPx = resolveFontPx(this.font);
      var ascent = fontPx * 0.78;
      var descent = fontPx * 0.22;
      return {
        width: safeText.length * fontPx * 0.52,
        actualBoundingBoxAscent: ascent,
        actualBoundingBoxDescent: descent,
        fontBoundingBoxAscent: ascent,
        fontBoundingBoxDescent: descent
      };
    },
    save: function () {},
    restore: function () {},
    scale: function () {},
    translate: function () {},
    clearRect: function () {},
    fillRect: function () {},
    beginPath: function () {},
    fill: function () {},
    stroke: function () {},
    fillText: function () {},
    strokeText: function () {}
  };

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    /** @param {string} type @returns {any} */
    function (type) {
      if (type === "2d") {
        return mock2dContext;
      }
      return null;
    }
  );
})();
