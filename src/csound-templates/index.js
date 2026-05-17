import * as defaultCsdTxt from "./default.csd?raw";
import * as defaultSplitCsdTxt from "./default-split.csd?raw";
import * as defaultOrcTxt from "./default.orc?raw";
import * as defaultScoTxt from "./default.sco?raw";

export const defaultCsd = {
    name: "project.csd",
    value: defaultCsdTxt.default,
    type: "txt"
};

export const defaultSplitCsd = {
    name: "project.csd",
    value: defaultSplitCsdTxt.default,
    type: "txt"
};

export const defaultOrc = {
    name: "project.orc",
    value: defaultOrcTxt.default,
    type: "txt"
};

export const defaultSco = {
    name: "project.sco",
    value: defaultScoTxt.default,
    type: "txt"
};

export const emptyCsd = {
    name: "project.csd",
    value: "",
    type: "txt"
};
