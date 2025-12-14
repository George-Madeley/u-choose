import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

import pluginJs from "@eslint/js";

export default defineConfig([
  globalIgnores([
    "**/node_modules/*",
    "**/public/*",
    "**/build/*",
    "**/dist/*",
    "**/src-tauri/*",
    "**/.react-router/*",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js: pluginJs },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "react/boolean-prop-naming": "error",
      "react/button-has-type": "error",
      "react/display-name": "error",
      "react/hook-use-state": "warn",
      "react/jsx-boolean-value": "warn",
      "react/jsx-handler-names": "warn",
      "react/jsx-pascal-case": "error",
      "react/jsx-sort-props": "warn",
      "react/jsx-uses-react": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/prefer-stateless-function": "error",
      "react/prop-types": "error",
    },
  },
]);
