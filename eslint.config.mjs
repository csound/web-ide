import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.builtin, ...globals.browser }
        },
        ignores: ["config/*", "scripts/*", "public/*", "*.test.tsx"],

        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-expressions": "off",
            "no-empty": "off",
            "unicorn/no-reduce": "off",
            "unicorn/no-array-for-each": "off",
            "unicorn/no-array-reduce": "off",
            "unicorn/no-array-callback-reference": "off",
            "unicorn/no-useless-undefined": "off",
            "unicorn/prevent-abbreviations": "off",
            "unicorn/no-abusive-eslint-disable": "off"
        },
        plugins: {
            "react-hooks": eslintPluginReactHooks,
            unicorn: eslintPluginUnicorn
        }
    }
);
