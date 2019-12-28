import React from "react";
import { useSelector } from "react-redux";
import { ThemeProvider } from "emotion-theming";
import { pathOr } from "ramda";
import { ITheme } from "./types";

const CsoundWebIdeThemeProvider = props => {
    const theme: ITheme | null = useSelector(
        pathOr(null, ["ThemeReducer", "selectedTheme"])
    );
    return (
        <ThemeProvider theme={theme ? theme : {}}>
            {props.children}
        </ThemeProvider>
    );
};

export default CsoundWebIdeThemeProvider;
