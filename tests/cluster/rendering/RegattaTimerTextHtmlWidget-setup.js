const {
  parseStyle,
  readPx,
  toTimerSeconds,
  buildRenderer,
  makeProps,
  withSurfacePolicy,
  createMountedRenderer,
  installFakeTimerHooks
} = require("./RegattaTimerTextHtmlWidget.harness.js");

const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

installFakeTimerHooks();

module.exports = {
  buildRenderer,
  createMountedRenderer,
  createScriptContext,
  installFakeTimerHooks,
  makeProps,
  parseStyle,
  readPx,
  runIifeScript,
  toTimerSeconds,
  withSurfacePolicy
};
