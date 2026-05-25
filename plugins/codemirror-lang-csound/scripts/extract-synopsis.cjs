const R = require('ramda');
const fs = require('fs');
const path = require('path');

const sourcefile = path.resolve(__dirname, '../static-manual-index.json');
const outputScoregens = path.resolve(
  __dirname,
  '../src/builtin-scoregens.json',
);
const outputOpcodes = path.resolve(__dirname, '../src/builtin-opcodes.json');

const inputJson = JSON.parse(fs.readFileSync(sourcefile));

const scoregens = R.filter(R.propEq('type', 'scoregen'))(inputJson);
const opcodes = R.filter(R.propEq('type', 'opcode'))(inputJson);

const scoregensObj = R.reduce((acc, val) => {
  return R.assoc(val.id || val.opcode, {
    synopsis: val.synopsis,
    short_desc: val.short_desc,
  })(acc);
}, {})(scoregens);

const opcodesObj = R.reduce((acc, val) => {
  return R.assoc(val.id || val.opcode, {
    synopsis: val.synopsis,
    short_desc: val.short_desc,
  })(acc);
}, {})(opcodes);

fs.writeFileSync(outputScoregens, JSON.stringify(scoregensObj, null, 2));
fs.writeFileSync(outputOpcodes, JSON.stringify(opcodesObj, null, 2));
