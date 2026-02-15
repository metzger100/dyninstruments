/**
 * Test config for dyninstruments.
 * Coverage is focused on core logic contracts and runtime integration points.
 */
module.exports = {
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.js"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "plugin.js",
        "cluster/**/*.js",
        "runtime/**/*.js",
        "config/shared/*.js",
        "config/clusters/*.js",
        "shared/widget-kits/gauge/GaugeAngleMath.js",
        "shared/widget-kits/gauge/GaugeTickMath.js",
        "shared/widget-kits/gauge/GaugeValueMath.js"
      ],
      exclude: [
        "tests/**",
        "documentation/**",
        "tools/check-docs.mjs"
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 65
      }
    }
  }
};
