import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
    js.configs.recommended,
    prettier, // Disables ESLint rules that might conflict with Prettier
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.node, ...globals.browser }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off" // Often allowed in Puppeteer scripts for logging
        }
    }
];
