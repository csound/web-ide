const fs = require("fs");
const { buildParserFile } = require("@lezer/generator");

exports.default = function loader() {
    const isRequestingTerms = this.resource.includes(".terms");
    const resourcePath = isRequestingTerms
        ? this.resource.replace(".terms.js", ".grammar")
        : this.resource;
    const code = fs.readFileSync(resourcePath).toString();

    const parser = buildParserFile(code, {
        fileName: "syntax.grammar",
        moduleStyle: "es",
        warn: (message) => {
            if (!isRequestingTerms) {
                console.error(message);
                throw new Error(message);
            }
        }
    });

    return isRequestingTerms ? parser.terms : parser.parser;
};
