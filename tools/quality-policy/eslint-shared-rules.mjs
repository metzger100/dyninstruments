/**
 * @file eslint-shared-rules - Strict lint rules shared by role-model repositories
 */

export const SHARED_STRICT_RULES = {
  eqeqeq: "error",
  "no-warning-comments": [
    "error",
    {
      location: "anywhere",
      terms: ["eslint-disable", "@ts-ignore", "@ts-expect-error", "@ts-nocheck", "prettier-ignore", "istanbul ignore"]
    }
  ],
  "no-unused-vars": ["error", { args: "none", caughtErrors: "all", caughtErrorsIgnorePattern: "^_" }],
  "no-useless-assignment": "error"
};
