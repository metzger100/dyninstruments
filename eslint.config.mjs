import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";

const browserRuntimeGlobals = {
  ...globals.browser,
  AVNAV_BASE_URL: "readonly",
  DyniPlugin: "readonly",
  define: "readonly",
  module: "readonly",
  process: "readonly"
};

const nodeGlobals = {
  ...globals.node
};

const testGlobals = {
  ...globals.browser,
  ...globals.node,
  ...globals.vitest
};

const noRuntimeModules = [
  "error",
  {
    selector: "ImportDeclaration",
    message: "Runtime JavaScript is loaded as classic scripts; do not use import."
  },
  {
    selector: "ExportAllDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration",
    message: "Runtime JavaScript is loaded as classic scripts; do not use export."
  }
];

export default [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "artifacts/**",
      "releases/**",
      "exec-plans/**",
      "tests/tools/lint-fixtures/**",
      "widgets/lint-fixtures/**",
      "tools/lint-fixtures/**"
    ]
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    },
    plugins: {
      "eslint-comments": eslintComments
    },
    rules: {
      ...js.configs.recommended.rules,
      eqeqeq: ["error", "smart"],
      "eslint-comments/no-duplicate-disable": "error",
      "eslint-comments/no-unused-disable": "error",
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      "no-useless-assignment": "error"
    }
  },
  {
    files: [
      "plugin.js",
      "plugin.mjs",
      "config/**/*.js",
      "runtime/**/*.js",
      "shared/**/*.js",
      "cluster/**/*.js",
      "widgets/**/*.js"
    ],
    plugins: {
      jsdoc
    },
    rules: {
      "jsdoc/require-file-overview": "error"
    }
  },
  {
    files: ["plugin.js", "config/**/*.js", "runtime/**/*.js", "shared/**/*.js", "cluster/**/*.js", "widgets/**/*.js"],
    languageOptions: {
      globals: browserRuntimeGlobals,
      sourceType: "script"
    },
    rules: {
      // These classic-script surfaces retain intentionally shared UMD callback parameters and host-boundary values.
      "no-restricted-globals": [
        "error",
        {
          name: "isFinite",
          message: "Use Number.isFinite(...) for explicit numeric checks."
        }
      ],
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "no-restricted-syntax": noRuntimeModules
    }
  },
  {
    files: ["plugin.mjs"],
    languageOptions: {
      globals: browserRuntimeGlobals,
      sourceType: "module"
    }
  },
  {
    files: ["tools/**/*.mjs", "eslint.config.mjs"],
    languageOptions: {
      globals: nodeGlobals,
      sourceType: "module"
    }
  },
  {
    files: ["tools/test-data/**/*.js"],
    languageOptions: {
      globals: nodeGlobals,
      sourceType: "commonjs"
    }
  },
  {
    files: ["tools/lint-fixtures/**/*.js"],
    languageOptions: {
      globals: browserRuntimeGlobals,
      sourceType: "script"
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "isFinite",
          message: "Use Number.isFinite(...) for explicit numeric checks."
        }
      ]
    }
  },
  {
    files: ["tests/**/*.js", "vitest.config.js"],
    languageOptions: {
      globals: testGlobals,
      sourceType: "commonjs"
    },
    rules: {
      // Split test files share setup globals and partial-harness bindings by design.
      "no-empty": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-useless-assignment": "off"
    }
  },
  {
    files: ["tests/**/*.test.js"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[computed!=true][property.name=/^(only|skip|todo)$/]",
          message: "Focused or disabled test modifiers are not allowed. Remove .only, .skip, or .todo."
        },
        {
          selector: "MemberExpression[computed=true][property.value=/^(only|skip|todo)$/]",
          message: "Focused or disabled test modifiers are not allowed. Remove .only, .skip, or .todo."
        }
      ]
    }
  }
];
