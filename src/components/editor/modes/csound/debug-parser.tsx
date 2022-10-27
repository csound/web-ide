import React from "react";
import { Tree } from "@lezer/common";
import { parser } from "./syntax.grammar";
import { printTree } from "./print-tree";

const instrBlock = `

<CsoundSynthesizer>
<CsOptions>
-o dac -m0 --daemon
</CsOptions>
<CsInstruments>
sr=48000
ksmps=32
0dbfs=1
nchnls=2
#include "livecode.orc"
</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>

`;

export const ParserDebugger = () => {
    const [value, setValue] = React.useState(instrBlock);

    React.useEffect(() => {
        try {
            console.log(printTree(parser.parse(value) as Tree, instrBlock));
        } catch (error) {
            console.log(value);
            console.error(error);
        }
    }, [value]);

    return (
        <>
            <style>{`h1 {color: white;}`}</style>
            <textarea
                value={value}
                style={{ minWidth: 500, minHeight: 800 }}
                onChange={(event: any) => setValue(event.target.value)}
            ></textarea>
        </>
    );
};
