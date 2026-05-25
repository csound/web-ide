const fs = require('fs');
const path = require('path');
const { buildParserFile } = require('@lezer/generator');

exports.default = function loader() {
  const isRequestingTerms = this.resource.includes('.terms');
  const basename = path.basename(this.resource, '.grammar');

  const resourcePath = isRequestingTerms
    ? this.resource.replace('.terms.js', '.grammar')
    : this.resource;
  const code = fs.readFileSync(resourcePath).toString();
  const commonCode =
    basename !== 'csd'
      ? fs
          .readFileSync(path.resolve(__dirname, '../src/csd.grammar'))
          .toString()
          .replace(/@top.*/, '')
      : '';

  // console.error(
  //   'THIS RESOURCE',
  //   this.resource,
  //   'BASEN',
  //   basename,
  //   'commonCode',
  //   commonCode,
  // );

  const parser = buildParserFile(`${code}\n${commonCode}`, {
    fileName: `${basename}.grammar`,
    moduleStyle: 'es',
    warn: (message) => {
      if (!isRequestingTerms) {
        if (basename === 'csd') {
          console.error(message);
        }
        // throw new Error(message);
      }
    },
  });

  return isRequestingTerms ? parser.terms : parser.parser;
};
