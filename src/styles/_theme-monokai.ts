import { rgba } from "./utils";

// Monokai
// https://www.colourlovers.com/palette/1718713/Monokai
// https://github.com/oneKelvinSmith/monokai-emacs/blob/master/monokai-theme.el

const henn1nk = `#a6e22e`;
const monokaiGray = "#64645E";
const monokaiLightGray = "#CCCCCC";
const monokaiCyan = "#A1EFE4";
const monokaiLightBlue = `#66d9ef`;
const monokaiOrange = `#fd971f`;
const monokaiRed = "#F92672";
const monokaiYellow = "#E6DB74";
const monokaiMagenta = "#FD5FF0";
const monokaiGreen = "#A6E22E";
const orchid = `#f92672`;
const sundriedClay = `#272822`;
const monokaiViolet = "#AE81FF";
const monokaiForeground = "#F8F8F2";
const monokaiBackground = "#272822";
const monokaiComments = "#75715E";
const monokaiEmphasis = "#F8F8F0";
const monokaiLineNumber = "#8F908A";
const monokaiHighlight = "#49483E";
const monokaiHighlightAlt = "#3E3D31";
const monokaiHighlightLine = "#3C3D37";
// const monokaiBlueDark = "#40CAE4";
const monokaiLightBlue2 = "#92E7F7";
const monokaiBlueHighContrast = "#1DB4D0";

const theme = {
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
    // Text colors
    headerTextColor: monokaiForeground,
    textColor: monokaiForeground,
    selectedTextColor: monokaiHighlightLine,
    errorText: monokaiRed,
    buttonTextColor: monokaiForeground,
    altTextColor: monokaiLineNumber,
    unfocusedTextColor: `rgba(${rgba(monokaiForeground, 0.4)})`,
    disabledTextColor: monokaiGray,
    // hr/dragger/underline
    line: monokaiHighlightLine,
    lineHover: `rgba(${rgba(monokaiHighlightAlt, 0.1)})`,
    // Hover colors
    // - background Hover
    buttonBackgroundHover: `rgba(${rgba(monokaiHighlightAlt, 0.5)})`,
    buttonTextColorHover: `rgba(${rgba(monokaiForeground, 0.1)})`,
    dropdownBackgroundHover: `rgba(${rgba(monokaiHighlight, 0.1)})`,
    // - text Hover
    textColorHover: `rgba(${rgba(monokaiForeground, 0.1)})`,
    tabHighlight: monokaiLightBlue2,
    tabHighlightActive: monokaiMagenta,
    allowed: monokaiGreen,
    button: monokaiBlueHighContrast,

    // Other
    starActive: monokaiYellow,
    starInactive: monokaiGray,
    buttonIcon: monokaiGray,
    settingsIcon: monokaiViolet,
    profilePlayButton: henn1nk,
    profilePlayButtonActive: monokaiOrange,
    scrollbar: monokaiHighlight,
    scrollbarHover: monokaiLightGray,
    console: monokaiLightGray,
    cursor: monokaiForeground,
    opcode: monokaiMagenta,
    operator: monokaiEmphasis,
    attribute: monokaiBlueHighContrast,
    keyword: orchid,
    string: monokaiYellow,
    number: monokaiEmphasis,
    bracket: monokaiHighlightAlt,
    aRateVar: monokaiViolet,
    iRateVar: monokaiCyan,
    kRateVar: monokaiLightBlue,
    fRateVar: monokaiMagenta,
    pField: monokaiYellow,
    flash: monokaiHighlight,
    flashFade: monokaiHighlightAlt,
    gutterBackground: monokaiHighlightLine,
    gutterMarker: monokaiForeground,
    gutterMarkerSubtle: monokaiForeground,
    lineNumber: monokaiLineNumber,
    comment: monokaiComments,
    commentAttribute: henn1nk,
    commentDef: monokaiOrange,
    commentTag: monokaiMagenta,
    commentType: monokaiCyan
};

export default theme;
