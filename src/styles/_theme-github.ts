import themeMonokai from "./_theme-monokai";
import { deepMerge } from "@root/utils";
import { rgba } from "./utils";

const border = "#d0d0d0";
const comment = "#6a737d";
const constant = "#005cc5";
// const diffAdded = "#e6ffed";
const diffAddedHighlight = "#acf2bd";
// const diffChanged = "#ffe1b9";
const diffChangedHighlight = "#ffc86f";
// const diffRemoved = "#ffeef0";
const diffRemovedHighlight = "#fdb8c0";
const fn = "#6f42c1";
const headerBg2 = "#d73a49";
// const headerFg2 = "#ffffff";
const highlight = "#fffbdd";
const headerBg1 = "#24292e";
const headerFg1 = "#bcbdc0";
const htmlTag = "#22863a";
// const keyword = "#d73a49";
const selection = "#6199ff2f";
const string = "#032f62";
const text = "#24292e";
const white = "#ffffff";

const theme = {
    // Backgrounds
    background: white,
    headerBackground: headerBg1,
    fileTreeBackground: white,
    tooltipBackground: highlight,
    dropdownBackground: highlight,
    buttonBackground: border,
    altButtonBackground: diffRemovedHighlight,
    disabledButtonBackground: headerFg1,
    highlightBackground: headerFg1,
    highlightBackgroundAlt: headerFg1,
    textFieldBackground: selection,
    // Text colors
    headerTextColor: white,
    textColor: text,
    selectedTextColor: selection,
    errorText: headerBg2,
    buttonTextColor: text,
    altTextColor: headerBg1,
    disabledTextColor: headerFg1,
    unfocusedTextColor: `rgba(${rgba(text, 0.4)})`,
    // hr/dragger/underline
    line: comment,
    lineHover: headerFg1,
    // Hover colors
    // - background Hover
    buttonBackgroundHover: `rgba(${rgba(border, 0.1)})`,
    buttonTextColorHover: `rgba(${rgba(text, 0.1)})`,
    dropdownBackgroundHover: `rgba(${rgba(highlight, 0.1)})`,
    // - text Hover
    textColorHover: `rgba(${rgba(text, 0.1)})`,
    tabHighlight: string,
    tabHighlightActive: selection,
    allowed: htmlTag,
    button: border,
    // Other
    starActive: diffChangedHighlight,
    starInactive: border,
    socialIcon: border,
    publicIcon: border,
    playIcon: border,
    settingsIcon: diffChangedHighlight,
    profilePlayButton: diffAddedHighlight,
    profilePlayButtonActive: diffChangedHighlight,
    scrollbar: highlight,
    scrollbarHover: `rgba(${rgba(border, 0.1)})`,
    console: text,
    cursor: text,
    opcode: fn,
    operator: constant,
    attribute: fn,
    keyword: fn,
    string: string,
    number: text,
    bracket: htmlTag,
    aRateVar: constant,
    iRateVar: constant,
    kRateVar: constant,
    fRateVar: constant,
    pField: diffChangedHighlight,
    flash: highlight,
    flashFade: headerFg1,
    gutterBackground: white,
    gutterMarker: headerBg2,
    gutterMarkerSubtle: headerBg2,
    lineNumber: text,
    caretColor: text
    /*
    comment: monokaiComments,
    commentAttribute: henn1nk,
    commentDef: monokaiOrange,
    commentTag: diffRemovedHighlight,
    commentType: monokaiCyan
*/
};

export default deepMerge(themeMonokai, theme) as any;
