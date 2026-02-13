import { deepMerge } from "@root/utils";
import defaultTheme from "./_theme-monokai";

const theme = {
    background: "#2e3440",
    headerBackground: "#3b4252",
    fileTreeBackground: "#2e3440",
    tooltipBackground: "#3b4252",
    dropdownBackground: "#3b4252",
    buttonBackground: "#434c5e",
    highlightBackground: "#434c5e",
    highlightBackgroundAlt: "#3b4252",
    selectedTextColor: "#4c566a",
    line: "#4c566a",
    lineHover: "#616e88",
    buttonBackgroundHover: "#4c566a",
    textColor: "#eceff4",
    headerTextColor: "#eceff4",
    altTextColor: "#d8dee9",
    disabledTextColor: "#8f9bb3",
    scrollbar: "#4c566a",
    scrollbarHover: "#616e88",
    opcode: "#b48ead",
    keyword: "#b48ead",
    string: "#a3be8c",
    number: "#88c0d0",
    controlFlow: "#81a1c1",
    attribute: "#81a1c1",
    aRateVar: "#b48ead",
    iRateVar: "#88c0d0",
    kRateVar: "#8fbcbb",
    fRateVar: "#d08770",
    pField: "#ebcb8b",
    comment: "#9ba6bd",
    caretColor: "#88c0d0"
};

export default deepMerge(defaultTheme, theme) as any;
