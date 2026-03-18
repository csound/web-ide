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
    caretColor: "#8be9fd",
    fileIcons: {
        csd: { panel: "#ff79c6", shadow: "#c04090" },
        orc: { panel: "#8be9fd", shadow: "#5AABCC" },
        sco: { panel: "#50fa7b", shadow: "#30AA50" },
        udo: { panel: "#ffb86c", shadow: "#c08040" },
        audio: { panel: "#F29A2E", shadow: "#9C4E16" },
        midi: { panel: "#2BAE9C", shadow: "#15594F" },
        sample: { panel: "#7D69D6", shadow: "#43367A" },
        media: { panel: "#5A88B5", shadow: "#294662" }
    }
};

export default deepMerge(defaultTheme, theme) as any;
