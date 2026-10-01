import CssBaseline from "@mui/material/CssBaseline";
import WebIdeCssBaseline from "./web-ide-css-baseline";
import { useSelector } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import { assocPath, mergeAll, path, pipe } from "ramda";
import { Global, SerializedStyles, Theme, css } from "@emotion/react";
import { makeMuiTheme } from "./material-ui-style";

const globalStyles = (theme: Theme): SerializedStyles => css`
    .splitter-layout > .layout-splitter {
        background-color: ${theme.line}!important;
    }

    .splitter-layout .layout-splitter:hover {
        background-color: ${theme.lineHover}!important;
    }

    body > li[role="tab"] {
        z-index: 10;
    }
    body > li[role="tab"] button {
        z-index: 10000;
    }
    body > li[role="tab"] span {
        margin: auto 0;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 12px;
    }
    .MuiButton-outlinedPrimary {
        color: ${theme.textColor}!important;
        border-color: ${theme.textColor}!important;
    }
    .MuiDrawer {
        background-color: ${theme.tooltipBackground}!important;
    }

    .MuiTabs-root button {
        background: ${theme.dropdownBackground};
        color: ${theme.textColor} !important;
        min-width: 160px !important;
        :hover {
            background: ${theme.buttonBackgroundHover} !important;
        }
    }
    .MuiInputLabel-root {
        color: ${theme.altTextColor}!important;
    }
    .Mui-focused {
        color: ${theme.altTextColor}!important;
        fieldset {
            border-color: ${theme.altTextColor}!important;
        }
    }
    .MuiTab-root[aria-selected="false"] {
        opacity: 0.7;
    }
    .MuiTab-wrapper {
        font-weight: 500;
        font-family: ${theme.font.regular};
    }
    .MuiTypography-root,
    .MuiInputBase-root,
    .MuiInputBase-root > input,
    .MuiInputBase-root > textarea {
        font-family: ${theme.font.regular};
        color: ${theme.textColor} !important;
    }
    .MuiDialogContentText-root {
        color: ${theme.textColor} !important;
    }
    .MuiListItem-root {
        padding: 12px 24px !important;
        :hover {
            background-color: ${theme.buttonBackgroundHover} !important;
        }
    }

    .MuiTooltip-tooltip {
        font-family: ${theme.font.regular}!important;
    }
    .MuiTypography-body2 {
        color: ${theme.altTextColor} !important;
    }
    .MuiFab-root,
    .MuiButton-textPrimary {
        opacity: 0.95;
    }
    .MuiFab-root.Mui-disabled {
        background-color: ${theme.disabledButtonBackground} !important;
    }
    .MuiMenu-list {
        color: ${theme.textColor} !important;
        ul {
            padding: 0;
        }
        li,
        a {
            color: ${theme.textColor} !important;
        }
    }
`;

const CsoundWebIdeThemeProvider = ({
    children
}: {
    children: React.ReactNode;
}) => {
    const monospaceFont = `'Fira Mono', monospace`;
    const regularFont = ` 'Poppins', sans-serif`;
    // const themeName = useSelector(path(["ThemeReducer", "selectedThemeName"]));

    const themeWebIde: Theme = pipe(
        assocPath(["font", "monospace"], monospaceFont),
        assocPath(["font", "regular"], regularFont)
    )(useSelector(path(["ThemeReducer", "selectedTheme"]))) as Theme;

    const muiTheme = makeMuiTheme(themeWebIde);
    const theme = mergeAll([muiTheme, themeWebIde]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <WebIdeCssBaseline theme={theme as unknown as Theme} />
            <Global styles={globalStyles} />
            {children}
        </ThemeProvider>
    );
};

export default CsoundWebIdeThemeProvider;
