import React from "react";
import { Tree } from "@lezer/common";
import { parser } from "./syntax.grammar";
import { printTree } from "./print-tree";

const instrBlock = `
instr 1

endin
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
