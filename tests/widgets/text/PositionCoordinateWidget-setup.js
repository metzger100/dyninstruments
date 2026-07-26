const {
  makeComponentContext,
  fillTextValues,
  captureTextCalls,
  parseFontPx,
  findTextCall
} = require("./PositionCoordinateWidget.harness.js");

const { loadFresh, createMockCanvas, createMockContext2D } = require("./PositionCoordinateWidget.harness.js");

module.exports = {
  captureTextCalls,
  createMockCanvas,
  createMockContext2D,
  fillTextValues,
  findTextCall,
  loadFresh,
  makeComponentContext,
  parseFontPx
};
