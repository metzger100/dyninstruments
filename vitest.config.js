/**
 * Test config for dyninstruments.
 * Coverage is focused on core logic contracts and runtime integration points.
 */
const unitNodeTests = [
  "tests/tools/**/*.test.js",
  "tests/shared/property/**/*.test.js",
  "tests/shared/value/**/*.test.js",
  "tests/shared/format/**/*.test.js",
  "tests/shared/layout/**/*.test.js",
  "tests/shared/linear/LinearGaugeMath.test.js",
  "tests/shared/radial/RadialAngleMath.test.js",
  "tests/shared/radial/RadialTickMath.test.js",
  "tests/shared/radial/RadialValueMath.test.js",
  "tests/cluster/mappers/**/*.test.js",
  "tests/cluster/viewmodels/**/*.test.js",
  "tests/config/shared/**/*.test.js",
  "tests/config/clusters/**/*.test.js",
  "tests/config/cluster-routes.test.js"
];

const contractTests = [
  "tests/contract/**/*.test.js",
  "tests/config/components.test.js",
  "tests/config/widget-definitions.test.js",
  "tests/layouts/bundled-layouts.test.js",
  "tests/plugin/plugin-bootstrap.test.js",
  "tests/plugin/plugin-module-bootstrap.test.js",
  "tests/runtime/component-loader*.test.js",
  "tests/runtime/init.test.js",
  "tests/runtime/namespace.test.js",
  "tests/runtime/selector-migration-guard.test.js"
];

const negativeFixtureTests = ["tests/tools/lint-fixtures/**"];

module.exports = {
  test: {
    allowOnly: false,
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup/vitest.setup.js"],
    include: ["tests/**/*.test.js"],
    exclude: ["tests/tools/lint-fixtures/**"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "plugin.js",
        "plugin.mjs",
        "config/**/*.js",
        "runtime/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "widgets/**/*.js"
      ],
      exclude: ["tests/**", "documentation/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 65,
        "cluster/mappers/**/*.js": {
          lines: 92,
          branches: 55
        },
        "runtime/**/*.js": {
          lines: 85,
          branches: 70
        },
        "shared/widget-kits/radial/Radial{Angle,Tick,Value}Math.js": {
          lines: 90,
          branches: 50
        },
        "config/clusters/{nav,environment,vessel}.js": {
          lines: 95,
          branches: 70
        }
      }
    },
    projects: [
      {
        test: {
          name: "unit-node",
          allowOnly: false,
          environment: "node",
          globals: true,
          include: unitNodeTests,
          exclude: negativeFixtureTests,
          coverage: {
            enabled: false
          }
        }
      },
      {
        test: {
          name: "contract",
          allowOnly: false,
          environment: "node",
          globals: true,
          include: contractTests,
          coverage: {
            enabled: false
          }
        }
      },
      {
        test: {
          name: "unit-dom",
          allowOnly: false,
          environment: "jsdom",
          globals: true,
          setupFiles: ["tests/setup/vitest.setup.js"],
          include: ["tests/**/*.test.js"],
          exclude: negativeFixtureTests.concat(unitNodeTests, contractTests),
          coverage: {
            enabled: false
          }
        }
      }
    ]
  }
};
