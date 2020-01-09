import { DefaultTheme } from "@material-ui/core/styles/defaultTheme";
import { assocPath, pipe } from "ramda";

// assume darkmode = primary
// (if consistent, the lightMode vs darkMode distinction becomes irrelevant)

export const makeMuiTheme = (muiTheme, theme) => {
    const primaryPalette = {
        light: theme.highlight.secondary,
        main: theme.highlight.primary,
        dark: theme.color.secondary,
        contrastText: theme.color.primary
    };

    const backgroundPalette = {
        paper: theme.background.primary,
        default: theme.background.primary
    };

    return pipe(
        assocPath(["palette", "type"], "dark"),
        assocPath(["palette", "common"], {
            black: theme.color.primary,
            white: theme.color.secondary
        }),
        assocPath(["palette", "primary"], primaryPalette),
        assocPath(["palette", "type"], backgroundPalette),
        assocPath(["MuiTooltip", "tooltip", "color"], theme.color.primary)
    )(muiTheme) as DefaultTheme;
};
