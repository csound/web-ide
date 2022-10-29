import "@emotion/react";
import CreateStyleOriginal from "@emotion/styled";

type ThemeFont = {
    regular: string;
    monospace: string;
};

declare module "@emotion/react" {
    export interface Theme {
        // fonts
        font: ThemeFont;
        // basic colors
        background: string;
        headerBackground: string;
        fileTreeBackground: string;
        tooltipBackground: string;
        dropdownBackground: string;
        buttonBackground: string;
        altButtonBackground: string;
        disabledButtonBackground: string;
        highlightBackground: string;
        highlightBackgroundAlt: string;
        textFieldBackground: string;
        // Text colors
        headerTextColor: string;
        textColor: string;
        selectedTextColor: string;
        errorText: string;
        buttonTextColor: string;
        altTextColor: string;
        unfocusedTextColor: string;
        disabledTextColor: string;
        // hr/dragger/underline
        line: string;
        lineHover: string;
        // Hover colors
        // - background Hover
        buttonBackgroundHover: string;
        buttonTextColorHover: string;
        dropdownBackgroundHover: string;
        // - text Hover
        textColorHover: string;
        tabHighlight: string;
        tabHighlightActive: string;
        allowed: string;
        button: string;

        // Other
        starActive: string;
        starInactive: string;
        buttonIcon: string;
        settingsIcon: string;
        profilePlayButton: string;
        profilePlayButtonActive: string;
        scrollbar: string;
        scrollbarHover: string;
        macro: string;
        console: string;
        cursor: string;
        opcode: string;
        operator: string;
        controlFlow: string;
        attribute: string;
        keyword: string;
        string: string;
        number: string;
        bracket: string;
        aRateVar: string;
        iRateVar: string;
        kRateVar: string;
        fRateVar: string;
        pField: string;
        flash: string;
        flashFade: string;
        gutterBackground: string;
        gutterMarker: string;
        gutterMarkerSubtle: string;
        lineNumber: string;
        comment: string;
        commentAttribute: string;
        commentDef: string;
        commentTag: string;
        commentType: string;
    }
}
