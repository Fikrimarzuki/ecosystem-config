import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Lints the website only. Registry scripts and tests keep their existing Node test coverage.
export default tseslint.config(
  { ignores: ["**/node_modules/**", "site/dist/**", "site/src/generated/**", "site/public/**", "config/**", "dist/**", "scripts/**", "test/**", "docs/**", "schema/**"] },
  {
    files: ["site/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  { files: ["site/scripts/**/*.{js,mjs}"], extends: [js.configs.recommended], languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...globals.node } } },
  { files: ["site/scripts/sw.template.js"], languageOptions: { sourceType: "script", globals: { ...globals.serviceworker, __PRECACHE__: "readonly" } } },
);
