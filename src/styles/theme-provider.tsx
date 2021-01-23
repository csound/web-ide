import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import WebIdeCssBaseline from "./web-ide-css-baseline";
import {
    createMuiTheme,
    ThemeProvider as MuiThemeProvider
} from "@material-ui/core/styles";
import { ThemeProvider as StyledComponentsThemeProvider } from "styled-components";
import { useSelector } from "react-redux";
import { ThemeProvider } from "@emotion/react";
import { assocPath, pathOr, pipe } from "ramda";
import { Theme } from "@emotion/react";
import { CodeMirrorPainter } from "./code-mirror-painter";
import themeMonokai from "./_theme-monokai";
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
   .MuiButton-outlinedPrimary {
     color: ${theme.textColor}!important;
     border-color: ${theme.textColor}!important;
   }
   .MuiDrawer {background-color: ${theme.tooltipBackground}!important;}
        `}</style>
);

const CsoundWebIdeThemeProvider = (properties) => {
    const monospaceFont = `"Fira Mono", monospace`;
    const regularFont = `"Roboto", sans-serif`;

    const theme: Theme = pipe(
        assocPath(["font", "monospace"], monospaceFont),
        assocPath(["font", "regular"], regularFont)
    )(
        useSelector(
            pathOr(themeMonokai, ["ThemeReducer", "selectedTheme"])
        ) as Theme
    ) as Theme;

    const muiTheme = createMuiTheme();
    const muiThemeMixed = makeMuiTheme(muiTheme, theme);

    return (
        <MuiThemeProvider theme={muiThemeMixed}>
            <StyledComponentsThemeProvider theme={theme}>
                <ThemeProvider theme={theme ? theme : {}}>
                    <CssBaseline />
                    <WebIdeCssBaseline />
                    <CodeMirrorPainter theme={theme} />
                    <ThirdPartyLibraryPainter theme={theme} />
                    {properties.children}
                </ThemeProvider>
            </StyledComponentsThemeProvider>
        </MuiThemeProvider>
    );
};

export default CsoundWebIdeThemeProvider;
