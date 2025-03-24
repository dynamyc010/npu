import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/*.js", "**/*.mjs", "!src/**/*.js"]), {
    extends: compat.extends("eslint:recommended", "prettier"),

    linterOptions: {
        reportUnusedDisableDirectives: true,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            GM: true,
            unsafeWindow: true,
            exportFunction: true,
        },

        ecmaVersion: 2018,
        sourceType: "commonjs",
    },

    rules: {
        "default-param-last": "error",
        "dot-notation": "error",
        eqeqeq: ["error", "always"],

        "lines-between-class-members": ["error", "always", {
            exceptAfterSingleLine: true,
        }],

        "no-dupe-class-members": "error",

        "no-empty": ["error", {
            allowEmptyCatch: true,
        }],

        "no-eval": "error",
        "no-invalid-this": "off",
        "no-loop-func": "error",
        "no-new-wrappers": "error",
        "no-param-reassign": "error",
        "no-redeclare": "error",
        "no-shadow": "error",
        "no-underscore-dangle": "off",
        "no-unused-expressions": "error",
        "no-unused-vars": ["error", {
            "caughtErrors": "none"
        }],
        "no-useless-constructor": "error",
        "no-var": "error",
        "object-shorthand": ["error", "always"],
        "one-var": ["error", "never"],
        "prefer-const": "error",
        "prefer-template": "error",
        radix: "error",
    },
}]);
