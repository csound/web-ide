const {
    addBabelPlugin,
    addBabelPreset,
    addWebpackAlias,
    override
} = require("customize-cra");
const path = require("path");

module.exports = override(
    addBabelPlugin("emotion"),
    addBabelPreset("@emotion/babel-preset-css-prop"),
    addWebpackAlias({
        ["@root"]: path.resolve(__dirname, "./src"),
        ["@styles"]: path.resolve(__dirname, "./src/styles"),
        ["@comp"]: path.resolve(__dirname, "./src/components"),
        ["@elem"]: path.resolve(__dirname, "./src/elements"),
        ["@config"]: path.resolve(__dirname, "./src/config"),
        ["@store"]: path.resolve(__dirname, "./src/store")
    })
);
