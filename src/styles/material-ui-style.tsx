import { DefaultTheme } from "@material-ui/core/styles/defaultTheme";
import { Theme } from "@emotion/react";
import { assocPath, pipe, memoizeWith, reduce } from "ramda";
// import { rgba } from "./utils";

// assume darkmode = primary
// (if consistent, the lightMode vs darkMode distinction becomes irrelevant)

const typographyOverride = (theme: Theme) =>
    pipe(
        (x) => (console.log(x) as any) || x,
        assocPath(["typography", "fontFamily"], theme.font.regular),
        assocPath(["typography", "button", "fontFamily"], theme.font.monospace),
        (t) =>
            reduce(
                (acc, k) =>
                    assocPath(
                        ["typography", k, "fontFamily"],
                        theme.font.regular,
                        acc
                    ),
                t,
                [
                    "body1",
                    "body2",
                    // "button",
                    "caption",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "subtitle1",
                    "subtitle2"
                ]
            )
    );

const makeMuiTheme_ = (muiTheme, theme: Theme, themeName: string) => {
    // const primaryPalette = {
    //     light: theme.highlight.secondary,
    //     main: theme.highlight.primary,
    //     dark: theme.color.secondary,
    //     contrastText: theme.color.primary
    // };

    // const backgroundPalette = {
    //     paper: theme.background.primary,
    //     default: theme.background.primary
    // };

    return (pipe as any)(
        typographyOverride(theme),
        assocPath(["palette", "common"], {
            black: theme.textColor,
            white: theme.background
        }),
        // assocPath(["palette", "primary"], primaryPalette),

        assocPath(["overrides", "MuiTooltip", "tooltip"], {
            color: theme.buttonTextColor,
            backgroundColor: theme.tooltipBackground,
            // textShadow: "0px 2px 2px rgba(0, 0, 0, 0.4)",
            textShadow: "unset",
            fontSize: "14px",
            padding: "12px",
            fontWeight: "500"
        }),
        assocPath(["overrides", "MuiDrawer", "paper"], {
            backgroundColor: theme.tooltipBackground,
            color: `${theme.textColor}!important`
        }),
        assocPath(["overrides", "MuiListItemText", "secondary"], {
            color: `${theme.altTextColor}!important`
        }),
        assocPath(["overrides", "MuiTypography", "root"], {
            color: `${theme.textColor}!important`
        }),
        assocPath(["overrides", "MuiButtonBase", "root"], {
            "&:hover": {
                backgroundColor: `${theme.buttonBackgroundHover}!important`
            }
        }),
        assocPath(["overrides", "MuiFab", "primary"], {
            backgroundColor: `${theme.buttonBackground}`,
            color: `${theme.buttonTextColor}`
        }),
        assocPath(["overrides", "MuiTabs", "root"], {
            "& button": {
                color: `${theme.buttonTextColor}!important`,
                backgroundColor: `${theme.buttonBackground}`
            }
        }),
        assocPath(["overrides", "MuiButtonBase", "disabled"], {
            color: `${theme.disabledButtonBackground}!important`
        }),
        assocPath(["overrides", "MuiButton", "textPrimary"], {
            backgroundColor: `${theme.buttonBackground}`,
            color: `${theme.buttonTextColor}!important`,
            opacity: 0.95,
            "&:hover": {
                backgroundColor: `${theme.buttonBackgroundHover}!important`
            }
        }),
        assocPath(["overrides", "MuiTouchRipple", "rippleVisible"], {
            color: "#005d83 !important"
        }),
        assocPath(["overrides", "MuiButton", "textSecondary"], {
            backgroundColor: `${theme.altButtonBackground}`,
            color: `${theme.buttonTextColor}!important`,
            opacity: 0.95,
            "&:hover": {
                backgroundColor: `${theme.textColorHover}!important`
            }
        }),
        assocPath(["overrides", "MuiFormLabel", "error"], {
            color: `${theme.errorText}!important`
        }),
        assocPath(["overrides", "MuiInputBase", "root"], {
            color: theme.textColor
        }),
        assocPath(["overrides", "MuiInput", "underline"], {
            "&:before": {
                borderBottom: `1px solid ${theme.line}!important`
            },
            color: theme.textColor
        }),
        assocPath(["overrides", "MuiInputLabel", "animated"], {
            transition: "none",
            color: `${theme.buttonTextColor}!important`
        }),
        assocPath(["overrides", "MuiInputBase", "input"], {
            color: theme.textColor
        }),
        assocPath(["overrides", "MuiAppBar", "positionFixed"], {
            left: "0!important",
            borderRightWidth: "4px!important"
        }),
        assocPath(["overrides", "MuiDrawer", "paper"], {
            backgroundColor: `${theme.background}!important`,
            "& .MuiButtonBase-root": {
                backgroundColor: `${theme.background}!important`,
                "&:hover": {
                    backgroundColor: `${theme.buttonBackgroundHover}!important`
                }
            }
        }),
        assocPath(["overrides", "MuiPaper", "root"], {
            color: theme.textColor,
            backgroundColor: theme.background
        }),
        assocPath(["overrides", "MuiMenu", "paper"], {
            color: theme.textColor,
            backgroundColor: theme.background,
            border: `2px solid ${theme.line}`,
            borderRadius: "6px",
            padding: "12px",
            "& ul": {
                padding: 0
            },
            "& a,li": {
                color: theme.textColor,
                fontSize: "15px",
                fontWeight: 500
            },
            "& li": {
                padding: "12px 24px!important"
            }
        }),
        // assocPath(["overrides", "MuiListItem"], {
        //     cursor: "grabbing"
        // }),
        assocPath(["overrides", "MuiMenu", "list"], {
            color: theme.textColor
        })
    )(muiTheme) as DefaultTheme;
};

export const makeMuiTheme = memoizeWith(
    (foo, bar, name) => name,
    makeMuiTheme_
);
