// jest.config.js
const { jsWithBabel: tsjPreset } = require("ts-jest/presets");

module.exports = {
    automock: false,
    setupFiles: ["<rootDir>/scripts/setupJest.js"],
    transform: {
        ...tsjPreset.transform,
        "^.+\\.svg$": "babel-jest"
    },
    roots: ["<rootDir>/src"],
    testMatch: [
        "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
        "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"
    ],
    transformIgnorePatterns: [
        "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$",
        "^.+\\.module\\.(css|sass|scss)$"
    ],
    moduleNameMapper: {
        "^react-native$": "react-native-web",
        "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
        "^@root(.*)$": "<rootDir>/src$1",
        "^@styles(.*)$": "<rootDir>/src/styles$1",
        "^@comp(.*)$": "<rootDir>/src/components$1",
        "^@elem(.*)$": "<rootDir>/src/elements$1",
        "^@config(.*)$": "<rootDir>/src/config$1",
        "^.*\\.svg$": "<rootDir>/__mocks__/svgMock.js",
        "\\.(jpg|jpeg|png|gif|orc|sco|csd|udo)$":
            "<rootDir>/__mocks__/fileMock.js",
        "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
    }
};
