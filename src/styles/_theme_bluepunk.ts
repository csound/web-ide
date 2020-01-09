/* eslint-disable @typescript-eslint/no-unused-vars */

import themeMonokai from "./_theme_monokai";
import { deepMerge } from "@root/utils";

const defaultBackground = "#372963";
const defaultForeground = "#00E3FF";
const linenumBackground = "#4B3E72";
const linenumForeground = "#CBEBFF";
const background2 = "#4B3E72";
const contrastColor = "#FFFAFA";
const highlight = "#262F36";
const highlight2 = "#4B3E72";
const highlight3 = "#729FCF";
const altColor = "#00FFC1";
const altColor2 = "#00FF9C";
const cyberOrange = "#FF9C00";
const cyberGreen = "#BEFF00";
const button1 = "#FF4081";
const button2 = "#00E3FF";

const theme = {
    background: { primary: defaultBackground, secondary: linenumBackground },
    fileTreeBackground: {
        primary: defaultBackground,
        secondary: linenumBackground
    },
    headerBackground: {
        primary: background2,
        secondary: background2
    },
    color: {
        primary: linenumForeground,
        secondary: contrastColor
    },
    alternativeColor: {
        primary: cyberOrange,
        secondary: altColor2
    },
    tabHighlight: {
        primary: cyberOrange,
        secondary: cyberGreen
    },
    // inherit error
    highlight: {
        primary: highlight3,
        secondary: contrastColor
    },
    highlightAlt: {
        primary: highlight2
    },
    button: {
        primary: button1,
        secondary: button2
    }
};

export default deepMerge(themeMonokai, theme);
