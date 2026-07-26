const { loadFresh } = require("../../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

const { createCompassCachingHarness, makeCompassProps } = require("./CompassRadialWidget.caching.harness.js");

module.exports = {
  createCompassCachingHarness,
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  loadFresh,
  makeCompassProps
};
