import "@emotion/react";

declare module "@emotion/react" {
    export interface Theme {
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
        socialIcon: string;
        publicIcon: string;
        playIcon: string;
        settingsIcon: string;
        profilePlayButton: string;
        profilePlayButtonActive: string;
        scrollbar: string;
        scrollbarHover: string;
        console: string;
        cursor: string;
        opcode: string;
        operator: string;
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
