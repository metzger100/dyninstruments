const { createHarness, createMockCanvas, createMockContext2D } = require("./XteDisplayWidget.harness.js");

const { makeProps, fillTextValues } = require("./XteDisplayWidget.test-model.js");

module.exports = {
  createHarness,
  createMockCanvas,
  createMockContext2D,
  fillTextValues,
  makeProps
};
