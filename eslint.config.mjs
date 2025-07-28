import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReact from "eslint-plugin-react";

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.builtin,
                ...globals.browser,
                React: "readonly"
            },
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        ignores: ["config/*", "scripts/*", "public/*", "*.test.tsx"],
        settings: {
            react: {
                version: "detect"
            }
        },
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
            "unicorn/no-abusive-eslint-disable": "off",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off"
        },
        plugins: {
            "react-hooks": eslintPluginReactHooks,
            unicorn: eslintPluginUnicorn,
            react: eslintPluginReact
        }
    }
];
