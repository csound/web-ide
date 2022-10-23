const fs = require("fs");
const { uniq } = require("ramda");
const opcodes = require(__dirname + "/../public/static-manual-index.json");
const { buildParserFile } = require("@lezer/generator");

exports.default = function loader() {
    const highlightedOpcodes = uniq(
        opcodes
            .sort(function (a, b) {
                return b.length - a.length;
            })
            .map(({ opname }) => `"${opname}"`)
    ).filter(
        // todo add all conflicting operators
        (opname) =>
            ![
                `"0dbfs"`,
                `"sr"`,
                `"ksmps"`,
                `"kr"`,
                `"/"`,
                `"+"`,
                `"-"`,
                `"*"`,
                `"%"`,
                `"^"`,
                `"<"`,
                `">"`,
                `">="`,
                `"<="`,
                `"="`,
                `"=="`,
                `"+="`,
                `"-="`,
                `"*="`,
                `"/="`,
                `"|="`,
                `"&="`,
                `"!="`,
                `"&&"`,
                `"&"`,
                `"||"`,
                `"|"`,
                `"!"`,
                `"<<"`,
                `">>"`,
                `"¬"`,
                `"#"`,
                `"$"`,
                `"~"`,
                `"{"`,
                `"}"`,
                `"#define"`,
                `"#include"`,
                `"#undef"`,
                `"#ifdef"`,
                `"#ifndef"`,
                `"instr"`,
                `"endin"`,
                `"opcode"`,
                `"endop"`,
                `"if"`,
                `"then"`,
                `"else"`,
                `"elseif"`,
                `"endif"`,
                `"while"`,
                `"do"`,
                `"od"`
            ].includes(opname)
    );

    const code = fs
        .readFileSync(this.resource)
        .toString()
        .replace("//DONT_DELETE", highlightedOpcodes.join(" | "));

    // fs.writeFileSync("debug.grammar", code);

    const parser = buildParserFile(code, {
        fileName: "syntax.grammar",
        moduleStyle: "es",
        warn: (message) => {
            console.error(message);
            //throw new Error(message);
        }
    }).parser;

    return parser;
};
