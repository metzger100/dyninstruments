/**
 * @typedef {Object} MockCanvasContext
 * @property {(x: number, y: number) => void} moveTo
 * @property {(x: number, y: number) => void} lineTo
 * @property {() => void} stroke
 */

/** @type {MockCanvasContext} */
const incompatibleMock = {
  moveTo(x, y) {},
  stroke() {}
};

module.exports = { incompatibleMock };
