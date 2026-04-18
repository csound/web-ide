import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
    js.configs.recommended,
    prettier, // Disables ESLint rules that might conflict with Prettier
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                console: "readonly",
                document: "readonly",
                process: "readonly",
                window: "readonly",
                URL: "readonly",
                setTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off" // Often allowed in Puppeteer scripts for logging
        }
    }
];
