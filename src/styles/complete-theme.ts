import defaultTheme from "./_theme-monokai";

// Keep shared token names while deriving UI colors from the chosen palette.
export function completeTheme(
    palette: Partial<typeof defaultTheme> & {
        background: string;
        headerBackground: string;
        textColor: string;
        altTextColor: string;
        highlightBackground: string;
        highlightBackgroundAlt: string;
        buttonBackgroundHover: string;
        caretColor: string;
    },
    accent: string
): typeof defaultTheme {
    return {
        ...defaultTheme,
        ...palette,
        gutterBackground: palette.background,
        textFieldBackground: palette.background,
        altButtonBackground: palette.highlightBackground,
        disabledButtonBackground: palette.highlightBackgroundAlt,
        buttonTextColor: palette.textColor,
        buttonTextColorHover: palette.textColor,
        textColorHover: palette.textColor,
        unfocusedTextColor: palette.altTextColor,
        dropdownBackgroundHover: palette.buttonBackgroundHover,
        tabHighlight: accent,
        tabHighlightActive: accent,
        button: accent,
        buttonIcon: palette.altTextColor,
        settingsIcon: accent,
        console: palette.textColor,
        cursor: palette.caretColor,
        lineNumber: palette.altTextColor,
        gutterMarker: accent,
        gutterMarkerSubtle: palette.altTextColor,
        bracket: palette.textColor,
        operator: palette.textColor,
        macro: palette.keyword ?? defaultTheme.keyword,
        flash: palette.highlightBackground,
        flashFade: palette.highlightBackgroundAlt
    };
}
