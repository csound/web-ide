import { deepMerge } from "@root/utils";
import defaultTheme from "./_theme-monokai";

const theme = {
    background: "#0f1117",
    headerBackground: "#181a23",
    fileTreeBackground: "#0f1117",
    tooltipBackground: "#181a23",
    dropdownBackground: "#181a23",
    buttonBackground: "#24283b",
    highlightBackground: "#24283b",
    highlightBackgroundAlt: "#1d2030",
    selectedTextColor: "#2f3a5a",
    line: "#30364f",
    lineHover: "#3a4160",
    buttonBackgroundHover: "#30364f",
    textColor: "#f8f8f2",
    headerTextColor: "#f8f8f2",
    altTextColor: "#a8acc7",
    disabledTextColor: "#6f7693",
    scrollbar: "#4a4f69",
    scrollbarHover: "#666b8d",
    opcode: "#ff79c6",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    controlFlow: "#8be9fd",
    attribute: "#8be9fd",
    aRateVar: "#bd93f9",
    iRateVar: "#8be9fd",
    kRateVar: "#50fa7b",
    fRateVar: "#ffb86c",
    pField: "#f1fa8c",
    comment: "#7f859f",
    caretColor: "#8be9fd"
};

export default deepMerge(defaultTheme, theme) as any;
