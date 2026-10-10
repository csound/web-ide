import type { Theme } from "@emotion/react";
import { createTheme } from "@mui/material/styles";

/** Match MUI controls to the selected IDE palette and shared spacing. */
export const makeMuiTheme = (theme: Theme) =>
    createTheme({
        palette: {
            mode: theme.mode,
            primary: { main: theme.tabHighlightActive },
            background: {
                paper: theme.dropdownBackground,
                default: theme.background
            },
            text: {
                primary: theme.textColor,
                secondary: theme.altTextColor,
                disabled: theme.disabledTextColor
            },
            divider: theme.line,
            error: { main: theme.errorText },
            action: {
                active: theme.buttonIcon,
                hover: theme.highlightBackground,
                selected: theme.highlightBackgroundAlt,
                disabled: theme.disabledTextColor,
                disabledBackground: theme.disabledButtonBackground
            }
        },
        typography: { fontFamily: theme.font.regular },
        shape: { borderRadius: 6 },
        components: {
            MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        color: theme.textColor,
                        backgroundColor: theme.tooltipBackground,
                        border: `1px solid ${theme.line}`,
                        fontSize: 12,
                        padding: "6px 8px"
                    }
                }
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: { backgroundColor: theme.headerBackground }
                }
            },
            MuiMenu: {
                styleOverrides: {
                    paper: { border: `1px solid ${theme.line}` },
                    list: { padding: "4px 0" }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: { whiteSpace: "nowrap" },
                    text: {
                        "&.MuiButton-colorPrimary": {
                            color: theme.buttonTextColor,
                            backgroundColor: theme.buttonBackground,
                            "&:hover": {
                                backgroundColor: theme.buttonBackgroundHover
                            }
                        }
                    }
                }
            },
            MuiFab: {
                styleOverrides: {
                    root: {
                        color: theme.buttonTextColor,
                        backgroundColor: theme.buttonBackground,
                        "&:hover": {
                            backgroundColor: theme.buttonBackgroundHover
                        }
                    }
                }
            }
        }
    });
