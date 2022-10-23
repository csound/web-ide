import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import WebIdeCssBaseline from "./web-ide-css-baseline";
import {
    createTheme as createMuiTheme,
    ThemeProvider as MuiThemeProvider
} from "@material-ui/core/styles";
import { useSelector } from "react-redux";
import { ThemeProvider } from "@emotion/react";
import { assocPath, path, pipe } from "ramda";
import { Theme } from "@emotion/react";
import { makeMuiTheme } from "./material-ui-style";

const ThirdPartyLibraryPainter = ({ theme }) => (
    <style>{`
    .splitter-layout > .layout-splitter {
         background-color: ${theme.line}!important;
    }

    .splitter-layout .layout-splitter:hover {
        background-color: ${theme.lineHover}!important;
    }

    body > li[role=tab] {
      z-index: 10;
   }
    body > li[role=tab] button {
      z-index: 10000;
   }
    body > li[role=tab] span {
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
   .MuiDrawer {background-color: ${theme.tooltipBackground}!important;}
        `}</style>
);

const CsoundWebIdeThemeProvider = (properties) => {
    const monospaceFont = `'Fira Mono', monospace`;
    const regularFont = ` 'Poppins', sans-serif`;
    const themeName = useSelector(path(["ThemeReducer", "selectedThemeName"]));

    const theme: Theme = pipe(
        assocPath(["font", "monospace"], monospaceFont),
        assocPath(["font", "regular"], regularFont)
    )(useSelector(path(["ThemeReducer", "selectedTheme"]))) as Theme;

    const muiTheme = createMuiTheme();
    const muiThemeMixed = makeMuiTheme(muiTheme, theme, themeName);
    return (
        <MuiThemeProvider theme={muiThemeMixed}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <WebIdeCssBaseline theme={theme} />
                <ThirdPartyLibraryPainter theme={theme} />
                {properties.children}
            </ThemeProvider>
        </MuiThemeProvider>
    );
};

export default React.memo(CsoundWebIdeThemeProvider);
