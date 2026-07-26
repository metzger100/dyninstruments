const { setupComponentLoader, installComponentContextRuntime } = require("./component-loader.harness");

const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const { createDomHarness } = require("../helpers/mock-dom");

const { flushPromises } = require("../helpers/async");

module.exports = {
  createDomHarness,
  createScriptContext,
  flushPromises,
  installComponentContextRuntime,
  runIifeScript,
  setupComponentLoader
};
