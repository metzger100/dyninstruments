const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

module.exports = {
  createComponentContextMock,
  createScriptContext,
  loadFresh,
  runIifeScript
};
