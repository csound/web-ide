import { deepMerge } from "@root/utils";
import defaultTheme from "./_theme-monokai";

const theme = {
    background: "#002b36",
    headerBackground: "#073642",
    fileTreeBackground: "#002b36",
    tooltipBackground: "#073642",
    dropdownBackground: "#073642",
    buttonBackground: "#184955",
    highlightBackground: "#184955",
    highlightBackgroundAlt: "#0f3e4a",
    selectedTextColor: "#1f5b67",
    line: "#2f6f7b",
    lineHover: "#3f7f8b",
    buttonBackgroundHover: "#2f6f7b",
    textColor: "#93a1a1",
    headerTextColor: "#93a1a1",
    altTextColor: "#839496",
    disabledTextColor: "#657b83",
    scrollbar: "#2f6f7b",
    scrollbarHover: "#3f7f8b",
    opcode: "#d33682",
    keyword: "#d33682",
    string: "#2aa198",
    number: "#268bd2",
    controlFlow: "#859900",
    attribute: "#b58900",
    aRateVar: "#6c71c4",
    iRateVar: "#268bd2",
    kRateVar: "#2aa198",
    fRateVar: "#cb4b16",
    pField: "#b58900",
    comment: "#657b83",
    caretColor: "#268bd2",
    fileIcons: {
        csd: { panel: "#d33682", shadow: "#A02060" },
        orc: { panel: "#268bd2", shadow: "#1A6090" },
        sco: { panel: "#2aa198", shadow: "#1A7068" },
        udo: { panel: "#cb4b16", shadow: "#90320E" },
        audio: { panel: "#F29A2E", shadow: "#9C4E16" },
        midi: { panel: "#2BAE9C", shadow: "#15594F" },
        sample: { panel: "#7D69D6", shadow: "#43367A" },
        media: { panel: "#5A88B5", shadow: "#294662" }
    }
};

export default deepMerge(defaultTheme, theme) as any;
