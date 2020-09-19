// uploadSourcemaps.js
const path = require("path");
const { upload } = require("sentry-files");
const { version } = require("../package.json");

upload({
    version: version,
    organization: "csound",
    project: process.env.SENTRY_PROJECT,
    token: process.env.SENTRY_AUTH_TOKEN,
    files: getFiles()
})
    .then(data => console.log("----- SUCCESS ----\n", data))
    .catch(error => console.log("---- ERROR ----\n", error));
function getFiles() {
    const BUILD_DIR = "build";
    const assetsFile = path.resolve(BUILD_DIR, "asset-manifest.json");
    const filePaths = require(assetsFile);
    const jsFilesRegex = /(\.js(.map)?)$/;
    const files = Object.keys(filePaths)
        .filter(f => jsFilesRegex.test(f))
        .map(f => ({
            name: `${filePaths[f]}`,
            path: `build${filePaths[f]}`
        }));

    return files;
}