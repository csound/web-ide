// Monokai
// https://www.colourlovers.com/palette/1718713/Monokai
// https://github.com/oneKelvinSmith/monokai-emacs/blob/master/monokai-theme.el

const henn1nk = `#a6e22e`;
const monokaiGray = "#666b75";
const monokaiLightGray = "#CCCCCC";
const monokaiCyan = "#A1EFE4";
const monokaiLightBlue = `#66d9ef`;
const monokaiOrange = `#fd971f`;
const monokaiRed = "#F92672";
const monokaiYellow = "#E6DB74";
const monokaiMagenta = "#FD5FF0";
const monokaiGreen = "#A6E22E";
const orchid = `#f92672`;
const sundriedClay = `#1f2023`;
const monokaiViolet = "#AE81FF";
const monokaiForeground = "#f3f4f6";
const monokaiBackground = "#222326";
const monokaiComments = "#969ba6";
const monokaiEmphasis = "#F8F8F0";
const monokaiLineNumber = "#a0a5b1";
const monokaiHighlight = "#35373d";
const monokaiHighlightAlt = "#2c2e34";
const monokaiHighlightLine = "#2b2d33";
// const monokaiBlueDark = "#40CAE4";
const monokaiLightBlue2 = "#92E7F7";
const monokaiBlueHighContrast = "#1DB4D0";

const theme = {
    mode: "dark" as "dark" | "light",
    // Backgrounds
    background: monokaiBackground,
    headerBackground: monokaiBackground,
    fileTreeBackground: monokaiBackground,
    tooltipBackground: monokaiHighlight,
    dropdownBackground: monokaiHighlight,
    buttonBackground: monokaiHighlight,
    altButtonBackground: monokaiMagenta,
    disabledButtonBackground: monokaiHighlightAlt,
    highlightBackground: monokaiHighlight,
    highlightBackgroundAlt: monokaiHighlightAlt,
    textFieldBackground: sundriedClay,
    gutterBackground: monokaiBackground,
    // Text colors
    headerTextColor: monokaiForeground,
    textColor: monokaiForeground,
    selectedTextColor: "#494b56",
    errorText: monokaiRed,
    buttonTextColor: monokaiForeground,
    altTextColor: monokaiLineNumber,
    unfocusedTextColor: monokaiLineNumber,
    disabledTextColor: monokaiGray,
    // hr/dragger/underline
    line: monokaiHighlightLine,
    lineHover: monokaiGray,
    // Hover colors
    // - background Hover
    buttonBackgroundHover: monokaiHighlight,
    buttonTextColorHover: monokaiForeground,
    dropdownBackgroundHover: monokaiHighlightAlt,
    // - text Hover
    textColorHover: monokaiForeground,
    tabHighlight: monokaiLightBlue2,
    tabHighlightActive: monokaiMagenta,
    allowed: monokaiGreen,
    button: monokaiBlueHighContrast,

    // Other
    starActive: monokaiYellow,
    buttonIcon: monokaiLineNumber,
    settingsIcon: monokaiViolet,
    profilePlayButton: henn1nk,
    profilePlayButtonActive: monokaiOrange,
    scrollbar: monokaiGray,
    scrollbarHover: monokaiLightGray, // don't keep using this one
    console: monokaiLightGray,
    macro: monokaiOrange,
    cursor: monokaiForeground,
    opcode: monokaiMagenta,
    operator: monokaiEmphasis,
    controlFlow: monokaiBlueHighContrast,
    attribute: monokaiBlueHighContrast,
    keyword: orchid,
    string: monokaiYellow,
    number: monokaiEmphasis,
    bracket: monokaiBlueHighContrast,
    aRateVar: monokaiViolet,
    iRateVar: monokaiCyan,
    kRateVar: monokaiLightBlue,
    fRateVar: monokaiMagenta,
    pField: monokaiYellow,
    flash: monokaiHighlight,
    flashFade: monokaiHighlightAlt,
    gutterMarker: monokaiForeground,
    gutterMarkerSubtle: monokaiForeground,
    lineNumber: monokaiLineNumber,
    comment: monokaiComments,
    commentAttribute: henn1nk,
    commentDef: monokaiOrange,
    commentTag: monokaiMagenta,
    commentType: monokaiCyan,
    caretColor: monokaiCyan,
    fileIcons: {
        csd: { panel: monokaiMagenta, shadow: "#B03CA7" },
        orc: { panel: monokaiCyan, shadow: "#6ABFB5" },
        sco: { panel: monokaiLightBlue, shadow: "#45A8BC" },
        udo: { panel: monokaiOrange, shadow: "#C06A10" },
        audio: { panel: "#F29A2E", shadow: "#9C4E16" },
        midi: { panel: "#2BAE9C", shadow: "#15594F" },
        sample: { panel: "#7D69D6", shadow: "#43367A" },
        media: { panel: "#5A88B5", shadow: "#294662" }
    }
};

export default theme;
