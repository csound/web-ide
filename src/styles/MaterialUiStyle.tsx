import { DefaultTheme } from "@material-ui/core/styles/defaultTheme";
import { assocPath, pipe } from "ramda";
import { rgba } from "./utils";

// assume darkmode = primary
// (if consistent, the lightMode vs darkMode distinction becomes irrelevant)

export const makeMuiTheme = (muiTheme, theme) => {
    const primaryPalette = {
        light: theme.highlight.secondary,
        main: theme.highlight.primary,
        dark: theme.color.secondary,
        contrastText: theme.color.primary
    };

    // const backgroundPalette = {
    //     paper: theme.background.primary,
    //     default: theme.background.primary
    // };

    return (pipe as any)(
        assocPath(["palette", "common"], {
            black: theme.color.primary,
            white: theme.color.secondary
        }),
        assocPath(["palette", "primary"], primaryPalette),

        assocPath(["overrides", "MuiTooltip", "tooltip"], {
            color: theme.color.primary,
            backgroundColor: theme.alternativeColor.primary,
            textShadow: "0px 2px 2px rgba(0, 0, 0, 0.4)",
            fontSize: "12px",
            padding: "12px",
            fontWeight: "600"
        }),
        assocPath(["overrides", "MuiListItemText", "secondary"], {
            color: `${theme.alternativeColor.primary}!important`
        }),
        assocPath(["overrides", "MuiTypography", "root"], {
            color: `${theme.color.primary}!important`
        }),
        assocPath(["overrides", "MuiButtonBase", "outlinedPrimary"], {
            color: `${theme.button.primary}`,
            borderColor: "brown",
            backgroundColor: "red",
            "&:hover": {
                backgroundColor: `${theme.highlight.primary}!important`
            }
        }),
        assocPath(["overrides", "MuiButtonBase", "root"], {
            color: `${theme.button.primary}`,
            "&:hover": {
                backgroundColor: `rgba(${rgba(
                    theme.button.primary,
                    0.1
                )})!important`
            }
        }),
        assocPath(["overrides", "MuiFab", "primary"], {
            backgroundColor: `${theme.button.primary}`,
            color: `${theme.color.primary}`
        }),
        assocPath(["overrides", "MuiTabs", "root"], {
            "& button": {
                color: `${theme.color.primary}!important`,
                backgroundColor: `${theme.highlight.secondary}`
            }
        }),
        assocPath(["overrides", "MuiButtonBase", "disabled"], {
            color: `${theme.highlightAlt.primary}!important`
        }),
        assocPath(["overrides", "MuiButton", "textPrimary"], {
            backgroundColor: `${theme.highlight.secondary}`,
            color: `${theme.color.primary}!important`,
            opacity: 0.95,
            "&:hover": {
                backgroundColor: `rgba(${rgba(
                    theme.button.secondary,
                    0.1
                )})!important`,
                opacity: 1
            }
        }),
        assocPath(["overrides", "MuiButton", "textSecondary"], {
            backgroundColor: `${theme.highlight.secondary}`,
            color: `${theme.error.primary}!important`,
            opacity: 0.95,
            "&:hover": {
                backgroundColor: `rgba(${rgba(
                    theme.error.primary,
                    0.1
                )})!important`
            }
        }),
        assocPath(["overrides", "MuiFormLabel", "error"], {
            color: `${theme.error.primary}!important`
        }),
        assocPath(["overrides", "MuiInputBase", "root"], {
            color: theme.color.primary
        }),
        assocPath(["overrides", "MuiInput", "underline"], {
            "&:before": {
                borderBottom: `1px solid ${theme.highlightAlt.primary}!important`
            },
            color: theme.color.primary
        }),
        assocPath(["overrides", "MuiInputLabel", "animated"], {
            transition: "none",
            color: `${theme.highlight.primary}!important`
        }),
        assocPath(["overrides", "MuiInputLabel", "animated"], {
            color: `${theme.alternativeColor.primary}!important`
        }),
        assocPath(["overrides", "MuiInputBase", "input"], {
            color: theme.color.primary
        }),
        assocPath(["overrides", "MuiAppBar", "positionFixed"], {
            left: "0!important",
            borderRightWidth: "4px!important"
        }),
        assocPath(["overrides", "MuiDrawer", "paper"], {
            backgroundColor: theme.highlight.primary,
            "& .MuiButtonBase-root": {
                backgroundColor: theme.highlight.primary
            }
        }),
        assocPath(["overrides", "MuiPaper", "root"], {
            color: theme.color.primary,
            backgroundColor: theme.highlight.primary
        }),
        assocPath(["overrides", "MuiMenu", "paper"], {
            color: theme.color.primary,
            backgroundColor: theme.background.primary,
            border: `2px solid ${theme.highlight.primary}`,
            borderRadius: "6px",
            padding: "12px",
            "& ul": {
                padding: 0
            },
            "& a,li": {
                color: theme.color.primary,
                fontSize: "15px",
                fontWeight: 500
            },
            "& li": {
                padding: "6px 12px!important"
            }
        }),
        assocPath(["overrides", "MuiListItem", "button"], {
            color: theme.color.primary,
            backgroundColor: theme.background.primary,
            "&:hover": {
                backgroundColor: theme.highlightAlt.primary,
                borderRadius: "2px"
            }
        }),
        assocPath(["overrides", "MuiMenu", "list"], {
            color: theme.color.primary
        })
    )(muiTheme) as DefaultTheme;
};
