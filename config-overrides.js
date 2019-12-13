const { addBabelPlugin, addBabelPreset, override } = require("customize-cra");

module.exports = override(
    addBabelPlugin("emotion"),
    addBabelPreset("@emotion/babel-preset-css-prop")
);
