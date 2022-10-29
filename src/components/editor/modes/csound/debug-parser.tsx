import React from "react";
import { Tree } from "@lezer/common";
import { parser } from "./syntax.grammar";
import { printTree } from "./print-tree";

const instrBlock = `

opcode contains, i, ik[]
  ival, karr[] xin
  indx = 0
  iret = 0
  while (indx < lenarray:i(karr)) do
    if (i(karr,indx) == ival) then
      iret = 1
      igoto end
    endif
    indx += 1
  od
end:
  xout iret
endop 

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
